/**
 * Modified Script.js for Ahmed website using the unified_site_data table
 * This demonstrates the changes needed to adapt the existing script to use the unified data structure.
 */

// Import the UnifiedSiteData helper
import UnifiedSiteData from './unified_site_data.js';
import siteConfig from './site-config.js';

// Initialize Supabase (your existing code)
// ... [Supabase initialization code] ...

// Get site ID from site config
const WEBSITE_ID = siteConfig.websiteId || 'ahmed_01';

// Initialize the unified data helper
const unifiedData = new UnifiedSiteData(WEBSITE_ID);

// Global variables (your existing variables)
let isLoggedIn = false;
let siteData = null;
// ... [other globals] ...

// Document ready function remains largely the same
document.addEventListener('DOMContentLoaded', function() {
    console.log('Document ready, initializing site with ID:', WEBSITE_ID);
    
    // Initialize DOM elements (your existing code)
    initDOMElements();
    
    // Check login status (your existing code)
    if (localStorage.getItem('adminLoggedIn') === 'true' || 
        sessionStorage.getItem('adminLoggedIn') === 'true') {
        isLoggedIn = true;
        console.log('User is logged in based on localStorage/sessionStorage');
    }
    
    // Setup admin button (your existing code)
    setupAdminButton();
    
    // Initialize the site with data from unified table
    initializeSite();
});

/**
 * Initialize the site with data from the unified table
 */
async function initializeSite() {
    try {
        console.log('Initializing site with unified data structure');
        
        // Load site data
        const data = await unifiedData.getSiteData();
        
        if (data) {
            console.log('✅ Site data loaded from unified table:', data);
            siteData = data;
            
            // Load additional data if needed
            const experience = await unifiedData.getExperience();
            if (experience) {
                console.log('✅ Experience data loaded:', experience);
                // Optionally merge with site data if your UI expects it
                siteData.experienceData = experience;
            }
            
            const results = await unifiedData.getResults();
            if (results) {
                console.log('✅ Results data loaded:', results);
                // Optionally merge with site data if your UI expects it
                siteData.resultsData = results;
            }
            
            // Update the site with the loaded data
            updateSiteContent(siteData);
        } else {
            console.log('No site data found in unified table, using defaults');
            initializeWithDefaultData();
        }
    } catch (error) {
        console.error('Error initializing site:', error);
        initializeWithDefaultData();
    }
}

// Open admin panel and load data - MODIFIED for unified table
async function openAdminPanel() {
    console.log('Opening admin panel, login status:', isLoggedIn);
    
    // Double-check login status
    if (localStorage.getItem('adminLoggedIn') === 'true' || 
        sessionStorage.getItem('adminLoggedIn') === 'true') {
        isLoggedIn = true;
    }
    
    if (!isLoggedIn) {
        console.warn('Attempt to open admin panel while not logged in');
        showLoginForm();
        return;
    }
    
    try {
        // Show a loading message
        showAdminAlert('success', 'Loading admin panel...');
        
        let dataLoaded = false;
        let dataSource = 'default';
        
        // Try to load from unified table first
        try {
            console.log('Attempting to load data from unified table');
            console.log('Using website ID:', WEBSITE_ID);
            
            // Load site data from unified table
            const data = await unifiedData.getSiteData();
            
            if (data) {
                console.log('✅ Raw data from unified table:', data);
                siteData = data;
                dataLoaded = true;
                dataSource = 'unified-table';
                
                // Also load other related data if needed
                const experience = await unifiedData.getExperience();
                if (experience) {
                    console.log('✅ Experience data loaded:', experience);
                    siteData.experienceData = experience;
                }
                
                console.log('✅ Data loaded for admin panel from unified table successfully');
                showAdminAlert('success', 'Data loaded successfully!');
            } else {
                console.log('No data found in unified table for admin panel');
                showAdminAlert('error', 'No data found in database. Using local storage or default values.');
            }
        } catch (error) {
            console.error('Error in admin data loading from unified table:', error);
            showAdminAlert('error', 'Error loading from database: ' + error.message);
        }
        
        // If unified table failed, try localStorage (your existing fallback)
        if (!dataLoaded) {
            try {
                const localData = localStorage.getItem('siteData');
                if (localData) {
                    console.log('Found data in localStorage');
                    try {
                        siteData = JSON.parse(localData);
                        console.log('✅ Parsed localStorage data:', JSON.stringify(siteData, null, 2));
                        dataLoaded = true;
                        dataSource = 'localStorage';
                        console.log('✅ Data loaded from localStorage successfully');
                        showAdminAlert('success', 'Data loaded successfully from local storage!');
                    } catch (parseError) {
                        console.error('Error parsing localStorage data:', parseError);
                        showAdminAlert('error', `Error parsing local data: ${parseError.message}. Using defaults.`);
                    }
                } else {
                    console.log('No data found in localStorage');
                }
            } catch (localError) {
                console.error('Error accessing localStorage:', localError);
            }
        }
        
        // If neither worked, use default data (your existing code)
        if (!dataLoaded || !siteData) {
            console.log('No data found in any storage, using defaults');
            initializeWithDefaultData();
            dataSource = 'default';
            showAdminAlert('success', 'Using default data as no saved data was found.');
        }
        
        console.log(`FINAL DATA LOAD [source: ${dataSource}]:`, JSON.stringify(siteData, null, 2));
        
        // Check data structure before form population (your existing code)
        if (!siteData) {
            console.error('CRITICAL ERROR: siteData is null or undefined after all attempts to load');
            showAdminAlert('error', 'Failed to load any data. Please refresh and try again.');
            return;
        }
        
        // Continue with your existing admin panel setup code...
        populateAdminForm(siteData);
        showAdminPanel();
        
    } catch (error) {
        console.error('Error opening admin panel:', error);
        showAdminAlert('error', 'Error: ' + error.message);
    }
}

