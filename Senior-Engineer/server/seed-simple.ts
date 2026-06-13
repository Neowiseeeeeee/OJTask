import { getStorage } from "./storage";
import { writeFileSync, appendFileSync } from "fs";
import { resolve } from "path";
import bcrypt from "bcrypt";

const BCRYPT_ROUNDS = 12;
const logFile = resolve(process.cwd(), 'seed.log');

function log(msg: string) {
  console.log(msg);
  try {
    appendFileSync(logFile, msg + '\n');
  } catch (e) {
    // ignore
  }
}

function clearLog() {
  try {
    writeFileSync(logFile, '[SEED LOG START]\n');
  } catch (e) {
    // ignore
  }
}

async function migratePasswordsTobcrypt() {
  const storage = getStorage();
  const db = (storage as any).db;
  if (!db) return;

  const users = await db.collection("users").find({}).toArray();
  let migrated = 0;

  for (const user of users) {
    const isBcrypt = typeof user.password === "string" && user.password.startsWith("$2");
    if (!isBcrypt && user.password) {
      const hashed = await bcrypt.hash(user.password, BCRYPT_ROUNDS);
      await db.collection("users").updateOne({ _id: user._id }, { $set: { password: hashed } });
      migrated++;
    }
  }

  if (migrated > 0) {
    log(`[SEED] ✓ Migrated ${migrated} plain-text password(s) to bcrypt hashes`);
  } else {
    log(`[SEED] ✓ All passwords already hashed`);
  }
}

export async function seedDatabase() {
  clearLog();
  log('[SEED] ============================================');
  log('[SEED] STARTING SEED PROCESS');
  log('[SEED] ============================================');
  
  try {
    const storage = getStorage();
    log(`[SEED] Using storage backend`);
    
    log('[SEED] Migrating plain-text passwords to bcrypt...');
    await migratePasswordsTobcrypt();

    const existingUsers = await storage.getUser(101);
    log(`[SEED] User check completed`);
    
    if (existingUsers) {
      log('[SEED] ✓ Users already exist, skipping seed');
      log('[SEED] ============================================\n');
      return;
    }
    
    log('[SEED] Creating 4 users...');

    const SEED_PASSWORD = await bcrypt.hash('password123', BCRYPT_ROUNDS);

    const users = [
      {
        username: 'admin1',
        password: SEED_PASSWORD,
        role: 'admin',
        name: 'Admin User',
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin1@example.com',
        organization: 'Management',
        profilePicture: null,
        emailVerified: true,
      },
      {
        username: 'supervisor1',
        password: SEED_PASSWORD,
        role: 'supervisor',
        name: 'Supervisor User',
        firstName: 'Supervisor',
        lastName: 'User',
        email: 'supervisor1@example.com',
        organization: 'Tech School',
        profilePicture: null,
        emailVerified: true,
      },
      {
        username: 'student1',
        password: SEED_PASSWORD,
        role: 'student',
        name: 'John Student',
        firstName: 'John',
        lastName: 'Student',
        email: 'student1@example.com',
        organization: 'Tech School',
        profilePicture: null,
        emailVerified: true,
      },
      {
        username: 'student2',
        password: SEED_PASSWORD,
        role: 'student',
        name: 'Jane Student',
        firstName: 'Jane',
        lastName: 'Student',
        email: 'student2@example.com',
        organization: 'Tech School',
        profilePicture: null,
        emailVerified: true,
      },
    ];

    for (const user of users) {
      try {
        const existing = await storage.getUserByUsername(user.username);
        if (!existing) {
          await storage.createUser(user);
          log(`[SEED]   ✓ User created: ${user.username}`);
        } else {
          log(`[SEED]   - User already exists: ${user.username}`);
        }
      } catch (err: any) {
        log(`[SEED]   ✗ Failed to create user ${user.username}: ${err.message}`);
      }
    }

    log('[SEED] ✓ Users created - NO pre-populated spaces');
    log('[SEED] ✓ Users must create their own spaces or join via codes');
    log('[SEED] ============================================\n');
  } catch (err: any) {
    log(`[SEED] ✗ Seeding failed: ${err?.message || err}`);
    log('[SEED] Full error:', err);
  }
}
