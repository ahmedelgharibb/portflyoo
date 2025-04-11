/**
 * Modified Website Registration Script
 * This script registers a new website using the unified_site_data table
 */

const { createClient } = require('@supabase/supabase-js');

// Replace with your actual Supabase credentials
const SUPABASE_URL = 'https://bqpchhitrbyfleqpyydz.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJxcGNoaGl0cmJ5ZmxlcXB5eWR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM0NTU4ODgsImV4cCI6MjA1OTAzMTg4OH0.Yworu_EPLewJJGBFnW5W7GUsNZIONc3qOEJMTwJMzzQ';

// Default template data for new websites
const DEFAULT_TEMPLATE_DATA = {
  personal: {
    philosophy: "My teaching philosophy is centered on making complex subjects accessible and engaging for all students. I believe in a hands-on, interactive approach to learning that encourages critical thinking and problem-solving skills.",
    qualifications: [
      "Ph.D. in Subject Education",
      "Master's in Applied Subject",
      "Bachelor's in Subject"
    ]
  },
  contact: {
    email: "teacher@example.com",
    phone: "+1 (123) 456-7890",
    formUrl: "https://forms.example.com/registration",
    assistantFormUrl: "https://forms.example.com/assistant",
    contactMessage: "Feel free to reach out with any questions or to schedule a consultation."
  },
  experience: {
    schools: [
      "International School",
      "Elite Academy",
      "Science High School"
    ],
    centers: [
      "Learning Center",
      "Advanced Institute",
      "Education Hub"
    ],
    platforms: [
      "Online Education Platform",
      "Learning Academy",
      "Virtual Center"
    ]
  },
  theme: {
    color: "blue",
    mode: "light"
  },
  heroImage: "https://example.com/default-hero.jpg",
  subjects: [
    { name: "Subject 1", icon: "fa-atom" },
    { name: "Subject 2", icon: "fa-calculator" },
    { name: "Subject 3", icon: "fa-flask" }
  ],
  results: {
    subjects: [
      { name: "Subject 1", score: 90 },
      { name: "Subject 2", score: 85 },
      { name: "Subject 3", score: 88 },
      { name: "Subject 4", score: 92 }
    ]
  }
};

/**
 * Generates a site ID for the new website
 * @returns {string} - A unique identifier
 */
function generateSiteId() {
  // Generate a timestamp-based ID
  return `site_${Date.now()}`;
}

/**
 * Generates a hashed password for admin access
 * @returns {string} - Hashed password (simplified for demo)
 */
function generateHashedPassword() {
  // In a real app, you would use bcrypt or similar
  return "hashed_teacher123";
}

/**
 * Registers a new website using the unified table structure
 * @param {string} siteName - Display name for the website
 * @param {string} folderName - Folder name for the website files
 * @param {object} options - Optional configuration
 * @returns {Promise<object>} - Registration result
 */
