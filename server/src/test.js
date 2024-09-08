import { MongoClient } from 'mongodb';

const MONGODB_URI = 'mongodb+srv://ticket_chatbot:ticket_chatbot@sih24.d2rk6.mongodb.net/?retryWrites=true&w=majority&appName=sih24';

async function logDatabasesAndCollections() {
    const client = new MongoClient(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  
    try {
      await client.connect();
  
      // List databases
      const adminDb = client.db().admin();
      const databasesList = await adminDb.listDatabases();
      console.log('Databases:');
      databasesList.databases.forEach(db => console.log(`- ${db.name}`));
  
      // List collections in each database
      for (const dbInfo of databasesList.databases) {
        const db = client.db(dbInfo.name);
        const collections = await db.listCollections().toArray();
  
        console.log(`Collections in ${dbInfo.name}:`);
        collections.forEach(collection => console.log(`- ${collection.name}`));
      }
    } catch (error) {
      console.error('Error fetching databases and collections:', error);
    } finally {
      await client.close();
    }
  }
  
  logDatabasesAndCollections();