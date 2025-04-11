import { db, testConnection, closeConnection } from './db/index.js';
import { websites } from './db/schema.js';
import 'dotenv/config';

async function testDatabaseConnection() {
  console.log('Testing database connection...');
  
  try {
    // Test basic connection
    const connected = await testConnection();
    
    if (!connected) {
      console.error('Database connection failed.');
      return;
    }
    
    // Try to execute a simple query
    const sites = await db.select().from(websites).limit(5);
    
    console.log('Found sites:', sites.length);
    
    if (sites.length > 0) {
      console.log('First site:', sites[0]);
    } else {
      console.log('No sites found. Database might be empty.');
    }
    
    console.log('Database test completed successfully!');
  } catch (error) {
    console.error('Error testing database:', error);
  } finally {
    // Close the connection
    await closeConnection();
  }
}

// Run the test
testDatabaseConnection(); 