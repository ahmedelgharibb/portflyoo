import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Function to fix a website to work with universal API
async function fixWebsiteForUniversalAPI(websiteFolder) {
  console.log(`🔧 Fixing ${websiteFolder} for universal API...`);
  
  const websitePath = path.join(process.cwd(), 'public', 'websites', websiteFolder);
  
  // 1. Check if site.config.json exists
  const configPath = path.join(websitePath, 'site.config.json');
  if (!fs.existsSync(configPath)) {
    console.log(`❌ No site.config.json found in ${websiteFolder}`);
    return false;
  }
  
  // 2. Read the config
  const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  console.log(`📋 Current config:`, config);
  
  // 3. Check if script.js exists
  const scriptPath = path.join(websitePath, 'script.js');
  if (!fs.existsSync(scriptPath)) {
    console.log(`❌ No script.js found in ${websiteFolder}`);
    return false;
  }
  
  // 4. Read the script
  let scriptContent = fs.readFileSync(scriptPath, 'utf-8');
  
  // 5. Check if it's using universal API correctly
  const hasUniversalAPI = scriptContent.includes('/api/api?action=getData');
  const hasWebsiteSpecificAPI = scriptContent.includes('/api/' + websiteFolder);
  
  if (hasWebsiteSpecificAPI) {
    console.log(`⚠️  ${websiteFolder} is using website-specific API, converting to universal...`);
    
    // Replace website-specific API calls with universal ones
    scriptContent = scriptContent.replace(
      new RegExp(`/api/${websiteFolder}`, 'g'),
      '/api/api'
    );
    
    // Write the updated script
    fs.writeFileSync(scriptPath, scriptContent);
    console.log(`✅ Updated ${websiteFolder}/script.js to use universal API`);
  } else if (hasUniversalAPI) {
    console.log(`✅ ${websiteFolder} is already using universal API`);
  } else {
    console.log(`⚠️  ${websiteFolder} has no API calls detected`);
  }
  
  // 6. Remove any website-specific API files if they exist
  const apiFiles = [
    path.join(websitePath, 'api.js'),
    path.join(websitePath, 'reviews-api.js')
  ];
  
  for (const apiFile of apiFiles) {
    if (fs.existsSync(apiFile)) {
      fs.unlinkSync(apiFile);
      console.log(`🗑️  Removed ${path.basename(apiFile)} from ${websiteFolder}`);
    }
  }
  
  console.log(`✅ ${websiteFolder} is now ready for universal API\n`);
  return true;
}

// Function to fix all websites
async function fixAllWebsites() {
  console.log('🚀 Fixing all websites for universal API...\n');
  
  const websitesPath = path.join(process.cwd(), 'public', 'websites');
  const websites = fs.readdirSync(websitesPath, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);
  
  console.log(`📁 Found websites: ${websites.join(', ')}\n`);
  
  for (const website of websites) {
    await fixWebsiteForUniversalAPI(website);
  }
  
  console.log('🎉 All websites have been fixed for universal API!');
}

// Function to fix a specific website
async function fixSpecificWebsite(websiteName) {
  if (!websiteName) {
    console.log('❌ Please provide a website name');
    console.log('Usage: node scripts/fix-universal-api.js <website-name>');
    console.log('Or: node scripts/fix-universal-api.js --all');
    return;
  }
  
  if (websiteName === '--all') {
    await fixAllWebsites();
  } else {
    await fixWebsiteForUniversalAPI(websiteName);
  }
}

// Get command line arguments
const args = process.argv.slice(2);
const websiteName = args[0];

// Run the fix
fixSpecificWebsite(websiteName); 