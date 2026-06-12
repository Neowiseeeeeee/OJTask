// Script to reset MongoDB collections and reinitialize counters
const { MongoClient } = require('mongodb');

const uri = 'mongodb+srv://ojadmin:ojadmin@cluster0.haavtu6.mongodb.net/?appName=Cluster0';

async function resetDatabase() {
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    const db = client.db('ojtask');
    
    console.log('Connected to MongoDB');
    console.log('Dropping old collections...');
    
    // Drop collections to start fresh
    const collections = [
      'tasks', 'timeLogs', 'scrums', 'attendance', 'documents', 
      'messages', 'evaluations', 'announcements', 'leaveRequests',
      'taskAssignees', '_idCounters'
    ];
    
    for (const col of collections) {
      try {
        await db.collection(col).drop();
        console.log(`  Dropped: ${col}`);
      } catch (e) {
        // Collection might not exist
      }
    }
    
    console.log('\nResetdel old data');
    console.log('Initializing counter at 0...');
    await db.collection('_idCounters').insertOne({ type: 'task', count: 0 });
    console.log('Counter initialized');
    
    console.log('\nDatabase reset complete!');
  } finally {
    await client.close();
  }
}

resetDatabase().catch(console.error);
