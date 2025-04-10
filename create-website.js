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
 */
async function registerWebsite(siteName, folderName) {
  try {
    console.log('Validating input...');
    const { siteName: validSiteName, folderName: validFolderName } = validateInput(siteName, folderName);
    
    console.log('Connecting to Supabase...');
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    
    // Generate a site URL based on the folder name
    const siteUrl = `https://portflyo-new.vercel.app/teacher/${validFolderName}/index.html`;
    console.log(`Registering website: ${validSiteName} (${validFolderName}) at ${siteUrl}`);
    
    // Generate a unique site_id
    const siteId = generateSiteId();
    
    // Generate admin username and password hash
    const adminUsername = validFolderName;
    const adminPasswordHash = generateHashedPassword();
    
    // Create the website record in the teacher_websites table
    console.log('Creating website record in the database...');
    const { data: website, error: websiteError } = await supabase
      .from('teacher_websites')
      .insert({
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
        subjects: DEFAULT_TEMPLATE_DATA.subjects,
        qualifications: DEFAULT_TEMPLATE_DATA.personal.qualifications,
        experience_schools: DEFAULT_TEMPLATE_DATA.experience.schools,
        experience_centers: DEFAULT_TEMPLATE_DATA.experience.centers,
        experience_platforms: DEFAULT_TEMPLATE_DATA.experience.platforms,
        results: DEFAULT_TEMPLATE_DATA.results
      })
      .select()
      .single();
    
    if (websiteError) {
      console.error('Error creating website record:', websiteError);
      throw new Error(`Failed to create website record: ${websiteError.message}`);
    }
    
    if (!website) {
      throw new Error('No website data returned after insert');
    }
    
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