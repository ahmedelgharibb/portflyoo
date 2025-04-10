/**
 * Create Website Script
 * This script registers a new teacher website in the database.
 * 
 * Usage:
 * node create-website.js "Site Name" "folder_name"
 */

// Import required libraries
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

// Supabase connection details
const SUPABASE_URL = 'https://bqpchhitrbyfleqpyydz.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJxcGNoaGl0cmJ5ZmxlcXB5eWR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM0NTU4ODgsImV4cCI6MjA1OTAzMTg4OH0.Yworu_EPLewJJGBFnW5W7GUsNZIONc3qOEJMTwJMzzQ';

// Default template data for new websites
const DEFAULT_TEMPLATE_DATA = {
  "personal": {
    "name": "Teacher Name",
    "title": "Teacher Title",
    "subtitle": "Experienced Educator",
    "experience": "15+ years of teaching experience",
    "philosophy": "I believe in creating an engaging and supportive learning environment where students are encouraged to think critically and develop a deep understanding of the subject matter.",
    "qualifications": [
      "Ph.D. in Education, Stanford University",
      "Master's in Mathematics, MIT",
      "Bachelor's in Computer Science, Harvard University",
      "Certified Advanced Placement (AP) Instructor"
    ]
  },
  "theme": {
    "color": "blue",
    "mode": "light"
  },
  "hero": {
    "heading": "Inspiring Minds Through Education"
  },
  "contact": {
    "email": "contact@example.com",
    "phone": "+1 (555) 123-4567",
    "formUrl": "https://forms.gle/your-form-id",
    "assistantFormUrl": "https://forms.gle/assistant-form-id",
    "contactMessage": "Take the first step towards academic excellence. Register for our classes and get personalized attention from experienced educators."
  },
  "results": [
    {
      "subject": "Mathematics",
      "year": 2023,
      "a_grade_percent": 85,
      "b_grade_percent": 10,
      "c_grade_percent": 3.5,
      "other_grade_percent": 1.5
    },
    {
      "subject": "Physics",
      "year": 2023,
      "a_grade_percent": 78,
      "b_grade_percent": 15,
      "c_grade_percent": 5,
      "other_grade_percent": 2
    },
    {
      "subject": "Chemistry",
      "year": 2023,
      "a_grade_percent": 75,
      "b_grade_percent": 18,
      "c_grade_percent": 5,
      "other_grade_percent": 2
    }
  ],
  "subjects": [
    {
      "name": "Mathematics",
      "icon": "fas fa-square-root-variable",
      "description": "Advanced Mathematics for all levels"
    },
    {
      "name": "Physics",
      "icon": "fas fa-atom",
      "description": "Physics for high school and college preparation"
    },
    {
      "name": "Chemistry",
      "icon": "fas fa-flask",
      "description": "Chemistry with practical applications"
    },
    {
      "name": "Biology",
      "icon": "fas fa-dna",
      "description": "Biology with focus on IGCSE curriculum"
    },
    {
      "name": "Statistics",
      "icon": "fas fa-calculator",
      "description": "Statistics and data analysis"
    },
    {
      "name": "Computer Science",
      "icon": "fas fa-laptop-code",
      "description": "Programming and computer concepts"
    }
  ],
  "experience": {
    "centers": [
      {
        "name": "Learning Excellence Center",
        "position": "Senior Math Instructor",
        "years": "2018-Present",
        "description": "Teaching advanced mathematics to high school students and preparing them for college entrance exams."
      }
    ],
    "schools": [
      {
        "name": "Washington High School",
        "position": "Mathematics Teacher",
        "years": "2015-2018",
        "description": "Taught Algebra, Geometry, and Calculus to students in grades 9-12."
      }
    ],
    "platforms": [
      {
        "name": "Online Education Platform",
        "position": "Course Creator",
        "years": "2019-Present",
        "description": "Created and published online courses on mathematics, reaching over 5,000 students globally."
      }
    ]
  },
  "heroImage": "https://static.vecteezy.com/system/resources/thumbnails/020/765/399/small_2x/default-profile-account-unknown-icon-black-silhouette-free-vector.jpg"
};

/**
 * Generate a random site_id
 * @returns {string} A random UUID
 */
function generateSiteId() {
  return crypto.randomUUID();
}

/**
 * Generate a random hashed password for the admin user
 * @returns {string} A bcrypt-compatible hashed password
 */
function generateHashedPassword() {
  // In a real implementation, you would use bcrypt to hash the password
  // For this example, we'll return a placeholder
  return '$2a$10$yourhashpassword';
}

/**
 * Validate and sanitize input values
 * @param {string} siteName The name of the website
 * @param {string} folderName The folder name for the website
 * @returns {object} Validated and sanitized values
 */
