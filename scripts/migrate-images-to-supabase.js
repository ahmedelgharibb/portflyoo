// Migration script to convert base64 images to Supabase storage
// Run this script to migrate existing base64 images to Supabase storage URLs

const fs = require('fs');
const path = require('path');

// Configuration
const SITE_DIRECTORIES = [
    'public/websites/template1'
];

// Helper function to check if a string is base64
function isBase64(str) {
    if (typeof str !== 'string') return false;
    if (str.startsWith('data:image/')) return true;
    if (str.startsWith('http://') || str.startsWith('https://')) return false;
    // Check if it looks like base64 (contains only base64 characters and is reasonably long)
    const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
    return base64Regex.test(str) && str.length > 100;
}

// Helper function to convert base64 to file buffer
function base64ToBuffer(base64String) {
    const base64Data = base64String.replace(/^data:image\/[a-z]+;base64,/, '');
    return Buffer.from(base64Data, 'base64');
}

// Helper function to get file extension from base64 data URL
function getExtensionFromBase64(base64String) {
    const match = base64String.match(/^data:image\/([a-z]+);base64,/);
    return match ? match[1] : 'png';
}

// Function to migrate a single site's images
async function migrateSiteImages(sitePath) {
    console.log(`\n🔍 Checking site: ${sitePath}`);
    
    const siteDataPath = path.join(sitePath, 'siteData.json');
    
    if (!fs.existsSync(siteDataPath)) {
        console.log(`❌ No siteData.json found in ${sitePath}`);
        return;
    }
    
    try {
        // Read current site data
        const siteData = JSON.parse(fs.readFileSync(siteDataPath, 'utf8'));
        let hasChanges = false;
        
        // Check hero image
        if (siteData.heroImage && isBase64(siteData.heroImage)) {
            console.log(`📸 Found base64 hero image in ${sitePath}`);
            console.log(`   Converting to Supabase storage...`);
            
            try {
                const extension = getExtensionFromBase64(siteData.heroImage);
                const timestamp = new Date().getTime();
                const filename = `hero-image-${timestamp}.${extension}`;
                
                // Convert base64 to buffer
                const buffer = base64ToBuffer(siteData.heroImage);
                
                // Upload to Supabase via API
                const uploadResponse = await fetch('http://localhost:3000/api/api?action=uploadImage', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        base64: siteData.heroImage, 
                        filename 
                    })
                });
                
                if (uploadResponse.ok) {
                    const { url } = await uploadResponse.json();
                    siteData.heroImage = url;
                    hasChanges = true;
                    console.log(`   ✅ Hero image migrated successfully`);
                } else {
                    console.log(`   ❌ Failed to upload hero image`);
                }
            } catch (error) {
                console.log(`   ❌ Error migrating hero image: ${error.message}`);
            }
        }
        
        // Check about image
        if (siteData.aboutImage && isBase64(siteData.aboutImage)) {
            console.log(`📸 Found base64 about image in ${sitePath}`);
            console.log(`   Converting to Supabase storage...`);
            
            try {
                const extension = getExtensionFromBase64(siteData.aboutImage);
                const timestamp = new Date().getTime();
                const filename = `about-image-${timestamp}.${extension}`;
                
                // Convert base64 to buffer
                const buffer = base64ToBuffer(siteData.aboutImage);
                
                // Upload to Supabase via API
                const uploadResponse = await fetch('http://localhost:3000/api/api?action=uploadImage', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        base64: siteData.aboutImage, 
                        filename 
                    })
                });
                
                if (uploadResponse.ok) {
                    const { url } = await uploadResponse.json();
                    siteData.aboutImage = url;
                    hasChanges = true;
                    console.log(`   ✅ About image migrated successfully`);
                } else {
                    console.log(`   ❌ Failed to upload about image`);
                }
            } catch (error) {
                console.log(`   ❌ Error migrating about image: ${error.message}`);
            }
        }
        
        // Save updated data if changes were made
        if (hasChanges) {
            fs.writeFileSync(siteDataPath, JSON.stringify(siteData, null, 2));
            console.log(`💾 Updated siteData.json in ${sitePath}`);
        } else {
            console.log(`✅ No base64 images found in ${sitePath}`);
        }
        
    } catch (error) {
        console.log(`❌ Error processing ${sitePath}: ${error.message}`);
    }
}

// Main migration function
async function migrateAllImages() {
    console.log('🚀 Starting image migration from base64 to Supabase storage...\n');
    
    for (const siteDir of SITE_DIRECTORIES) {
        await migrateSiteImages(siteDir);
    }
    
    console.log('\n✅ Migration completed!');
    console.log('\n📋 Next steps:');
    console.log('1. Test the websites to ensure images load correctly');
    console.log('2. Verify that new image uploads work properly');
    console.log('3. Check Supabase storage bucket for uploaded images');
    console.log('4. Consider cleaning up old base64 data if everything works');
}

// Run migration if this script is executed directly
if (require.main === module) {
    migrateAllImages().catch(console.error);
}

module.exports = { migrateAllImages, migrateSiteImages }; 