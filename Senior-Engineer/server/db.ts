import { config } from 'dotenv';
import { MongoClient, Db } from 'mongodb';
config({ override: true });

let db: Db | null = null;
let client: MongoClient | null = null;
let connectionRetries = 0;
const MAX_RETRIES = 5;
const RETRY_DELAY = 3000; // 3 seconds

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const connectDB = async (): Promise<Db> => {
  if (db && client) {
    // Test existing connection
    try {
      await client.db().admin().ping();
      return db;
    } catch (error) {
      console.log('🔄 Connection lost, reconnecting to MongoDB Atlas...');
      await closeDB();
    }
  }

  const mongoUri = process.env.DATABASE_URL;
  if (!mongoUri) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  console.log('🔗 Connecting to MongoDB Atlas...');
  console.log(`🔗 Connection URI: ${mongoUri.replace(/:([^@]+)@/, ':***@')}`);
  
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      connectionRetries = attempt;
      console.log(`🔄 Connection attempt ${attempt}/${MAX_RETRIES}...`);
      
      client = new MongoClient(mongoUri, {
        serverSelectionTimeoutMS: 30000,
        socketTimeoutMS: 60000,
        connectTimeoutMS: 30000,
        maxPoolSize: 10,
        minPoolSize: 2,
        maxIdleTimeMS: 30000,
        waitQueueTimeoutMS: 5000,
        retryWrites: true,
        retryReads: true,
        readPreference: 'primary',
        writeConcern: { w: 'majority', j: true }
      });
      
      await client.connect();
      console.log('✅ Connected to MongoDB Atlas - PERSISTENT DATABASE');
      
      // Test the connection with ping
      const admin = client.db().admin();
      const pingResult = await admin.ping();
      console.log('✅ MongoDB Atlas ping successful:', pingResult);
      
      // Test database access
      db = client.db('ojtask');
      await db.listCollections().toArray();
      console.log(`🗄️  Using database: ${db.databaseName}`);
      
      // Set up connection monitoring
      client.on('error', (error) => {
        console.error('❌ MongoDB connection error:', error);
      });
      
      client.on('close', () => {
        console.log('🔌 MongoDB connection closed');
        db = null;
      });
      
      client.on('serverOpening', (event) => {
        console.log('� MongoDB server opened:', event.address);
      });
      
      client.on('serverClosed', (event) => {
        console.log('🔌 MongoDB server closed:', event.address);
      });
      
      console.log('🎯 MongoDB Atlas connection established successfully!');
      return db;
      
    } catch (error: any) {
      console.error(`❌ Connection attempt ${attempt} failed:`, error.message);
      
      if (attempt < MAX_RETRIES) {
        console.log(`🔄 Retrying in ${RETRY_DELAY/1000} seconds...`);
        await sleep(RETRY_DELAY);
      } else {
        console.error('💥 All connection attempts failed!');
        console.error('💥 Error details:', {
          name: error.name,
          message: error.message,
          code: error.code,
          cause: error.cause
        });
        
        // Provide helpful troubleshooting information
        console.error('\n🔧 TROUBLESHOOTING:');
        console.error('1. Check your internet connection');
        console.error('2. Verify DATABASE_URL in .env file');
        console.error('3. Ensure MongoDB Atlas cluster is running');
        console.error('4. Check if your IP is whitelisted in Atlas');
        console.error('5. Verify Atlas user credentials');
        
        throw new Error(`Failed to connect to MongoDB Atlas after ${MAX_RETRIES} attempts. Please check your configuration and network connectivity.`);
      }
    }
  }
  
  throw new Error('Unexpected error in database connection');
};

export const getDB = (): Db => {
  if (!db || !client) {
    throw new Error('Database not connected. Call connectDB() first.');
  }
  return db;
};

export const isConnected = (): boolean => {
  return !!(client && db);
};

export const getConnectionStatus = () => {
  return {
    connected: isConnected(),
    retries: connectionRetries,
    database: db?.databaseName || null
  };
};

export const closeDB = async (): Promise<void> => {
  if (client) {
    try {
      await client.close();
      console.log('✓ Disconnected from MongoDB Atlas');
    } catch (error) {
      console.error('❌ Error closing MongoDB connection:', error);
    } finally {
      db = null;
      client = null;
    }
  }
};

// Graceful shutdown handler
process.on('SIGINT', async () => {
  console.log('\n🔄 Gracefully shutting down MongoDB connection...');
  await closeDB();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🔄 Gracefully shutting down MongoDB connection...');
  await closeDB();
  process.exit(0);
});
