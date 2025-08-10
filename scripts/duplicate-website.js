#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import fetch from 'node-fetch';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function envCheck(key) {
  if (!process.env[key]) {
    console.error(`Error: ${key} is not set in environment.`);
    process.exit(1);
  }
}

envCheck('SUPABASE_SERVICE_ROLE_KEY');
envCheck('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL;

const TEMPLATE_DIR = path.join(__dirname, '../public/websites/template1');
const WEBSITES_DIR = path.join(__dirname, '../public/websites');

// Parse --name argument
const args = process.argv.slice(2);
const nameArg = args.find(arg => arg.startsWith('--name'));
if (!nameArg) {
  console.error('Error: --name argument is required.');
  process.exit(1);
}
const websiteName = nameArg.split('=')[1] || args[args.indexOf('--name') + 1];
if (!websiteName) {
  console.error('Error: No website name provided.');
  process.exit(1);
}

const newWebsiteDir = path.join(WEBSITES_DIR, websiteName);
if (fs.existsSync(newWebsiteDir)) {
  console.error('Error: Target website directory already exists.');
  process.exit(1);
}

// 1. Duplicate the template folder
function copyRecursiveSync(src, dest) {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats.isDirectory();
  if (isDirectory) {
    fs.mkdirSync(dest, { recursive: true });
    fs.readdirSync(src).forEach(childItemName => {
      copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}

async function getNextSiteId() {
  const url = `${SUPABASE_URL}/rest/v1/teachers_websites?select=id&order=id.desc&limit=20`;
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'apikey': SUPABASE_SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json'
    }
  });
  if (!res.ok) {
    const text = await res.text();
    console.error('Supabase error (fetching max id):', text);
    process.exit(1);
  }
  const data = await res.json();
  // Filter out non-numeric id values
  const numericIds = data
    .map(row => Number(row.id))
    .filter(id => Number.isInteger(id) && id > 0);
  let nextId = 1;
  if (numericIds.length > 0) {
    nextId = Math.max(...numericIds) + 1;
  }
  if (!Number.isInteger(nextId) || nextId < 1) {
    console.error('Error: Could not determine a valid next id.');
    process.exit(1);
  }
  return nextId;
}

// Fetch default data from id=1
async function getDefaultDataAndOwner() {
  const url = `${SUPABASE_URL}/rest/v1/teachers_websites?id=eq.1&select=data,owner_name`;
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'apikey': SUPABASE_SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json'
    }
  });
  if (!res.ok) {
    const text = await res.text();
    console.error('Supabase error (fetching default data):', text);
    process.exit(1);
  }
  const data = await res.json();
  if (!data[0]) {
    console.error('No default data found for id=1');
    process.exit(1);
  }
  return { data: data[0].data, owner_name: data[0].owner_name };
}

(async () => {
  // 1. Duplicate the template folder
  copyRecursiveSync(TEMPLATE_DIR, newWebsiteDir);

  // 2. Find the next available id from Supabase
  const newId = await getNextSiteId();
  if (!Number.isInteger(newId) || newId < 1) {
    console.error('Error: Invalid newId:', newId);
    process.exit(1);
  }

  // 3. Update the new site's site.config.json
  const configPath = path.join(newWebsiteDir, 'site.config.json');
  let config = {};
  if (fs.existsSync(configPath)) {
    config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  }
  config.site_id = newId;
  config.directory = websiteName;
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  console.log('Wrote new site.config.json:', configPath, config);

  // 4. Create a new row in Supabase
  await createSupabaseRow(newId);

  // 5. Fix hardcoded paths in HTML and JS files
  const filesToFix = [
    path.join(newWebsiteDir, 'index.html'),
    path.join(newWebsiteDir, 'script.js')
  ];
  
  for (const filePath of filesToFix) {
    if (fs.existsSync(filePath)) {
      let content = fs.readFileSync(filePath, 'utf-8');
      
      // Replace hardcoded template1 paths with website-specific paths
      content = content.replace(
        new RegExp(`/websites/template1/`, 'g'),
        ''
      );
      
      // Remove hardcoded template1 navigation
      content = content.replace(
        /window\.location\.href\s*=\s*['"]template1\/index\.html['"];?/g,
        '// Removed hardcoded template1 navigation'
      );
      
      // Remove any absolute domain references
      content = content.replace(
        /https:\/\/portflyo\.online/g,
        '#'
      );
      
      // Make file paths explicit to the website's own folder (deployed structure)
      content = content.replace(
        /href=["']styles\.css["']/g,
        `href="websites/${websiteName}/styles.css"`
      );
      content = content.replace(
        /src=["']script\.js["']/g,
        `src="websites/${websiteName}/script.js"`
      );
      content = content.replace(
        /src=["']reviews\.js["']/g,
        `src="websites/${websiteName}/reviews.js"`
      );
      content = content.replace(
        /href=["']favicon\.ico["']/g,
        `href="websites/${websiteName}/favicon.ico"`
      );
      
      // Ensure all other file references are relative
      content = content.replace(
        /href=["']\/(?!\/)/g,
        'href="'
      );
      content = content.replace(
        /src=["']\/(?!\/)/g,
        'src="'
      );
      
      fs.writeFileSync(filePath, content);
      console.log('Fixed hardcoded paths in:', path.basename(filePath));
    }
  }

  // 6. Ensure the new website uses universal API (remove any website-specific API files)
  const apiFiles = [
    path.join(newWebsiteDir, 'api.js'),
    path.join(newWebsiteDir, 'reviews-api.js')
  ];
  
  for (const apiFile of apiFiles) {
    if (fs.existsSync(apiFile)) {
      fs.unlinkSync(apiFile);
      console.log('Removed website-specific API file:', path.basename(apiFile));
    }
  }

  console.log('Website duplicated and registered successfully:', websiteName, '(id:', newId, ')');
  console.log('✅ The new website is configured to use the universal API automatically!');
})().catch(e => {
  console.error('Error:', e);
  process.exit(1);
});

// Update createSupabaseRow to use default data
async function createSupabaseRow(newId) {
  const { data: defaultData, owner_name: defaultOwnerName } = await getDefaultDataAndOwner();
  const url = `${SUPABASE_URL}/rest/v1/teachers_websites`;
  const body = {
    id: newId,
    data: defaultData,
    owner_name: defaultOwnerName
  };
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify([body])
  });
  if (!res.ok) {
    const text = await res.text();
    console.error('Supabase error:', text);
    process.exit(1);
  }
  console.log('Supabase row created for id', newId);
} 
