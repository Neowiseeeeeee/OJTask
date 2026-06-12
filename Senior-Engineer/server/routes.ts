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
import memorystore from "memorystore";
import multer from "multer";
import path from "path";
import fs from "fs";
import { sendOtpEmail } from "./email";

// In-memory OTP store: email -> { otp, expiresAt, verified }
const otpStore = new Map<string, { otp: string; expiresAt: number; verified: boolean }>();

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Set up multer disk storage for file uploads
const uploadsDir = path.resolve(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage_disk = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});
const upload = multer({ storage: storage_disk, limits: { fileSize: 20 * 1024 * 1024 } });

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
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

  const MemoryStore = memorystore(session);
  
  // Session cleanup middleware
  const sessionCleanup = (req: Request, res: Response, next: NextFunction) => {
    // Clean up old sessions periodically
    const store = (req as any).sessionStore;
    if (store && store.cleanup) {
      store.cleanup();
    }
    next();
  };
  
  app.use(session({
    cookie: { 
      maxAge: 86400000,
      secure: process.env.NODE_ENV === 'production' && process.env.HTTPS === 'true',
      httpOnly: true,
      sameSite: 'lax'
    },
    store: new MemoryStore({ 
      checkPeriod: 86400000,
      // Clean up expired sessions and limit storage
      ttl: 86400000, // 24 hours
      max: 100 // Maximum number of sessions to store
    }),
    resave: false,
    saveUninitialized: false,
    secret: process.env.SESSION_SECRET || "ojt-management-secret"
  }));
  
  // Apply session cleanup middleware
  app.use(sessionCleanup);

  // Auth Routes
  app.post(api.auth.login.path, async (req, res) => {
    try {
      const input = api.auth.login.input.parse(req.body);
      const user = await getStorage().getUserByUsername(input.username);
      if (!user || user.password !== input.password) {
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
      const user = await getStorage().createUser(input);
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

      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: "Current password and new password are required" });
      }

      if (newPassword.length < 8) {
        return res.status(400).json({ message: "New password must be at least 8 characters" });
      }

      const user = await getStorage().getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Simple validation (in production, use bcrypt for hashing)
      if (user.password !== currentPassword) {
        return res.status(401).json({ message: "Current password is incorrect" });
      }

      // Update password
      const users = await (getStorage() as any).getUsers();
      const userIndex = users.findIndex((u: any) => u.id === userId);
      if (userIndex !== -1) {
        users[userIndex].password = newPassword;
        (getStorage() as any).users = users;
      }

      res.json({ message: "Password changed successfully" });
    } catch (err) {
      console.error("Password change error:", err);
      res.status(500).json({ message: "Internal error" });
    }
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

      const otp = generateOtp();
      otpStore.set(email.toLowerCase().trim(), {
        otp,
        expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
        verified: false,
      });

      await sendOtpEmail(email, otp, user.name || user.username);

      res.status(200).json({ message: "Reset code sent to your email." });
    } catch (err: any) {
      console.error("Forgot password error:", err);
      res.status(500).json({ message: err.message || "Failed to send reset code. Check your email configuration." });
    }
  });

  app.post("/api/auth/verify-otp", async (req, res) => {
    try {
      const { email, otp } = req.body;
      if (!email || !otp) {
        return res.status(400).json({ message: "Email and code are required" });
      }

      const record = otpStore.get(email.toLowerCase().trim());
      if (!record) {
        return res.status(400).json({ message: "No reset code found. Please request a new one." });
      }
      if (Date.now() > record.expiresAt) {
        otpStore.delete(email.toLowerCase().trim());
        return res.status(400).json({ message: "Code has expired. Please request a new one." });
      }
      if (record.otp !== otp.trim()) {
        return res.status(400).json({ message: "Invalid code. Please try again." });
      }

      // Mark as verified so reset-password can proceed
      record.verified = true;
      otpStore.set(email.toLowerCase().trim(), record);

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

      const record = otpStore.get(email.toLowerCase().trim());
      if (!record || !record.verified || record.otp !== otp.trim()) {
        return res.status(400).json({ message: "Invalid or expired code. Please start over." });
      }
      if (Date.now() > record.expiresAt) {
        otpStore.delete(email.toLowerCase().trim());
        return res.status(400).json({ message: "Code expired. Please request a new one." });
      }

      const user = await (getStorage() as any).getUserByEmail(email.toLowerCase().trim());
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      await getStorage().updateUser(user.id, { password: newPassword });
      otpStore.delete(email.toLowerCase().trim());

      res.status(200).json({ message: "Password reset successfully." });
    } catch (err: any) {
      console.error("Reset password error:", err);
      res.status(500).json({ message: "Failed to reset password" });
    }
  });

  // ── Google OAuth ───────────────────────────────────────────────────────────
  app.get("/api/auth/google", (req, res) => {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) {
      return res.status(500).json({ message: "Google OAuth is not configured." });
    }
    const redirectUri = encodeURIComponent(`${process.env.APP_URL || `https://${req.headers.host}`}/api/auth/google/callback`);
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
      const redirectUri = `${process.env.APP_URL || `https://${req.headers.host}`}/api/auth/google/callback`;

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
        // Create new user from Google profile
        const firstName = profile.given_name || "";
        const lastName = profile.family_name || "";
        const baseUsername = (profile.email.split("@")[0] || "user").replace(/[^a-z0-9]/gi, "").toLowerCase();
        let username = baseUsername;
        let suffix = 1;
        while (await getStorage().getUserByUsername(username)) {
          username = `${baseUsername}${suffix++}`;
        }
        user = await getStorage().createUser({
          username,
          password: `google_oauth_${Date.now()}`,
          name: profile.name || `${firstName} ${lastName}`.trim() || username,
          firstName,
          lastName,
          email: profile.email.toLowerCase(),
          role: "student",
          organization: "",
          profilePicture: profile.picture || null,
          emailVerified: true,
        });
      }

      (req as any).session.userId = user.id;
      res.redirect("/dashboard");
    } catch (err: any) {
      console.error("Google OAuth callback error:", err);
      res.redirect("/auth?error=google_failed");
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
      res.json({
        filePath: `/uploads/${file.filename}`,
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
      console.log(`[DOWNLOAD] doc=${docId} filePath=${(doc as any)?.filePath} originalFileName=${(doc as any)?.originalFileName}`);
      if (!doc || !(doc as any).filePath) return res.status(404).json({ message: "No file attached to this document" });
      const rawPath: string = (doc as any).filePath;
      const absPath = path.isAbsolute(rawPath)
        ? rawPath
        : path.resolve(process.cwd(), rawPath.replace(/^\//, ''));
      console.log(`[DOWNLOAD] absPath=${absPath} exists=${fs.existsSync(absPath)}`);
      if (!fs.existsSync(absPath)) return res.status(404).json({ message: "File not found on disk" });
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
        filePath = `uploads/${req.file.filename}`;
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

  // Seed Data
  await seedDatabase();

  return httpServer;
}