function validateInput(siteName, folderName) {
  if (!siteName || typeof siteName !== 'string') {
    throw new Error('Site name is required and must be a string');
  }
  
  if (!folderName || typeof folderName !== 'string') {
    throw new Error('Folder name is required and must be a string');
  }
  
  // Sanitize folder_name (allow only alphanumeric, hyphens, and underscores)
  const sanitizedFolderName = folderName.replace(/[^a-zA-Z0-9_-]/g, '');
  if (sanitizedFolderName !== folderName) {
    throw new Error('Folder name must contain only letters, numbers, hyphens and underscores');
  }
  
  return {
    siteName: siteName.trim(),
    folderName: sanitizedFolderName
  };
}

/**
 * Register a new website in the database
 * @param {string} siteName The name of the website
 * @param {string} folderName The folder name for the website
 * @param {object} options Optional parameters
 * @param {boolean} options.skipFolderName Whether to skip using the folder_name column
 */
async function registerWebsite(siteName, folderName, options = {}) {
  try {
    console.log('Validating input...');
    const { siteName: validSiteName, folderName: validFolderName } = validateInput(siteName, folderName);
    
    // Check options
    const skipFolderName = options.skipFolderName === true;
    if (skipFolderName) {
      console.log('Option set to skip folder_name column');
    }
    
    console.log('Connecting to Supabase...');
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    
    // Verify connection to Supabase and determine which table to use
    console.log('Checking database tables...');
    let tableToUse = 'teacher_websites'; // Default table name
    let hasTeacherWebsitesTable = false;
    let hasWebsitesTable = false;
    
    // Check if teacher_websites table exists
    const { error: teacherTableError } = await supabase.from('teacher_websites').select('count').limit(1);
    if (!teacherTableError) {
      console.log('Found teacher_websites table');
      hasTeacherWebsitesTable = true;
    } else {
      console.warn('teacher_websites table check failed:', teacherTableError.message);
    }
    
    // Check if websites table exists
    const { error: websitesTableError } = await supabase.from('websites').select('count').limit(1);
    if (!websitesTableError) {
      console.log('Found websites table');
      hasWebsitesTable = true;
      
      // Check if the websites table has the necessary columns
      try {
        const { data: websitesInfo, error: websitesInfoError } = await supabase
          .from('websites')
          .select('*')
          .limit(1);
          
        if (!websitesInfoError && websitesInfo && websitesInfo.length > 0) {
          console.log('Available columns in websites table:', Object.keys(websitesInfo[0]).join(', '));
          
          // If folder_name is missing from websites table but we need to use it, 
          // set a flag to handle this case differently
          const columns = Object.keys(websitesInfo[0]);
          if (!columns.includes('folder_name')) {
            console.warn('websites table does not have folder_name column');
            
            // We'll use admin_username instead if available
            if (columns.includes('admin_username')) {
              console.log('Will use admin_username instead of folder_name for websites table');
            }
          }
        }
      } catch (websitesCheckError) {
        console.warn('Error checking websites table structure:', websitesCheckError.message);
      }
    } else {
      console.warn('websites table check failed:', websitesTableError.message);
    }
    
    // Decide which table to use
    if (hasTeacherWebsitesTable) {
      tableToUse = 'teacher_websites';
    } else if (hasWebsitesTable) {
      tableToUse = 'websites';
      // Force skipFolderName to true when using websites table
      if (!skipFolderName) {
        console.log('Automatically skipping folder_name column for websites table to avoid errors');
        options.skipFolderName = true;
        skipFolderName = true;
      }
    } else {
      throw new Error('No suitable database table found. Please ensure either teacher_websites or websites table exists.');
    }
    
    console.log(`Using '${tableToUse}' table for website registration`);
    
    // Get table structure to identify available columns
    console.log(`Checking ${tableToUse} table structure...`);
    try {
      const { data: tableInfo, error: tableError } = await supabase
        .from(tableToUse)
        .select('*')
        .limit(1);
        
      if (tableError) {
        console.warn(`Could not retrieve ${tableToUse} structure:`, tableError.message);
      } else if (tableInfo && tableInfo.length > 0) {
        console.log(`Available columns in ${tableToUse} table:`, Object.keys(tableInfo[0]).join(', '));
      } else {
        console.log(`Table ${tableToUse} appears to be empty, could not infer structure from existing records`);
      }
    } catch (structureError) {
      console.warn('Error checking table structure:', structureError.message);
    }
    
    // Check if website with the same admin_username (folder name) already exists
    console.log(`Checking if website with folder name "${validFolderName}" already exists...`);
    
    // For teacher_websites table, check admin_username
    if (tableToUse === 'teacher_websites') {
      const { data: existingWebsite, error: existingWebsiteError } = await supabase
        .from(tableToUse)
        .select('site_id, admin_username, teacher_name')
        .eq('admin_username', validFolderName)
        .maybeSingle();
        
      if (existingWebsiteError) {
        console.warn('Error checking for existing website:', existingWebsiteError.message);
      }
      
      if (existingWebsite) {
        console.error(`Website with folder name "${validFolderName}" already exists (ID: ${existingWebsite.site_id})`);
        throw new Error(`A website already exists with folder name "${validFolderName}". Please choose a different folder name.`);
      }
    } 
    // For websites table, check different columns depending on structure
    else if (tableToUse === 'websites') {
      try {
        // First check table structure to see what columns we have
        const { data: columnCheck, error: columnCheckError } = await supabase
          .from(tableToUse)
          .select('*')
          .limit(1);
          
        if (columnCheckError) {
          console.warn('Error checking columns:', columnCheckError.message);
        } else {
          const availableColumns = columnCheck && columnCheck.length > 0 
            ? Object.keys(columnCheck[0]) 
            : [];
            
          console.log('Available columns for existence check:', availableColumns.join(', '));
          
          // Check if admin_username exists (safer check)
          if (availableColumns.includes('admin_username')) {
            const { data: existingWebsite, error: existingWebsiteError } = await supabase
              .from(tableToUse)
              .select('id, site_name')
              .eq('admin_username', validFolderName)
              .maybeSingle();
              
            if (!existingWebsiteError && existingWebsite) {
              console.error(`Website with username "${validFolderName}" already exists (ID: ${existingWebsite.id})`);
              throw new Error(`A website already exists with username "${validFolderName}". Please choose a different folder name.`);
            }
          }
          
          // Check site_name as a fallback
          const { data: nameCheck, error: nameCheckError } = await supabase
            .from(tableToUse)
            .select('id, site_name')
            .eq('site_name', validSiteName)
            .maybeSingle();
            
          if (!nameCheckError && nameCheck) {
            console.error(`Website with name "${validSiteName}" already exists (ID: ${nameCheck.id})`);
            throw new Error(`A website already exists with name "${validSiteName}". Please choose a different site name.`);
          }
        }
      } catch (checkError) {
        console.warn('Error checking existing website in websites table:', checkError.message);
      }
    }
    
    console.log(`No existing website found with folder name "${validFolderName}"`);
    
    // Generate a site URL based on the folder name
    const siteUrl = `https://portflyo-new.vercel.app/teacher/${validFolderName}/index.html`;
    console.log(`Registering website: ${validSiteName} (${validFolderName}) at ${siteUrl}`);
    
    // Generate a unique site_id
    const siteId = generateSiteId();
    
    // Generate admin username and password hash
    const adminUsername = validFolderName;
    const adminPasswordHash = generateHashedPassword();
    
    // Create the website record in the database table
    console.log(`Creating website record in the ${tableToUse} table...`);
    
    // Prepare the data based on which table we're using
    let websiteData = {};
    
    if (tableToUse === 'teacher_websites') {
      websiteData = {
        site_id: siteId,
        admin_username: adminUsername,
        admin_password_hash: adminPasswordHash,
        teacher_name: validSiteName,
        teacher_title: 'Teacher',
        hero_heading: 'Inspiring Minds Through Education',
        experience_years: '15+',
        teaching_philosophy: DEFAULT_TEMPLATE_DATA.personal.philosophy,
        contact_email: DEFAULT_TEMPLATE_DATA.contact.email,
        phone_number: DEFAULT_TEMPLATE_DATA.contact.phone,
        registration_form_url: DEFAULT_TEMPLATE_DATA.contact.formUrl,
        assistant_form_url: DEFAULT_TEMPLATE_DATA.contact.assistantFormUrl,
        contact_message: DEFAULT_TEMPLATE_DATA.contact.contactMessage,
        theme_color: DEFAULT_TEMPLATE_DATA.theme.color,
        theme_mode: DEFAULT_TEMPLATE_DATA.theme.mode,
        hero_image_url: DEFAULT_TEMPLATE_DATA.heroImage,
        subjects: JSON.stringify(DEFAULT_TEMPLATE_DATA.subjects),
        qualifications: JSON.stringify(DEFAULT_TEMPLATE_DATA.personal.qualifications),
        experience_schools: JSON.stringify(DEFAULT_TEMPLATE_DATA.experience.schools),
        experience_centers: JSON.stringify(DEFAULT_TEMPLATE_DATA.experience.centers),
        experience_platforms: JSON.stringify(DEFAULT_TEMPLATE_DATA.experience.platforms),
        results: JSON.stringify(DEFAULT_TEMPLATE_DATA.results),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    } else {
      // For websites table, use a simpler structure
      // First check columns to ensure we only include valid ones
      let availableWebsitesColumns = [];
      
      try {
        const { data: columnInfo, error: columnError } = await supabase
          .from('websites')
          .select('*')
          .limit(1);
          
        if (!columnError && columnInfo && columnInfo.length > 0) {
          availableWebsitesColumns = Object.keys(columnInfo[0]);
          console.log('Available columns in websites table for data insertion:', availableWebsitesColumns.join(', '));
        } else {
          console.warn('Could not determine columns for websites table, using basic fields only');
          availableWebsitesColumns = ['site_name', 'site_url', 'created_at', 'updated_at'];
        }
      } catch (columnCheckError) {
        console.warn('Error checking websites columns:', columnCheckError.message);
        // Fallback to basic fields
        availableWebsitesColumns = ['site_name', 'site_url', 'created_at', 'updated_at'];
      }
      
      // Start with basic data that should work on all schemas
      websiteData = {
        site_name: validSiteName,
        site_url: siteUrl,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      // Only add fields that exist in the table
      if (availableWebsitesColumns.includes('admin_username')) {
        websiteData.admin_username = adminUsername;
      }
      
      // NEVER add folder_name to websites table regardless of schema check
      // This ensures we never hit the folder_name column issue
      
      // Debug log the final data being used
      console.log('Final data for websites table:', JSON.stringify(websiteData));
    }
    
    // Retry logic for database insertion
    let website = null;
    let websiteError = null;
    let retries = 3;
    
    while (retries > 0 && !website) {
      try {
        // For websites table, make absolutely sure folder_name is not included
        if (tableToUse === 'websites' && websiteData.folder_name !== undefined) {
          console.log('Removing folder_name field for websites table to prevent errors');
          delete websiteData.folder_name;
        }
        
        const response = await supabase
          .from(tableToUse)
          .insert(websiteData)
          .select()
          .single();
          
        website = response.data;
        websiteError = response.error;
        
        if (websiteError) {
          console.warn(`Database insertion attempt failed (${4-retries}/3), retrying...`, websiteError.message);
          
          // Handle specific case of missing folder_name column
          if (websiteError.message && websiteError.message.includes("folder_name")) {
            console.log("Detected folder_name column error, removing folder_name from data");
            
            // Remove the folder_name field and try again
            if (websiteData.folder_name) {
              delete websiteData.folder_name;
              console.log("Modified data object:", Object.keys(websiteData).join(', '));
            }
          }
          
          retries--;
          
          if (retries > 0) {
            // Wait before retrying (exponential backoff)
            await new Promise(resolve => setTimeout(resolve, 1000 * (4-retries)));
          }
        } else {
          console.log('Website data inserted successfully on attempt', 4-retries);
          break;
        }
      } catch (insertError) {
        console.error('Unexpected error during database insertion:', insertError.message);
        websiteError = {message: insertError.message};
        retries--;
        
        if (retries > 0) {
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, 1000 * (4-retries)));
        }
      }
    }
    
    if (websiteError) {
      console.error('All database insertion attempts failed:', websiteError);
      throw new Error(`Failed to create website record after multiple attempts: ${websiteError.message}`);
    }
    
    if (!website) {
      throw new Error('No website data returned after insert');
    }
    
    console.log('Website registered successfully with ID:', siteId);
    
    // Generate and write the site-config.js file content
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
    
    // In a real implementation, you would write this to a file
    console.log('\nWebsite registered successfully!');
    console.log('----------------------------');
    console.log(`Site ID: ${siteId}`);
    console.log(`Site Name: ${validSiteName}`);
    console.log(`Site URL: ${siteUrl}`);
    console.log(`Folder Name: ${validFolderName}`);
    console.log(`Admin Username: ${adminUsername}`);
    console.log('Default Admin Password: teacher123 (please change this)');
    console.log('\nNext steps:');
    console.log('1. Create the website folder: mkdir -p teacher/' + validFolderName);
    console.log('2. Copy template files: cp -r teacher/edit-template/* teacher/' + validFolderName + '/');
    console.log('3. Create site-config.js in the website folder with the generated content');
    console.log('4. Deploy the website and start customizing!');
    
    // For development purposes, output the site-config.js content
    console.log('\n--- site-config.js content ---');
    console.log(configContent);
    console.log('-----------------------------');
    
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
    console.error('Usage: node create-website.js "Site Name" "folder_name"');
    process.exit(1);
  }
  
  const siteName = args[0];
  const folderName = args[1];
  
  registerWebsite(siteName, folderName)
    .then(() => {
      process.exit(0);
    })
    .catch(error => {
      console.error('Failed to register website:', error.message);
      process.exit(1);
    });
} else {
  // Export the function for use in other modules
  module.exports = { registerWebsite };
} 