#!/bin/bash

# Unified Database Migration Helper Script
# This script guides you through the process of migrating to a unified database structure

set -e  # Exit immediately if any command fails

echo "===================================================================="
echo "                   UNIFIED DATABASE MIGRATION TOOL                   "
echo "===================================================================="
echo
echo "This script will help you migrate your separate database tables"
echo "into a single unified_site_data table for easier management."
echo
echo "IMPORTANT: Make sure you have a backup of your database before proceeding!"
echo

# Check if required files exist
if [ ! -f unified_site_data_schema.sql ]; then
    echo "Error: unified_site_data_schema.sql not found!"
    echo "Please make sure this file is in the current directory."
    exit 1
fi

if [ ! -f unified_site_data.js ]; then
    echo "Error: unified_site_data.js not found!"
    echo "Please make sure this file is in the current directory."
    exit 1
fi

if [ ! -f unified_data_readme.md ]; then
    echo "Error: unified_data_readme.md not found!"
    echo "Please make sure this file is in the current directory."
    exit 1
fi

if [ ! -f unified_script_example.js ]; then
    echo "Error: unified_script_example.js not found!"
    echo "Please make sure this file is in the current directory."
    exit 1
fi

echo "All required files found. Let's proceed with the migration."
echo

# Step 1: Backup Database
echo "STEP 1: Create a database backup"
echo
echo "Instructions:"
echo "1. Connect to your Supabase dashboard"
echo "2. Go to the SQL Editor or Database section"
echo "3. Execute this command to create a backup:"
echo
echo "   CREATE TABLE site_data_backup AS SELECT * FROM site_data;"
echo "   -- Repeat for each table you want to backup"
echo
read -p "Press Enter when you've completed this step..." dummy

# Step 2: Run the migration script
echo
echo "STEP 2: Run the migration script"
echo
echo "Instructions:"
echo "1. Open your Supabase dashboard and navigate to the SQL Editor"
echo "2. Copy the entire content of unified_site_data_schema.sql"
echo "3. Paste it into the SQL Editor"
echo "4. Before executing, review the script and modify table names if needed"
echo "5. Uncomment the SELECT migrate_to_unified_table(); line"
echo "6. Execute the script"
echo "7. Check for any error messages in the output"
echo
read -p "Press Enter when you've completed this step..." dummy

# Step 3: Verify the migration
echo
echo "STEP 3: Verify the migration"
echo
echo "Instructions:"
echo "1. Run this SQL query to check the migrated data:"
echo
echo "   SELECT site_id, category, COUNT(*) FROM unified_site_data GROUP BY site_id, category ORDER BY site_id, category;"
echo
echo "2. Confirm all your sites and categories are present with the expected number of records"
echo 
read -p "Press Enter when you've completed this step..." dummy

# Step 4: Copy the JavaScript helper
echo
echo "STEP 4: Update your JavaScript code"
echo
echo "Instructions:"
echo "1. Copy unified_site_data.js to your project directory:"
echo
echo "   Target location: teacher/ahmed/"
echo
echo "2. Update the Supabase credentials in the file"
echo "3. Use unified_script_example.js as a reference to modify your script.js files"
echo

# Actually copy the files
echo "Copying unified_site_data.js to teacher/ahmed/..."
if cp unified_site_data.js teacher/ahmed/; then
    echo "✅ File copied successfully"
else
    echo "❌ Failed to copy file. Please copy it manually"
fi

echo
echo "Would you like to create a backup of the current script.js before modifying it?"
read -p "Copy script.js to script.js.backup? (y/n): " create_backup

if [[ $create_backup == "y" || $create_backup == "Y" ]]; then
    if cp teacher/ahmed/script.js teacher/ahmed/script.js.backup; then
        echo "✅ Backup created at teacher/ahmed/script.js.backup"
    else
        echo "❌ Failed to create backup. Please create it manually"
    fi
fi

echo
echo "Would you like me to attempt to automatically update script.js?"
echo "WARNING: This is an automated process and may require manual verification."
read -p "Automatically modify script.js? (y/n): " auto_modify

if [[ $auto_modify == "y" || $auto_modify == "Y" ]]; then
    echo "Generating modified script.js..."
    # This is a very simplified replacement - you may need to manually modify further
    sed -i.tmp '1i// Import the UnifiedSiteData helper\nimport UnifiedSiteData from "./unified_site_data.js";\n\n// Initialize the unified data helper\nconst unifiedData = new UnifiedSiteData(WEBSITE_ID);\n' teacher/ahmed/script.js
    
    # Replace openAdminPanel function with unified version
    # Note: This is a very simplified example - will likely need manual fixing
    echo "⚠️ Automated replacement of openAdminPanel and saveAdminChanges is not possible"
    echo "Please manually update these functions using unified_script_example.js as a reference"
fi

# Step 5: Test the updated code
echo
echo "STEP 5: Testing"
echo
echo "Instructions:"
echo "1. Open your website in a browser"
echo "2. Try to log in to the admin panel"
echo "3. Check if data loads correctly"
echo "4. Make changes and save them"
echo "5. Verify the changes are saved to the unified_site_data table"
echo
echo "If you encounter any issues, refer to the unified_data_readme.md file for troubleshooting"
echo

# Step 6: Cleanup (Optional)
echo "STEP 6: Cleanup (Optional)"
echo
echo "After confirming everything works correctly, you can drop the old tables:"
echo
echo "   DROP TABLE site_data CASCADE;"
echo "   -- Repeat for each table you want to drop"
echo
echo "⚠️ Only do this after thorough testing!"
echo

echo "Migration process completed!"
echo "For more information and troubleshooting, see unified_data_readme.md"
echo "====================================================================" 