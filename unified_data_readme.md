# Unified Site Data Solution

This document provides instructions for migrating from multiple separate tables to a single unified table for all site data. This approach makes it easier to access information and simplifies your database structure.

## Overview

Currently, your site data is scattered across multiple tables:
- admin_settings
- admin_users
- assistant_applications
- contact_messages
- experience
- qualifications
- results
- site_data
- site_settings
- student_registrations
- subjects
- teacher_websites
- website_content
- website_settings
- websites

This solution replaces all of these tables with a single `unified_site_data` table that uses a category-based approach to store all types of data. This makes it easier to query, maintain, and extend your database.

## Files Included

1. `unified_site_data_schema.sql` - SQL migration script to create the unified table and migrate existing data
2. `unified_site_data.js` - JavaScript helper library to interact with the unified table

## Implementation Steps

### Step 1: Back Up Your Database

Before making any changes, create a full backup of your database:

```bash
pg_dump your_database_name > database_backup.sql
```

### Step 2: Prepare the Migration

1. Review the `unified_site_data_schema.sql` script and modify it if needed to match your specific table structure
2. Make sure all the table names referenced in the script match your actual table names

### Step 3: Run the Migration

Execute the migration script in your database:

1. Connect to your Supabase database using the SQL Editor
2. Copy and paste the content of `unified_site_data_schema.sql` 
3. Review the script carefully
4. Uncomment the `SELECT migrate_to_unified_table();` line when you're ready to run the migration
5. Execute the script
6. Check the console output for any errors or messages

### Step 4: Verify the Migration

After the migration completes, verify that all data was migrated correctly:

1. Uncomment and run the verification query:
   ```sql
   SELECT site_id, category, COUNT(*) FROM unified_site_data GROUP BY site_id, category ORDER BY site_id, category;
   ```
2. Check that all categories have the expected number of records
3. Sample a few records to ensure the data is correct:
   ```sql
   SELECT * FROM unified_site_data WHERE site_id = 'your_site_id' AND category = 'site_data';
   ```

### Step 5: Update Your Application

1. Copy the `unified_site_data.js` file to your project
2. Update the Supabase credentials in the file to match your project
3. Modify your code to use the new helper library instead of direct table access

#### Example Usage:

```javascript
import UnifiedSiteData from './unified_site_data.js';

// Initialize with your site ID
const siteId = 'ahmed_01'; // or whatever your site ID is
const siteData = new UnifiedSiteData(siteId);

// Load data
async function loadSiteData() {
  // Get all data at once
  const allData = await siteData.getAllData();
  console.log('All site data:', allData);
  
  // Or get specific categories
  const adminSettings = await siteData.getAdminSettings();
  const experienceData = await siteData.getExperience();
  const results = await siteData.getResults();
  
  // Use the data as needed
  updateUI(allData);
}

// Save data
async function saveChanges(newData) {
  // Save to a specific category
  const success = await siteData.saveData('experience', newData.experience);
  
  if (success) {
    console.log('Experience data saved successfully');
  } else {
    console.error('Failed to save experience data');
  }
}
```

### Step 6: Update Your Script.js Files

For each of your script.js files, you'll need to modify the following functions to work with the unified data structure:

1. `openAdminPanel` function - To load data from the unified table
2. `saveAdminChanges` function - To save data to the unified table 

Example modification for `openAdminPanel`:

```javascript
async function openAdminPanel() {
  // ...existing code...
  
  try {
    // Show a loading message
    showAdminAlert('success', 'Loading admin panel...');
    
    let dataLoaded = false;
    let dataSource = 'default';
    
    // Create an instance of UnifiedSiteData
    const unifiedData = new UnifiedSiteData(WEBSITE_ID);
    
    // Try to load from Supabase using the unified helper
    try {
      console.log('Attempting to load data from unified table');
      const data = await unifiedData.getSiteData();
      
      if (data) {
        console.log('✅ Raw data from unified table:', data);
        siteData = data;
        dataLoaded = true;
        dataSource = 'supabase-unified';
        console.log('✅ Data loaded for admin panel from unified table successfully');
        showAdminAlert('success', 'Data loaded successfully!');
      } else {
        console.log('No data found in unified table for admin panel');
        showAdminAlert('error', 'No data found in database. Using local storage or default values.');
      }
    } catch (error) {
      console.error('Error in admin data loading from unified table:', error);
      showAdminAlert('error', `Database error: ${error.message}. Using local data instead.`);
    }
    
    // ...rest of your existing code...
  }
}
```

Example modification for `saveAdminChanges`:

```javascript
async function saveAdminChanges() {
  // ...existing code...
  
  try {
    // ...existing code...
    
    // Save to unified table
    const unifiedData = new UnifiedSiteData(WEBSITE_ID);
    const success = await unifiedData.saveSiteData(newData);
    
    if (success) {
      console.log('✅ Data saved to unified table successfully');
      showAdminAlert('success', 'Changes saved successfully!');
    } else {
      console.error('Failed to save to unified table');
      // Fallback to localStorage
      localStorage.setItem('siteData', JSON.stringify(newData));
      console.log('✅ Data saved to localStorage as fallback');
      showAdminAlert('success', 'Data saved to local storage successfully');
    }
    
    // ...rest of your existing code...
  } catch (error) {
    // ...existing error handling...
  }
}
```

### Step 7: Testing

1. Test the website functionality after the changes
2. Verify that the admin panel loads data correctly
3. Test saving changes and ensure they persist
4. Check that all features using the previously separate tables still work

### Step 8: Cleanup (Optional)

Once you've verified everything works correctly, you can drop the old tables:

```sql
DROP TABLE admin_settings CASCADE;
DROP TABLE admin_users CASCADE;
-- ... and so on for all tables
```

Keep the backup tables (e.g., admin_settings_backup) for a while until you're confident the migration was successful.

## Benefits of This Approach

1. **Simplified Database Schema**: Single table instead of 15+ separate tables
2. **Flexible Structure**: Easy to add new data categories without schema changes
3. **Simplified Queries**: Consistent pattern for accessing all types of data
4. **Reduced Complexity**: Fewer tables to manage and maintain
5. **Improved Performance**: Fewer joins needed for related data
6. **Better Caching**: The helper library includes caching for improved performance

## Troubleshooting

If you encounter issues:

1. **Data not loading**: Check the browser console for errors and ensure site_id is correct
2. **Save failures**: Verify that you have write permissions to the unified_site_data table
3. **Missing data**: Check if the migration function completed successfully by looking for error messages in the migration output

For any errors, you can always restore from your backup if needed. 