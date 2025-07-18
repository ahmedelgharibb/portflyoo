// Backup script to create a backup of current data before migration
// Run this script before running the migration to ensure data safety

const fs = require('fs');
const path = require('path');

// Configuration
const SITE_DIRECTORIES = [
    'public/websites/template1',
    'public/websites/test1'
];

// Create backup directory with timestamp
function createBackupDirectory() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join(__dirname, '..', 'backups', `pre-migration-${timestamp}`);
    
    if (!fs.existsSync(path.dirname(backupDir))) {
        fs.mkdirSync(path.dirname(backupDir), { recursive: true });
    }
    
    fs.mkdirSync(backupDir, { recursive: true });
    return backupDir;
}

// Backup a single site
function backupSite(sitePath, backupDir) {
    console.log(`📁 Backing up: ${sitePath}`);
    
    const siteName = path.basename(sitePath);
    const siteBackupDir = path.join(backupDir, siteName);
    fs.mkdirSync(siteBackupDir, { recursive: true });
    
    // Copy siteData.json
    const siteDataPath = path.join(sitePath, 'siteData.json');
    if (fs.existsSync(siteDataPath)) {
        const backupPath = path.join(siteBackupDir, 'siteData.json');
        fs.copyFileSync(siteDataPath, backupPath);
        console.log(`   ✅ Backed up siteData.json`);
    }
    
    // Copy other important files
    const filesToBackup = ['index.html', 'script.js', 'styles.css', 'site.config.json'];
    filesToBackup.forEach(file => {
        const filePath = path.join(sitePath, file);
        if (fs.existsSync(filePath)) {
            const backupPath = path.join(siteBackupDir, file);
            fs.copyFileSync(filePath, backupPath);
            console.log(`   ✅ Backed up ${file}`);
        }
    });
}

// Create backup manifest
function createBackupManifest(backupDir, sites) {
    const manifest = {
        timestamp: new Date().toISOString(),
        description: 'Backup created before base64 to Supabase image migration',
        sites: sites.map(site => ({
            path: site,
            name: path.basename(site),
            backedUp: fs.existsSync(path.join(backupDir, path.basename(site), 'siteData.json'))
        })),
        totalSites: sites.length,
        backupLocation: backupDir
    };
    
    const manifestPath = path.join(backupDir, 'backup-manifest.json');
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    console.log(`📋 Created backup manifest: ${manifestPath}`);
}

// Main backup function
function createBackup() {
    console.log('🔄 Creating backup before migration...\n');
    
    const backupDir = createBackupDirectory();
    console.log(`📂 Backup directory: ${backupDir}\n`);
    
    for (const siteDir of SITE_DIRECTORIES) {
        backupSite(siteDir, backupDir);
    }
    
    createBackupManifest(backupDir, SITE_DIRECTORIES);
    
    console.log('\n✅ Backup completed successfully!');
    console.log(`📁 Backup location: ${backupDir}`);
    console.log('\n🔒 Your data is now safe. You can proceed with the migration.');
    console.log('💡 To restore from backup, copy the files back to their original locations.');
    
    return backupDir;
}

// Run backup if this script is executed directly
if (require.main === module) {
    createBackup();
}

module.exports = { createBackup }; 