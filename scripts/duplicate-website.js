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

const TEMPLATE_DIR = path.join(__dirname, '../teacher/template1');
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
  const url = `${SUPABASE_URL}/rest/v1/teacher_websites?select=site_id&order=site_id.desc&limit=20`;
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
    console.error('Supabase error (fetching max site_id):', text);
    process.exit(1);
  }
  const data = await res.json();
  // Filter out non-numeric site_id values
  const numericIds = data
    .map(row => Number(row.site_id))
    .filter(id => Number.isInteger(id) && id > 0);
  let nextId = 1;
  if (numericIds.length > 0) {
    nextId = Math.max(...numericIds) + 1;
  }
  if (!Number.isInteger(nextId) || nextId < 1) {
    console.error('Error: Could not determine a valid next site_id.');
    process.exit(1);
  }
  return nextId;
}

(async () => {
  // 1. Duplicate the template folder
  copyRecursiveSync(TEMPLATE_DIR, newWebsiteDir);

  // 2. Find the next available site_id from Supabase
  const newSiteId = await getNextSiteId();
  if (!Number.isInteger(newSiteId) || newSiteId < 1) {
    console.error('Error: Invalid newSiteId:', newSiteId);
    process.exit(1);
  }

  // 3. Update the new site's site.config.json
  const configPath = path.join(newWebsiteDir, 'site.config.json');
  let config = {};
  if (fs.existsSync(configPath)) {
    config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  }
  config.site_id = newSiteId;
  config.directory = websiteName;
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

  // 4. Create a new row in Supabase
  await createSupabaseRow(newSiteId);

  console.log('Website duplicated and registered successfully:', websiteName, '(site_id:', newSiteId, ')');
})().catch(e => {
  console.error('Error:', e);
  process.exit(1);
});

// To insert more fields with default values, add them to the body object below.
// Example: const body = { site_id: newSiteId, theme: 'default', owner_email: '' };
async function createSupabaseRow(newSiteId) {
  const url = `${SUPABASE_URL}/rest/v1/teacher_websites`;
  const body = {
    site_id: newSiteId
    // Add more fields here if needed, e.g. theme: 'default', owner_email: ''
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
  console.log('Supabase row created for site_id', newSiteId);
} 