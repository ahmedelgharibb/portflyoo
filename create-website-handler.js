/**
 * Create Website Handler
 * A simple Express.js server to handle website creation requests.
 * 
 * To run:
 * 1. Install dependencies: npm install express cors fs-extra
 * 2. Start server: node create-website-handler.js
 * 3. Access the web interface at: http://localhost:3000
 */

const express = require('express');
const cors = require('cors');
const fs = require('fs-extra');
const path = require('path');
const { registerWebsite } = require('./create-website');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Serve the form
app.get('/', (req, res) => {
  const formHtml = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Create Teacher Website</title>
      <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
    </head>
    <body class="bg-gray-100 min-h-screen flex items-center justify-center p-4">
      <div class="bg-white rounded-lg shadow-md p-8 max-w-lg w-full">
        <h1 class="text-2xl font-bold text-center mb-6">Create New Teacher Website</h1>
        
        <div id="alertContainer" class="mb-4 hidden"></div>
        
        <form id="createWebsiteForm" class="space-y-4">
          <div>
            <label for="siteName" class="block text-sm font-medium text-gray-700 mb-1">Teacher Name</label>
            <input type="text" id="siteName" name="siteName" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. John Smith" required>
          </div>
          
          <div>
            <label for="folderName" class="block text-sm font-medium text-gray-700 mb-1">Folder Name</label>
            <input type="text" id="folderName" name="folderName" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. john_smith" required>
            <p class="text-xs text-gray-500 mt-1">Use only letters, numbers, underscores and hyphens</p>
          </div>
          
          <div class="pt-4">
            <button type="submit" class="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
              Create Website
            </button>
          </div>
        </form>
        
        <div id="resultContainer" class="mt-8 hidden">
          <h2 class="text-xl font-semibold mb-4">Website Created Successfully!</h2>
          <div class="bg-gray-100 p-4 rounded-md">
            <div class="mb-3">
              <p class="text-sm font-medium text-gray-700">Site ID:</p>
              <p id="resultSiteId" class="text-sm font-mono bg-gray-200 p-1 rounded"></p>
            </div>
            <div class="mb-3">
              <p class="text-sm font-medium text-gray-700">Site Name:</p>
              <p id="resultSiteName" class="text-sm"></p>
            </div>
            <div class="mb-3">
              <p class="text-sm font-medium text-gray-700">Site URL:</p>
              <a id="resultSiteUrl" href="#" target="_blank" class="text-sm text-blue-600 hover:underline"></a>
            </div>
            <div class="mb-3">
              <p class="text-sm font-medium text-gray-700">Folder Name:</p>
              <p id="resultFolderName" class="text-sm font-mono"></p>
            </div>
            <div class="mb-3">
              <p class="text-sm font-medium text-gray-700">Admin Username:</p>
              <p id="resultAdminUsername" class="text-sm font-mono"></p>
            </div>
            <div>
              <p class="text-sm font-medium text-gray-700">Default Admin Password:</p>
              <p class="text-sm">teacher123 (please change this after first login)</p>
            </div>
          </div>
        </div>
      </div>
      
      <script>
        document.addEventListener('DOMContentLoaded', function() {
          const form = document.getElementById('createWebsiteForm');
          const alertContainer = document.getElementById('alertContainer');
          const resultContainer = document.getElementById('resultContainer');
          
          form.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            // Show loading state
            showAlert('info', 'Creating website, please wait...');
            
            // Get form data
            const siteName = document.getElementById('siteName').value;
            const folderName = document.getElementById('folderName').value;
            
            try {
              // Send request to create website
              const response = await fetch('/api/create-website', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  siteName,
                  folderName
                })
              });
              
              const data = await response.json();
              
              if (!response.ok) {
                throw new Error(data.error || 'Failed to create website');
              }
              
              // Show success message and results
              showAlert('success', 'Website created successfully!');
              
              // Display results
              document.getElementById('resultSiteId').textContent = data.siteId;
              document.getElementById('resultSiteName').textContent = data.siteName;
              document.getElementById('resultSiteUrl').textContent = data.siteUrl;
              document.getElementById('resultSiteUrl').href = data.siteUrl;
              document.getElementById('resultFolderName').textContent = data.folderName;
              document.getElementById('resultAdminUsername').textContent = data.folderName;
              
              // Show result container
              resultContainer.classList.remove('hidden');
              
              // Hide form
              form.classList.add('hidden');
              
            } catch (error) {
              showAlert('error', error.message);
            }
          });
          
          // Helper function to show alerts
          function showAlert(type, message) {
            // Clear previous alerts
            alertContainer.innerHTML = '';
            
            // Create alert elements
            const alertDiv = document.createElement('div');
            alertDiv.className = 'flex items-center p-4 rounded-md';
            
            const iconDiv = document.createElement('div');
            iconDiv.className = 'flex-shrink-0 mr-3';
            
            const messageDiv = document.createElement('div');
            messageDiv.textContent = message;
            
            // Set styles based on alert type
            switch(type) {
              case 'success':
                alertDiv.classList.add('bg-green-100');
                iconDiv.classList.add('text-green-800');
                messageDiv.classList.add('text-green-800');
                iconDiv.innerHTML = '<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg>';
                break;
              case 'error':
                alertDiv.classList.add('bg-red-100');
                iconDiv.classList.add('text-red-800');
                messageDiv.classList.add('text-red-800');
                iconDiv.innerHTML = '<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path></svg>';
                break;
              case 'info':
              default:
                alertDiv.classList.add('bg-blue-100');
                iconDiv.classList.add('text-blue-800');
                messageDiv.classList.add('text-blue-800');
                iconDiv.innerHTML = '<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zm-1 7a1 1 0 01-1-1v-2a1 1 0 112 0v2a1 1 0 01-1 1z" clip-rule="evenodd"></path></svg>';
            }
            
            // Assemble the alert
            alertDiv.appendChild(iconDiv);
            alertDiv.appendChild(messageDiv);
            alertContainer.appendChild(alertDiv);
            
            // Show the alert
            alertContainer.classList.remove('hidden');
          }
        });
      </script>
    </body>
    </html>
  `;
  
  res.send(formHtml);
});

// API endpoint to create a new website
app.post('/api/create-website', async (req, res) => {
  try {
    const { siteName, folderName } = req.body;
    
    if (!siteName || !folderName) {
      return res.status(400).json({ error: 'Site name and folder name are required' });
    }
    
    console.log(`Attempting to create website: "${siteName}" with folder: "${folderName}"`);
    
    // Check if the website folder already exists in the filesystem
    const templateDir = path.join(__dirname, 'teacher', 'edit-template');
    const newWebsiteDir = path.join(__dirname, 'teacher', folderName);
    
    // Check if template directory exists
    if (!fs.existsSync(templateDir)) {
      console.error('Template directory not found:', templateDir);
      return res.status(500).json({ error: 'Template directory not found' });
    }
    
    // Check if website directory already exists
    if (fs.existsSync(newWebsiteDir)) {
      console.error('Folder already exists:', newWebsiteDir);
      return res.status(400).json({ error: 'A website with this folder name already exists. Please choose a different folder name.' });
    }
    
    // Register the website in the database
    try {
      const result = await registerWebsite(siteName, folderName);
      
      if (!result || !result.siteId) {
        return res.status(500).json({ error: 'Failed to register website in database' });
      }
      
      console.log(`Website registered successfully with ID: ${result.siteId}`);
      
      // Create the website directory
      console.log('Creating website directory:', newWebsiteDir);
      await fs.mkdir(newWebsiteDir, { recursive: true });
      
      // Copy template files to the new website directory
      console.log('Copying template files to new directory...');
      await fs.copy(templateDir, newWebsiteDir);
      
      // Create site-config.js file
      const configPath = path.join(newWebsiteDir, 'site-config.js');
      console.log('Creating site-config.js at:', configPath);
      await fs.writeFile(configPath, result.configContent);
      
      console.log('Website creation completed successfully');
      
      // Return the result
      res.status(201).json({
        siteId: result.siteId,
        siteName: result.siteName,
        siteUrl: result.siteUrl,
        folderName: result.folderName
      });
    } catch (dbError) {
      // If there's a database error, handle specific cases
      if (dbError.message && dbError.message.includes('already exists')) {
        return res.status(409).json({ error: dbError.message });
      }
      
      // Specifically handle folder_name column issue
      if (dbError.message && dbError.message.includes('folder_name')) {
        console.error('Folder name column error:', dbError.message);
        
        // Try to insert into database without the folder_name column
        try {
          console.log('Attempting to create website without folder_name...');
          // Create a modified version of registerWebsite function call with extra option
          const result = await registerWebsite(siteName, folderName, { skipFolderName: true });
          
          if (!result || !result.siteId) {
            return res.status(500).json({ 
              error: 'Database schema issue: The folder_name column is missing, and fallback attempt also failed.'
            });
          }
          
          console.log(`Website registered successfully with ID: ${result.siteId} (without folder_name)`);
          
          // Create the website directory
          console.log('Creating website directory:', newWebsiteDir);
          await fs.mkdir(newWebsiteDir, { recursive: true });
          
          // Copy template files to the new website directory
          console.log('Copying template files to new directory...');
          await fs.copy(templateDir, newWebsiteDir);
          
          // Create site-config.js file
          const configPath = path.join(newWebsiteDir, 'site-config.js');
          console.log('Creating site-config.js at:', configPath);
          await fs.writeFile(configPath, result.configContent);
          
          console.log('Website creation completed successfully (without folder_name)');
          
          // Return the result
          return res.status(201).json({
            siteId: result.siteId,
            siteName: result.siteName,
            siteUrl: result.siteUrl,
            folderName: result.folderName,
            note: "Website created successfully, but folder_name column was missing in database."
          });
        } catch (fallbackError) {
          console.error('Fallback attempt also failed:', fallbackError.message);
          return res.status(500).json({ 
            error: 'Database schema issue: The folder_name column is missing. Please contact the administrator to fix the database schema.',
            technicalDetails: `${dbError.message}. Fallback also failed: ${fallbackError.message}`
          });
        }
      }
      
      // Otherwise, rethrow the error
      throw dbError;
    }
  } catch (error) {
    console.error('Error creating website:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    res.status(500).json({ error: error.message });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log('Access the web interface to create a new website');
}); 