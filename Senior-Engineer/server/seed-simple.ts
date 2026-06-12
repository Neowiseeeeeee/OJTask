import { getStorage } from "./storage";
import { writeFileSync, appendFileSync } from "fs";
import { resolve } from "path";

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

export async function seedDatabase() {
  clearLog();
  log('[SEED] ============================================');
  log('[SEED] STARTING SEED PROCESS');
  log('[SEED] ============================================');
  
  try {
    const storage = getStorage();
    log(`[SEED] Using storage backend`);
    
    // Check if any users already exist
    const existingUsers = await storage.getUser(101); // Check for admin user
    log(`[SEED] User check completed`);
    
    if (existingUsers) {
      log('[SEED] ✓ Users already exist, skipping seed');
      log('[SEED] ============================================\n');
      return;
    }
    
    log('[SEED] Creating 4 users...');

    // Create users using storage
    const users = [
      {
        username: 'admin1',
        password: 'password123',
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
        password: 'password123',
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
        password: 'password123',
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
        password: 'password123',
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
