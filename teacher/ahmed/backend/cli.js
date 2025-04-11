#!/usr/bin/env node
import { db, closeConnection } from './db/index.js';
import { unifiedSiteData, websites, users } from './db/schema.js';
import { eq, and } from 'drizzle-orm';
import 'dotenv/config';
import readline from 'readline';

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Helper to ask questions
const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function main() {
  console.log('=============================================');
  console.log('Ahmed Teacher Portfolio - Drizzle ORM CLI');
  console.log('=============================================\n');
  
  try {
    while (true) {
      console.log('\nAvailable Actions:');
      console.log('1. List all sites');
      console.log('2. Get site data by category');
      console.log('3. Create new site data');
      console.log('4. Update site data');
      console.log('5. List users');
      console.log('6. Exit');
      
      const choice = await question('\nSelect an action (1-6): ');
      
      switch (choice) {
        case '1':
          await listSites();
          break;
        case '2':
          await getSiteData();
          break;
        case '3':
          await createSiteData();
          break;
        case '4':
          await updateSiteData();
          break;
        case '5':
          await listUsers();
          break;
        case '6':
          console.log('\nExiting...');
          rl.close();
          await closeConnection();
          return;
        default:
          console.log('\nInvalid choice. Please try again.');
      }
    }
  } catch (error) {
    console.error('Error:', error);
    rl.close();
    await closeConnection();
  }
}

// List all sites
async function listSites() {
  console.log('\nListing all sites...');
  
  const sites = await db.select().from(websites);
  
  if (sites.length === 0) {
    console.log('No sites found in the database.');
    return;
  }
  
  console.log(`Found ${sites.length} sites:`);
  sites.forEach((site, index) => {
    console.log(`${index + 1}. ${site.name} (ID: ${site.siteId})`);
  });
}

// Get site data by category
async function getSiteData() {
  const siteId = await question('\nEnter site ID: ');
  const category = await question('Enter category: ');
  
  console.log(`\nFetching ${category} data for site ${siteId}...`);
  
  const data = await db
    .select()
    .from(unifiedSiteData)
    .where(
      and(
        eq(unifiedSiteData.siteId, siteId),
        eq(unifiedSiteData.category, category)
      )
    );
  
  if (data.length === 0) {
    console.log(`No ${category} data found for site ${siteId}.`);
    return;
  }
  
  console.log('Data:');
  console.log(JSON.stringify(data[0].data, null, 2));
}

// Create new site data
async function createSiteData() {
  const siteId = await question('\nEnter site ID: ');
  const category = await question('Enter category: ');
  
  // Check if data already exists
  const existingData = await db
    .select()
    .from(unifiedSiteData)
    .where(
      and(
        eq(unifiedSiteData.siteId, siteId),
        eq(unifiedSiteData.category, category)
      )
    );
  
  if (existingData.length > 0) {
    console.log(`Data for ${category} in site ${siteId} already exists. Use update instead.`);
    return;
  }
  
  console.log('Enter JSON data (or "c" to cancel):');
  let jsonStr = await question('> ');
  
  if (jsonStr.toLowerCase() === 'c') {
    console.log('Operation cancelled.');
    return;
  }
  
  try {
    const data = JSON.parse(jsonStr);
    
    const result = await db
      .insert(unifiedSiteData)
      .values({
        siteId,
        category,
        data,
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true
      })
      .returning();
    
    console.log('Data created successfully:');
    console.log(result[0]);
  } catch (error) {
    console.error('Error creating data:', error.message);
  }
}

// Update site data
async function updateSiteData() {
  const siteId = await question('\nEnter site ID: ');
  const category = await question('Enter category: ');
  
  // Check if data exists
  const existingData = await db
    .select()
    .from(unifiedSiteData)
    .where(
      and(
        eq(unifiedSiteData.siteId, siteId),
        eq(unifiedSiteData.category, category)
      )
    );
  
  if (existingData.length === 0) {
    console.log(`No data found for ${category} in site ${siteId}. Use create instead.`);
    return;
  }
  
  console.log('Current data:');
  console.log(JSON.stringify(existingData[0].data, null, 2));
  
  console.log('\nEnter new JSON data (or "c" to cancel):');
  let jsonStr = await question('> ');
  
  if (jsonStr.toLowerCase() === 'c') {
    console.log('Operation cancelled.');
    return;
  }
  
  try {
    const data = JSON.parse(jsonStr);
    
    const result = await db
      .update(unifiedSiteData)
      .set({
        data,
        updatedAt: new Date()
      })
      .where(
        and(
          eq(unifiedSiteData.siteId, siteId),
          eq(unifiedSiteData.category, category)
        )
      )
      .returning();
    
    console.log('Data updated successfully:');
    console.log(result[0]);
  } catch (error) {
    console.error('Error updating data:', error.message);
  }
}

// List users
async function listUsers() {
  console.log('\nListing all users...');
  
  const allUsers = await db.select({
    id: users.id,
    email: users.email,
    name: users.name,
    role: users.role,
    siteId: users.siteId
  }).from(users);
  
  if (allUsers.length === 0) {
    console.log('No users found in the database.');
    return;
  }
  
  console.log(`Found ${allUsers.length} users:`);
  allUsers.forEach((user, index) => {
    console.log(`${index + 1}. ${user.name || 'Unknown'} (${user.email}) - Role: ${user.role}`);
  });
}

// Start the CLI
main().catch(console.error); 