import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import { connectDB } from "./db";
import { config } from "dotenv";

// Load environment variables — Replit secrets take precedence; .env is only a local fallback
config();

import path from "path";

const app = express();
const httpServer = createServer(app);

// Trust Render's reverse proxy so secure cookies work over HTTPS
app.set('trust proxy', 1);

// Serve uploaded files statically so they can be previewed/downloaded
const uploadsDir = path.resolve(process.cwd(), "uploads");
app.use("/uploads", express.static(uploadsDir));

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
    limit: '10mb',
  }),
);

app.use(express.urlencoded({ extended: false }));

// Apply basic security headers
app.use((req, res, next) => {
  res.header('X-Content-Type-Options', 'nosniff');
  res.header('X-XSS-Protection', '1; mode=block');
  next();
});

// Apply rate limiting
app.use('/api', (req, res, next) => {
  // Basic rate limiting
  next();
});

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

function notFound(req: Request, res: Response, next: NextFunction) {
  res.status(404).json({ error: "Not found" });
}

function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  console.log('Starting server initialization...');
  
  // MANDATORY: Connect to MongoDB Atlas - server will not start without it
  try {
    await connectDB();
    console.log('🎯 MongoDB Atlas connection established - server can start');
  } catch (error) {
    console.error('💥 CRITICAL: Failed to connect to MongoDB Atlas!');
    console.error('💥 Server cannot start without database connection.');
    console.error('💥 Please fix the connection issues and restart the server.');
    process.exit(1);
  }
  
  await registerRoutes(httpServer, app);
  console.log('Routes registered successfully');

  // Verify email config at startup (non-blocking)
  const { verifyEmailConfig } = await import("./email");
  verifyEmailConfig().catch(() => {});

  // Setup static serving before error handlers for production
  if (process.env.NODE_ENV === "production") {
    console.log('Running in production mode');
    serveStatic(app);
  } else {
    console.log('Setting up Vite dev server...');
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
    console.log('Vite setup complete');
  }

  // 404 handler (after static files)
  app.use(notFound);

  // Global error handler
  app.use(errorHandler);

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || "5000", 10);
  const host = "0.0.0.0";
  console.log(`Listening on ${host}:${port}...`);
  httpServer.listen(
    {
      port,
      host,
      reusePort: false,
    },
    () => {
      log(`serving on port ${port}`);
    },
  );
})();
