import type { Express, Request, Response, NextFunction } from "express";
import { notifyUser, notifyByRole } from "./notification-helpers";
import { createServer, type Server } from "http";
import { initStorage, getStorage } from "./storage";
import { seedDatabase } from "./seed-simple";
import { api } from "@shared/routes";
import { taskQuerySchema, timeLogQuerySchema, scrumQuerySchema } from "@shared/schema";
import { z } from "zod";
import session from "express-session";
import { MongoClient } from "mongodb";
import MongoStore from "connect-mongo";
import multer from "multer";
import path from "path";
import fs from "fs";
import { sendOtpEmail, verifyEmailConfig } from "./email";
import { getDB } from "./db";
import bcrypt from "bcrypt";
import { uploadToCloudinary, deleteFromCloudinary } from "./cloudinary";

const BCRYPT_ROUNDS = 12;

// MongoDB-backed OTP helpers (safe for multi-instance / serverless)
async function otpCollection() {
  const db = getDB();
  const col = db.collection("passwordResetOtps");
  try {
    await col.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0, background: true });
    await col.createIndex({ email: 1 }, { unique: true, background: true });
  } catch {}
  return col;
}
async function setOtp(email: string, otp: string) {
  const col = await otpCollection();
  await col.updateOne(
    { email },
    { $set: { email, otp, verified: false, expiresAt: new Date(Date.now() + 10 * 60 * 1000) } },
    { upsert: true }
  );
}
async function getOtp(email: string) {
  const col = await otpCollection();
  return col.findOne({ email }) as Promise<{ email: string; otp: string; verified: boolean; expiresAt: Date } | null>;
}
async function markOtpVerified(email: string) {
  const col = await otpCollection();
  await col.updateOne({ email }, { $set: { verified: true } });
}
async function deleteOtp(email: string) {
  const col = await otpCollection();
  await col.deleteOne({ email });
}

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Use memory storage — files go directly to Cloudinary, nothing written to disk
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Keep-alive ping endpoint — point UptimeRobot (free) at /api/ping every 14 min
  // to prevent Render's free tier from spinning down.
  app.get('/api/ping', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Initialize MongoDB storage
  console.log('Initializing MongoDB storage...');
  
  try {
    await initStorage();
    console.log('âœ“ MongoDB storage initialized');
  } catch (err) {
    console.error('âœ— Failed to initialize storage:', err);
    throw err;
  }
  
  // Seed database with initial data
  try {
    console.log('Starting database seeding...');
    await seedDatabase();
    console.log('âœ“ Database seeding complete');
  } catch (err: any) {
    console.error('âŒ Seeding failed:', err?.message || err);
    console.error('Full error:', err);
  }

  app.use(session({
    cookie: {
      maxAge: 86400000,
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: 'lax'
    },
    store: MongoStore.create({
      mongoUrl: process.env.MONGODB_URI!,
      dbName: 'ojtask',
      collectionName: 'sessions',
      ttl: 86400,
      autoRemove: 'native',
    }),
    resave: false,
    saveUninitialized: false,
    secret: process.env.SESSION_SECRET || "ojt-management-secret"
  }));

  // Auth Routes
  app.post(api.auth.login.path, async (req, res) => {
    try {
      const input = api.auth.login.input.parse(req.body);
      const user = await getStorage().getUserByUsername(input.username)
        ?? await (getStorage() as any).getUserByEmail(input.username.toLowerCase().trim());
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      const passwordMatch = await bcrypt.compare(input.password, user.password);
      if (!passwordMatch) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      (req as any).session.userId = user.id;
      
      // Log system event
      await (getStorage() as any).logSystemEvent('login', user.id, { username: user.username, role: user.role });
      
      res.status(200).json({ user });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      }
      res.status(500).json({ message: "Internal error" });
    }
  });

  app.post(api.auth.register.path, async (req, res) => {
    try {
      const input = api.auth.register.input.parse(req.body);
      const existing = await getStorage().getUserByUsername(input.username);
      if (existing) {
        return res.status(400).json({ message: "Username already exists", field: "username" });
      }
      const hashedPassword = await bcrypt.hash(input.password, BCRYPT_ROUNDS);
      const user = await getStorage().createUser({ ...input, password: hashedPassword });
      (req as any).session.userId = user.id;
      res.status(201).json({ user });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      }
      res.status(500).json({ message: "Internal error" });
    }
  });

  app.get(api.auth.me.path, async (req, res) => {
    const userId = (req as any).session?.userId;
    if (!userId) return res.status(401).json({ message: "Not authenticated" });
    const user = await getStorage().getUser(userId);
    if (!user) return res.status(401).json({ message: "Not authenticated" });
    res.status(200).json(user);
  });

  app.post(api.auth.logout.path, (req, res) => {
    (req as any).session.destroy();
    res.status(200).json({ success: true });
  });

  // Middleware to ensure auth for all API routes
  const requireAuth = (req: Request, res: Response, next: NextFunction) => {
    if (!(req as any).session?.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    next();
  };

  // Middleware to ensure user is member of the space
  const requireSpaceMembership = (req: Request, res: Response, next: NextFunction) => {
    const userId = (req as any).session?.userId;
    const spaceId = Number(req.params.spaceId);
    
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    if (!spaceId) {
      return res.status(400).json({ message: "Space ID required" });
    }
    
    // Check if user is member of this space
    getStorage().getSpaceMembers(spaceId).then(members => {
      const isMember = members.some(m => m.userId === userId);
      
      if (!isMember) {
        return res.status(403).json({ message: "You are not a member of this space" });
      }
      
      // Add user role to request for authorization checks
      const userMembership = members.find(m => m.userId === userId);
      (req as any).userRole = userMembership?.role || 'member';
      
      next();
    }).catch(err => {
      console.error('Space membership check failed:', err);
      res.status(500).json({ message: "Failed to verify space membership" });
    });
  };

  // Profile Routes
  app.get("/api/profile", requireAuth, async (req, res) => {
    const userId = (req as any).session.userId;
    const user = await getStorage().getUser(userId);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  });

  app.post("/api/profile/update", requireAuth, async (req, res) => {
    try {
      const userId = (req as any).session.userId;
      const { firstName, lastName, email, organization, profilePicture } = req.body;

      if (!firstName || !lastName || !email) {
        return res.status(400).json({ message: "First name, last name, and email are required" });
      }

      const updated = await getStorage().updateUser(userId, {
        firstName,
        lastName,
        name: `${firstName} ${lastName}`,
        email,
        organization,
        profilePicture: profilePicture || undefined,
      });

      if (!updated) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json(updated);
    } catch (err) {
      console.error("Profile update error:", err);
      res.status(500).json({ message: "Internal error" });
    }
  });

  // Password Change Route
  app.post("/api/password/change", requireAuth, async (req, res) => {
    try {
      const userId = (req as any).session.userId;
      const { currentPassword, newPassword } = req.body;

      if (!newPassword) {
        return res.status(400).json({ message: "New password is required" });
      }

      if (newPassword.length < 8) {
        return res.status(400).json({ message: "New password must be at least 8 characters" });
      }

      const user = await getStorage().getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const isGoogleUser = (user as any).provider === "google";

      if (!isGoogleUser) {
        // Regular users must provide their current password
        if (!currentPassword) {
          return res.status(400).json({ message: "Current password is required" });
        }
        const currentMatch = await bcrypt.compare(currentPassword, user.password);
        if (!currentMatch) {
          return res.status(401).json({ message: "Current password is incorrect" });
        }
      }

      const hashedNew = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
      await getStorage().updateUser(userId, { password: hashedNew, provider: null } as any);

      res.json({ message: "Password set successfully" });
    } catch (err) {
      console.error("Password change error:", err);
      res.status(500).json({ message: "Internal error" });
    }
  });

  // ── Email status (is Gmail configured?) ─────────────────────────────────
  app.get("/api/auth/email/status", (_req, res) => {
    const configured = !!process.env.BREVO_API_KEY;
    res.json({ configured, from: configured ? "Brevo" : null });
  });

  // ── Forgot Password (OTP via Gmail) ──────────────────────────────────────
  app.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;
      if (!email || typeof email !== "string") {
        return res.status(400).json({ message: "Email is required" });
      }

      const user = await (getStorage() as any).getUserByEmail(email.toLowerCase().trim());
      // Always respond OK to prevent email enumeration
      if (!user) {
        return res.status(200).json({ message: "If that email exists, a code was sent." });
      }

      if (!process.env.BREVO_API_KEY) {
        return res.status(503).json({
          message: "Email sending is not configured on this server. Please contact the administrator.",
          code: "EMAIL_NOT_CONFIGURED",
        });
      }

      const otp = generateOtp();
      await setOtp(email.toLowerCase().trim(), otp);

      try {
        await sendOtpEmail(email, otp, user.name || user.username);
        res.status(200).json({ message: "Reset code sent to your email." });
      } catch (mailErr: any) {
        console.error("❌ sendOtpEmail failed for", email, "—", mailErr?.message);
        // Clean up the OTP so the user can retry cleanly
        await deleteOtp(email.toLowerCase().trim()).catch(() => {});
        return res.status(500).json({
          message: "Failed to send reset code. Please try again later.",
          _debug: {
            error: mailErr?.message,
            resendName: mailErr?.resendName,
            resendStatus: mailErr?.resendStatus,
          },
        });
      }
    } catch (err: any) {
      console.error("Forgot password error:", err);
      res.status(500).json({ message: "Failed to send reset code." });
    }
  });

  app.post("/api/auth/verify-otp", async (req, res) => {
    try {
      const { email, otp } = req.body;
      if (!email || !otp) {
        return res.status(400).json({ message: "Email and code are required" });
      }

      const record = await getOtp(email.toLowerCase().trim());
      if (!record) {
        return res.status(400).json({ message: "No reset code found. Please request a new one." });
      }
      if (new Date() > record.expiresAt) {
        await deleteOtp(email.toLowerCase().trim());
        return res.status(400).json({ message: "Code has expired. Please request a new one." });
      }
      if (record.otp !== otp.trim()) {
        return res.status(400).json({ message: "Invalid code. Please try again." });
      }

      await markOtpVerified(email.toLowerCase().trim());
      res.status(200).json({ message: "Code verified successfully." });
    } catch (err: any) {
      console.error("Verify OTP error:", err);
      res.status(500).json({ message: "Failed to verify code" });
    }
  });

  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      const { email, otp, newPassword } = req.body;
      if (!email || !otp || !newPassword) {
        return res.status(400).json({ message: "Email, code and new password are required" });
      }
      if (newPassword.length < 8) {
        return res.status(400).json({ message: "Password must be at least 8 characters" });
      }

      const record = await getOtp(email.toLowerCase().trim());
      if (!record || !record.verified || record.otp !== otp.trim()) {
        return res.status(400).json({ message: "Invalid or expired code. Please start over." });
      }
      if (new Date() > record.expiresAt) {
        await deleteOtp(email.toLowerCase().trim());
        return res.status(400).json({ message: "Code expired. Please request a new one." });
      }

      const user = await (getStorage() as any).getUserByEmail(email.toLowerCase().trim());
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const hashedReset = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
      await getStorage().updateUser(user.id, { password: hashedReset });
      await deleteOtp(email.toLowerCase().trim());

      res.status(200).json({ message: "Password reset successfully." });
    } catch (err: any) {
      console.error("Reset password error:", err);
      res.status(500).json({ message: "Failed to reset password" });
    }
  });

  // ── Google OAuth ───────────────────────────────────────────────────────────

  // Resolves the base URL of the running app.
  // Priority: APP_URL env var → x-forwarded-host (Vercel/proxy) → Host header.
  // Always uses https in production so the OAuth callback URL is correct.
  function getBaseUrl(req: Request): string {
    if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, "");
    const proto =
      process.env.NODE_ENV === "production"
        ? "https"
        : (req.headers["x-forwarded-proto"] as string) || "http";
    const host =
      (req.headers["x-forwarded-host"] as string) || req.headers.host || "localhost:5000";
    return `${proto}://${host}`;
  }

  // Returns whether Google OAuth is configured and the exact callback URL to
  // register in Google Cloud Console → Credentials → Authorised redirect URIs.
  app.get("/api/auth/google/status", (req, res) => {
    const enabled = !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
    res.json({
      enabled,
      callbackUrl: `${getBaseUrl(req)}/api/auth/google/callback`,
    });
  });

  app.get("/api/auth/google", (req, res) => {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) {
      return res.redirect("/auth?error=google_not_configured");
    }
    const redirectUri = encodeURIComponent(`${getBaseUrl(req)}/api/auth/google/callback`);
    const scope = encodeURIComponent("openid email profile");
    const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}&access_type=offline&prompt=select_account`;
    res.redirect(url);
  });

  app.get("/api/auth/google/callback", async (req, res) => {
    try {
      const { code, error } = req.query as { code?: string; error?: string };
      if (error || !code) {
        return res.redirect("/auth?error=google_cancelled");
      }

      const clientId = process.env.GOOGLE_CLIENT_ID;
      const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
      const redirectUri = `${getBaseUrl(req)}/api/auth/google/callback`;

      if (!clientId || !clientSecret) {
        return res.redirect("/auth?error=google_not_configured");
      }

      // Exchange code for tokens
      const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          grant_type: "authorization_code",
        }),
      });
      const tokenData = await tokenRes.json() as any;
      if (!tokenData.access_token) {
        console.error("Google token exchange failed:", tokenData);
        return res.redirect("/auth?error=google_token_failed");
      }

      // Fetch user info
      const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });
      const profile = await userInfoRes.json() as any;

      if (!profile.email) {
        return res.redirect("/auth?error=google_no_email");
      }

      // Find or create user
      let user = await (getStorage() as any).getUserByEmail(profile.email.toLowerCase());
      if (!user) {
        // New user — store profile in session and redirect to role selection
        (req as any).session.pendingGoogleProfile = {
          email: profile.email.toLowerCase(),
          name: profile.name || "",
          firstName: profile.given_name || "",
          lastName: profile.family_name || "",
          picture: profile.picture || null,
        };
        return res.redirect("/role-select");
      }

      (req as any).session.userId = user.id;
      res.redirect("/dashboard");
    } catch (err: any) {
      console.error("Google OAuth callback error:", err);
      res.redirect("/auth?error=google_failed");
    }
  });

  app.get("/api/auth/pending-profile", (req, res) => {
    const pending = (req as any).session?.pendingGoogleProfile;
    if (!pending) return res.status(404).json({ message: "No pending profile" });
    res.json(pending);
  });

  app.post("/api/auth/complete-google-signup", async (req, res) => {
    try {
      const pending = (req as any).session?.pendingGoogleProfile;
      if (!pending) return res.status(400).json({ message: "No pending Google profile" });

      const { role } = req.body as { role?: string };
      if (!role || !["student", "supervisor", "school"].includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
      }

      const baseUsername = (pending.email.split("@")[0] || "user").replace(/[^a-z0-9]/gi, "").toLowerCase();
      let username = baseUsername;
      let suffix = 1;
      while (await getStorage().getUserByUsername(username)) {
        username = `${baseUsername}${suffix++}`;
      }

      const googlePlaceholder = await bcrypt.hash(`google_oauth_${Date.now()}_${Math.random()}`, BCRYPT_ROUNDS);
      const user = await getStorage().createUser({
        username,
        password: googlePlaceholder,
        name: pending.name || `${pending.firstName} ${pending.lastName}`.trim() || username,
        firstName: pending.firstName,
        lastName: pending.lastName,
        email: pending.email,
        role,
        organization: "",
        profilePicture: pending.picture || null,
        emailVerified: true,
      });
      // Mark as Google OAuth user so password-change flow knows no current password exists
      await getStorage().updateUser(user.id, { provider: "google" } as any);

      delete (req as any).session.pendingGoogleProfile;
      (req as any).session.userId = user.id;
      res.json({ ok: true });
    } catch (err: any) {
      console.error("complete-google-signup error:", err);
      res.status(500).json({ message: "Failed to complete signup" });
    }
  });

  app.get("/api/onboarding/status", requireAuth, async (req, res) => {
    try {
      const userId = (req as any).session.userId;
      const user = await getStorage().getUser(userId);
      if (!user) return res.status(404).json({ message: "User not found" });
      const spaces = await getStorage().getUserSpaces(userId);
      res.json({
        profileComplete: !!(user.firstName && user.lastName && user.email && user.organization),
        pictureUploaded: !!(user.profilePicture),
        spaceJoined: spaces.length > 0,
        accountAgeDays: user.createdAt
          ? Math.floor((Date.now() - new Date(user.createdAt).getTime()) / 86_400_000)
          : 0,
      });
    } catch (err) {
      console.error("onboarding/status error:", err);
      res.status(500).json({ message: "Internal error" });
    }
  });

  // Settings Routes
  app.post("/api/settings/notifications", requireAuth, async (req, res) => {
    try {
      const userId = (req as any).session.userId;
      const { emailNotifications, taskReminders, scrumsNotifications, documentAlerts } = req.body;

      // In a real app, this would be stored in a user_settings or user_preferences table
      // For now, we'll just acknowledge the request
      res.json({
        message: "Notification preferences saved",
        preferences: {
          emailNotifications,
          taskReminders,
          scrumsNotifications,
          documentAlerts,
        },
      });
    } catch (err) {
      console.error("Settings update error:", err);
      res.status(500).json({ message: "Internal error" });
    }
  });

  // User Search Routes (Public)
  app.get("/api/users/search", async (req, res) => {
    try {
      const query = (req.query.q as string || "").toLowerCase();
      const spaceId = req.query.spaceId ? Number(req.query.spaceId) : null;
      
      if (!query || query.length < 2) {
        return res.json([]);
      }

      const results: any[] = [];
      const usersMap = (getStorage() as any).users as Map<number, any>;
      
      // If spaceId is provided, only return members of that space
      let allowedUserIds: Set<number> | null = null;
      if (spaceId) {
        const members = await getStorage().getSpaceMembers(spaceId);
        allowedUserIds = new Set(members.map(m => m.userId));
      }
      
      for (const user of usersMap.values()) {
        // Filter by space membership if spaceId provided
        if (allowedUserIds && !allowedUserIds.has(user.id)) {
          continue;
        }
        
        if (
          user.username.toLowerCase().includes(query) ||
          (user.firstName && user.firstName.toLowerCase().includes(query)) ||
          (user.lastName && user.lastName.toLowerCase().includes(query)) ||
          user.name.toLowerCase().includes(query) ||
          (user.email && user.email.toLowerCase().includes(query))
        ) {
          results.push(getPublicUserInfo(user));
          if (results.length >= 20) break;
        }
      }

      res.json(results);
    } catch (err) {
      console.error("User search error:", err);
      res.status(500).json({ message: "Internal error" });
    }
  });

  // Get public user profile
  app.get("/api/users/:id", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const user = await getStorage().getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json(getPublicUserInfo(user));
    } catch (err) {
      console.error("Get user error:", err);
      res.status(500).json({ message: "Internal error" });
    }
  });

  app.use('/api/spaces', requireAuth);

  // Spaces
  app.get(api.spaces.list.path, async (req, res) => {
    const spaces = await getStorage().getUserSpaces((req as any).session.userId);
    res.json(spaces);
  });

  app.post(api.spaces.create.path, async (req, res) => {
    try {
      const input = api.spaces.create.input.parse(req.body);
      const space = await getStorage().createSpace({...input, ownerId: (req as any).session.userId});
      await getStorage().joinSpace(space.id, space.ownerId, 'owner');
      res.status(201).json(space);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: "Internal error" });
    }
  });

  app.post(api.spaces.join.path, async (req, res) => {
    try {
      const input = api.spaces.join.input.parse(req.body);
      console.log('[JOIN DEBUG] Input received:', input);
      
      const spaces = await getStorage().getSpaces();
      console.log('[JOIN DEBUG] Available spaces:', spaces.map(s => ({ 
        id: s.id, 
        name: s.name, 
        joinCode: s.joinCode,
        _id: s._id // MongoDB ObjectId
      })));
      
      const space = spaces.find(s => s.joinCode === input.joinCode);
      console.log('[JOIN DEBUG] Found space:', space);
      console.log('[JOIN DEBUG] Space ID type:', typeof space?.id, space?.id);
      
      if (!space) return res.status(404).json({ message: "Space not found" });
      
      const members = await getStorage().getSpaceMembers(space.id);
      const existing = members.find(m => m.userId === (req as any).session.userId);
      if (existing) return res.json(existing);

      const member = await getStorage().joinSpace(space.id, (req as any).session.userId, 'member');
      res.json(member);
    } catch (err) {
      console.error('[JOIN ERROR]', err);
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: "Internal error" });
    }
  });

  // Space Settings
  app.get('/api/spaces/:spaceId/settings', requireAuth, requireSpaceMembership, async (req, res) => {
    try {
      const spaceId = Number(req.params.spaceId);
      const userId = (req as any).session.userId;
      
      // Check if user is owner or supervisor
      const space = await getStorage().getSpace(spaceId);
      const members = await getStorage().getSpaceMembers(spaceId);
      const userMember = members.find(m => m.userId === userId);
      
      if (!space || !userMember) {
        return res.status(404).json({ message: "Space not found or access denied" });
      }
      
      if (space.ownerId !== userId && userMember.role !== 'supervisor' && userMember.role !== 'owner') {
        return res.status(403).json({ message: "Only space owners and supervisors can access settings" });
      }
      
      // Get space settings (for now return default settings)
      // TODO: Implement spaceSettings storage
      const settings = {
        id: 1,
        spaceId,
        totalRequiredHours: 486,
        requiredDocuments: [],
        documentDeadlines: [],
        dailyHoursMin: 1,
        dailyHoursMax: 8,
        weeklyHoursMin: 20,
        weeklyHoursMax: 40,
        requiredAttendanceDays: 5,
        allowedAbsences: 2,
        scrumFrequency: "daily",
        scrumTimeRequirement: "end_of_day",
        evaluationFrequency: "monthly",
        evaluationCriteria: [],
        companyPolicies: "",
        workingHours: "9:00 AM - 6:00 PM",
        breakDuration: 60,
        communicationChannels: [],
        reportingStructure: "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      res.json(settings);
    } catch (err) {
      console.error('[SETTINGS GET ERROR]', err);
      res.status(500).json({ message: "Internal error" });
    }
  });

  app.post('/api/spaces/:spaceId/settings', requireAuth, requireSpaceMembership, async (req, res) => {
    try {
      const spaceId = Number(req.params.spaceId);
      const userId = (req as any).session.userId;
      
      // Check if user is owner or supervisor
      const space = await getStorage().getSpace(spaceId);
      const members = await getStorage().getSpaceMembers(spaceId);
      const userMember = members.find(m => m.userId === userId);
      
      if (!space || !userMember) {
        return res.status(404).json({ message: "Space not found or access denied" });
      }
      
      if (space.ownerId !== userId && userMember.role !== 'supervisor' && userMember.role !== 'owner') {
        return res.status(403).json({ message: "Only space owners and supervisors can update settings" });
      }
      
      // Validate and save settings
      const settings = req.body;
      
      // TODO: Implement spaceSettings storage
      console.log('[SETTINGS SAVE]', settings);
      
      res.json({ message: "Settings saved successfully", settings });
    } catch (err) {
      console.error('[SETTINGS POST ERROR]', err);
      res.status(500).json({ message: "Internal error" });
    }
  });

  // Generic file upload endpoint
  app.post('/api/upload', requireAuth, upload.single('file'), async (req, res) => {
    try {
      const file = req.file;
      if (!file) return res.status(400).json({ message: "No file uploaded" });
      const { url } = await uploadToCloudinary(file.buffer, file.originalname, file.mimetype);
      res.json({
        filePath: url,
        fileName: file.originalname,
        fileSize: file.size,
        mimeType: file.mimetype,
      });
    } catch (error) {
      console.error('[UPLOAD ERROR]', error);
      res.status(500).json({ message: "Upload failed" });
    }
  });

  app.post('/api/spaces/:spaceId/leave', requireAuth, async (req, res) => {
    try {
      const spaceId = Number(req.params.spaceId);
      const userId = (req as any).session.userId;
      
      // Verify user is member of this space
      const members = await getStorage().getSpaceMembers(spaceId);
      const isMember = members.some(m => m.userId === userId);
      
      if (!isMember) {
        return res.status(403).json({ message: "You are not a member of this space" });
      }
      
      await getStorage().leaveSpace(spaceId, userId);
      res.status(200).json({ success: true, message: "Left space successfully" });
    } catch (err) {
      res.status(500).json({ message: "Internal error" });
    }
  });

  // Scrums
  app.get(api.scrums.list.path, async (req, res) => {
    try {
      const query = scrumQuerySchema.parse(Object.fromEntries(new URLSearchParams(req.query as any)));
      const scrums = await getStorage().getScrums(Number(req.params.spaceId), query.userId, query.date);
      res.json(scrums);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal error" });
    }
  });

  
  app.post(api.scrums.create.path, async (req, res) => {
    try {
      // Use z.coerce for user/space ID
      const schema = api.scrums.create.input.extend({
        userId: z.coerce.number(),
        spaceId: z.coerce.number(),
        timeSpent: z.coerce.number()
      });
      const input = schema.parse({ ...req.body, spaceId: req.params.spaceId });
      const scrum = await getStorage().createScrum(input);
      res.status(201).json(scrum);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: "Internal error" });
    }
  });

  app.patch(api.scrums.approve.path, async (req, res) => {
    const scrum = await getStorage().approveScrum(Number(req.params.id));
    if (!scrum) return res.status(404).json({ message: "Not found" });
    res.json(scrum);
  });

  app.delete('/api/spaces/:spaceId/scrums/:id', requireAuth, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const scrums = await getStorage().getScrums(Number(req.params.spaceId));
      const scrum = scrums.find(s => s.id === id);
      if (!scrum) return res.status(404).json({ message: "Not found" });
      if (scrum.isApproved) return res.status(403).json({ message: "Cannot delete an approved scrum" });
      const userId = (req as any).session.userId;
      if (scrum.userId !== userId) return res.status(403).json({ message: "Not authorized" });
      await getStorage().deleteScrum(id);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ message: "Internal error" });
    }
  });

  // Tasks
  app.get(api.tasks.list.path, requireAuth, requireSpaceMembership, async (req, res) => {
    try {
      const query = taskQuerySchema.parse(Object.fromEntries(new URLSearchParams(req.query as any)));
      const tasks = await getStorage().getTasks(Number(req.params.spaceId), query);
      res.json(tasks);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal error" });
    }
  });

  
  app.post(api.tasks.create.path, requireAuth, requireSpaceMembership, async (req, res) => {
    try {
      const schema = api.tasks.create.input.extend({
        spaceId: z.coerce.number(),
        authorId: z.coerce.number(),
        assignedToId: z.coerce.number().optional().nullable(),
        assignedToIds: z.array(z.coerce.number()).optional(),
        groupId: z.coerce.number().optional().nullable()
      });
      const input = schema.parse({ ...req.body, spaceId: req.params.spaceId });
      const spaceId = Number(req.params.spaceId);
      
      // Validate that all assigned users belong to this space
      if (input.assignedToIds && input.assignedToIds.length > 0) {
        const spaceMembers = await getStorage().getSpaceMembers(spaceId);
        const spaceMemberIds = spaceMembers.map(m => m.userId);
        
        for (const assignedUserId of input.assignedToIds) {
          if (!spaceMemberIds.includes(assignedUserId)) {
            return res.status(400).json({ 
              message: `User ${assignedUserId} is not a member of this space`,
              field: "assignedToIds"
            });
          }
        }
      }
      
      if (input.assignedToId) {
        const spaceMembers = await getStorage().getSpaceMembers(spaceId);
        const spaceMemberIds = spaceMembers.map(m => m.userId);
        
        if (!spaceMemberIds.includes(input.assignedToId)) {
          return res.status(400).json({ 
            message: `User ${input.assignedToId} is not a member of this space`,
            field: "assignedToId"
          });
        }
      }
      
      const task = await getStorage().createTask({
        spaceId: input.spaceId,
        title: input.title,
        description: input.description || null,
        type: input.type,
        status: input.status,
        assignedToId: input.assignedToIds?.[0] || input.assignedToId || null,
        groupId: input.groupId || null,
        authorId: input.authorId
      });
      
      // Add multiple assignees if provided
      if (input.assignedToIds && input.assignedToIds.length > 0) {
        for (const userId of input.assignedToIds) {
          await getStorage().addTaskAssignee(task.id, userId);
        }
      }
      
      // Get all assignees for response
      const assignees = input.assignedToIds && input.assignedToIds.length > 0 
        ? await getStorage().getTaskAssignees(task.id)
        : [];
      
      res.status(201).json({ ...task, assignees });
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: "Internal error" });
    }
  });
  
  app.put(api.tasks.update.path, requireAuth, requireSpaceMembership, async (req, res) => {
    try {
      const input = api.tasks.update.input.parse(req.body);
      const task = await getStorage().updateTask(Number(req.params.id), input);
      if (!task) return res.status(404).json({ message: "Not found" });
      res.json(task);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: "Internal error" });
    }
  });

  app.delete(api.tasks.delete.path, requireAuth, requireSpaceMembership, async (req, res) => {
    await getStorage().deleteTask(Number(req.params.id));
    res.status(204).end();
  });

  // Task Assignees
  app.get("/api/spaces/:spaceId/tasks/:taskId/assignees", async (req, res) => {
    try {
      const assignees = await getStorage().getTaskAssignees(Number(req.params.taskId));
      res.json(assignees);
    } catch (err) {
      res.status(500).json({ message: "Internal error" });
    }
  });

  app.post("/api/spaces/:spaceId/tasks/:taskId/assignees", async (req, res) => {
    try {
      const { userId } = req.body;
      if (!userId) return res.status(400).json({ message: "userId is required" });
      const assignee = await getStorage().addTaskAssignee(Number(req.params.taskId), userId);
      res.status(201).json(assignee);
    } catch (err) {
      res.status(500).json({ message: "Internal error" });
    }
  });

  app.delete("/api/spaces/:spaceId/tasks/:taskId/assignees/:userId", async (req, res) => {
    try {
      await getStorage().removeTaskAssignee(Number(req.params.taskId), Number(req.params.userId));
      res.status(204).end();
    } catch (err) {
      res.status(500).json({ message: "Internal error" });
    }
  });

  // Personal (no-space) Time Logs
  app.get('/api/personal/time-logs', requireAuth, async (req, res) => {
    try {
      const userId = (req as any).session.userId;
      const logs = await getStorage().getPersonalTimeLogs(userId);
      res.json(logs);
    } catch (err) {
      res.status(500).json({ message: "Internal error" });
    }
  });

  app.post('/api/personal/time-logs', requireAuth, async (req, res) => {
    try {
      const userId = (req as any).session.userId;
      const schema = z.object({
        date: z.string(),
        hours: z.coerce.number().min(1).max(24),
        description: z.string().optional().nullable(),
      });
      const input = schema.parse(req.body);
      const log = await getStorage().createTimeLog({ ...input, userId, spaceId: null as any, taskId: null });
      res.status(201).json(log);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: "Internal error" });
    }
  });

  // Personal (no-space) Scrums
  app.get('/api/personal/scrums', requireAuth, async (req, res) => {
    try {
      const userId = (req as any).session.userId;
      const scrums = await getStorage().getPersonalScrums(userId);
      res.json(scrums);
    } catch (err) {
      res.status(500).json({ message: "Internal error" });
    }
  });

  app.post('/api/personal/scrums', requireAuth, async (req, res) => {
    try {
      const userId = (req as any).session.userId;
      const schema = z.object({
        date: z.string(),
        taskYesterdayPlanned: z.string().default(''),
        taskYesterdayCompleted: z.string().default(''),
        taskTodayPlanned: z.string().default(''),
        taskTodayCompleted: z.string().default(''),
        whatNext: z.string().default(''),
        timeSpent: z.coerce.number().default(0),
        reflection: z.string().default(''),
        completionPercentage: z.coerce.number().min(0).max(100).default(0),
      });
      const input = schema.parse(req.body);
      const scrum = await getStorage().createScrum({ ...input, userId, spaceId: null as any });
      res.status(201).json(scrum);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: "Internal error" });
    }
  });

  app.delete('/api/personal/scrums/:id', requireAuth, async (req, res) => {
    try {
      const userId = (req as any).session.userId;
      const id = Number(req.params.id);
      const scrums = await getStorage().getPersonalScrums(userId);
      const scrum = scrums.find(s => s.id === id);
      if (!scrum) return res.status(404).json({ message: "Not found" });
      if (scrum.isApproved) return res.status(403).json({ message: "Cannot delete an approved scrum" });
      if (scrum.userId !== userId) return res.status(403).json({ message: "Not authorized" });
      await getStorage().deleteScrum(id);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ message: "Internal error" });
    }
  });

  // Personal (no-space) Tasks
  app.get('/api/personal/tasks', requireAuth, async (req, res) => {
    try {
      const userId = (req as any).session.userId;
      const tasks = await getStorage().getPersonalTasks(userId);
      res.json(tasks);
    } catch (err) {
      res.status(500).json({ message: "Internal error" });
    }
  });

  app.post('/api/personal/tasks', requireAuth, async (req, res) => {
    try {
      const userId = (req as any).session.userId;
      const schema = z.object({
        title: z.string().min(1),
        description: z.string().optional().default(''),
        status: z.enum(['todo', 'doing', 'done']).default('todo'),
        type: z.string().default('personal'),
      });
      const input = schema.parse(req.body);
      const task = await getStorage().createTask({
        ...input,
        spaceId: null as any,
        authorId: userId,
        assignedToId: userId,
        groupId: null,
      });
      res.status(201).json(task);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: "Internal error" });
    }
  });

  app.patch('/api/personal/tasks/:id', requireAuth, async (req, res) => {
    try {
      const userId = (req as any).session.userId;
      const id = Number(req.params.id);
      const tasks = await getStorage().getPersonalTasks(userId);
      const task = tasks.find(t => t.id === id);
      if (!task) return res.status(404).json({ message: "Not found" });
      if (task.authorId !== userId) return res.status(403).json({ message: "Not authorized" });
      const updated = await getStorage().updateTask(id, req.body);
      res.json(updated);
    } catch (err) {
      res.status(500).json({ message: "Internal error" });
    }
  });

  app.delete('/api/personal/tasks/:id', requireAuth, async (req, res) => {
    try {
      const userId = (req as any).session.userId;
      const id = Number(req.params.id);
      const tasks = await getStorage().getPersonalTasks(userId);
      const task = tasks.find(t => t.id === id);
      if (!task) return res.status(404).json({ message: "Not found" });
      if (task.authorId !== userId) return res.status(403).json({ message: "Not authorized" });
      await getStorage().deleteTask(id);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ message: "Internal error" });
    }
  });

  // Personal (no-space) Documents
  app.get('/api/personal/documents', requireAuth, async (req, res) => {
    try {
      const userId = (req as any).session.userId;
      const docs = await getStorage().getPersonalDocuments(userId);
      res.json(docs);
    } catch (err) {
      res.status(500).json({ message: "Internal error" });
    }
  });

  app.post('/api/personal/documents', requireAuth, upload.single('file'), async (req, res) => {
    try {
      const userId = (req as any).session.userId;
      const file = (req as any).file;
      if (!file) return res.status(400).json({ message: "No file uploaded" });
      const { url } = await uploadToCloudinary(file.buffer, file.originalname, file.mimetype);
      const docType = req.body.documentType ?? req.body.type ?? "other";
      const doc = await getStorage().createDocument({
        spaceId: null as any,
        uploaderId: userId,
        name: req.body.name ?? file.originalname,
        type: "personal",
        documentType: docType,
        status: "submitted",
        filePath: url,
        originalFileName: file.originalname,
        fileSize: file.size,
        mimeType: file.mimetype,
        notes: req.body.notes ?? null,
      });
      res.status(201).json(doc);
    } catch (err) {
      res.status(500).json({ message: "Internal error" });
    }
  });

  app.delete('/api/personal/documents/:id', requireAuth, async (req, res) => {
    try {
      const userId = (req as any).session.userId;
      const id = Number(req.params.id);
      const docs = await getStorage().getPersonalDocuments(userId);
      const doc = docs.find(d => d.id === id);
      if (!doc) return res.status(404).json({ message: "Not found" });
      if (doc.uploaderId !== userId) return res.status(403).json({ message: "Not authorized" });
      await getStorage().deleteDocument(id);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ message: "Internal error" });
    }
  });

  // Time Logs
  app.get(api.timeLogs.list.path, requireAuth, requireSpaceMembership, async (req, res) => {
    try {
      const query = timeLogQuerySchema.parse(Object.fromEntries(new URLSearchParams(req.query as any)));
      const logs = await getStorage().getTimeLogs(Number(req.params.spaceId), query);
      res.json(logs);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal error" });
    }
  });


  app.post(api.timeLogs.create.path, requireAuth, requireSpaceMembership, async (req, res) => {
    try {
      const schema = api.timeLogs.create.input.extend({
        spaceId: z.coerce.number(),
        userId: z.coerce.number(),
        hours: z.coerce.number(),
        taskId: z.coerce.number().optional().nullable(),
        description: z.string().optional().nullable()
      });
      const input = schema.parse({ ...req.body, spaceId: req.params.spaceId });
      const spaceId = Number(req.params.spaceId);
      
      // Verify user can only create time logs for themselves (unless admin/supervisor)
      const userRole = (req as any).userRole;
      if (input.userId !== (req as any).session.userId && !['admin', 'supervisor', 'owner'].includes(userRole)) {
        return res.status(403).json({ message: "You can only create time logs for yourself" });
      }
      
      // Verify the user belongs to this space
      const spaceMembers = await getStorage().getSpaceMembers(spaceId);
      const spaceMemberIds = spaceMembers.map(m => m.userId);
      
      if (!spaceMemberIds.includes(input.userId)) {
        return res.status(403).json({ message: "User is not a member of this space" });
      }
      
      // If task is specified, verify it belongs to this space
      if (input.taskId) {
        const tasks = await getStorage().getTasks(spaceId);
        const taskExists = tasks.some(t => t.id === input.taskId);
        if (!taskExists) {
          return res.status(400).json({ message: "Task does not belong to this space", field: "taskId" });
        }
      }
      
      const log = await getStorage().createTimeLog(input);
      res.status(201).json(log);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: "Internal error" });
    }
  });

  app.patch(api.timeLogs.approve.path, requireAuth, requireSpaceMembership, async (req, res) => {
    const log = await getStorage().approveTimeLog(Number(req.params.id));
    if (!log) return res.status(404).json({ message: "Not found" });
    res.json(log);
  });

  // Attendance
  app.get(api.attendance.list.path, requireAuth, requireSpaceMembership, async (req, res) => {
    const atts = await getStorage().getAttendance(Number(req.params.spaceId));
    res.json(atts);
  });

  app.post(api.attendance.create.path, requireAuth, requireSpaceMembership, async (req, res) => {
    try {
      const schema = api.attendance.create.input.extend({
        spaceId: z.coerce.number(),
        userId: z.coerce.number()
      });
      const input = schema.parse({ ...req.body, spaceId: req.params.spaceId });
      const att = await getStorage().createAttendance(input);
      res.status(201).json(att);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: "Internal error" });
    }
  });

  // Serve uploaded files for download
  app.get('/api/documents/:id/file', requireAuth, async (req, res) => {
    try {
      const docId = Number(req.params.id);
      const allDocs = await getStorage().getAllDocuments();
      const doc = allDocs.find((d: any) => d.id === docId);
      if (!doc || !(doc as any).filePath) return res.status(404).json({ message: "No file attached to this document" });
      const filePath: string = (doc as any).filePath;
      // Cloudinary URLs are public — redirect the client directly
      if (filePath.startsWith("http://") || filePath.startsWith("https://")) {
        return res.redirect(filePath);
      }
      // Legacy: old local path still on disk (pre-Cloudinary uploads)
      const absPath = path.isAbsolute(filePath)
        ? filePath
        : path.resolve(process.cwd(), filePath.replace(/^\//, ''));
      if (!fs.existsSync(absPath)) return res.status(404).json({ message: "File not found" });
      const filename = (doc as any).originalFileName || path.basename(absPath);
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
      if ((doc as any).mimeType) res.setHeader('Content-Type', (doc as any).mimeType);
      res.sendFile(absPath, (err) => {
        if (err && !res.headersSent) {
          console.error('[DOWNLOAD] sendFile error:', err);
          res.status(500).json({ message: "Failed to serve file" });
        }
      });
    } catch (err) {
      console.error('[DOWNLOAD] error:', err);
      if (!res.headersSent) res.status(500).json({ message: "Internal error" });
    }
  });

  // Documents
  app.get(api.documents.list.path, requireAuth, requireSpaceMembership, async (req, res) => {
    const docs = await getStorage().getDocuments(Number(req.params.spaceId));
    res.json(docs);
  });

  app.post(api.documents.create.path, requireAuth, requireSpaceMembership, upload.single('file'), async (req, res) => {
    try {
      const today = new Date().toISOString().split("T")[0];
      const userId = (req as any).session.userId;
      const user = await getStorage().getUser(userId);
      const isSupervisor = user?.role === 'supervisor' || user?.role === 'school' || user?.role === 'admin';

      let filePath: string | null = null;
      let fileSize: number | null = null;
      let mimeType: string | null = null;
      let originalFileName: string | null = null;

      if (req.file) {
        const { url } = await uploadToCloudinary(req.file.buffer, req.file.originalname, req.file.mimetype);
        filePath = url;
        fileSize = req.file.size;
        mimeType = req.file.mimetype;
        originalFileName = req.file.originalname;
      }

      const body = req.body;
      const input = {
        spaceId: Number(req.params.spaceId),
        uploaderId: userId,
        name: body.name,
        type: body.type ?? 'other',
        documentType: body.documentType ?? body.type ?? 'other',
        uploadDate: today,
        status: isSupervisor ? 'approved' : 'submitted',
        filePath,
        fileSize,
        mimeType,
        originalFileName,
      };
      if (!input.name) return res.status(400).json({ message: "Document name is required" });
      const doc = await getStorage().createDocument(input);
      if (!isSupervisor) {
        await notifyByRole(getStorage(), Number(req.params.spaceId), ['supervisor', 'school'], 'documents', doc.id, 'document_uploaded');
      } else {
        await notifyByRole(getStorage(), Number(req.params.spaceId), ['student'], 'documents', doc.id, 'document_uploaded');
      }
      res.status(201).json(doc);
    } catch (err) {
      console.error('[DOC CREATE ERROR]', err);
      res.status(500).json({ message: "Internal error" });
    }
  });

  app.delete('/api/spaces/:spaceId/documents/:id', requireAuth, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const docs = await getStorage().getDocuments(Number(req.params.spaceId));
      const doc = docs.find(d => d.id === id);
      if (!doc) return res.status(404).json({ message: "Not found" });
      if (doc.status === 'approved') return res.status(403).json({ message: "Cannot delete an approved document" });
      const userId = (req as any).session.userId;
      if (doc.uploaderId !== userId) return res.status(403).json({ message: "Not authorized" });
      await getStorage().deleteDocument(id);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ message: "Internal error" });
    }
  });

  app.patch('/api/spaces/:spaceId/documents/:id/approve', requireAuth, requireSpaceMembership, async (req, res) => {
    const doc = await getStorage().approveDocument(Number(req.params.id));
    if (!doc) return res.status(404).json({ message: "Not found" });
    await notifyUser(getStorage(), doc.uploaderId, Number(req.params.spaceId), 'documents', doc.id, 'document_approved');
    res.json(doc);
  });

  app.patch('/api/spaces/:spaceId/documents/:id/reject', requireAuth, requireSpaceMembership, async (req, res) => {
    const doc = await getStorage().rejectDocument(Number(req.params.id));
    if (!doc) return res.status(404).json({ message: "Not found" });
    await notifyUser(getStorage(), doc.uploaderId, Number(req.params.spaceId), 'documents', doc.id, 'document_rejected');
    res.json(doc);
  });

  app.put('/api/documents/:id', requireAuth, async (req, res) => {
    try {
      const documentId = Number(req.params.id);
      const userId = (req as any).session.userId;
      
      // Get document to verify permissions
      const docs = await getStorage().getDocuments(0); // This needs to be fixed to get by ID
      const document = docs.find(d => d.id === documentId);
      
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }
      
      // Check if user is supervisor or document owner
      const user = await getStorage().getUser(userId);
      const isSupervisor = user?.role === "supervisor" || user?.role === "school";
      const isOwner = document.uploaderId === userId;
      
      if (!isSupervisor && !isOwner) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      // Update document
      const updatedDoc = await getStorage().updateDocument(documentId, {
        ...req.body,
        approvedBy: isSupervisor ? userId : document.approvedBy,
        approvedDate: req.body.status === 'approved' ? new Date().toISOString() : document.approvedDate
      });
      
      res.json(updatedDoc);
    } catch (error) {
      console.error('[DOCUMENT UPDATE ERROR]', error);
      res.status(500).json({ message: "Failed to update document" });
    }
  });

  // Messages
  app.get(api.messages.list.path, requireAuth, requireSpaceMembership, async (req, res) => {
    const spaceId = Number(req.params.spaceId);
    const channelId = req.query.channelId as string | undefined;
    const msgs = await getStorage().getMessages(spaceId, channelId);
    
    // Get all users in the space to include user information
    const members = await getStorage().getSpaceMembers(spaceId);
    const userIds = members.map(m => m.userId);
    const users = await Promise.all(
      userIds.map(async (userId) => {
        const user = await getStorage().getUser(userId);
        return user ? { id: user.id, name: user.name, username: user.username, profilePicture: user.profilePicture, role: user.role } : null;
      })
    ).then(users => users.filter(Boolean));
    
    // Attach user information to messages
    const messagesWithUsers = msgs.map(msg => {
      const user = users.find(u => u.id === msg.senderId);
      return {
        ...msg,
        sender: user || {
          id: msg.senderId,
          name: `User #${msg.senderId}`,
          username: `user_${msg.senderId}`,
          profilePicture: null,
          role: 'unknown'
        }
      };
    });
    
    res.json(messagesWithUsers);
  });

  app.post(api.messages.create.path, requireAuth, requireSpaceMembership, async (req, res) => {
    try {
      const schema = api.messages.create.input.extend({
        spaceId: z.coerce.number(),
        senderId: z.coerce.number(),
        recipientId: z.coerce.number()
      });
      const input = schema.parse({ ...req.body, spaceId: req.params.spaceId });
      const spaceId = Number(req.params.spaceId);
      
      // Verify sender matches current user
      if (Number(input.senderId) !== Number((req as any).session.userId)) {
        return res.status(403).json({ message: "You can only send messages as yourself" });
      }
      
      // Get space members for validation
      const spaceMembers = await getStorage().getSpaceMembers(spaceId);
      const spaceMemberIds = spaceMembers.map(m => m.userId);
      
      // For channel messages (recipientId = 0), skip recipient validation
      // For DM messages, verify recipient is member of the space
      if (input.recipientId !== 0 && !spaceMemberIds.includes(input.recipientId)) {
        return res.status(403).json({ message: "Recipient is not a member of this space" });
      }
      
      const msg = await getStorage().createMessage(input);
      res.status(201).json(msg);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: "Internal error" });
    }
  });

  app.post('/api/spaces/:spaceId/messages/:channelId/mark-read', requireAuth, requireSpaceMembership, async (req, res) => {
    try {
      await getStorage()['markAsRead'](Number(req.params.spaceId), req.params.channelId, (req as any).session.userId);
      res.status(200).json({ success: true });
    } catch (err) {
      res.status(500).json({ message: "Internal error" });
    }
  });

  app.get('/api/spaces/:spaceId/unread-messages', requireAuth, requireSpaceMembership, async (req, res) => {
    try {
      const count = await getStorage()['getUnreadCount'](Number(req.params.spaceId), (req as any).session.userId);
      res.set('Content-Type', 'text/plain');
      res.send(count.toString());
    } catch (err) {
      res.status(500).json({ message: "Internal error" });
    }
  });

  // Get DM conversation partners (users with actual message history)
  app.get('/api/spaces/:spaceId/unread-per-channel', requireAuth, requireSpaceMembership, async (req, res) => {
    try {
      const counts = await getStorage()['getUnreadCountsPerChannel'](
        Number(req.params.spaceId),
        (req as any).session.userId
      );
      res.json(counts);
    } catch (err) {
      res.status(500).json({ message: 'Internal error' });
    }
  });

    // Notification counts per section for current user
  app.get('/api/spaces/:spaceId/notification-counts', requireAuth, requireSpaceMembership, async (req, res) => {
    try {
      const spaceId = Number(req.params.spaceId);
      const userId = (req as any).session.userId;
      const counts = await (getStorage() as any).getNotificationCounts(spaceId, userId);
      res.json(counts);
    } catch (err) {
      res.status(500).json({ message: "Internal error" });
    }
  });

  // Mark all notifications in a section as read for current user
  app.post('/api/spaces/:spaceId/notifications/mark-read', requireAuth, requireSpaceMembership, async (req, res) => {
    try {
      const spaceId = Number(req.params.spaceId);
      const userId = (req as any).session.userId;
      const { section } = req.body;
      if (!section) return res.status(400).json({ message: "section required" });
      await (getStorage() as any).markNotificationsRead(spaceId, userId, section);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ message: "Internal error" });
    }
  });

    app.get('/api/spaces/:spaceId/dm-conversations', requireAuth, requireSpaceMembership, async (req, res) => {
    try {
      const spaceId = Number(req.params.spaceId);
      const userId = (req as any).session.userId;
      
      // Get all messages for this space
      const allMessages = await getStorage().getMessages(spaceId, null);
      
      // Filter for DM messages involving this user
      const dmMessages = allMessages.filter(msg => {
        if (!msg.channelId.startsWith('dm-')) return false;
        const parts = msg.channelId.split('-');
        const id1 = Number(parts[1]);
        const id2 = Number(parts[2]);
        return (id1 === userId || id2 === userId);
      });
      
      // Get unique partner IDs
      const partnerIds = new Set<number>();
      dmMessages.forEach(msg => {
        const parts = msg.channelId.split('-');
        const id1 = Number(parts[1]);
        const id2 = Number(parts[2]);
        const partnerId = id1 === userId ? id2 : id1;
        partnerIds.add(partnerId);
      });
      
      // Get user info for partners
      const partners = await Promise.all(
        Array.from(partnerIds).map(async (partnerId) => {
          const user = await getStorage().getUser(partnerId);
          return user ? {
            id: user.id,
            name: user.name,
            username: user.username,
            profilePicture: user.profilePicture,
            role: user.role
          } : null;
        })
      );
      
      res.json(partners.filter(Boolean));
    } catch (err) {
      res.status(500).json({ message: "Internal error" });
    }
  });

  // Space Members (with user info)
  app.get('/api/spaces/:spaceId/members', async (req, res) => {
    const spaceId = Number(req.params.spaceId);
    const members = await getStorage().getSpaceMembers(spaceId);
    const membersWithUsers = await Promise.all(
      members.map(async (m) => {
        const user = await getStorage().getUser(m.userId);
        return { ...m, user };
      })
    );
    res.json(membersWithUsers);
  });

  // Remove a member from a space (supervisor/owner only)
  app.delete('/api/spaces/:spaceId/members/:userId', requireAuth, requireSpaceMembership, async (req, res) => {
    try {
      const spaceId = Number(req.params.spaceId);
      const targetUserId = Number(req.params.userId);
      const requesterId = (req as any).session.userId;
      const requesterRole = (req as any).userRole;

      const space = await getStorage().getSpace(spaceId);
      if (!space) return res.status(404).json({ message: "Space not found" });

      if (requesterRole !== 'supervisor' && requesterRole !== 'owner' && space.ownerId !== requesterId) {
        return res.status(403).json({ message: "Only supervisors can remove members" });
      }
      if (targetUserId === requesterId) {
        return res.status(400).json({ message: "You cannot remove yourself" });
      }
      if (targetUserId === space.ownerId) {
        return res.status(400).json({ message: "Cannot remove the space owner" });
      }

      await getStorage().leaveSpace(spaceId, targetUserId);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ message: "Internal error" });
    }
  });

  // Update a member's role (supervisor/owner only)
  app.patch('/api/spaces/:spaceId/members/:userId/role', requireAuth, requireSpaceMembership, async (req, res) => {
    try {
      const spaceId = Number(req.params.spaceId);
      const targetUserId = Number(req.params.userId);
      const requesterId = (req as any).session.userId;
      const requesterRole = (req as any).userRole;
      const { role } = req.body;

      if (!['student', 'supervisor', 'school'].includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
      }

      const space = await getStorage().getSpace(spaceId);
      if (!space) return res.status(404).json({ message: "Space not found" });

      if (requesterRole !== 'supervisor' && requesterRole !== 'owner' && space.ownerId !== requesterId) {
        return res.status(403).json({ message: "Only supervisors can change roles" });
      }
      if (targetUserId === space.ownerId) {
        return res.status(400).json({ message: "Cannot change the space owner's role" });
      }

      const updated = await getStorage().updateSpaceMemberRole(spaceId, targetUserId, role);
      if (!updated) return res.status(404).json({ message: "Member not found" });
      res.json(updated);
    } catch (err) {
      res.status(500).json({ message: "Internal error" });
    }
  });

  // Groups
  app.get(api.groups.list.path, async (req, res) => {
    const groups = await getStorage().getGroups(Number(req.params.spaceId));
    res.json(groups);
  });

  app.post(api.groups.create.path, async (req, res) => {
    try {
      const schema = api.groups.create.input.extend({
        spaceId: z.coerce.number()
      });
      const input = schema.parse({ ...req.body, spaceId: req.params.spaceId });
      const group = await getStorage().createGroup(input);
      res.status(201).json(group);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: "Internal error" });
    }
  });

  // Space settings update (targetHours)
  app.patch('/api/spaces/:spaceId', async (req, res) => {
    const spaceId = Number(req.params.spaceId);
    const { targetHours } = req.body;
    const updated = await getStorage().updateSpace(spaceId, { targetHours: Number(targetHours) });
    if (!updated) return res.status(404).json({ message: "Not found" });
    res.json(updated);
  });

  // Evaluations
  app.get(api.evaluations.list.path, requireAuth, requireSpaceMembership, async (req, res) => {
    const evals = await getStorage().getEvaluations(Number(req.params.spaceId));
    res.json(evals);
  });

  app.post(api.evaluations.create.path, requireAuth, requireSpaceMembership, async (req, res) => {
    try {
      const schema = api.evaluations.create.input.extend({
        spaceId: z.coerce.number(),
        evaluatorId: z.coerce.number(),
        evaluateeId: z.coerce.number(),
        punctuality: z.coerce.number(),
        attitude: z.coerce.number(),
        technical: z.coerce.number(),
        communication: z.coerce.number(),
        overall: z.coerce.number(),
      });
      const input = schema.parse({ ...req.body, spaceId: req.params.spaceId });
      const ev = await getStorage().createEvaluation(input);
      await notifyUser(getStorage(), input.evaluateeId, input.spaceId, 'evaluations', ev.id, 'new_evaluation');
      res.status(201).json(ev);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: "Internal error" });
    }
  });

  // Leave Requests
  app.get(api.leaveRequests.list.path, async (req, res) => {
    const leaves = await getStorage().getLeaveRequests(Number(req.params.spaceId));
    res.json(leaves);
  });

  app.post(api.leaveRequests.create.path, async (req, res) => {
    try {
      const schema = api.leaveRequests.create.input.extend({
        spaceId: z.coerce.number(),
        userId: z.coerce.number(),
      });
      const input = schema.parse({ ...req.body, spaceId: req.params.spaceId });
      const lr = await getStorage().createLeaveRequest(input);
      await notifyByRole(getStorage(), Number(req.params.spaceId), ['supervisor', 'school'], 'attendance', lr.id, 'leave_filed');
      res.status(201).json(lr);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: "Internal error" });
    }
  });

  app.delete('/api/spaces/:spaceId/leave-requests/:id', requireAuth, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const leaves = await getStorage().getLeaveRequests(Number(req.params.spaceId));
      const lr = leaves.find(l => l.id === id);
      if (!lr) return res.status(404).json({ message: "Not found" });
      if (lr.status === 'approved') return res.status(403).json({ message: "Cannot delete an approved leave request" });
      const userId = (req as any).session.userId;
      if (lr.userId !== userId) return res.status(403).json({ message: "Not authorized" });
      await getStorage().deleteLeaveRequest(id);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ message: "Internal error" });
    }
  });

  app.patch('/api/spaces/:spaceId/leave-requests/:id/approve', async (req, res) => {
    const lr = await getStorage().approveLeaveRequest(Number(req.params.id));
    if (!lr) return res.status(404).json({ message: "Not found" });
    await notifyUser(getStorage(), lr.userId, Number(req.params.spaceId), 'attendance', lr.id, 'leave_approved');
    res.json(lr);
  });

  app.patch('/api/spaces/:spaceId/leave-requests/:id/reject', async (req, res) => {
    const lr = await getStorage().rejectLeaveRequest(Number(req.params.id));
    if (!lr) return res.status(404).json({ message: "Not found" });
    await notifyUser(getStorage(), lr.userId, Number(req.params.spaceId), 'attendance', lr.id, 'leave_rejected');
    res.json(lr);
  });

  // Announcements
  app.get(api.announcements.list.path, async (req, res) => {
    const anns = await getStorage().getAnnouncements(Number(req.params.spaceId));
    res.json(anns.sort((a, b) => (b.date ?? "").localeCompare(a.date ?? "")));
  });

  app.post(api.announcements.create.path, async (req, res) => {
    try {
      const schema = api.announcements.create.input.extend({
        spaceId: z.coerce.number(),
        authorId: z.coerce.number(),
      });
      const input = schema.parse({ ...req.body, spaceId: req.params.spaceId });
      const ann = await getStorage().createAnnouncement(input);
      res.status(201).json(ann);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: "Internal error" });
    }
  });

  // Admin Middleware - Check if user is admin
  const requireAdmin = async (req: Request, res: Response, next: NextFunction) => {
    const userId = (req as any).session?.userId;
    if (!userId) return res.status(401).json({ message: "Not authenticated" });
    const user = await getStorage().getUser(userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: "Admin access required" });
    }
    next();
  };

  // Landing stats (public)
  app.get('/api/landing/stats', async (_req, res) => {
    try {
      // Some storage backends (or current builds) may not implement the stats methods.
      // Always return a safe JSON payload for the landing page.
      const storage: any = getStorage();
      if (typeof storage?.getUserStats !== "function") {
        return res.json({
          studentsOnboarded: 0,
          companiesUsingIt: 0,
          schoolsEnrolled: 0,
          supervisorSatisfaction: 0,
        });
      }

      const userStats = await storage.getUserStats();

      // Definition mapping (adjust later if your roles represent companies differently)
      const studentsOnboarded = userStats?.byRole?.student ?? 0;
      const schoolsEnrolled = userStats?.byRole?.school ?? 0;
      const companiesUsingIt = userStats?.byRole?.supervisor ?? 0;

      const supervisorSatisfaction = 0;

      return res.json({
        studentsOnboarded,
        companiesUsingIt,
        schoolsEnrolled,
        supervisorSatisfaction,
      });
    } catch (_err) {
      return res.json({
        studentsOnboarded: 0,
        companiesUsingIt: 0,
        schoolsEnrolled: 0,
        supervisorSatisfaction: 0,
      });
    }
  });

  // Admin Routes
  app.get(api.admin.overview.path, requireAdmin, async (req, res) => {
    try {
      const stats = await getStorage().getUserStats();
      const spaceStats = await getStorage().getSpaceStats();
      res.json({
        totalUsers: stats.total,
        totalSpaces: spaceStats.total,
        totalStudents: stats.byRole.student || 0,
        totalSupervisors: stats.byRole.supervisor || 0,
        totalSchoolCoords: stats.byRole.school || 0,
        activeUsers: stats.total,
        newUsersThisWeek: stats.newThisWeek
      });
    } catch (err) {
      res.status(500).json({ message: "Internal error" });
    }
  });


  app.get(api.admin.users.list.path, requireAdmin, async (req, res) => {
    try {
      const allUsers = await getStorage().getUsersWithStats();
      let filtered = allUsers;
      
      const role = (req.query.role as string)?.toLowerCase();
      if (role && ['student', 'supervisor', 'school', 'admin'].includes(role)) {
        filtered = filtered.filter(u => u.role === role);
      }
      
      const search = (req.query.search as string)?.toLowerCase();
      if (search) {
        filtered = filtered.filter(u => 
          u.username.toLowerCase().includes(search) || 
          u.name.toLowerCase().includes(search)
        );
      }
      
      res.json(filtered);
    } catch (err) {
      res.status(500).json({ message: "Internal error" });
    }
  });

  app.get(api.admin.users.get.path, requireAdmin, async (req, res) => {
    try {
      const user = await getStorage().getUser(Number(req.params.id));
      if (!user) return res.status(404).json({ message: "User not found" });
      
      const spaces = (await getStorage().getUserSpaces(user.id)).length;
      res.json({
        user,
        spacesCount: spaces,
        joinedDate: new Date().toISOString(),
        lastLogin: null
      });
    } catch (err) {
      res.status(500).json({ message: "Internal error" });
    }
  });

  app.patch(api.admin.users.updateRole.path, requireAdmin, async (req, res) => {
    try {
      const input = api.admin.users.updateRole.input.parse(req.body);
      const user = await getStorage().getUser(Number(req.params.id));
      if (!user) return res.status(404).json({ message: "User not found" });
      
      // Create updated user object
      const updated: any = { ...user, role: input.role };
      (await getStorage()['users'] as any).set(user.id, updated);
      
      await (getStorage() as any).logSystemEvent('userupdate', (req as any).session.userId, {
        targetUserId: user.id,
        newRole: input.role,
        oldRole: user.role
      });
      
      res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: "Internal error" });
    }
  });

  app.get(api.admin.spaces.list.path, requireAdmin, async (req, res) => {
    try {
      const allSpaces = await getStorage().getSpacesWithStats();
      let filtered = allSpaces;
      
      const type = (req.query.type as string)?.toLowerCase();
      if (type && ['official', 'private'].includes(type)) {
        filtered = filtered.filter(s => s.type === type);
      }
      
      const search = (req.query.search as string)?.toLowerCase();
      if (search) {
        filtered = filtered.filter(s => s.name.toLowerCase().includes(search));
      }
      
      const result = filtered.map(space => ({
        space,
        memberCount: space.memberCount,
        ownerName: space.ownerName
      }));
      
      res.json(result);
    } catch (err) {
      res.status(500).json({ message: "Internal error" });
    }
  });

  app.get(api.admin.spaces.get.path, requireAdmin, async (req, res) => {
    try {
      const space = await getStorage().getSpace(Number(req.params.id));
      if (!space) return res.status(404).json({ message: "Space not found" });
      
      const memberRecords = await getStorage().getSpaceMembers(space.id);
      const members = await Promise.all(memberRecords.map(async (m) => {
        const user = await getStorage().getUser(m.userId);
        return {
          id: m.id,
          userId: m.userId,
          username: user?.username || 'Unknown',
          role: user?.role || 'unknown',
          spaceRole: m.role
        };
      }));
      
      const tasks = await getStorage().getTasks(space.id);
      const docs = await getStorage().getDocuments(space.id);
      
      res.json({
        space,
        members,
        stats: {
          totalMembers: members.length,
          totalTasks: tasks.length,
          totalDocuments: docs.length
        }
      });
    } catch (err) {
      res.status(500).json({ message: "Internal error" });
    }
  });

  app.get(api.admin.analytics.userGrowth.path, requireAdmin, async (req, res) => {
    try {
      // Simple analytics - show user count by role
      const stats = await getStorage().getUserStats();
      const data = [{
        date: new Date().toISOString().split('T')[0],
        count: stats.total,
        roleBreakdown: stats.byRole
      }];
      res.json(data);
    } catch (err) {
      res.status(500).json({ message: "Internal error" });
    }
  });

  app.get(api.admin.analytics.logs.path, requireAdmin, async (req, res) => {
    try {
      const limit = Math.min((req.query.limit as any) || 100, 500);
      const logs = await (getStorage() as any).getSystemLogs(limit);
      res.json(logs);
    } catch (err) {
      res.status(500).json({ message: "Internal error" });
    }
  });

  // ── Database Management (admin-only) ──────────────────────────────────────

  // Backup: export safe collections as JSON download
  app.get("/api/admin/db/backup", requireAdmin, async (req, res) => {
    try {
      const db = getDB();
      const safeCollections = [
        "spaces", "spaceMembers", "groups", "tasks", "taskAssignees",
        "timeLogs", "scrums", "attendance", "documents", "messages",
        "evaluations", "leaveRequests", "announcements", "notifications", "systemSettings"
      ];
      const backup: Record<string, any[]> = {};
      for (const name of safeCollections) {
        try {
          const docs = await db.collection(name).find({}).toArray();
          backup[name] = docs;
        } catch { backup[name] = []; }
      }
      // Export users WITHOUT passwords
      const users = await db.collection("users").find({}).toArray();
      backup["users"] = users.map(({ password, ...rest }: any) => rest);

      const json = JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), collections: backup }, null, 2);
      res.setHeader("Content-Type", "application/json");
      res.setHeader("Content-Disposition", `attachment; filename="ojtask-backup-${new Date().toISOString().slice(0,10)}.json"`);
      res.send(json);
    } catch (err: any) {
      res.status(500).json({ message: "Backup failed: " + err.message });
    }
  });

  // Optimize: return collection stats (doc counts, indexes)
  app.get("/api/admin/db/stats", requireAdmin, async (req, res) => {
    try {
      const db = getDB();
      const collections = await db.listCollections().toArray();
      const stats = await Promise.all(
        collections.map(async (col) => {
          try {
            const count = await db.collection(col.name).countDocuments();
            const indexes = await db.collection(col.name).listIndexes().toArray();
            return { name: col.name, count, indexes: indexes.length };
          } catch { return { name: col.name, count: 0, indexes: 0 }; }
        })
      );
      res.json({ collections: stats.sort((a, b) => b.count - a.count) });
    } catch (err: any) {
      res.status(500).json({ message: "Stats failed: " + err.message });
    }
  });

  // Restore: accept JSON backup and upsert documents
  app.post("/api/admin/db/restore", requireAdmin, async (req, res) => {
    try {
      const { collections } = req.body;
      if (!collections || typeof collections !== "object") {
        return res.status(400).json({ message: "Invalid backup file — missing collections key." });
      }
      // Collections that are safe to restore (never restore sessions or OTP tokens from backup)
      const allowedCollections = [
        "users", "spaces", "spaceMembers", "groups", "tasks", "taskAssignees",
        "timeLogs", "scrums", "attendance", "documents", "messages",
        "evaluations", "leaveRequests", "announcements", "notifications", "systemSettings"
      ];
      const db = getDB();
      let restoredCount = 0;
      for (const name of allowedCollections) {
        const docs: any[] = collections[name];
        if (!Array.isArray(docs) || docs.length === 0) continue;
        const col = db.collection(name);
        const ops = docs.map((doc: any) => ({
          updateOne: {
            filter: { _id: doc._id },
            update: { $set: doc },
            upsert: true,
          }
        }));
        await col.bulkWrite(ops, { ordered: false });
        restoredCount++;
      }
      res.json({ message: "Restore complete.", restored: restoredCount });
    } catch (err: any) {
      res.status(500).json({ message: "Restore failed: " + err.message });
    }
  });

  // Delete old logs: remove expired OTPs + passwordResetOtps older than 24h
  app.delete("/api/admin/db/logs", requireAdmin, async (req, res) => {
    try {
      const db = getDB();
      const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const otpResult = await db.collection("passwordResetOtps").deleteMany({
        $or: [{ expiresAt: { $lt: new Date() } }, { createdAt: { $lt: cutoff } }]
      });
      const sessResult = await db.collection("sessions").deleteMany({
        expires: { $lt: new Date() }
      });
      res.json({
        message: "Old logs cleared successfully",
        deleted: { expiredOtps: otpResult.deletedCount, expiredSessions: sessResult.deletedCount }
      });
    } catch (err: any) {
      res.status(500).json({ message: "Delete failed: " + err.message });
    }
  });

  // Environment Health Check (admin-only)
  app.get("/api/admin/env-health", requireAdmin, (req, res) => {
    const vars = [
      {
        key: "MONGODB_URI",
        required: true,
        description: "MongoDB Atlas connection string. Required for all database operations.",
        impact: "Nothing works without this — the app cannot connect to any database.",
      },
      {
        key: "SESSION_SECRET",
        required: true,
        description: "Secret used to sign session cookies. Required for user authentication.",
        impact: "Sessions are insecure or fail to work; users cannot log in.",
      },
      {
        key: "GOOGLE_CLIENT_ID",
        required: false,
        description: "Google OAuth 2.0 client ID. Enables 'Continue with Google' sign-in.",
        impact: "Google sign-in button will be hidden or show an error.",
      },
      {
        key: "GOOGLE_CLIENT_SECRET",
        required: false,
        description: "Google OAuth 2.0 client secret. Required alongside GOOGLE_CLIENT_ID.",
        impact: "Google OAuth callback will fail even if client ID is set.",
      },
      {
        key: "BREVO_API_KEY",
        required: false,
        description: "Brevo API key used to send OTP, welcome, and notification emails via HTTPS.",
        impact: "Forgot-password OTP emails cannot be sent; a warning banner will appear.",
      },
      {
        key: "APP_URL",
        required: false,
        description: "Public base URL of the deployment (e.g. https://ojtask.vercel.app). Used for Google OAuth callbacks.",
        impact: "OAuth callback URL may be auto-detected incorrectly on some hosting providers.",
      },
    ];

    const result = vars.map(v => ({
      ...v,
      present: !!process.env[v.key],
    }));

    res.json(result);
  });

  // Get maintenance mode status (public — used by all clients)
  app.get("/api/system/maintenance", async (req, res) => {
    try {
      const db = getDB();
      const doc = await db.collection("systemSettings").findOne({ key: "maintenanceMode" });
      if (!doc) return res.json({ enabled: false, message: "", endsAt: null });
      res.json({ enabled: doc.enabled ?? false, message: doc.message ?? "", endsAt: doc.endsAt ?? null });
    } catch {
      res.json({ enabled: false, message: "", endsAt: null });
    }
  });

  // Set maintenance mode (admin-only)
  app.post("/api/admin/maintenance", requireAdmin, async (req, res) => {
    try {
      const { enabled, message, endsAt } = req.body;
      if (typeof enabled !== "boolean") return res.status(400).json({ message: "enabled must be a boolean" });
      const db = getDB();
      await db.collection("systemSettings").updateOne(
        { key: "maintenanceMode" },
        { $set: { key: "maintenanceMode", enabled, message: message ?? "", endsAt: endsAt ?? null, updatedAt: new Date() } },
        { upsert: true }
      );
      res.json({ enabled, message, endsAt });
    } catch {
      res.status(500).json({ message: "Internal error" });
    }
  });

  // Public contact form endpoint
  app.post("/api/contact", async (req, res) => {
    try {
      const { name, email, subject, message } = req.body;
      if (!name?.trim() || !email?.trim() || !message?.trim()) {
        return res.status(400).json({ message: "Name, email, and message are required." });
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ message: "Please provide a valid email address." });
      }
      const { sendContactEmail } = await import("./email");
      await sendContactEmail(name.trim(), email.trim(), subject?.trim() || "General Inquiry", message.trim());
      res.status(200).json({ message: "Message sent successfully." });
    } catch (err: any) {
      console.error("Contact form error:", err?.message);
      if (err?.message?.includes("BREVO_API_KEY")) {
        return res.status(503).json({ message: "Email delivery is not configured on this server. Please email us directly at ojtask.connect@gmail.com." });
      }
      res.status(500).json({ message: "Failed to send message. Please try again or email us directly at ojtask.connect@gmail.com." });
    }
  });

  // Seed Data
  await seedDatabase();

  return httpServer;
}
