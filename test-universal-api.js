import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Test the resolveWebsiteContext logic
async function testResolveWebsiteContext() {
  console.log('🧪 Testing Universal API Website Detection...\n');
  
  // Test cases
  const testCases = [
    {
      name: 'dralywael website',
      referer: 'http://localhost:8080/dralywael',
      expectedSiteId: 46
    },
    {
      name: 'template1 website', 
      referer: 'http://localhost:8080/template1',
      expectedSiteId: 1
    },
    {
      name: 'website_3 website',
      referer: 'http://localhost:8080/website_3', 
      expectedSiteId: 3
    }
  ];
  
  for (const testCase of testCases) {
    console.log(`📋 Testing: ${testCase.name}`);
    console.log(`   Referer: ${testCase.referer}`);
    
    try {
      const urlObj = new URL(testCase.referer);
      console.log(`   Pathname: ${urlObj.pathname}`);
      
      const pathSegments = urlObj.pathname.split('/').filter(Boolean);
      console.log(`   Path segments: [${pathSegments.join(', ')}]`);
      
      const firstSegment = pathSegments[0];
      console.log(`   First segment: ${firstSegment}`);
      
      if (firstSegment) {
        const configPath = path.join(process.cwd(), 'public', 'websites', firstSegment, 'site.config.json');
        console.log(`   Config path: ${configPath}`);
        
        if (fs.existsSync(configPath)) {
          const json = fs.readFileSync(configPath, 'utf-8');
          const cfg = JSON.parse(json);
          console.log(`   Config content:`, cfg);
          
          if (cfg && Number.isInteger(cfg.site_id)) {
            console.log(`   ✅ Resolved site_id: ${cfg.site_id} for directory: ${firstSegment}`);
            console.log(`   ${cfg.site_id === testCase.expectedSiteId ? '✅' : '❌'} Expected: ${testCase.expectedSiteId}, Got: ${cfg.site_id}`);
          } else {
            console.log(`   ❌ Invalid site_id in config`);
          }
        } else {
          console.log(`   ❌ Config file not found`);
        }
      } else {
        console.log(`   ❌ No first segment found`);
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
    
    console.log('');
  }
}

// Run the test
testResolveWebsiteContext(); 