async function registerWebsiteUnified(siteName, folderName, options = {}) {
  try {
    // Initialize logging function
    const log = (message) => console.error(message);
    
    log('Connecting to Supabase...');
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    
    // Validate inputs
    const validSiteName = siteName.trim();
    const validFolderName = folderName.trim().replace(/[^a-zA-Z0-9_-]/g, '_');
    
    if (!validSiteName || !validFolderName) {
      throw new Error('Invalid site name or folder name');
    }
    
    log(`Registering website: ${validSiteName} (${validFolderName})`);
    
    // Check if the unified_site_data table exists
    log('Verifying unified_site_data table...');
    try {
      const { count, error } = await supabase
        .from('unified_site_data')
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        log('Error checking unified_site_data table:', error.message);
        log('Falling back to traditional table approach...');
        
        // If you have a fallback registration function, call it here
        // return fallbackRegisterWebsite(siteName, folderName, options);
        
        throw new Error('unified_site_data table not found. Please run the migration script first.');
      }
      
      log('unified_site_data table verified');
    } catch (tableError) {
      throw new Error(`Database verification failed: ${tableError.message}`);
    }
    
    // Check if a website with this folder name already exists
    log(`Checking if website with folder name "${validFolderName}" already exists...`);
    try {
      const { data: existingData, error: existingError } = await supabase
        .from('unified_site_data')
        .select('site_id')
        .like('data->>folderName', validFolderName)
        .maybeSingle();
      
      if (existingError) {
        log('Error checking for existing website:', existingError.message);
      }
      
      if (existingData) {
        throw new Error(`A website already exists with folder name "${validFolderName}". Please choose a different folder name.`);
      }
      
      log(`No existing website found with folder name "${validFolderName}"`);
    } catch (checkError) {
      if (checkError.message.includes('already exists')) {
        throw checkError; // Re-throw this specific error
      }
      log('Error checking existing website:', checkError.message);
    }
    
    // Generate site URL based on the folder name
    const siteUrl = `https://portflyo-new.vercel.app/teacher/${validFolderName}/index.html`;
    log(`Site URL will be: ${siteUrl}`);
    
    // Generate a unique site_id
    const siteId = generateSiteId();
    log(`Generated site ID: ${siteId}`);
    
    // Generate admin username and password
    const adminUsername = validFolderName;
    const adminPasswordHash = generateHashedPassword();
    
    // Create the initial website data for site_data category
    const websiteData = {
      siteName: validSiteName,
      siteUrl,
      folderName: validFolderName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      personalInfo: {
        name: validSiteName,
        title: "Educator",
        qualifications: DEFAULT_TEMPLATE_DATA.personal.qualifications,
        experience: "Add your experience"
      },
      experience: {
        schools: DEFAULT_TEMPLATE_DATA.experience.schools,
        centers: DEFAULT_TEMPLATE_DATA.experience.centers,
        onlinePlatforms: DEFAULT_TEMPLATE_DATA.experience.platforms
      },
      results: DEFAULT_TEMPLATE_DATA.results,
      contact: DEFAULT_TEMPLATE_DATA.contact,
      theme: DEFAULT_TEMPLATE_DATA.theme
    };
    
    // Prepare additional data for other categories
    const adminSettings = {
      adminUsername,
      adminPasswordHash,
      theme: DEFAULT_TEMPLATE_DATA.theme.color,
      themeMode: DEFAULT_TEMPLATE_DATA.theme.mode,
      createdAt: new Date().toISOString()
    };
    
    const teacherWebsite = {
      teacherName: validSiteName,
      folderName: validFolderName,
      siteUrl,
      adminUsername,
      adminPasswordHash,
      createdAt: new Date().toISOString()
    };
    
    // Insert data into unified_site_data table
    log('Inserting data into unified_site_data table...');
    
    // Step 1: Insert site_data category
    const { data: siteDataResult, error: siteDataError } = await supabase
      .from('unified_site_data')
      .insert({
        site_id: siteId,
        category: 'site_data',
        data: websiteData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (siteDataError) {
      throw new Error(`Error inserting site_data: ${siteDataError.message}`);
    }
    
    log('Site data inserted successfully');
    
    // Step 2: Insert admin_settings category
    const { error: adminError } = await supabase
      .from('unified_site_data')
      .insert({
        site_id: siteId,
        category: 'admin_settings',
        data: adminSettings,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    
    if (adminError) {
      log(`Warning: Error inserting admin_settings: ${adminError.message}`);
      // Continue anyway as this is not critical
    } else {
      log('Admin settings inserted successfully');
    }
    
    // Step 3: Insert teacher_website category
    const { error: teacherError } = await supabase
      .from('unified_site_data')
      .insert({
        site_id: siteId,
        category: 'teacher_website',
        data: teacherWebsite,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    
    if (teacherError) {
      log(`Warning: Error inserting teacher_website: ${teacherError.message}`);
      // Continue anyway as this is not critical
    } else {
      log('Teacher website data inserted successfully');
    }
    
    // Generate and prepare the site-config.js file content
    const configContent = 
      '/**\n' +
      ' * site-config.js\n' +
      ' * This file contains configuration specific to this website instance.\n' +
      ' * It is automatically generated on: ' + new Date().toISOString() + '\n' +
      ' */\n\n' +
      'const siteConfig = {\n' +
      '    // Website ID from the database\n' +
      '    websiteId: "' + siteId + '",\n\n' +
      '    // Site name\n' +
      '    siteName: "' + validSiteName + '",\n\n' +
      '    // Site URL\n' +
      '    siteUrl: "' + siteUrl + '",\n\n' +
      '    // Folder name\n' +
      '    folderName: "' + validFolderName + '",\n\n' +
      '    // Created timestamp\n' +
      '    createdAt: "' + new Date().toISOString() + '"\n' +
      '};\n\n' +
      'export default siteConfig;';
    
    log('\nWebsite registered successfully in unified table!');
    log('-------------------------------------------');
    log(`Site ID: ${siteId}`);
    log(`Site Name: ${validSiteName}`);
    log(`Site URL: ${siteUrl}`);
    log(`Folder Name: ${validFolderName}`);
    log(`Admin Username: ${adminUsername}`);
    log('Default Admin Password: teacher123 (please change this)');
    
    return {
      siteId,
      siteName: validSiteName,
      siteUrl,
      folderName: validFolderName,
      configContent
    };
    
  } catch (error) {
    console.error('Error registering website:', error.message);
    throw error;
  }
}

// Execute the script if run directly
if (require.main === module) {
  // Get command line arguments
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.error('Usage: node modified_create_website.js "Site Name" "folder_name"');
    process.exit(1);
  }
  
  const siteName = args[0];
  const folderName = args[1];
  
  registerWebsiteUnified(siteName, folderName)
    .then(result => {
      // Only output the JSON to stdout, all logs go to stderr
      console.log(JSON.stringify(result));
      process.exit(0);
    })
    .catch(error => {
      console.error('Failed to register website:', error.message);
      process.exit(1);
    });
} else {
  // Export the function for use in other modules
  module.exports = { registerWebsiteUnified };
} 