// Save admin changes - MODIFIED for unified table
async function saveAdminChanges() {
    console.log('Save changes function called');
    
    // Show loading state on button (your existing code)
    const saveBtn = document.getElementById('saveChangesBtn');
    if (!saveBtn) {
        console.error('Save button not found in DOM');
        return;
    }
    
    console.log('Save button found:', saveBtn);
    const originalBtnText = saveBtn.innerHTML;
    saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
    saveBtn.disabled = true;

    try {
        // Get current data through unified data helper
        console.log('Fetching current data from unified table...');
        console.log('Using website ID:', WEBSITE_ID);
        
        // Get current site data (falls back to empty object if not found)
        const currentData = await unifiedData.getSiteData() || {};

        console.log('Current data fetched:', currentData);

        // Initialize all input elements (your existing code)
        const nameInput = document.getElementById('admin-name');
        const titleInput = document.getElementById('admin-title');
        // ... other input elements ...

        // Prepare new data object (your existing code)
        const newData = {
            ...(currentData || {}),
            personalInfo: {
                name: nameInput?.value || currentData?.personalInfo?.name || '',
                title: titleInput?.value || currentData?.personalInfo?.title || '',
                // ... other personal info fields ...
            },
            // ... other data sections ...
        };

        console.log('Saving data:', JSON.stringify(newData, null, 2));
        
        // Update our global state
        siteData = newData;
        
        // Save to unified table
        let unifiedSaveSuccess = false;
        try {
            unifiedSaveSuccess = await unifiedData.saveSiteData(newData);
            
            if (unifiedSaveSuccess) {
                console.log('✅ Data saved to unified table successfully');
                showAdminAlert('success', 'Changes saved successfully!');
                
                // Also save other categories if needed
                if (newData.experience) {
                    const experienceSaveSuccess = await unifiedData.saveData('experience', newData.experience);
                    console.log('Experience data save result:', experienceSaveSuccess);
                }
                
                if (newData.results) {
                    const resultsSaveSuccess = await unifiedData.saveData('results', newData.results);
                    console.log('Results data save result:', resultsSaveSuccess);
                }
            } else {
                console.error('Failed to save to unified table');
                throw new Error('Failed to save to unified table');
            }
        } catch (unifiedError) {
            console.error('Error saving to unified table:', unifiedError);
            unifiedSaveSuccess = false;
        }

        // If unified table save failed, try localStorage (your existing fallback)
        if (!unifiedSaveSuccess) {
            try {
                localStorage.setItem('siteData', JSON.stringify(newData));
                console.log('✅ Data saved to localStorage as fallback');
                showAdminAlert('success', 'Data saved to local storage successfully');
            } catch (localError) {
                console.error('Failed to save to localStorage:', localError);
                showAdminAlert('error', 'Failed to save data to any storage location');
            }
        }

        // Update the site content with the new data (your existing code)
        updateSiteContent(newData);
        
        // Force update the results chart if it exists (your existing code)
        if (window.resultsChart) {
            updateResultsChart(newData.results);
        }
    } catch (error) {
        console.error('Error saving changes:', error);
        showAdminAlert('error', `Failed to save changes: ${error.message}`);
    } finally {
        // Restore button state (your existing code)
        saveBtn.innerHTML = originalBtnText;
        saveBtn.disabled = false;
    }
}

// The rest of your existing functions can remain largely unchanged
// They will work with the data structure you load from the unified table

// For example, your showLoginForm, handleAdminLogin, etc. would all work the same way
// because they operate on the UI, not directly on the database 