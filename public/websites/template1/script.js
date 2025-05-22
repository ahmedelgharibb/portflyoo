// script.js

// Preloader
// window.addEventListener('load', () => {
//     const preloader = document.querySelector('.preloader');
//     if (preloader) {
//         preloader.classList.add('fade-out');
//         setTimeout(() => {
//             preloader.style.display = 'none';
//         }, 600);
//     }
// });

// DOM Elements - using let for all variables so they can be reassigned in DOMContentLoaded
let menuBtn;
let closeMenuBtn;
let mobileMenu;
let mobileMenuLinks;
let body;
let adminBtn;
let adminBtnMobile;
let adminLoginModal;
let adminLoginForm;
let cancelLoginBtn;
let exitLoginBtn;
let adminPanel;
let closeAdminPanelBtn;
let saveChangesBtn;
let addResultBtn;
let adminResultsContainer;
let adminAlert;

// Global state
let siteData = null;
let isLoggedIn = false;
let currentTheme = { color: 'blue', mode: 'light' };
let isAdminLoggedIn = false;
let websiteData = {}; // Object to store website data including images

// Supabase setup
const SUPABASE_URL = 'https://bqpchhitrbyfleqpyydz.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJxcGNoaGl0cmJ5ZmxlcXB5eWR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM0NTU4ODgsImV4cCI6MjA1OTAzMTg4OH0.Yworu_EPLewJJGBFnW5W7GUsNZIONc3qOEJMTwJMzzQ';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Helper to load site_id from site.config.json
async function getCurrentSiteId() {
    try {
        const response = await fetch('site.config.json');
        if (!response.ok) throw new Error('Failed to load site.config.json');
        const config = await response.json();
        if (config.site_id && Number.isInteger(config.site_id)) {
            return config.site_id;
        } else {
            console.error('site_id missing or invalid in site.config.json, defaulting to 1');
            return 1;
        }
    } catch (err) {
        console.error('Error loading site.config.json:', err);
        return 1;
    }
}

// Once the document is ready
document.addEventListener('DOMContentLoaded', async function() {
    console.log('Document ready, initializing...');
    
    // Initialize DOM elements
    initDOMElements();
    
    // Check if user is logged in (using sessionStorage for session-only login)
    isLoggedIn = sessionStorage.getItem('adminLoggedIn') === 'true';
    console.log('Login status:', isLoggedIn ? 'Logged in' : 'Not logged in');
    
    // Set up the admin button functionality based on login status
    if (adminBtn) {
        console.log('Setting up admin button click handler');
        if (isLoggedIn) {
            adminBtn.innerHTML = '<i class="fas fa-lock"></i>';
            adminBtn.addEventListener('click', function(e) {
                console.log('Admin button clicked (logged in) - opening panel');
                e.preventDefault();
                openAdminPanel();
            });
        } else {
            adminBtn.textContent = 'Admin Login';
            adminBtn.addEventListener('click', function(e) {
                console.log('Admin button clicked (not logged in) - showing login form');
                e.preventDefault();
                showLoginForm();
            });
        }
    } else {
        console.warn('Admin button not found in the DOM');
    }
    
    // Mobile admin button functionality
    if (adminBtnMobile) {
        console.log('Setting up mobile admin button click handler');
        if (isLoggedIn) {
            adminBtnMobile.addEventListener('click', function(e) {
                console.log('Mobile admin button clicked (logged in) - opening panel');
                e.preventDefault();
                closeMenu();
                openAdminPanel();
            });
        } else {
            adminBtnMobile.addEventListener('click', function(e) {
                console.log('Mobile admin button clicked (not logged in) - showing login form');
                e.preventDefault();
                closeMenu();
                showLoginForm();
            });
        }
    } else {
        console.warn('Mobile admin button not found in the DOM');
    }
    
    // Set up admin login form event listener
    if (adminLoginForm) {
        console.log('Setting up admin login form submit handler');
        adminLoginForm.addEventListener('submit', handleAdminLogin);
    }
    
    // Set up cancel login button
    if (cancelLoginBtn) {
        console.log('Setting up cancel login button click handler');
        cancelLoginBtn.addEventListener('click', hideAdminLogin);
    }
    
    // Set up exit login button
    if (exitLoginBtn) {
        console.log('Setting up exit login button click handler');
        exitLoginBtn.addEventListener('click', hideAdminLogin);
    }
    
    // Set up close admin panel button
    if (closeAdminPanelBtn) {
        console.log('Setting up close admin panel button click handler');
        closeAdminPanelBtn.addEventListener('click', closeAdminPanel);
    }
    
    // Initialize Supabase client
    try {
        // Get the current site id from config
        const currentSiteId = await getCurrentSiteId();
        console.log('Fetching data for id:', currentSiteId);
        // Try to load from Supabase
        try {
            const { data, error } = await supabase
                .from('teachers_websites')
                .select('data')
                .eq('id', currentSiteId)
                .single();
            
            if (error) {
                console.error('Error loading initial data from Supabase:', error);
                // Data doesn't exist or there was an error, just show an error and do not restore default data
                alert('Error loading data from database. Please check your connection or contact support.');
            } else if (data && data.data) {
                siteData = data.data;
                console.log('✅ Initial data loaded from Supabase successfully');
                updateSiteContent(siteData);
            } else {
                console.log('No initial data found in Supabase');
                alert('No data found in the database. Please set up your site data.');
            }
        } catch (error) {
            console.error('Error during initialization:', error);
            alert('Error during initialization. Please check your connection or contact support.');
        }
    } catch (error) {
        console.error('Error during initialization:', error);
        alert('Critical error during initialization.');
    }
    
    // Apply the saved theme
    loadSavedTheme();
    
    // Setup admin panel event listeners if present and user is logged in
    if (isLoggedIn) {
        if (closeAdminPanelBtn) closeAdminPanelBtn.addEventListener('click', closeAdminPanel);
        if (saveChangesBtn) saveChangesBtn.addEventListener('click', saveAdminChanges);
        
        // Add result button
        if (addResultBtn) addResultBtn.addEventListener('click', addNewResult);
        
        // Logout button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            // Remove previous event listeners by cloning
            const newLogoutBtn = logoutBtn.cloneNode(true);
            logoutBtn.parentNode.replaceChild(newLogoutBtn, logoutBtn);
            newLogoutBtn.addEventListener('click', adminLogout);
        }
    }
    
    // Set up danger zone functionality
    setupDangerZone();
    
    // Setup theme toggle functionality (placeholder for future dark mode implementation)
    setupThemeToggle();
    
    // Image Upload Functionality
    const heroImageInput = document.getElementById('heroImageInput');
    const aboutImageInput = document.getElementById('aboutImageInput');
    const heroUploadBtn = document.getElementById('heroUploadBtn');
    const aboutUploadBtn = document.getElementById('aboutUploadBtn');
    const heroPreview = document.getElementById('heroPreview');
    const aboutPreview = document.getElementById('aboutPreview');
    const removeHeroBtn = document.getElementById('removeHeroBtn');
    const removeAboutBtn = document.getElementById('removeAboutBtn');
    const heroDropZone = document.getElementById('heroDropZone');
    const aboutDropZone = document.getElementById('aboutDropZone');
    
    // Initialize image upload functionality
    async function initializeImageUpload() {
        try {
            const { data, error } = await supabase
                .from('teachers_websites')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(1);

            if (error) throw error;

            if (data && data.length > 0) {
                const websiteData = data[0].data;
                
                // Handle hero image
                if (websiteData.heroImage) {
                    const heroImg = heroPreview.querySelector('img');
                    heroImg.src = websiteData.heroImage;
                    heroPreview.classList.remove('hidden');
                }

                // Handle about image
                if (websiteData.aboutImage) {
                    const aboutImg = aboutPreview.querySelector('img');
                    aboutImg.src = websiteData.aboutImage;
                    aboutPreview.classList.remove('hidden');
                }
            }
        } catch (error) {
            console.error('Error initializing image upload:', error);
        }
    }
    
    // Setup drag and drop functionality
    function setupDragAndDrop(dropZone, fileInput, type) {
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, preventDefaults, false);
        });

        function preventDefaults(e) {
            e.preventDefault();
            e.stopPropagation();
        }

        ['dragenter', 'dragover'].forEach(eventName => {
            dropZone.addEventListener(eventName, highlight, false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, unhighlight, false);
        });

        function highlight(e) {
            dropZone.classList.add('border-blue-500', 'dark:border-blue-400');
        }

        function unhighlight(e) {
            dropZone.classList.remove('border-blue-500', 'dark:border-blue-400');
        }

        dropZone.addEventListener('drop', handleDrop, false);

        function handleDrop(e) {
            const dt = e.dataTransfer;
            const files = dt.files;
            if (files.length > 0) {
                handleImageUpload(files[0], type);
            }
        }
    }
    
    // Handle image upload
    async function handleImageUpload(file, type) {
        try {
            if (!file || !file.type.startsWith('image/')) {
                showAdminAlert('error', 'Please upload an image file');
                return;
            }

            // Show spinner for the appropriate upload type
            const spinner = document.getElementById(`${type}UploadSpinner`);
            if (spinner) spinner.classList.remove('hidden');
            
            // First update the preview
            const previewElement = document.getElementById(`${type}Preview`);
            const previewImg = previewElement.querySelector('img');
            
            // Show preview
            const reader = new FileReader();
            reader.onload = (e) => {
                previewImg.src = e.target.result;
                previewElement.classList.remove('hidden');
            };
            reader.readAsDataURL(file);
            
            // Get the file extension
            const extension = file.name.split('.').pop().toLowerCase();
            // Create a unique filename
            const timestamp = new Date().getTime();
            const filename = `${type}-image-${timestamp}.${extension}`;
            
            try {
                // Upload to Supabase Storage
                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('website-images')
                    .upload(filename, file);
                
                if (uploadError) {
                    console.error('Upload error:', uploadError);
                    if (uploadError.message.includes('bucket')) {
                        showAdminAlert('error', 'Storage bucket not found. Please ensure your Supabase project is set up correctly with a "website-images" bucket.');
                        return;
                    }
                    throw uploadError;
                }
                
                // Get the public URL
                const { data: { publicUrl } } = supabase.storage
                    .from('website-images')
                    .getPublicUrl(filename);
                
                // Update the website data object
                if (type === 'hero') {
                    websiteData.heroImage = publicUrl;
                } else if (type === 'about') {
                    websiteData.aboutImage = publicUrl;
                }
                
                // Save to database
                await saveWebsiteData();
                
                showAdminAlert('success', `${type.charAt(0).toUpperCase() + type.slice(1)} image uploaded successfully!`);
            } catch (error) {
                throw error;
            } finally {
                // Hide spinner regardless of success or failure
                if (spinner) spinner.classList.add('hidden');
            }
        } catch (error) {
            console.error('Error uploading image:', error);
            showAdminAlert('error', error.message || 'Failed to upload image. Please try again.');
            
            // Hide spinner on error
            const spinner = document.getElementById(`${type}UploadSpinner`);
            if (spinner) spinner.classList.add('hidden');
        }
    }
    
    // Handle image removal
    async function handleImageRemove(type) {
        try {
            // Get current data
            const { data: currentData, error: fetchError } = await supabase
                .from('teachers_websites')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(1);

            if (fetchError) throw fetchError;

            let websiteData = currentData && currentData.length > 0 ? currentData[0].data : {};
            
            // Delete image from storage if exists
            if (websiteData[`${type}Image`]) {
                const filename = websiteData[`${type}Image`].split('/').pop();
                await supabase.storage
                    .from('website-images')
                    .remove([filename]);
            }

            // Remove image URL from data
            delete websiteData[`${type}Image`];

            // Update the database
            const { error: updateError } = await supabase
                .from('teachers_websites')
                .upsert([{ data: websiteData }]);

            if (updateError) throw updateError;

            // Hide preview
            if (type === 'hero') {
                heroPreview.classList.add('hidden');
            } else {
                aboutPreview.classList.add('hidden');
            }

            showAdminAlert('success', `${type.charAt(0).toUpperCase() + type.slice(1)} image removed successfully`);
            
            // Update the website content
            updateSiteContent(websiteData);
        } catch (error) {
            console.error('Error removing image:', error);
            showAdminAlert('error', error.message || 'Failed to remove image. Please try again.');
        }
    }
    
    // Event Listeners
    heroUploadBtn.addEventListener('click', () => heroImageInput.click());
    aboutUploadBtn.addEventListener('click', () => aboutImageInput.click());
    
    heroImageInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            // Show preview before upload
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onload = function(e) {
                heroPreview.querySelector('img').src = e.target.result;
                heroPreview.classList.remove('hidden');
            }
            reader.readAsDataURL(file);
            // Then upload
            handleImageUpload(file, 'hero');
        }
    });
    
    aboutImageInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            // Show preview before upload
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onload = function(e) {
                aboutPreview.querySelector('img').src = e.target.result;
                aboutPreview.classList.remove('hidden');
            }
            reader.readAsDataURL(file);
            // Then upload
            handleImageUpload(file, 'about');
        }
    });
    
    removeHeroBtn.addEventListener('click', () => handleImageRemove('hero'));
    removeAboutBtn.addEventListener('click', () => handleImageRemove('about'));
    
    // Setup drag and drop
    setupDragAndDrop(heroDropZone, heroImageInput, 'hero');
    setupDragAndDrop(aboutDropZone, aboutImageInput, 'about');
    
    // Initialize image upload when admin panel is loaded
    document.addEventListener('DOMContentLoaded', async () => {
        if (document.getElementById('adminPanel')) {
            try {
                const { data: currentData, error: fetchError } = await supabase
                    .from('teachers_websites')
                    .select('*')
                    .order('created_at', { ascending: false })
                    .limit(1);

                if (fetchError) throw fetchError;

                if (currentData && currentData.length > 0) {
                    const websiteData = currentData[0].data;
                    
                    // Initialize hero image
                    if (websiteData.heroImage) {
                        const heroImg = heroPreview.querySelector('img');
                        heroImg.src = websiteData.heroImage;
                        heroPreview.classList.remove('hidden');
                    }

                    // Initialize about image
                    if (websiteData.aboutImage) {
                        const aboutImg = aboutPreview.querySelector('img');
                        aboutImg.src = websiteData.aboutImage;
                        aboutPreview.classList.remove('hidden');
                    }
                }
            } catch (error) {
                console.error('Error initializing images:', error);
            }
        }
    });
});

// Function to restore data to Supabase when it's missing
async function restoreDataToSupabase() {
    console.log('Restoring default data to Supabase');
    
    // First initialize with default data for the site
    initializeWithDefaultData();
    
    // Log what we're about to save
    console.log('About to save this data to Supabase:', JSON.stringify(siteData, null, 2));
    
    // Then save this data to Supabase with proper error handling
    try {
        // Use upsert with onConflict to handle existing records
        const { data, error } = await supabase
            .from('teachers_websites')
            .upsert({ 
                id: 1, 
                data: siteData 
            }, { 
                onConflict: 'id',
                returning: 'minimal'
            });
        
        if (error) {
            console.error('Supabase upsert error:', error);
            throw new Error(`Supabase error: ${error.message}`);
        }
        
        // Verify the data was saved by fetching it back
        const { data: verifyData, error: verifyError } = await supabase
            .from('teachers_websites')
            .select('data')
            .eq('id', 1)
            .single();
            
        if (verifyError) {
            console.error('Failed to verify data was saved:', verifyError);
            throw new Error(`Verification error: ${verifyError.message}`);
        }
        
        if (!verifyData || !verifyData.data) {
            console.error('Data verification failed: No data found after save');
            throw new Error('Data verification failed: No data found after save');
        }
        
        console.log('✅ Data verification successful:', verifyData);
        console.log('✅ Data successfully restored to Supabase!');
        alert('Data has been restored to the database successfully!');
    } catch (restoreError) {
        console.error('Exception during data restoration:', restoreError);
        alert('Error restoring data to Supabase: ' + restoreError.message);
        
        // Fall back to localStorage only
        try {
            localStorage.setItem('siteData', JSON.stringify(siteData));
            console.log('✅ Fallback: Data saved to localStorage successfully');
            alert('Data has been saved to local storage as a fallback.');
        } catch (localError) {
            console.error('Failed to save to localStorage as fallback:', localError);
            alert('Warning: Could not save data to any storage location. Your changes may be lost.');
        }
    }
}

// Initialize with default data
function initializeWithDefaultData() {
    console.log('Using default data');
    
    // Create a consistent data structure
    siteData = {
        personal: {
            name: 'Dr. Ahmed Mahmoud',
            title: 'Mathematics Educator',
            qualifications: [
                'Ph.D. in Mathematics Education',
                'Master\'s in Applied Mathematics',
                'Bachelor\'s in Mathematics'
            ],
            experience: '15+ years of teaching experience'
        },
        experience: {
            schools: [
                'International School of Mathematics',
                'Elite Academy',
                'Science High School'
            ],
            centers: [
                'Math Excellence Center',
                'Advanced Learning Institute',
                'STEM Education Hub'
            ],
            platforms: [
                'Khan Academy',
                'Coursera - Mathematics for Machine Learning',
                'Udemy - Advanced Calculus',
                'edX - Linear Algebra',
                'YouTube Math Channel'
            ]
        },
        // FIXED: Use correct structure for results
        results: [
            { subject: 'Mathematics', astar: 10, a: 15, other: 5 },
            { subject: 'Physics', astar: 8, a: 12, other: 7 },
            { subject: 'Chemistry', astar: 6, a: 10, other: 9 },
            { subject: 'Biology', astar: 5, a: 8, other: 12 }
        ],
        contact: {
            email: 'ahmed.mahmoud@mathseducator.com',
            formUrl: 'https://forms.google.com/your-form-link',
            assistantFormUrl: 'https://forms.google.com/assistant-form-link',
            phone: '+1 123-456-7890',
            contactMessage: 'Thank you for your interest in my teaching services. I will get back to you as soon as possible.'
        },
        theme: {
            color: 'blue',
            mode: 'light'
        }
    };
    
    console.log('Default data initialized:', JSON.stringify(siteData, null, 2));
    
    // Apply default data to the page
    updateSiteContent(siteData);
    
    // Save default data to localStorage for future use
    try {
        localStorage.setItem('siteData', JSON.stringify(siteData));
        console.log('Default data saved to localStorage');
    } catch (error) {
        console.error('Failed to save default data to localStorage:', error);
    }
}

// Mobile Menu Functionality
function toggleMenu() {
  console.log('Toggling menu...');
  const mobileMenu = document.getElementById('mobileMenu');
  const mobileMenuBackdrop = document.getElementById('mobileMenuBackdrop');
  const menuBtn = document.getElementById('menuBtn');
  const body = document.body;
  
  if (!mobileMenu) {
    console.error('Mobile menu element not found!');
    return;
  }
  
  console.log('Menu current state:', mobileMenu.classList.contains('active') ? 'open' : 'closed');
  
  // Toggle active class for the mobile menu and backdrop
  mobileMenu.classList.toggle('active');
  
  // Toggle the hamburger icon animation
  if (menuBtn) {
    menuBtn.classList.toggle('open');
  } else {
    console.warn('Menu button not found when toggling menu');
  }
  
  // Toggle the backdrop
  if (mobileMenuBackdrop) {
    mobileMenuBackdrop.classList.toggle('active');
  } else {
    console.warn('Menu backdrop not found when toggling menu');
  }
  
  // Prevent body scrolling when menu is open
  if (mobileMenu.classList.contains('active')) {
    body.classList.add('menu-open');
  } else {
    body.classList.remove('menu-open');
  }
  
  console.log('Menu new state:', mobileMenu.classList.contains('active') ? 'open' : 'closed');
}

function closeMenu() {
  console.log('Closing menu...');
  const mobileMenu = document.getElementById('mobileMenu');
  const mobileMenuBackdrop = document.getElementById('mobileMenuBackdrop');
  const menuBtn = document.getElementById('menuBtn');
  const body = document.body;
  
  if (!mobileMenu) {
    console.error('Mobile menu element not found!');
    return;
  }
  
  // Remove active class from the mobile menu
  mobileMenu.classList.remove('active');
  
  // Remove open class from menu button
  if (menuBtn) {
    menuBtn.classList.remove('open');
  }
  
  // Hide the backdrop
  if (mobileMenuBackdrop) {
    mobileMenuBackdrop.classList.remove('active');
  }
  
  // Re-enable body scrolling
  body.classList.remove('menu-open');
  
  console.log('Menu closed');
}

// Make sure event listeners are properly attached
document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM fully loaded, setting up menu event listeners');
  
  // Menu button event listener
  const menuBtn = document.getElementById('menuBtn');
  if (menuBtn) {
    console.log('Menu button found, attaching click event');
    menuBtn.addEventListener('click', function(e) {
      console.log('Menu button clicked');
      toggleMenu();
    });
  } else {
    console.error('Menu button not found on page load');
  }
  
  // Close menu button event listener
  const closeMenuBtn = document.getElementById('closeMenuBtn');
  if (closeMenuBtn) {
    console.log('Close menu button found, attaching click event');
    closeMenuBtn.addEventListener('click', closeMenu);
  }
  
  // Backdrop click to close menu
  const mobileMenuBackdrop = document.getElementById('mobileMenuBackdrop');
  if (mobileMenuBackdrop) {
    console.log('Mobile menu backdrop found, attaching click event');
    mobileMenuBackdrop.addEventListener('click', closeMenu);
  }
  
  // Setup mobile menu links to close menu when clicked
  const mobileMenuLinks = document.querySelectorAll('.mobile-nav-link');
  if (mobileMenuLinks && mobileMenuLinks.length > 0) {
    console.log(`Setting up ${mobileMenuLinks.length} mobile menu link click handlers`);
    mobileMenuLinks.forEach(link => {
      link.addEventListener('click', closeMenu);
    });
  }
});

// Initialize DOM Elements function
function initDOMElements() {
    console.log('Initializing DOM elements');
    
    // Mobile Menu Elements
    menuBtn = document.getElementById('menuBtn');
    closeMenuBtn = document.getElementById('closeMenuBtn');
    mobileMenu = document.getElementById('mobileMenu');
    mobileMenuBackdrop = document.getElementById('mobileMenuBackdrop');
    mobileMenuLinks = document.querySelectorAll('.mobile-nav-link');
    body = document.body;
    
    // Set up mobile menu event listeners
    if (menuBtn) {
        console.log('Setting up menu button click handler');
        menuBtn.addEventListener('click', toggleMenu);
    }
    
    if (closeMenuBtn) {
        console.log('Setting up close menu button click handler');
        closeMenuBtn.addEventListener('click', closeMenu);
    }
    
    if (mobileMenuBackdrop) {
        console.log('Setting up menu backdrop click handler');
        mobileMenuBackdrop.addEventListener('click', closeMenu);
    }
    
    // Close menu when clicking on mobile menu links
    if (mobileMenuLinks && mobileMenuLinks.length > 0) {
        console.log(`Setting up ${mobileMenuLinks.length} mobile link click handlers`);
        mobileMenuLinks.forEach(link => {
            link.addEventListener('click', closeMenu);
        });
    }
    
    // Other DOM elements initialization can go here
    // ...
}

// Close menu when clicking outside
document.addEventListener('click', (e) => {
    if (mobileMenu && menuBtn && 
        mobileMenu.classList.contains('active') && 
        !mobileMenu.contains(e.target) && 
        !menuBtn.contains(e.target)) {
        closeMenu();
    }
});

// Close menu when clicking on mobile menu links
if (mobileMenuLinks && mobileMenuLinks.length > 0) {
mobileMenuLinks.forEach(link => {
    link.addEventListener('click', closeMenu);
});
}

// Prevent touchmove when menu is open
document.addEventListener('touchmove', (e) => {
    if (document.body.classList.contains('menu-open')) {
        e.preventDefault();
    }
}, { passive: false });

// Smooth Scroll for Navigation Links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const targetId = this.getAttribute('href');
        if (targetId === '#') return;
        
        const target = document.querySelector(targetId);
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Navbar Scroll Effect
window.addEventListener('scroll', () => {
    const header = document.querySelector('header');
    if (header) {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
            header.style.backgroundColor = 'var(--nav-bg)';
            header.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.3)';
        } else {
            header.classList.remove('scrolled');
            header.style.backgroundColor = 'var(--nav-bg)';
            header.style.boxShadow = '0 1px 5px rgba(0, 0, 0, 0.2)';
        }
    }
});

// Set active nav link based on scroll position
window.addEventListener('scroll', () => {
    // Get current scroll position
    const scrollPosition = window.scrollY + 100;
    
    // Get all sections
    const sections = document.querySelectorAll('section[id]');
    
    // Loop through sections to find the one in view
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.offsetHeight;
        const sectionId = section.getAttribute('id');
        
        if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
            // Remove active class from all links
            document.querySelectorAll('.nav-link, .mobile-nav-link').forEach(link => {
                link.classList.remove('active');
            });
            
            // Add active class to current section links
            document.querySelectorAll(`.nav-link[href="#${sectionId}"], .mobile-nav-link[href="#${sectionId}"]`).forEach(link => {
                link.classList.add('active');
            });
        }
    });
});

// Smooth Scroll with active state handling
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const targetId = this.getAttribute('href');
        if (targetId === '#') return;
        
        // Remove active from all links
        document.querySelectorAll('.nav-link, .mobile-nav-link').forEach(link => {
            link.classList.remove('active');
        });
        
        // Add active class to clicked link
        this.classList.add('active');
        
        const target = document.querySelector(targetId);
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Add hover animation to nav items
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('mouseenter', () => {
        link.style.transition = 'all 0.3s ease';
    });
    
    link.addEventListener('mouseleave', () => {
        link.style.transition = 'all 0.3s ease';
    });
});

// Add touch ripple effect for mobile nav
document.querySelectorAll('.mobile-nav-link').forEach(link => {
    link.addEventListener('touchstart', function(e) {
        const rect = this.getBoundingClientRect();
        const x = e.touches[0].clientX - rect.left;
        const y = e.touches[0].clientY - rect.top;
        
        const ripple = document.createElement('span');
        ripple.className = 'touch-ripple';
        ripple.style.left = `${x}px`;
        ripple.style.top = `${y}px`;
        
        this.appendChild(ripple);
        
        setTimeout(() => {
            ripple.remove();
        }, 600);
    });
});

// Hero Section Typing Effect
const heroText = document.querySelector('.hero h1');
let index = 0;

function typeWriter() {
    if (!heroText) return;
    
    const playerName = window.playerConfig?.personalInfo?.name || '';
    const text = playerName ? `Welcome ${playerName}` : 'Welcome';
    
    if (index < text.length) {
        heroText.innerHTML = text.substring(0, index + 1);
        index++;
        setTimeout(typeWriter, 100);
    }
}

// Load config and start typing
async function loadConfig() {
    // Define this function if it doesn't exist
    // For now, just return a promise that resolves immediately
    return Promise.resolve();
}

// Don't start typing until config is loaded
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await loadConfig();
        typeWriter();
    } catch (error) {
        console.error('Error loading config:', error);
        if (heroText) {
            heroText.innerHTML = 'Welcome';
        }
    }
});

// Stats Counter Animation
const statCards = document.querySelectorAll('.stat-card');
const statsSection = document.querySelector('.stats-section');

if (statsSection && statCards.length > 0) {
    const options = {
        threshold: 0.5
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                statCards.forEach(card => {
                    const value = card.querySelector('.stat-value');
                    if (!value) return;
                    
                    const targetVal = value.textContent;
                    if (!targetVal) return;
                    
                    const target = parseInt(targetVal);
                    if (isNaN(target)) return;
                    
                    let count = 0;
                    const duration = 2000; // 2 seconds
                    const increment = target / (duration / 16);

                    const updateCount = () => {
                        if (count < target) {
                            count += increment;
                            value.textContent = Math.ceil(count) + '+';
                        } else {
                            value.textContent = target + '+';
                        }
                    };

                    const countInterval = setInterval(() => {
                        if (count < target) {
                            updateCount();
                        } else {
                            clearInterval(countInterval);
                        }
                    }, 16);
                });
                observer.unobserve(statsSection);
            }
        });
    }, options);

    observer.observe(statsSection);
}

// Gallery Hover Effect
const galleryItems = document.querySelectorAll('.gallery-item');

galleryItems.forEach(item => {
    const overlay = item.querySelector('.gallery-overlay');
    if (!overlay) return;
    
    item.addEventListener('mouseenter', () => {
        overlay.style.opacity = '1';
    });

    item.addEventListener('mouseleave', () => {
        overlay.style.opacity = '0';
    });
});

// Testimonial Slider
const testimonialItems = document.querySelectorAll('.testimonial-item');
if (testimonialItems.length > 0) {
    let currentTestimonial = 0;

    function showTestimonial(index) {
        testimonialItems.forEach((item, i) => {
            item.style.display = i === index ? 'block' : 'none';
        });
    }

    function nextTestimonial() {
        currentTestimonial = (currentTestimonial + 1) % testimonialItems.length;
        showTestimonial(currentTestimonial);
    }

    // Initial display
    showTestimonial(currentTestimonial);
    
    setInterval(nextTestimonial, 5000); // Change testimonial every 5 seconds
}

// Contact Form Handling
const contactForm = document.getElementById('contactForm');

if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(contactForm);
        const data = Object.fromEntries(formData);
        
        try {
            // Replace with your actual form submission endpoint
            const response = await fetch('https://api.example.com/contact', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });
            
            if (response.ok) {
                alert('Message sent successfully!');
                contactForm.reset();
            } else {
                throw new Error('Failed to send message');
            }
        } catch (error) {
            alert('Error sending message. Please try again later.');
            console.error('Form submission error:', error);
        }
    });
}

// Scroll Reveal Animation
const revealElements = document.querySelectorAll('.reveal');

if (revealElements.length > 0) {
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
            }
        });
    }, {
        threshold: 0.1
    });

    revealElements.forEach(element => {
        revealObserver.observe(element);
    });
}

// Results Chart
const chartCanvas = document.getElementById('resultsChart');

// Remove the chart initialization here since we're handling it through updateResultsChart
// This prevents conflicts with our chart management

// Add hover animations to cards
document.querySelectorAll('.bg-white.rounded-lg').forEach(card => {
    card.addEventListener('mouseenter', () => {
        card.classList.add('transform', 'scale-105', 'transition-all', 'duration-300');
    });
    
    card.addEventListener('mouseleave', () => {
        card.classList.remove('transform', 'scale-105', 'transition-all', 'duration-300');
    });
});

// Add smooth reveal animation to sections
document.querySelectorAll('section').forEach(section => {
    section.classList.add('opacity-0', 'transform', 'translate-y-10', 'transition-all', 'duration-700');
});

function revealSection() {
    document.querySelectorAll('section').forEach(section => {
        const sectionTop = section.getBoundingClientRect().top;
        const windowHeight = window.innerHeight;
        
        if (sectionTop < windowHeight * 0.75) {
            section.classList.remove('opacity-0', 'translate-y-10');
        }
    });
}

window.addEventListener('scroll', revealSection);
revealSection(); // Initial check

function updateFooter() {
    console.log('Updating footer');
    const footerBottom = document.querySelector('.footer-bottom p');
    if (!footerBottom) {
        console.warn('Footer bottom element not found');
        return;
    }
    
    // Get current year
    const year = new Date().getFullYear();
    
    // Get name from local storage if available
    let name = 'Dr. Ahmed Mahmoud';
    try {
        const storedData = localStorage.getItem('siteData');
        if (storedData) {
            const data = JSON.parse(storedData);
            if (data.personalInfo && data.personalInfo.name) {
                name = data.personalInfo.name;
            }
        }
    } catch (error) {
        console.error('Error loading name for footer:', error);
    }
    
    footerBottom.innerHTML = `&copy; ${year} <span>${name}</span>. All rights reserved.`;
}

// Setup danger zone functionality
function setupDangerZone() {
    const dangerZone = document.getElementById('dangerZone');
    const toggleDangerBtn = document.getElementById('toggleDangerBtn');
    
    // Only set up these listeners if user is logged in
    if (!isLoggedIn) return;
    
    // Set up hide danger zone listener
    if (toggleDangerBtn) {
        toggleDangerBtn.addEventListener('click', toggleDangerZone);
    }
    
    // Set up admin panel event listeners
    document.addEventListener('adminPanelClosed', function() {
        if (dangerZone) dangerZone.classList.add('hidden');
    });
}

// Toggle danger zone visibility
function toggleDangerZone() {
    console.log('Toggle danger zone called');
    const dangerZone = document.getElementById('dangerZone');
    
    if (dangerZone) {
        if (dangerZone.classList.contains('hidden')) {
            dangerZone.classList.remove('hidden');
        } else {
            dangerZone.classList.add('hidden');
        }
    }
}

// Show admin login modal
function showLoginForm() {
    console.log('showLoginForm called');
    
    if (isLoggedIn) {
        // If already logged in, just open the admin panel
        console.log('User already logged in, opening admin panel instead');
        openAdminPanel();
        return;
    }
    
    const adminLoginModal = document.getElementById('adminLoginModal');
    if (adminLoginModal) {
        console.log('Showing admin login modal');
        adminLoginModal.classList.remove('hidden');
        const passwordInput = document.getElementById('adminPassword');
        if (passwordInput) {
            passwordInput.value = ''; // Clear any previous input
            passwordInput.focus();
        } else {
            console.error('Password input not found in login modal');
        }
    } else {
        console.error('Admin login modal not found in the DOM');
        alert('Error: Login form not found. Please refresh the page and try again.');
    }
}

// Hide admin login modal
function hideAdminLogin() {
    console.log('hideAdminLogin called');
    
    const adminLoginModal = document.getElementById('adminLoginModal');
    if (adminLoginModal) {
        console.log('Hiding admin login modal');
        adminLoginModal.classList.add('hidden');
        
        // Reset the form if it exists
        const adminLoginForm = document.getElementById('adminLoginForm');
        if (adminLoginForm) {
            adminLoginForm.reset();
        } else {
            console.warn('Admin login form not found when hiding modal');
        }
    } else {
        console.error('Admin login modal not found when trying to hide it');
    }
}

// Handle admin login
function handleAdminLogin(e) {
    e.preventDefault(); // Prevent form submission
    console.log('Admin login attempt');
    
    const passwordInput = document.getElementById('adminPassword');
    if (!passwordInput) {
        console.error('Password input not found');
        return;
    }
    
    const loginBtn = document.querySelector('#adminLoginForm button[type="submit"]');
    if (loginBtn) {
        loginBtn.disabled = true;
        loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Logging in...';
    }
    
    const password = passwordInput.value.trim();
    
    // Check if password is empty
    if (!password) {
        console.log('No password entered');
        showAdminAlert('error', 'Please enter a password', true);
        
        // Reset button
        if (loginBtn) {
            loginBtn.disabled = false;
            loginBtn.innerHTML = 'Login';
        }
        return;
    }
    
    // Direct password check for demo purposes - we do this immediately
    // In production, this should be a secure authentication process
    if (password === 'admin123') {
        console.log('Admin login successful');
        
        // Save login state consistently
        sessionStorage.setItem('adminLoggedIn', 'true');
        isLoggedIn = true;
        
        // Show success message
        showAdminAlert('success', 'Login successful!', true);
        
        // Close login modal and open admin panel immediately
        hideAdminLogin();
        openAdminPanel();
        
        // Reset form
        document.getElementById('adminLoginForm').reset();
    } else {
        console.log('Admin login failed: Invalid password');
        
        // Show error message
        showAdminAlert('error', 'Invalid password. Please try again.', true);
        
        // Reset button
        if (loginBtn) {
            loginBtn.disabled = false;
            loginBtn.innerHTML = 'Login';
        }
    }
}

// Show admin alert
function showAdminAlert(type, message, inLoginModal = false, autoHideDelay = 0) {
    console.log(`Showing ${type} alert: ${message}`);
    
    const alertContainer = inLoginModal ? 
        document.getElementById('loginAlertContainer') : 
        document.getElementById('adminAlertContainer');
        
    if (!alertContainer) {
        console.error('Alert container not found');
        return;
    }
    
    // Clear any existing alerts
    alertContainer.innerHTML = '';
    
    // Create alert element
    const alertDiv = document.createElement('div');
    alertDiv.className = 'rounded-lg p-4 mb-4 flex items-center justify-between alert-animate-in';
    
    // Set colors based on alert type
    switch (type) {
        case 'success':
            alertDiv.className += ' bg-green-100 text-green-800 border border-green-200';
            break;
        case 'error':
            alertDiv.className += ' bg-red-100 text-red-800 border border-red-200';
            break;
        case 'info':
            alertDiv.className += ' bg-blue-100 text-blue-800 border border-blue-200';
            break;
        case 'warning':
            alertDiv.className += ' bg-yellow-100 text-yellow-800 border border-yellow-200';
            break;
        default:
            alertDiv.className += ' bg-gray-100 text-gray-800 border border-gray-200';
    }
    
    // Set icon based on alert type
    let icon;
    switch (type) {
        case 'success':
            icon = '<i class="fas fa-check-circle mr-2 text-green-600"></i>';
            break;
        case 'error':
            icon = '<i class="fas fa-exclamation-circle mr-2 text-red-600"></i>';
            break;
        case 'info':
            icon = '<i class="fas fa-info-circle mr-2 text-blue-600"></i>';
            break;
        case 'warning':
            icon = '<i class="fas fa-exclamation-triangle mr-2 text-yellow-600"></i>';
            break;
        default:
            icon = '<i class="fas fa-bell mr-2 text-gray-600"></i>';
    }
    
    // Create alert content
    const alertContent = document.createElement('div');
    alertContent.className = 'flex items-center';
    alertContent.innerHTML = `${icon} <span>${message}</span>`;
    
    // Create close button
    const closeButton = document.createElement('button');
    closeButton.className = 'text-gray-500 hover:text-gray-700 ml-2';
    closeButton.innerHTML = '<i class="fas fa-times"></i>';
    closeButton.onclick = function() {
        alertDiv.classList.add('alert-animate-out');
        setTimeout(() => {
            alertContainer.removeChild(alertDiv);
        }, 300);
    };
    
    // Add content and close button to alert
    alertDiv.appendChild(alertContent);
    alertDiv.appendChild(closeButton);
    
    // Add animation styles
    const style = document.createElement('style');
    style.textContent = `
        .alert-animate-in {
            animation: alertSlideIn 0.3s ease-out forwards;
        }
        
        .alert-animate-out {
            animation: alertSlideOut 0.3s ease-in forwards;
        }
        
        @keyframes alertSlideIn {
            from { opacity: 0; transform: translateY(-20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes alertSlideOut {
            from { opacity: 1; transform: translateY(0); }
            to { opacity: 0; transform: translateY(-20px); }
        }
    `;
    document.head.appendChild(style);
    
    // Add alert to container
    alertContainer.appendChild(alertDiv);
    
    // Auto-hide alert if delay is specified
    if (autoHideDelay > 0) {
        setTimeout(() => {
            if (alertDiv.parentNode === alertContainer) {
                alertDiv.classList.add('alert-animate-out');
                setTimeout(() => {
                    if (alertDiv.parentNode === alertContainer) {
                        alertContainer.removeChild(alertDiv);
                    }
                }, 300);
            }
        }, autoHideDelay);
    }
}

// Open admin panel and load data
async function openAdminPanel() {
    console.log('Opening admin panel, login status:', isLoggedIn);
    
    if (!isLoggedIn) {
        console.error('Attempt to open admin panel when not logged in');
        showLoginForm();
        return;
    }
    
    if (!adminPanel) {
        console.error('Admin panel element not found');
        return;
    }
    
    // Show the admin panel
    adminPanel.classList.remove('hidden');
    
    // Make sure body doesn't scroll when panel is open
    document.body.classList.add('overflow-hidden');
    
    try {
        // Load admin data
        let dataSource = 'unknown';
        // Try to load from Supabase
        let adminData;
        try {
            const currentSiteId = await getCurrentSiteId();
            console.log('Fetching data for id:', currentSiteId);
            const { data, error } = await supabase
                .from('teachers_websites')
                .select('*')
                .eq('id', currentSiteId)
                .single();
                
            console.log('Supabase query response:', data, error);
            
            if (error) {
                console.error('Error loading from Supabase:', error);
                showAdminAlert('error', 'Failed to load data from database. Using local data instead.');
            } else if (data && data.data) {
                console.log('✅ Raw data from Supabase:', data);
                // Use the data property which contains the actual site content
                adminData = data.data;
                
                dataSource = 'supabase';
                console.log('✅ Data loaded for admin panel from Supabase successfully');
                showAdminAlert('success', 'Data loaded successfully from Supabase!');
            } else {
                console.log('No data found in Supabase for admin panel');
                showAdminAlert('error', 'No data found in database. Using local storage or default values.');
            }
        } catch (error) {
            console.error('Error in admin data loading from Supabase:', error);
            showAdminAlert('error', `Database error: ${error.message}. Using local data instead.`);
        }
        
        // If Supabase failed, try localStorage
        if (!adminData) {
            try {
                const localData = localStorage.getItem('siteData');
                if (localData) {
                    adminData = JSON.parse(localData);
                    dataSource = 'localStorage';
                    console.log('✅ Data loaded for admin panel from localStorage successfully');
                    showAdminAlert('info', 'Data loaded from local storage (offline mode)');
                }
            } catch (localError) {
                console.error('Error loading from localStorage:', localError);
            }
        }
        
        // If both failed, use default data
        if (!adminData) {
            adminData = {
                personal: {
                    name: 'Dr. Ahmed Mahmoud',
                    title: 'Mathematics Educator',
                    subtitle: 'Inspiring the next generation',
                    heroHeading: 'Inspiring Minds Through Mathematics',
                    experience: '15+ years teaching experience',
                    philosophy: 'I believe in creating an engaging and supportive learning environment where students can develop their mathematical thinking and problem-solving skills. My approach combines theoretical knowledge with practical applications to make mathematics accessible and enjoyable.',
                    qualifications: [
                        'Ph.D. in Mathematics Education',
                        'Master\'s in Applied Mathematics',
                        'Bachelor\'s in Mathematics'
                    ]
                },
                experience: {
                    schools: [
                        'International School of Mathematics',
                        'Elite Academy',
                        'Science High School'
                    ],
                    centers: [
                        'Math Excellence Center',
                        'Advanced Learning Institute',
                        'STEM Education Hub'
                    ],
                    platforms: [
                        'MathPro Online',
                        'EduTech Academy',
                        'Virtual Learning Center'
                    ]
                },
                results: {
                    subjects: [
                        { name: 'Mathematics', score: 85 },
                        { name: 'Physics', score: 78 },
                        { name: 'Chemistry', score: 82 },
                        { name: 'Biology', score: 75 }
                    ]
                },
                contact: {
                    email: 'teacher@example.com',
                    formUrl: 'https://forms.google.com/your-form-link',
                    phone: '+1 234 567 890',
                    contactMessage: 'Feel free to reach out with any questions about tutoring.'
                },
                theme: {
                    color: 'blue',
                    mode: 'light'
                }
            };
            dataSource = 'default';
            console.log('✅ Default data used for admin panel');
            showAdminAlert('info', 'Using default data - no saved data found');
        }
        
        // Store the data globally
        siteData = adminData;
        console.log(`Admin data loaded from ${dataSource}:`, adminData);
        
        // Populate the admin form with the loaded data
        populateAdminForm(adminData);
        
        // Make sure we have the saveChangesBtn properly initialized
        saveChangesBtn = document.getElementById('saveChangesBtn');
        
        // Always attach event listener to save changes button when opening admin panel
        if (saveChangesBtn) {
            // Remove any existing event listeners to prevent duplicates
            saveChangesBtn.removeEventListener('click', saveAdminChanges);
            
            // Add fresh event listener
            saveChangesBtn.addEventListener('click', saveAdminChanges);
            // Hide the admin loader when the save changes button event listener is attached
            const adminLoader = document.getElementById('adminLoader');
            if (adminLoader) {
                adminLoader.classList.add('hide');
            }
            console.log('Save changes button event listener attached');
        } else {
            console.error('Save changes button not found in DOM when opening admin panel');
        }
        
    } catch (error) {
        console.error('Error opening admin panel:', error);
        showAdminAlert('error', 'Failed to load admin panel: ' + error.message);
    }
}

// Validate that form was properly populated
function validateFormPopulation(data) {
    console.log('Validating form population with data:', JSON.stringify(data, null, 2));
    
    // Get form element values
    const nameInput = document.getElementById('admin-name');
    const titleInput = document.getElementById('admin-title');
    const subtitleInput = document.getElementById('admin-subtitle');
    const heroHeadingInput = document.getElementById('admin-hero-heading');
    const experienceInput = document.getElementById('admin-experience');
    const philosophyInput = document.getElementById('admin-philosophy');
    const qualificationsInput = document.getElementById('admin-qualifications');
    const schoolsInput = document.getElementById('admin-schools');
    const centersInput = document.getElementById('admin-centers');
    const platformsInput = document.getElementById('admin-platforms');
    const emailInput = document.getElementById('admin-email');
    const formUrlInput = document.getElementById('admin-form-url');
    const assistantFormUrlInput = document.getElementById('admin-assistant-form-url');
    const phoneInput = document.getElementById('admin-phone');
    const contactMessageInput = document.getElementById('admin-contact-message');
    
    // Get the actual values in the form fields
    const formValues = {
        name: nameInput ? nameInput.value : 'element not found',
        title: titleInput ? titleInput.value : 'element not found',
        subtitle: subtitleInput ? subtitleInput.value : 'element not found',
        heroHeading: heroHeadingInput ? heroHeadingInput.value : 'element not found',
        experience: experienceInput ? experienceInput.value : 'element not found',
        philosophy: philosophyInput ? philosophyInput.value : 'element not found',
        qualifications: qualificationsInput ? qualificationsInput.value : 'element not found',
        schools: schoolsInput ? schoolsInput.value : 'element not found',
        centers: centersInput ? centersInput.value : 'element not found',
        platforms: platformsInput ? platformsInput.value : 'element not found',
        email: emailInput ? emailInput.value : 'element not found',
        formUrl: formUrlInput ? formUrlInput.value : 'element not found',
        assistantFormUrl: assistantFormUrlInput ? assistantFormUrlInput.value : '',
        phone: phoneInput ? phoneInput.value : '',
        contactMessage: contactMessageInput ? contactMessageInput.value : ''
    };
    
    console.log('FORM VALIDATION - Current form values:', formValues);
    
    // Provide default values for missing fields
    const defaultValues = {
        schools: ['International School of Mathematics', 'Elite Academy', 'Science High School'],
        centers: ['Math Excellence Center', 'Advanced Learning Institute', 'STEM Education Hub'],
        platforms: ['MathPro Online', 'EduTech Academy', 'Virtual Learning Center'],
        email: 'ahmed.mahmoud@mathseducator.com',
        formUrl: 'https://forms.google.com/your-form-link',
        assistantFormUrl: 'https://forms.google.com/assistant-form-link',
        phone: '+1 123-456-7890',
        contactMessage: 'Thank you for your interest in my teaching services. I will get back to you as soon as possible.'
    };

    // Check for empty required fields, only treat actual form fields as required
    const emptyFields = Object.entries(formValues)
        .filter(([key, value]) => 
            // Only consider fields that have corresponding DOM elements and are required
            (key === 'schools' || key === 'centers' || key === 'platforms' || 
             key === 'email' || key === 'formUrl') && 
            value === 'element not found' || value === ''
        )
        .map(([key]) => key);

    if (emptyFields.length > 0) {
        console.warn('⚠️ Empty form fields detected:', emptyFields);
        
        // More user-friendly message
        if (emptyFields.some(field => formValues[field] === 'element not found')) {
            showAdminAlert('warning', `Some required input fields could not be found in the form. Default values will be used.`);
            
            // Apply default values for missing fields
            emptyFields.forEach(field => {
                if (formValues[field] === 'element not found' || formValues[field] === '') {
                    formValues[field] = defaultValues[field];
                }
            });
        } else {
            showAdminAlert('warning', `Please fill in all required fields: ${emptyFields.join(', ')}.`);
            return;
        }
    }
    
    console.log('✅ All form fields are populated with values');
}

// Populate admin form with data
function populateAdminForm(data) {
    try {
        console.log('Populating admin form with data:', JSON.stringify(data, null, 2));
        
        if (!data) {
            console.error('No data provided to populateAdminForm');
            showAdminAlert('error', 'No data available to load. Using default values.');
            initializeWithDefaultData();
            data = siteData;
        }
        
        // Personal Info - Check for both 'personal' and 'personalInfo'
        const personalData = data.personal || data.personalInfo || {};
        console.log('Personal data to populate:', personalData);
        
        // Get form elements
        const nameInput = document.getElementById('admin-name');
        const titleInput = document.getElementById('admin-title');
        const subtitleInput = document.getElementById('admin-subtitle');
        const heroHeadingInput = document.getElementById('admin-hero-heading');
        const experienceInput = document.getElementById('admin-experience');
        const philosophyInput = document.getElementById('admin-philosophy');
        const qualificationsInput = document.getElementById('admin-qualifications');
        
        // Log which elements were found
        console.log('Form elements found:', {
            nameInput: !!nameInput,
            titleInput: !!titleInput,
            subtitleInput: !!subtitleInput,
            heroHeadingInput: !!heroHeadingInput,
            experienceInput: !!experienceInput,
            philosophyInput: !!philosophyInput,
            qualificationsInput: !!qualificationsInput
        });
        
        // Set values with detailed logging
        if (nameInput) {
            nameInput.value = personalData.name || '';
            console.log(`Set name input to "${personalData.name || ''}"`);
        } else {
            console.error('admin-name input not found in DOM');
        }
        
        if (titleInput) {
            titleInput.value = personalData.title || '';
            console.log(`Set title input to "${personalData.title || ''}"`);
        } else {
            console.error('admin-title input not found in DOM');
        }
        
        if (subtitleInput) {
            subtitleInput.value = personalData.subtitle || 'History Teacher';
            console.log(`Set subtitle input to "${personalData.subtitle || 'History Teacher'}"`);
        } else {
            console.error('admin-subtitle input not found in DOM');
        }
        
        if (heroHeadingInput) {
            heroHeadingInput.value = personalData.heroHeading || 'Inspiring Minds Through Mathematics';
            console.log(`Set hero heading input to "${personalData.heroHeading || 'Inspiring Minds Through Mathematics'}"`);
        } else {
            console.error('admin-hero-heading input not found in DOM');
        }
        
        if (experienceInput) {
            experienceInput.value = personalData.experience || '';
            console.log(`Set experience input to "${personalData.experience || ''}"`);
        } else {
            console.error('admin-experience input not found in DOM');
        }
        
        if (philosophyInput) {
            // Use the value from the database if present, otherwise fallback to default
            philosophyInput.value = (typeof personalData.philosophy === 'string' && personalData.philosophy.trim())
                ? personalData.philosophy
                : '';
            console.log(`Set philosophy input to "${philosophyInput.value}"`);
        } else {
            console.error('admin-philosophy input not found in DOM');
        }
        
        if (qualificationsInput) {
            const qualifications = personalData.qualifications || [];
            const qualText = Array.isArray(qualifications) ? qualifications.join('\n') : '';
            qualificationsInput.value = qualText;
            console.log(`Set qualifications input to "${qualText}"`);
        } else {
            console.error('admin-qualifications input not found in DOM');
        }
        
        // Experience data
        const experienceData = data.experience || {};
        console.log('Experience data to populate:', experienceData);
        
        // Get experience form elements
        const schoolsInput = document.getElementById('admin-schools');
        const centersInput = document.getElementById('admin-centers');
        const platformsInput = document.getElementById('admin-platforms');
        
        // Log which elements were found
        console.log('Experience form elements found:', {
            schoolsInput: !!schoolsInput,
            centersInput: !!centersInput,
            platformsInput: !!platformsInput
        });
        
        // Set values with detailed logging
        if (schoolsInput) {
            const schools = experienceData.schools || [];
            const schoolsText = Array.isArray(schools) ? schools.join('\n') : '';
            schoolsInput.value = schoolsText;
            console.log(`Set schools input to "${schoolsText}"`);
        } else {
            console.error('admin-schools input not found in DOM');
        }
        
        if (centersInput) {
            const centers = experienceData.centers || [];
            const centersText = Array.isArray(centers) ? centers.join('\n') : '';
            centersInput.value = centersText;
            console.log(`Set centers input to "${centersText}"`);
        } else {
            console.error('admin-centers input not found in DOM');
        }
        
        if (platformsInput) {
            const platforms = experienceData.platforms || experienceData.onlinePlatforms || [];
            const platformsText = Array.isArray(platforms) ? platforms.join('\n') : '';
            platformsInput.value = platformsText;
            console.log(`Set platforms input to "${platformsText}"`);
        } else {
            console.error('admin-platforms input not found in DOM');
        }
        
        // Results data
        const resultsData = data.results || [];
        console.log('Results data to populate:', resultsData);
        
        if (Array.isArray(resultsData)) {
            populateResultsForm(resultsData);
            console.log(`Results container populated with ${resultsData.length} items`);
        } else {
            console.warn('Results data is not an array:', resultsData);
            populateResultsForm([]);
        }
        
        // Contact data
        const contactData = data.contact || {};
        console.log('Contact data to populate:', contactData);
        
        // Get contact form elements
        const emailInput = document.getElementById('admin-email');
        const formUrlInput = document.getElementById('admin-form-url');
        const assistantFormUrlInput = document.getElementById('admin-assistant-form-url');
        const phoneInput = document.getElementById('admin-phone');
        const contactMessageInput = document.getElementById('admin-contact-message');
        
        // Log which elements were found
        console.log('Contact form elements found:', {
            emailInput: !!emailInput,
            formUrlInput: !!formUrlInput,
            assistantFormUrlInput: !!assistantFormUrlInput,
            phoneInput: !!phoneInput,
            contactMessageInput: !!contactMessageInput
        });
        
        // Set values with detailed logging
        if (emailInput) {
            emailInput.value = contactData.email || '';
            console.log(`Set email input to "${contactData.email || ''}"`);
        } else {
            console.error('admin-email input not found in DOM');
        }
        
        if (formUrlInput) {
            formUrlInput.value = contactData.formUrl || '';
            console.log(`Set form URL input to "${contactData.formUrl || ''}"`);
        } else {
            console.error('admin-form-url input not found in DOM');
        }
        
        if (assistantFormUrlInput) {
            assistantFormUrlInput.value = contactData.assistantFormUrl || '';
            console.log(`Set assistant form URL input to "${contactData.assistantFormUrl || ''}"`);
        } else {
            console.error('admin-assistant-form-url input not found in DOM');
        }
        
        if (phoneInput) {
            phoneInput.value = contactData.phone || '';
            console.log(`Set phone input to "${contactData.phone || ''}"`);
        } else {
            console.error('admin-phone input not found in DOM');
        }
        
        if (contactMessageInput) {
            contactMessageInput.value = contactData.contactMessage || '';
            console.log(`Set contact message input to "${contactData.contactMessage || ''}"`);
        } else {
            console.error('admin-contact-message input not found in DOM');
        }
        
        // Theme data
        const themeData = data.theme || { color: 'blue', mode: 'light' };
        console.log('Theme data to populate:', themeData);
        
        // Set theme radio buttons based on saved theme data
        const { color = 'blue', mode = 'light' } = themeData;
        
        // Set color theme selection
        const colorInput = document.getElementById(`theme-${color}`);
        if (colorInput) {
            colorInput.checked = true;
            console.log(`Set theme color to ${color}`);
        } else {
            console.warn(`Theme color input for ${color} not found`);
            // Set default color
            const defaultColorInput = document.getElementById('theme-blue');
            if (defaultColorInput) defaultColorInput.checked = true;
        }
        
        // Set mode theme selection
        const modeInput = document.getElementById(`mode-${mode}`);
        if (modeInput) {
            modeInput.checked = true;
            console.log(`Set theme mode to ${mode}`);
        } else {
            console.warn(`Theme mode input for ${mode} not found`);
            // Set default mode
            const defaultModeInput = document.getElementById('mode-light');
            if (defaultModeInput) defaultModeInput.checked = true;
        }
        
        console.log('✅ Admin form population completed');
        hidePreloader();
    } catch (error) {
        console.error('Error populating admin form:', error);
        showAdminAlert('error', `There was an error loading form fields: ${error.message}`);
    }
}

// Populate results form
function populateResultsForm(subjects) {
    const container = document.getElementById('admin-results-container');
    container.innerHTML = '';
    
    if (subjects && subjects.length > 0) {
        subjects.forEach(subject => {
            addResultItem(
                subject.subject || '',
                subject.score || '',
                subject.astar || '',
                subject.a || '',
                subject.other || ''
            );
        });
    } else {
        addResultItem();
    }
}

// Add a new result item to the form
function addResultItem(name = '', score = '', astar = '', a = '', other = '') {
    const resultItem = document.createElement('div');
    resultItem.className = 'result-item bg-gray-50 p-4 rounded-lg mb-4';
    resultItem.innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
                <label class="form-label">Subject</label>
                <input type="text" class="form-input subject-name" value="${name}" placeholder="e.g., Mathematics">
            </div>
            <div>
                <label class="form-label">A* Students</label>
                <input type="number" class="form-input astar-count" value="${astar}" placeholder="Number of A* students">
            </div>
            <div>
                <label class="form-label">A Students</label>
                <input type="number" class="form-input a-count" value="${a}" placeholder="Number of A students">
            </div>
            <div>
                <label class="form-label">Other Grades</label>
                <input type="number" class="form-input other-count" value="${other}" placeholder="Number of other grades">
            </div>
            <div class="flex items-end">
                <button class="remove-result-btn bg-red-500 text-white px-3 py-2 rounded hover:bg-red-600 transition-colors">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `;

    const removeBtn = resultItem.querySelector('.remove-result-btn');
    removeBtn.addEventListener('click', () => {
        resultItem.remove();
    });

    document.getElementById('admin-results-container').appendChild(resultItem);
}

// Initialize DOM elements
function initDOMElements() {
    menuBtn = document.getElementById('menuBtn');
    closeMenuBtn = document.getElementById('closeMenuBtn');
    mobileMenu = document.getElementById('mobileMenu');
    mobileMenuLinks = document.querySelectorAll('.mobile-nav-link');
    body = document.body;
    adminBtn = document.getElementById('adminBtn');
    adminBtnMobile = document.getElementById('adminBtnMobile');
    adminLoginModal = document.getElementById('adminLoginModal');
    adminLoginForm = document.getElementById('adminLoginForm');
    cancelLoginBtn = document.getElementById('cancelLogin');
    exitLoginBtn = document.getElementById('exitLoginBtn');
    adminPanel = document.getElementById('adminPanel');
    closeAdminPanelBtn = document.getElementById('closeAdminPanel');
    saveChangesBtn = document.getElementById('saveChangesBtn');
    addResultBtn = document.getElementById('addResultBtn');
    adminResultsContainer = document.getElementById('admin-results-container');
    adminAlert = document.getElementById('adminAlertContainer');
    
    // Add new password change elements
    const showChangePasswordBtn = document.getElementById('showChangePasswordBtn');
    const changePasswordSection = document.getElementById('changePasswordSection');
    const hidePasswordSection = document.getElementById('hidePasswordSection');
    const changePasswordForm = document.getElementById('changePasswordForm');
    
    if (showChangePasswordBtn && changePasswordSection && hidePasswordSection && changePasswordForm) {
        showChangePasswordBtn.addEventListener('click', showChangePasswordSection);
        hidePasswordSection.addEventListener('click', hideChangePasswordSection);
        changePasswordForm.addEventListener('submit', handlePasswordChange);
    }
    
    console.log('DOM elements initialized');
    
    // Log which admin elements were found
    console.log('Admin elements found:', {
        adminBtn: !!adminBtn,
        adminBtnMobile: !!adminBtnMobile,
        adminPanel: !!adminPanel,
        adminLoginModal: !!adminLoginModal,
        exitLoginBtn: !!exitLoginBtn,
        showChangePasswordBtn: !!showChangePasswordBtn,
        changePasswordSection: !!changePasswordSection
    });
}

// Show password change section
function showChangePasswordSection() {
    console.log('Showing password change section');
    const changePasswordSection = document.getElementById('changePasswordSection');
    if (changePasswordSection) {
        changePasswordSection.classList.remove('hidden');
        document.getElementById('currentPassword').focus();
    }
}

// Hide password change section
function hideChangePasswordSection() {
    console.log('Hiding password change section');
    const changePasswordSection = document.getElementById('changePasswordSection');
    if (changePasswordSection) {
        changePasswordSection.classList.add('hidden');
        // Reset the form
        document.getElementById('changePasswordForm').reset();
    }
}

// Handle password change
async function handlePasswordChange(e) {
    e.preventDefault();
    console.log('Handling password change');
    
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    
    // Validate inputs
    if (!currentPassword || !newPassword) {
        showAdminAlert('error', 'Please fill in all password fields.');
        return;
    }
    
    // Verify current password
    if (currentPassword !== 'admin123') {
        showAdminAlert('error', 'Current password is incorrect.');
        return;
    }
    
    try {
        // In a real application, you would make an API call to update the password
        // For this demo, we'll simulate the password change
        showAdminAlert('success', 'Password changed successfully!');
        hideChangePasswordSection();
        
        // Reset the form
        document.getElementById('changePasswordForm').reset();
    } catch (error) {
        console.error('Error changing password:', error);
        showAdminAlert('error', 'Failed to change password. Please try again.');
    }
}

// Update site content with new data
function updateSiteContent(data) {
    try {
        console.log('Updating site content with data:', data);
        // Use personal data for name and title
        const personalData = data.personal || data.personalInfo || {};
        // Update name and title
        document.querySelectorAll('.nav-brand-name').forEach(el => {
            el.textContent = personalData.name || 'Teacher Name';
        });
        document.querySelectorAll('.nav-brand-subtitle').forEach(el => {
            el.textContent = personalData.title || 'Teacher Title';
        });
        // Update hero section
        const heroHeading = document.querySelector('.hero-title');
        if (heroHeading) {
            heroHeading.innerHTML = data.heroHeading || 'Inspiring Minds Through <span class="text-blue-600">Education</span>';
        }
        // --- Always set hero and about image src, with fallback and logging ---
        const heroImg = document.querySelector('#heroImage');
        const heroImgMobile = document.querySelector('#heroImageMobile');
        const aboutImg = document.querySelector('#aboutImage');
        const heroImageUrl = data.heroImage || 'https://static.vecteezy.com/system/resources/thumbnails/020/765/399/small_2x/default-profile-account-unknown-icon-black-silhouette-free-vector.jpg';
        const aboutImageUrl = data.aboutImage || 'https://static.vecteezy.com/system/resources/thumbnails/020/765/399/small_2x/default-profile-account-unknown-icon-black-silhouette-free-vector.jpg';
        if (heroImg) {
            heroImg.src = heroImageUrl;
            heroImg.classList.remove('hidden');
            console.log('[Image] Set #heroImage to:', heroImageUrl);
        }
        if (heroImgMobile) {
            heroImgMobile.src = heroImageUrl;
            heroImgMobile.classList.remove('hidden');
            console.log('[Image] Set #heroImageMobile to:', heroImageUrl);
        }
        if (aboutImg) {
            aboutImg.src = aboutImageUrl;
            aboutImg.classList.remove('hidden');
            console.log('[Image] Set #aboutImage to:', aboutImageUrl);
        }
        // Handle results data
        try {
            const resultsData = data.results || [];
            if (resultsData.length === 0) {
                console.warn('⚠️ Results data array is empty, skipping results/subjects updates');
                // Do NOT return here; just skip updating results/subjects
            } else {
                // Validate the structure of results data
                const validResults = resultsData.every(item => 
                    item && 
                    typeof item === 'object' && 
                    'subject' in item && 
                    'astar' in item && 
                    'a' in item && 
                    'other' in item
                );
                if (!validResults) {
                    console.error('❌ Invalid results data structure:', resultsData);
                    // Try to fix the data if possible
                    const fixedResults = resultsData.filter(item => 
                        item && 
                        typeof item === 'object' && 
                        'subject' in item && 
                        'astar' in item && 
                        'a' in item && 
                        'other' in item
                    );
                    if (fixedResults.length > 0) {
                        console.log('🔧 Using fixed results data:', fixedResults);
                        updateResultsChart(fixedResults);
                        updateSubjectsGrid(fixedResults);
                    }
                    return;
                }
                console.log('✅ Valid results data found, updating chart and subjects grid:', resultsData);
                updateResultsChart(resultsData);
                updateSubjectsGrid(resultsData);
            }
        } catch (updateError) {
            console.error('❌ Error updating results:', updateError);
        }
        // ... rest of updateSiteContent ...
        // Update hero images if they exist
        if (data.heroImage) {
            const heroImg = document.querySelector('#heroImage');
            const heroImgMobile = document.querySelector('#heroImageMobile');
            if (heroImg) {
                heroImg.src = data.heroImage;
                heroImg.classList.remove('hidden');
            }
            if (heroImgMobile) {
                heroImgMobile.src = data.heroImage;
                heroImgMobile.classList.remove('hidden');
            }
        }
        
        // Update about image if it exists
        if (data.aboutImage) {
            const aboutImg = document.querySelector('#aboutImage');
            if (aboutImg) {
                aboutImg.src = data.aboutImage;
                aboutImg.classList.remove('hidden');
            }
        }
        
        // Update page title
        if (personalData.name && personalData.title) {
            document.title = `${personalData.name} - ${personalData.title}`;
        }
        
        // Update name in navigation
        const navName = document.querySelector('.nav-brand-name');
        if (navName && personalData.name) {
            navName.textContent = personalData.name;
        }
        
        // Update subtitle/role in navigation
        const subtitleElements = document.querySelectorAll('.nav-brand-subtitle');
        if (subtitleElements.length > 0 && personalData.subtitle) {
            subtitleElements.forEach(el => {
                el.textContent = personalData.subtitle;
            });
        }
        
        // Update hero description
        const heroDesc = document.querySelector('#hero p.text-base, #hero p.text-lg');
        if (heroDesc && personalData.title) {
            heroDesc.textContent = personalData.title;
        }
        
        // Update teaching philosophy text
        const philosophyText = document.querySelector('#about p.text-gray-600, #about p.mb-8');
        if (philosophyText) {
            if (personalData.philosophy && personalData.philosophy.trim()) {
                philosophyText.textContent = personalData.philosophy;
                philosophyText.style.display = '';
            } else {
                philosophyText.style.display = 'none';
            }
        }
        // Hide Teaching Philosophy title if there is no philosophy or the content is empty/whitespace
        const philosophyTitle = Array.from(document.querySelectorAll('#about h2, #about h3')).find(el => el.textContent.trim().toLowerCase() === 'teaching philosophy');
        if (philosophyTitle) {
            if (!personalData.philosophy || !personalData.philosophy.trim()) {
                philosophyTitle.style.display = 'none';
                console.log('Teaching Philosophy title hidden: No teaching philosophy data found in the database.');
            } else {
                philosophyTitle.style.display = '';
            }
        }
        
        // Update about section qualifications
        const qualsList = document.querySelector('#about ul');
        if (qualsList && Array.isArray(personalData.qualifications)) {
            qualsList.innerHTML = personalData.qualifications.map(qual => `
                <li class="flex items-center">
                    <i class="fas fa-graduation-cap text-blue-600 mr-3"></i>
                    <span>${qual}</span>
                </li>
            `).join('');
        }
        // Hide Qualifications title if there are no qualifications or the list is empty/whitespace
        const qualificationsTitle = document.querySelector('#about h3');
        if (qualsList && qualificationsTitle) {
            const hasContent = Array.from(qualsList.children).some(li => li.textContent.trim() !== '');
            if (!hasContent) {
                qualificationsTitle.style.display = 'none';
                console.log('Qualifications title hidden: No qualifications data found in the database.');
            }
        }
        
        // Update experience section
        const experienceData = data.experience || {};
        console.log('Experience data:', experienceData);
        
        // Update schools
        const schoolsList = document.querySelector('#experience .experience-card:nth-child(2) ul');
        if (schoolsList) {
            const schoolsArray = Array.isArray(experienceData.schools) ? experienceData.schools : [];
            schoolsList.innerHTML = schoolsArray.map(school => `<li>${school}</li>`).join('');
            console.log('Schools updated:', schoolsArray);
            if (schoolsArray.length > 0) {
                console.log('✅ Schools data displayed successfully:', schoolsArray);
            } else {
                console.error('❌ No schools data available to display.');
            }
        } else {
            console.warn('Schools list element not found');
        }
        
        // Update centers
        const centersList = document.querySelector('#experience .experience-card:nth-child(3) ul');
        if (centersList) {
            const centersArray = Array.isArray(experienceData.centers) ? experienceData.centers : [];
            centersList.innerHTML = centersArray.map(center => `<li>${center}</li>`).join('');
            console.log('Centers updated:', centersArray);
        } else {
            console.warn('Centers list element not found');
        }
        
        // Update platforms
        const platformsList = document.querySelector('#experience .experience-card:nth-child(4) ul');
        if (platformsList) {
            const platformsArray = Array.isArray(experienceData.platforms) ? experienceData.platforms : [];
            platformsList.innerHTML = platformsArray.map(platform => `<li>${platform}</li>`).join('');
            console.log('Platforms updated:', platformsArray);
        } else {
            console.warn('Platforms list element not found');
        }
        
        // Update contact form
        const contactData = data.contact || {};
        contactData.email = contactData.email || 'ahmed.mahmoud@mathseducator.com';
        contactData.formUrl = contactData.formUrl || 'https://forms.google.com/your-form-link';
        contactData.assistantFormUrl = contactData.assistantFormUrl || 'https://forms.google.com/assistant-form-link';
        contactData.phone = contactData.phone || '+1 123-456-7890';
        contactData.contactMessage = contactData.contactMessage || 'Thank you for your interest in my teaching services.';
        
        const contactPhoneEl = document.querySelector('.contact-phone');
        if (contactPhoneEl && contactData && contactData.phone) {
            contactPhoneEl.textContent = contactData.phone;
        }
        const contactMessageEl = document.querySelector('.contact-message');
        if (contactMessageEl && contactData && contactData.contactMessage) {
            contactMessageEl.textContent = contactData.contactMessage;
        }
        
        // Apply theme if it exists
        if (data.theme) {
            const { color = 'blue', mode = 'light' } = data.theme;
            console.log(`Applying theme from content update: ${color} color, ${mode} mode`);
            applyTheme(color, mode);
        } else {
            const colorRadio = document.querySelector('input[name="theme-color"]:checked');
            const modeRadio = document.querySelector('input[name="theme-mode"]:checked');
            const currentColor = colorRadio ? colorRadio.value : 'blue';
            const currentMode = modeRadio ? modeRadio.value : 'light';
            console.log(`No theme data found, using current radio button values: ${currentColor} color, ${currentMode} mode`);
            applyTheme(currentColor, currentMode);
        }
        
        console.log('✅ Site content updated successfully');
        console.log('✅ All data loaded and shown to the user successfully.');
        window.mainDataLoaded = true;
        maybeHidePreloader();
        // Hide Subjects Taught section if no subjects
        const subjectsSection = document.getElementById('subjects');
        if (subjectsSection) {
            if (!data.subjects || data.subjects.length === 0) {
                subjectsSection.style.display = 'none';
            } else {
                subjectsSection.style.display = '';
            }
        }
        // Hide Student Performance section if no results
        const resultsSection = document.getElementById('results');
        if (resultsSection) {
            if (!data.results || data.results.length === 0) {
                resultsSection.style.display = 'none';
            } else {
                resultsSection.style.display = '';
            }
        }
        // Register for Classes section: hide section if formUrl is empty
        const registerSection = document.getElementById('register');
        const registerBtn = registerSection ? registerSection.querySelector('a.btn-primary') : null;
        const formUrl = (data.contact && typeof data.contact.formUrl === 'string') ? data.contact.formUrl.trim() : '';
        if (registerSection) {
            if (!formUrl) {
                registerSection.style.display = 'none';
            } else {
                registerSection.style.display = '';
                if (registerBtn) {
                    registerBtn.href = formUrl;
                    registerBtn.style.display = '';
                }
            }
        }
        // Assistant Application section: hide section if assistantFormUrl is empty
        const assistantSection = document.getElementById('assistant');
        const assistantBtn = assistantSection ? assistantSection.querySelector('a.btn-assistant-apply') : null;
        const assistantFormUrl = (data.contact && typeof data.contact.assistantFormUrl === 'string') ? data.contact.assistantFormUrl.trim() : '';
        if (assistantSection) {
            if (!assistantFormUrl) {
                assistantSection.style.display = 'none';
            } else {
                assistantSection.style.display = '';
                if (assistantBtn) {
                    assistantBtn.href = assistantFormUrl;
                    assistantBtn.style.display = '';
                }
            }
        }
    } catch (error) {
        console.error('Error updating site content:', error);
    }
}

// Update results chart with new data
function updateResultsChart(subjects) {
    console.log('📊 Attempting to update results charts with subjects:', subjects);
    
    // Ensure we have data to work with
    if (!subjects || !Array.isArray(subjects) || subjects.length === 0) {
        console.warn('⚠️ No chart data provided or invalid format');
        return;
    }
    
    // Make sure Chart.js is loaded
    if (typeof Chart === 'undefined') {
        console.error('❌ Chart.js is not loaded or available');
        return;
    }

    // Get the charts container
    const chartsContainer = document.getElementById('charts-container');
    if (!chartsContainer) {
        console.error('❌ Charts container element not found');
        return;
    }

    // Clear existing charts
    chartsContainer.innerHTML = '';
    
    try {
        // Create a chart for each subject
        subjects.forEach(subject => {
            // Create chart container
            const chartWrapper = document.createElement('div');
            chartWrapper.className = 'bg-white rounded-lg shadow-lg p-6';
            chartWrapper.style.height = '400px';

            const canvas = document.createElement('canvas');
            canvas.id = `chart-${subject.subject.toLowerCase().replace(/\s+/g, '-')}`;
            chartWrapper.appendChild(canvas);
            chartsContainer.appendChild(chartWrapper);

            // Calculate percentages
            const total = subject.astar + subject.a + subject.other;
            const data = {
                astarPercent: ((subject.astar / total) * 100).toFixed(1),
                aPercent: ((subject.a / total) * 100).toFixed(1),
                otherPercent: ((subject.other / total) * 100).toFixed(1)
            };

            // Create the chart
            new Chart(canvas, {
                type: 'pie',
                data: {
                    labels: ['A*', 'A', 'Other Grades'],
                    datasets: [{
                        data: [
                            parseFloat(data.astarPercent),
                            parseFloat(data.aPercent),
                            parseFloat(data.otherPercent)
                        ],
                        backgroundColor: [
                            'rgba(54, 162, 235, 0.8)',  // Blue for A*
                            'rgba(75, 192, 192, 0.8)',  // Green for A
                            'rgba(255, 159, 64, 0.8)'   // Orange for Other
                        ],
                        borderColor: [
                            'rgba(54, 162, 235, 1)',
                            'rgba(75, 192, 192, 1)',
                            'rgba(255, 159, 64, 1)'
                        ],
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        title: {
                            display: true,
                            text: subject.subject,
                            font: {
                                size: 16,
                                weight: 'bold',
                                family: "'Inter', sans-serif"
                            },
                            padding: {
                                bottom: 20
                            }
                        },
                        legend: {
                            position: 'right',
                            labels: {
                                font: {
                                    family: "'Inter', sans-serif"
                                }
                            }
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const value = context.raw.toFixed(1);
                                    const label = context.label;
                                    let count = 0;
                                    if (label === 'A*') count = subject.astar;
                                    else if (label === 'A') count = subject.a;
                                    else count = subject.other;
                                    return `${label}: ${value}% (${count} students)`;
                                }
                            }
                        }
                    }
                }
            });
        });
        console.log('✅ Charts created/updated successfully');
    } catch (error) {
        console.error('❌ Failed to create/update charts:', error);
    }
}

// Save admin changes to Supabase and localStorage
async function saveAdminChanges() {
    console.log('Save changes function called');
    
    // Show loading state on button
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
        const currentSiteId = await getCurrentSiteId();
        console.log('Fetching current data from Supabase...');
        // Get current data to preserve existing values
        const { data: currentData, error: fetchError } = await supabase
            .from('teachers_websites')
            .select('*')
            .eq('id', currentSiteId)
            .single();

        if (fetchError) {
            console.error('Error fetching current data:', fetchError);
            throw fetchError;
        }

        console.log('Current data fetched successfully:', currentData);

        // Initialize all input elements with correct IDs
        const nameInput = document.getElementById('admin-name');
        const titleInput = document.getElementById('admin-title');
        const subtitleInput = document.getElementById('admin-subtitle');
        const heroHeadingInput = document.getElementById('admin-hero-heading');
        const experienceInput = document.getElementById('admin-experience');
        const philosophyInput = document.getElementById('admin-philosophy');
        const qualificationsInput = document.getElementById('admin-qualifications');
        const schoolsInput = document.getElementById('admin-schools');
        const centersInput = document.getElementById('admin-centers');
        const platformsInput = document.getElementById('admin-platforms');
        const emailInput = document.getElementById('admin-email');
        const formUrlInput = document.getElementById('admin-form-url');
        const assistantFormUrlInput = document.getElementById('admin-assistant-form-url');
        const phoneInput = document.getElementById('admin-phone');
        const contactMessageInput = document.getElementById('admin-contact-message');

        // Get current theme values from radio buttons with fallbacks
        const colorRadio = document.querySelector('input[name="theme-color"]:checked');
        const modeRadio = document.querySelector('input[name="theme-mode"]:checked');
        
        const currentColor = colorRadio ? colorRadio.value : (currentData?.data?.theme?.color || 'blue');
        const currentMode = modeRadio ? modeRadio.value : (currentData?.data?.theme?.mode || 'light');

        console.log('Current theme values:', { currentColor, currentMode });

        // Log which elements were found
        console.log('Input elements found:', {
            nameInput: nameInput ? 'found' : 'not found',
            titleInput: titleInput ? 'found' : 'not found',
            subtitleInput: subtitleInput ? 'found' : 'not found',
            heroHeadingInput: heroHeadingInput ? 'found' : 'not found',
            experienceInput: experienceInput ? 'found' : 'not found',
            philosophyInput: philosophyInput ? 'found' : 'not found',
            qualificationsInput: qualificationsInput ? 'found' : 'not found',
            schoolsInput: schoolsInput ? 'found' : 'not found',
            centersInput: centersInput ? 'found' : 'not found',
            platformsInput: platformsInput ? 'found' : 'not found',
            emailInput: emailInput ? 'found' : 'not found',
            formUrlInput: formUrlInput ? 'found' : 'not found',
            assistantFormUrlInput: assistantFormUrlInput ? 'found' : 'not found',
            phoneInput: phoneInput ? 'found' : 'not found',
            contactMessageInput: contactMessageInput ? 'found' : 'not found'
        });

        // Start with current data to preserve all existing values
        const newData = {
            ...(currentData?.data || {}),
            personal: {
                name: nameInput?.value || currentData?.data?.personal?.name || '',
                title: titleInput?.value || currentData?.data?.personal?.title || '',
                subtitle: subtitleInput?.value || currentData?.data?.personal?.subtitle || 'History Teacher',
                heroHeading: heroHeadingInput?.value || currentData?.data?.personal?.heroHeading || 'Inspiring Minds Through Mathematics',
                experience: experienceInput?.value || currentData?.data?.personal?.experience || '',
                philosophy: philosophyInput ? philosophyInput.value : '', // Always use the current input value, even if empty
                qualifications: qualificationsInput?.value?.split('\n').filter(item => item.trim() !== '') || 
                             currentData?.data?.personal?.qualifications || []
            },
            experience: {
                schools: schoolsInput?.value?.split('\n').filter(item => item.trim() !== '') || 
                        currentData?.data?.experience?.schools || [],
                centers: centersInput?.value?.split('\n').filter(item => item.trim() !== '') || 
                        currentData?.data?.experience?.centers || [],
                platforms: platformsInput?.value?.split('\n').filter(item => item.trim() !== '') || 
                          currentData?.data?.experience?.platforms || []
            },
            results: collectResultsData(),
            contact: {
                email: emailInput?.value || currentData?.data?.contact?.email || '',
                formUrl: formUrlInput ? formUrlInput.value : (currentData?.data?.contact?.formUrl || ''),
                assistantFormUrl: assistantFormUrlInput ? assistantFormUrlInput.value : (currentData?.data?.contact?.assistantFormUrl || ''),
                phone: phoneInput?.value || currentData?.data?.contact?.phone || '',
                contactMessage: contactMessageInput?.value || currentData?.data?.contact?.contactMessage || ''
            },
            theme: {
                color: currentColor,
                mode: currentMode
            }
        };

        console.log('Saving data:', JSON.stringify(newData, null, 2));
        
        // Update our global state
        siteData = newData;
        
        // Also update current theme
        currentTheme = { 
            color: currentColor,
            mode: currentMode
        };

        // Apply the theme immediately
        applyTheme(currentColor, currentMode);

        // Save to Supabase with verification
        let supabaseSaveSuccess = false;
        try {
            console.log('Attempting to save to Supabase...');
            const { error } = await supabase
                .from('teachers_websites')
                .upsert({ id: currentSiteId, data: newData }, { onConflict: 'id' });

            if (error) {
                console.error('Supabase upsert error:', error);
                throw new Error(`Supabase error: ${error.message}`);
            }
            
            // Verify the data was saved correctly
            console.log('Verifying Supabase data after save...');
            const { data: verifyData, error: verifyError } = await supabase
                .from('teachers_websites')
                .select('data')
                .eq('id', currentSiteId)
                .single();
                
            if (verifyError) {
                console.error('Failed to verify data was saved:', verifyError);
                throw new Error(`Verification error: ${verifyError.message}`);
            }
            
            if (!verifyData || !verifyData.data) {
                console.error('Data verification failed: No data found after save');
                throw new Error('Data verification failed: No data found after save');
            }
            
            // Log the verification results
            console.log('✅ Supabase data verification successful');
            console.log('Saved data structure:', JSON.stringify(verifyData.data, null, 2));
            console.log('Saved results specifically:', JSON.stringify(verifyData.data.results, null, 2));
            
            supabaseSaveSuccess = true;
            console.log('✅ Data saved to Supabase successfully');
        } catch (error) {
            console.error('Error saving to Supabase:', error);
            showAdminAlert('error', `Failed to save to database: ${error.message}`);
        }

        // If Supabase save failed, try localStorage
        if (!supabaseSaveSuccess) {
            try {
                localStorage.setItem('siteData', JSON.stringify(newData));
                console.log('✅ Data saved to localStorage as fallback');
                showAdminAlert('success', 'Data saved to local storage successfully');
            } catch (localError) {
                console.error('Failed to save to localStorage:', localError);
                showAdminAlert('error', 'Failed to save data to any storage location');
            }
        } else {
            showAdminAlert('success', 'Changes saved successfully!');
        }

        // Update the site content with the new data
        updateSiteContent(newData);
        
        // Force update the results chart if it exists
        if (window.resultsChart) {
            updateResultsChart(newData.results);
        }
    } catch (error) {
        console.error('Error saving changes:', error);
        showAdminAlert('error', `Failed to save changes: ${error.message}`);
    } finally {
        // Restore button state
        saveBtn.innerHTML = originalBtnText;
        saveBtn.disabled = false;
    }
}

// Helper function to collect results data from form
function collectResultsData() {
    const results = [];
    document.querySelectorAll('.result-item').forEach(item => {
        const subject = item.querySelector('.subject-name').value;
        const astar = parseInt(item.querySelector('.astar-count').value) || 0;
        const a = parseInt(item.querySelector('.a-count').value) || 0;
        const other = parseInt(item.querySelector('.other-count').value) || 0;
        
        if (subject) {
            results.push({
                subject,
                astar,
                a,
                other
            });
        }
    });
    return results;
}

// Add new result when clicking the Add Subject button
function addNewResult() {
    addResultItem('', '', '', '', '');
}

// Close admin panel
function closeAdminPanel() {
    console.log('Closing admin panel');
    
    if (adminPanel) {
        adminPanel.classList.add('hidden');
        body.classList.remove('overflow-hidden');
        
        // Also hide the danger zone and its button
        const dangerZone = document.getElementById('dangerZone');
        const toggleDangerBtn = document.getElementById('toggleDangerBtn');
        
        if (dangerZone) dangerZone.classList.add('hidden');
        if (toggleDangerBtn) toggleDangerBtn.classList.add('hidden');
        
        // Dispatch admin panel closed event
        document.dispatchEvent(new CustomEvent('adminPanelClosed'));
    }
}

// Admin logout
function adminLogout() {
    console.log('Logging out admin');
    
    // Clear login state
    isLoggedIn = false;
    sessionStorage.removeItem('adminLoggedIn');
    
    // Close admin panel
    closeAdminPanel();
    
    // Update admin button text
    if (adminBtn) {
        adminBtn.textContent = 'Admin Login';
        
        // Remove all existing event listeners
        const newAdminBtn = adminBtn.cloneNode(true);
        adminBtn.parentNode.replaceChild(newAdminBtn, adminBtn);
        adminBtn = newAdminBtn;
        
        // Add new login event listener
        adminBtn.addEventListener('click', function(e) {
            e.preventDefault();
            showLoginForm();
        });
    }
    
    // Update mobile admin button
    if (adminBtnMobile) {
        // Remove all existing event listeners
        const newAdminBtnMobile = adminBtnMobile.cloneNode(true);
        adminBtnMobile.parentNode.replaceChild(newAdminBtnMobile, adminBtnMobile);
        adminBtnMobile = newAdminBtnMobile;
        
        // Add new login event listener
        adminBtnMobile.addEventListener('click', function(e) {
            e.preventDefault();
            showLoginForm();
        });
    }
    
    // Show logout success message
    showAdminAlert('success', 'You have been logged out.');
}

// Setup theme toggle functionality (placeholder for future dark mode implementation)
function setupThemeToggle() {
    console.log('Setting up theme toggle functionality');
    
    // Get theme elements
    const themeColorInputs = document.querySelectorAll('input[name="theme-color"]');
    const themeModeInputs = document.querySelectorAll('input[name="theme-mode"]');
    const previewThemeBtn = document.getElementById('previewThemeBtn');
    
    // Set initial values based on current theme
    if (currentTheme) {
        // Set color selection
        const colorInput = document.getElementById(`theme-${currentTheme.color}`);
        if (colorInput) {
            colorInput.checked = true;
        }
        
        // Set mode selection
        const modeInput = document.getElementById(`mode-${currentTheme.mode}`);
        if (modeInput) {
            modeInput.checked = true;
        }
    }
    
    // Add preview button click handler
    if (previewThemeBtn) {
        previewThemeBtn.addEventListener('click', previewSelectedTheme);
    }
}

// Preview the selected theme without saving
function previewSelectedTheme() {
    const selectedColor = document.querySelector('input[name="theme-color"]:checked').value;
    const selectedMode = document.querySelector('input[name="theme-mode"]:checked').value;
    
    console.log(`Previewing theme: ${selectedColor} color, ${selectedMode} mode`);
    
    // Get preview button for animation
    const previewBtn = document.getElementById('previewThemeBtn');
    if (previewBtn) {
        previewBtn.innerHTML = '<div class="admin-loading"></div> Applying Theme...';
        previewBtn.disabled = true;
    }
    
    // Add transition animation to body
    document.body.classList.add('theme-transition');
    
    // Apply the theme with a slight delay for better visual effect
    setTimeout(() => {
        applyTheme(selectedColor, selectedMode);
        
        // Reset button after animation
        if (previewBtn) {
            setTimeout(() => {
                previewBtn.innerHTML = '<i class="fas fa-eye mr-2"></i> Preview Theme';
                previewBtn.disabled = false;
                
                // Show alert to inform user this is a preview
                showAdminAlert('info', 'Theme preview applied. Save changes to make it permanent.', false, 3000);
            }, 600);
        }
        
        // Remove animation class after it completes
        setTimeout(() => {
            document.body.classList.remove('theme-transition');
        }, 500);
    }, 100);
}

// Apply theme to the website
function applyTheme(color, mode) {
    console.log(`Applying theme: ${color} color, ${mode} mode`);
    
    // Store the theme values for later use
    currentTheme = { color, mode };
    
    // Add theme transition class for animation
    document.body.classList.add('theme-transition');
    
    // Apply color theme
    applyColorTheme(color);
    
    // Apply mode (light/dark)
    applyModeTheme(mode);
    
    // Remove transition class after animation completes
    setTimeout(() => {
        document.body.classList.remove('theme-transition');
    }, 500);
    
    // Add 3D effect to sections
    addSectionDepthEffect(mode);
}

// Add subtle 3D depth effect to sections based on theme
function addSectionDepthEffect(mode) {
    const sections = document.querySelectorAll('section');
    
    sections.forEach((section, index) => {
        // Alternate depth effect for visual interest
        const isEven = index % 2 === 0;
        const depthClass = isEven ? 'section-depth-even' : 'section-depth-odd';
        
        // Remove any existing depth classes
        section.classList.remove('section-depth-even', 'section-depth-odd');
        
        // Add new depth class
        section.classList.add(depthClass);
        
        // Apply different shadow based on mode
        if (mode === 'dark') {
            section.style.boxShadow = isEven ? 
                'inset 0 10px 20px rgba(0, 0, 0, 0.2), inset 0 -5px 10px rgba(0, 0, 0, 0.1)' : 
                'inset 0 -10px 20px rgba(0, 0, 0, 0.2), inset 0 5px 10px rgba(0, 0, 0, 0.1)';
        } else {
            section.style.boxShadow = isEven ? 
                'inset 0 10px 20px rgba(0, 0, 0, 0.05), inset 0 -5px 10px rgba(0, 0, 0, 0.03)' : 
                'inset 0 -10px 20px rgba(0, 0, 0, 0.05), inset 0 5px 10px rgba(0, 0, 0, 0.03)';
        }
    });
}

// Apply color theme to the website
function applyColorTheme(color) {
    console.log(`Applying color theme: ${color}`);
    
    // Remove all theme classes first
    document.body.classList.remove('theme-blue', 'theme-green', 'theme-purple', 'theme-red', 'theme-gray');
    
    // Add new theme class
    document.body.classList.add(`theme-${color}`);
    
    // Update CSS variables for the color theme based on color selection
    const root = document.documentElement;
    
    // Define gradient values for each color theme
    let gradientFrom, gradientTo;
    let primaryColorRgb;
    
    // Check current mode
    const isDarkMode = document.body.classList.contains('dark-mode');
    
    // Define color mappings for Tailwind colors
    const tailwindColorMap = {
        blue: {
            50: '#eff6ff', 100: '#dbeafe', 200: '#bfdbfe', 300: '#93c5fd', 
            400: '#60a5fa', 500: '#3b82f6', 600: '#2563eb', 700: '#1d4ed8', 
            800: '#1e40af', 900: '#1e3a8a'
        },
        green: {
            50: '#ecfdf5', 100: '#d1fae5', 200: '#a7f3d0', 300: '#6ee7b7', 
            400: '#34d399', 500: '#10b981', 600: '#059669', 700: '#047857', 
            800: '#065f46', 900: '#064e3b'
        },
        purple: {
            50: '#f5f3ff', 100: '#ede9fe', 200: '#ddd6fe', 300: '#c4b5fd', 
            400: '#a78bfa', 500: '#8b5cf6', 600: '#7c3aed', 700: '#6d28d9', 
            800: '#5b21b6', 900: '#4c1d95'
        },
        red: {
            50: '#fef2f2', 100: '#fee2e2', 200: '#fecaca', 300: '#fca5a5', 
            400: '#f87171', 500: '#ef4444', 600: '#dc2626', 700: '#b91c1c', 
            800: '#991b1b', 900: '#7f1d1d'
        },
        gray: {
            50: '#f9fafb', 100: '#f3f4f6', 200: '#e5e7eb', 300: '#d1d5db', 
            400: '#9ca3af', 500: '#6b7280', 600: '#4b5563', 700: '#374151', 
            800: '#1f2937', 900: '#111827'
        }
    };
    
    switch (color) {
        case 'blue':
            root.style.setProperty('--primary-color', tailwindColorMap.blue[500]);
            root.style.setProperty('--primary-dark', tailwindColorMap.blue[600]);
            root.style.setProperty('--primary-light', tailwindColorMap.blue[400]);
            primaryColorRgb = '59, 130, 246';
            gradientFrom = isDarkMode ? 'rgba(25, 50, 120, 0.95)' : 'rgba(30, 58, 138, 0.9)';
            gradientTo = isDarkMode ? 'rgba(37, 99, 235, 0.9)' : 'rgba(37, 99, 235, 0.8)';
            break;
        case 'green':
            root.style.setProperty('--primary-color', tailwindColorMap.green[500]);
            root.style.setProperty('--primary-dark', tailwindColorMap.green[600]);
            root.style.setProperty('--primary-light', tailwindColorMap.green[400]);
            primaryColorRgb = '16, 185, 129';
            gradientFrom = isDarkMode ? 'rgba(5, 75, 55, 0.95)' : 'rgba(6, 78, 59, 0.9)';
            gradientTo = isDarkMode ? 'rgba(5, 150, 105, 0.9)' : 'rgba(5, 150, 105, 0.8)';
            break;
        case 'purple':
            root.style.setProperty('--primary-color', tailwindColorMap.purple[500]);
            root.style.setProperty('--primary-dark', tailwindColorMap.purple[600]);
            root.style.setProperty('--primary-light', tailwindColorMap.purple[400]);
            primaryColorRgb = '139, 92, 246';
            gradientFrom = isDarkMode ? 'rgba(70, 25, 140, 0.95)' : 'rgba(76, 29, 149, 0.9)';
            gradientTo = isDarkMode ? 'rgba(124, 58, 237, 0.9)' : 'rgba(124, 58, 237, 0.8)';
            break;
        case 'red':
            root.style.setProperty('--primary-color', tailwindColorMap.red[500]);
            root.style.setProperty('--primary-dark', tailwindColorMap.red[600]);
            root.style.setProperty('--primary-light', tailwindColorMap.red[400]);
            primaryColorRgb = '239, 68, 68';
            gradientFrom = isDarkMode ? 'rgba(140, 25, 25, 0.95)' : 'rgba(153, 27, 27, 0.9)';
            gradientTo = isDarkMode ? 'rgba(220, 38, 38, 0.9)' : 'rgba(220, 38, 38, 0.8)';
            break;
        case 'gray':
            root.style.setProperty('--primary-color', tailwindColorMap.gray[500]);
            root.style.setProperty('--primary-dark', tailwindColorMap.gray[600]);
            root.style.setProperty('--primary-light', tailwindColorMap.gray[400]);
            primaryColorRgb = '107, 114, 128';
            gradientFrom = isDarkMode ? 'rgba(45, 55, 70, 0.95)' : 'rgba(55, 65, 81, 0.9)';
            gradientTo = isDarkMode ? 'rgba(75, 85, 99, 0.9)' : 'rgba(75, 85, 99, 0.8)';
            break;
        default:
            root.style.setProperty('--primary-color', tailwindColorMap.blue[500]);
            root.style.setProperty('--primary-dark', tailwindColorMap.blue[600]);
            root.style.setProperty('--primary-light', tailwindColorMap.blue[400]);
            primaryColorRgb = '59, 130, 246';
            gradientFrom = isDarkMode ? 'rgba(25, 50, 120, 0.95)' : 'rgba(30, 58, 138, 0.9)';
            gradientTo = isDarkMode ? 'rgba(37, 99, 235, 0.9)' : 'rgba(37, 99, 235, 0.8)';
    }
    
    // Set primary color RGB for glow effects
    root.style.setProperty('--primary-color-rgb', primaryColorRgb);
    
    // Apply gradient overlay to hero section
    root.style.setProperty('--gradient-from', gradientFrom);
    root.style.setProperty('--gradient-to', gradientTo);
    
    // Update the hero title glow color in dark mode
    if (isDarkMode) {
        const keyframes = `
            @keyframes glow {
                from {
                    text-shadow: 0 0 10px rgba(${primaryColorRgb}, 0.5);
                }
                to {
                    text-shadow: 0 0 20px rgba(${primaryColorRgb}, 0.8), 0 0 30px rgba(${primaryColorRgb}, 0.6);
                }
            }
        `;
        
        // Add or update the keyframes
        let styleElement = document.getElementById('glow-keyframes');
        if (!styleElement) {
            styleElement = document.createElement('style');
            styleElement.id = 'glow-keyframes';
            document.head.appendChild(styleElement);
        }
        styleElement.textContent = keyframes;
    }
    
    // Update the gradient overlay dynamically
    const heroOverlay = document.querySelector('#hero .absolute.inset-0.bg-gradient-to-r');
    if (heroOverlay) {
        heroOverlay.style.backgroundImage = `linear-gradient(to right, ${gradientFrom}, ${gradientTo})`;
    }
    
    // Update website logo
    const logo = document.querySelector('a.text-2xl.font-bold');
    if (logo) {
        // Remove all existing color classes
        logo.className = logo.className.replace(/text-\w+-\d+/g, '');
        // Add the new theme color
        logo.classList.add(`text-${color}-600`);
        logo.classList.add(`hover:text-${color}-700`);
    }
    
    // Update navigation menu text color to use theme color in light mode
    if (!isDarkMode) {
        document.querySelectorAll('.nav-link').forEach(link => {
            // Don't modify the admin button which has special styling
            if (!link.classList.contains('admin-btn')) {
                link.style.color = `var(--primary-color)`;
        }
    });
}

    // Update admin and lock icons to use theme color
    document.querySelectorAll('#adminBtn i, #adminBtnMobile i, .admin-btn i').forEach(icon => {
        // Remove any existing color classes
        icon.className = icon.className.replace(/text-\w+-\d+/g, '');
        // Add the new theme color directly using CSS variables
        icon.style.color = 'var(--primary-color)';
    });
    
    // Update subject icons - explicitly target them to ensure they change color
    document.querySelectorAll('.subject-card i').forEach(icon => {
        // Remove any existing color classes
        icon.className = icon.className.replace(/text-\w+-\d+/g, '');
        // Add the new theme color
        icon.classList.add(`text-${color}-600`);
    });
    
    // Update experience section icons - ensure they use the theme color
    document.querySelectorAll('.experience-card i.text-3xl').forEach(icon => {
        // Remove any existing color classes
        icon.className = icon.className.replace(/text-\w+-\d+/g, '');
        // Add the new theme color
        icon.classList.add(`text-${color}-600`);
    });
    
    // Update qualification icons
    document.querySelectorAll('.fa-graduation-cap').forEach(icon => {
        // Remove any existing color classes
        icon.className = icon.className.replace(/text-\w+-\d+/g, '');
        // Add the new theme color
        icon.classList.add(`text-${color}-600`);
    });
    
    // Update all icons with the theme color
    const iconSelectors = [
        '.fas.fa-graduation-cap', '.fas.fa-check', '.fas.fa-star', 
        '.fas.fa-money-bill-wave', '.fas.fa-calendar-alt', '.fas.fa-clock', 
        '.fas.fa-video', '.fas.fa-users', '.fas.fa-square-root-variable',
        '.fas.fa-atom', '.fas.fa-flask', '.fas.fa-dna', '.fas.fa-calculator',
        '.fas.fa-laptop-code', '.fas.fa-user-plus', '.fas.fa-user-graduate',
        '.fas.fa-info-circle', '.fas.fa-check-circle', '.fas.fa-exclamation-circle',
        '.fas.fa-exclamation-triangle', '.fas.fa-bell'
    ];
    
    // Update all text-blue-600 elements to use the current theme color
    document.querySelectorAll('[class*="text-blue-"]').forEach(element => {
        // Skip elements that might have custom coloring
        if (element.classList.contains('text-blue-900') && element.closest('.theme-blue')) {
            return;
        }
        
        const classes = Array.from(element.classList);
        const colorClass = classes.find(cls => cls.match(/text-blue-\d+/));
        
        if (colorClass) {
            const colorValue = colorClass.split('-')[2]; // Get the shade number (e.g., 600)
            element.classList.remove(colorClass);
            element.classList.add(`text-${color}-${colorValue}`);
        }
    });
    
    // Update elements that might be using other theme colors
    // This helps fix elements that might be stuck with a specific color like purple
    const themeColors = ['blue', 'green', 'purple', 'red', 'gray'];
    themeColors.forEach(themeColor => {
        if (themeColor === color) return; // Skip the current color
        
        document.querySelectorAll(`[class*="text-${themeColor}-"]`).forEach(element => {
            // Find all color classes for this theme
            const classes = Array.from(element.classList);
            const colorClasses = classes.filter(cls => cls.match(new RegExp(`text-${themeColor}-\\d+`)));
            
            colorClasses.forEach(colorClass => {
                const colorValue = colorClass.split('-')[2]; // Get the shade number
                element.classList.remove(colorClass);
                element.classList.add(`text-${color}-${colorValue}`);
            });
        });
    });
    
    // Update icons that use the text-blue-600 class
    document.querySelectorAll('.text-blue-600').forEach(element => {
        element.classList.remove('text-blue-600');
        element.classList.add(`text-${color}-600`);
    });
    
    // Update all section title underlines
    document.querySelectorAll('.section-title').forEach(title => {
        title.style.borderColor = `var(--primary-color)`;
    });
    
    // Update experience card icons
    document.querySelectorAll('.experience-card i').forEach(icon => {
        // Remove all text color classes
        icon.className = icon.className.replace(/text-\w+-\d+/g, '');
        // Add the new theme color
        icon.classList.add(`text-${color}-600`);
    });
    
    // Update buttons with the theme color
    document.querySelectorAll('.btn-primary').forEach(btn => {
        // Remove any existing background color classes
        btn.className = btn.className.replace(/bg-\w+-\d+/g, '');
        // Add the new theme background color
        btn.classList.add(`bg-${color}-600`);
        btn.style.backgroundColor = `var(--primary-color)`;
        btn.style.borderColor = `var(--primary-dark)`;
        
        // Enhanced button style in dark mode
        if (isDarkMode) {
            btn.style.boxShadow = `0 0 15px rgba(${primaryColorRgb}, 0.3)`;
        }
    });
    
    // Update theme option labels
    document.querySelectorAll('.theme-color-option input:checked + label').forEach(label => {
        label.style.boxShadow = `0 0 0 2px var(--primary-color)`;
    });
    
    // Update theme mode labels when checked
    document.querySelectorAll('.theme-mode-option input:checked + label').forEach(label => {
        label.style.boxShadow = `0 0 0 2px var(--primary-color)`;
    });
    
        // Add dynamic styles for all navigation elements
    const styleSheet = document.createElement('style');
    styleSheet.id = 'dynamic-theme-styles';
    document.head.appendChild(styleSheet);
    
    // Remove any previous dynamic styles
    const oldStyle = document.getElementById('dynamic-theme-styles');
    if (oldStyle && oldStyle !== styleSheet) {
        oldStyle.remove();
    }
    
    // Add new dynamic styles
    styleSheet.textContent = `
        .nav-link:hover { color: var(--primary-color) !important; }
        .mobile-nav-link:hover { color: var(--primary-color) !important; }
        .section-title::after { background-color: var(--primary-color) !important; }
        .btn-primary:hover { background-color: var(--primary-dark) !important; }
        
        /* Add hover styles for admin buttons */
        #adminBtnMobile:hover i,
        .admin-btn:hover { color: var(--primary-color) !important; }
        
        /* Style for active navigation link */
        .nav-link.active {
            font-weight: 600;
            color: var(--primary-color) !important;
        }
        
        .nav-link.active::after {
            width: 100% !important;
            opacity: 1 !important;
            background-color: var(--primary-color) !important;
            box-shadow: 0 0 5px var(--primary-color);
        }
        
        /* Lock icon styling */
        #adminBtn i, #adminBtnMobile i {
            color: var(--primary-color) !important;
            transition: all 0.3s ease;
        }
        
        /* Dynamic theme colors for all theme-specific elements */
        .text-${color}-50 { color: ${tailwindColorMap[color][50]} !important; }
        .text-${color}-100 { color: ${tailwindColorMap[color][100]} !important; }
        .text-${color}-200 { color: ${tailwindColorMap[color][200]} !important; }
        .text-${color}-300 { color: ${tailwindColorMap[color][300]} !important; }
        .text-${color}-400 { color: ${tailwindColorMap[color][400]} !important; }
        .text-${color}-500 { color: ${tailwindColorMap[color][500]} !important; }
        .text-${color}-600 { color: ${tailwindColorMap[color][600]} !important; }
        .text-${color}-700 { color: ${tailwindColorMap[color][700]} !important; }
        .text-${color}-800 { color: ${tailwindColorMap[color][800]} !important; }
        .text-${color}-900 { color: ${tailwindColorMap[color][900]} !important; }
        
        .bg-${color}-50 { background-color: ${tailwindColorMap[color][50]} !important; }
        .bg-${color}-100 { background-color: ${tailwindColorMap[color][100]} !important; }
        .bg-${color}-200 { background-color: ${tailwindColorMap[color][200]} !important; }
        .bg-${color}-300 { background-color: ${tailwindColorMap[color][300]} !important; }
        .bg-${color}-400 { background-color: ${tailwindColorMap[color][400]} !important; }
        .bg-${color}-500 { background-color: ${tailwindColorMap[color][500]} !important; }
        .bg-${color}-600 { background-color: ${tailwindColorMap[color][600]} !important; }
        .bg-${color}-700 { background-color: ${tailwindColorMap[color][700]} !important; }
        .bg-${color}-800 { background-color: ${tailwindColorMap[color][800]} !important; }
        .bg-${color}-900 { background-color: ${tailwindColorMap[color][900]} !important; }
        
        .hover\\:text-${color}-700:hover { color: ${tailwindColorMap[color][700]} !important; }
        .hover\\:bg-${color}-700:hover { background-color: ${tailwindColorMap[color][700]} !important; }
        
        .border-${color}-500 { border-color: ${tailwindColorMap[color][500]} !important; }
        .hover\\:border-${color}-700:hover { border-color: ${tailwindColorMap[color][700]} !important; }
        
        ${isDarkMode ? '.dark-mode .section-title::after { box-shadow: 0 0 8px var(--primary-color); }' : ''}
        ${isDarkMode ? '.dark-mode .nav-link:hover { text-shadow: 0 0 8px var(--primary-color); }' : ''}
    `;
    
    // Update admin panel themed elements
    const adminElementsSelector = '#adminPanel .text-blue-600, #adminLoginModal .text-blue-600';
    document.querySelectorAll(adminElementsSelector).forEach(element => {
        element.classList.remove('text-blue-600');
        element.classList.add(`text-${color}-600`);
    });
    
    // Update alert styles based on theme
    updateAlertStyles(color, primaryColorRgb);
}

// Apply mode theme (light/dark)
function applyModeTheme(mode) {
    console.log(`Applying mode theme: ${mode}`);
    
    const root = document.documentElement;
    
    // Remove current mode class
    document.body.classList.remove('dark-mode', 'light-mode');
    
    // Add new mode class
    document.body.classList.add(`${mode}-mode`);
    
    if (mode === 'dark') {
        // Apply dark mode colors
        root.style.setProperty('--bg-color', '#0f172a');
        document.body.style.backgroundColor = '#0f172a'; // Ensure body bg is dark
        root.style.setProperty('--text-color', '#f3f4f6');
        root.style.setProperty('--text-light', '#d1d5db');
        root.style.setProperty('--card-bg', '#1e293b');
        root.style.setProperty('--card-shadow', 'rgba(0, 0, 0, 0.25)');
        root.style.setProperty('--border-color', '#334155');
        root.style.setProperty('--nav-bg', 'rgba(15, 23, 42, 0.95)');
        root.style.setProperty('--btn-text', '#f9fafb');
        root.style.setProperty('--footer-bg', '#030712');
        root.style.setProperty('--footer-text', '#f9fafb');
        
        // Add dark class for Tailwind dark mode
        document.documentElement.classList.add('dark');
        
        // Update mobile menu for dark mode
        const mobileMenu = document.getElementById('mobileMenu');
        if (mobileMenu) {
            mobileMenu.style.backgroundColor = 'var(--card-bg)';
            mobileMenu.style.borderLeft = '1px solid var(--border-color)';
        }
        
        // Update desktop and mobile navigation links
        document.querySelectorAll('.nav-link').forEach(link => {
            if (!link.classList.contains('admin-btn')) {
                link.style.color = 'var(--text-color)';
                
                // Add hover state style for nav links
                link.addEventListener('mouseenter', function() {
                    this.style.color = 'var(--primary-color)';
                });
                
                link.addEventListener('mouseleave', function() {
                    this.style.color = 'var(--text-color)';
                });
            }
        });
        
        // Update mobile navigation links
        document.querySelectorAll('.mobile-nav-link').forEach(link => {
            link.style.color = 'var(--text-color)';
            
            // Add hover effect for mobile links
            link.addEventListener('mouseenter', function() {
                this.style.color = 'var(--primary-color)';
            });
            
            link.addEventListener('mouseleave', function() {
                this.style.color = 'var(--text-color)';
            });
        });
        
        // Update lock icons in dark mode
        document.querySelectorAll('#adminBtn i, #adminBtnMobile i').forEach(icon => {
            icon.style.color = 'var(--primary-color)';
        });
        
        // Make hero overlay more vibrant in dark mode
        const heroOverlay = document.querySelector('#hero .absolute.inset-0.bg-gradient-to-r');
        if (heroOverlay) {
            heroOverlay.style.opacity = '0.9';
            heroOverlay.style.mixBlendMode = 'multiply';
        }
        
        // Make header more visible in dark mode
        const header = document.querySelector('header');
        if (header) {
            header.style.boxShadow = '0 4px 10px rgba(0, 0, 0, 0.3)';
            header.style.backdropFilter = 'blur(8px)';
        }
        
        // Make cards stand out more in dark mode
        document.querySelectorAll('.experience-card, .subject-card, .feature-card').forEach(card => {
            card.style.boxShadow = '0 4px 10px rgba(0, 0, 0, 0.3)';
            card.style.border = '1px solid var(--border-color)';
            card.style.backgroundColor = 'var(--card-bg)';
            
            // Add hover effect
            card.addEventListener('mouseenter', function() {
                this.style.transform = 'translateY(-2px)';
                this.style.boxShadow = '0 6px 15px rgba(0, 0, 0, 0.4)';
            });
            
            card.addEventListener('mouseleave', function() {
                this.style.transform = 'translateY(0)';
                this.style.boxShadow = '0 4px 10px rgba(0, 0, 0, 0.3)';
            });
        });
        
        // Ensure all section titles and headings are white in dark mode
        document.querySelectorAll('.section-title, h2, h3, h4, h5, h6').forEach(heading => {
            heading.style.color = 'var(--text-color)';
        });
        
        // Update form labels and inputs for better visibility
        document.querySelectorAll('.form-label, .form-input, label').forEach(element => {
            element.style.color = 'var(--text-color)';
        });
        
        document.querySelectorAll('.form-input').forEach(input => {
            input.style.backgroundColor = 'rgba(31, 41, 55, 0.8)';
            input.style.borderColor = 'var(--border-color)';
            input.style.color = 'var(--text-color)';
        });
        
        // Add glow to buttons
        document.querySelectorAll('.btn-primary').forEach(btn => {
            btn.style.boxShadow = '0 0 15px rgba(var(--primary-color-rgb, 59, 130, 246), 0.3)';
        });
        
        // Add glow to icons
        document.querySelectorAll('.fas').forEach(icon => {
            icon.style.filter = 'drop-shadow(0 0 2px currentColor)';
        });
        
        // Ensure text elements in contact section are white
        document.querySelectorAll('#contact .form-label, #contact h2').forEach(element => {
            element.style.color = 'var(--text-color)';
        });
        
        // Ensure subject headings are white
        document.querySelectorAll('.subject-card h3').forEach(heading => {
            heading.style.color = 'var(--text-color)';
        });
        
        // Handle Chart.js elements - make chart text white in dark mode
        if (typeof Chart !== 'undefined') {
            Chart.defaults.color = '#f3f4f6'; // Light gray/white text
            Chart.defaults.borderColor = 'rgba(255, 255, 255, 0.1)'; // Lighter grid lines
            
            // If we have a chart instance, update it
            if (window.resultsChart && typeof window.resultsChart.options !== 'undefined' && 
                typeof window.resultsChart.options.scales !== 'undefined') {
                // Safely update chart properties
                try {
                    window.resultsChart.options.scales.x.ticks.color = '#f3f4f6';
                    window.resultsChart.options.scales.y.ticks.color = '#f3f4f6';
                    window.resultsChart.options.plugins.legend.labels.color = '#f3f4f6';
                    window.resultsChart.options.plugins.title.color = '#f3f4f6';
                    window.resultsChart.update();
                } catch (err) {
                    console.warn('Could not update chart colors in dark mode:', err);
                    // Don't throw an error, just log the warning
                }
            }
        }
        
        // Update admin panel
        const adminPanel = document.getElementById('adminPanel');
        if (adminPanel) {
            adminPanel.style.backgroundColor = 'var(--bg-color)';
        }
        
        // Update admin login modal
        const adminLoginModal = document.getElementById('adminLoginModal');
        if (adminLoginModal) {
            const modalContent = adminLoginModal.querySelector('.bg-white');
            if (modalContent) {
                modalContent.style.backgroundColor = 'var(--card-bg)';
                modalContent.style.borderColor = 'var(--border-color)';
            }
        }
        
        // Add dark mode specific CSS
        const darkModeStyle = document.getElementById('dark-mode-styles') || document.createElement('style');
        darkModeStyle.id = 'dark-mode-styles';
        darkModeStyle.textContent = `
            .dark-mode .text-gray-600, 
            .dark-mode .text-gray-700, 
            .dark-mode .text-gray-800,
            .dark-mode .text-gray-900 {
                color: var(--text-color) !important;
            }
            
            .dark-mode h2.section-title {
                color: var(--text-color) !important;
            }
            
            .dark-mode p {
                color: var(--text-light) !important;
            }
            
            .dark-mode .form-label {
                color: var(--text-color) !important;
            }
            
            .dark-mode #resultsChart {
                filter: drop-shadow(0 0 8px rgba(0, 0, 0, 0.5));
            }
        `;
        
        if (!document.getElementById('dark-mode-styles')) {
            document.head.appendChild(darkModeStyle);
        }
    } else {
        // Apply light mode colors
        root.style.setProperty('--bg-color', '#f9fafb');
        document.body.style.backgroundColor = '#f9fafb'; // Ensure body bg is light
        root.style.setProperty('--text-color', '#1f2937');
        root.style.setProperty('--text-light', '#6b7280');
        root.style.setProperty('--card-bg', '#ffffff');
        root.style.setProperty('--card-shadow', 'rgba(0, 0, 0, 0.1)');
        root.style.setProperty('--border-color', '#e5e7eb');
        root.style.setProperty('--nav-bg', 'rgba(255, 255, 255, 0.9)');
        root.style.setProperty('--btn-text', '#ffffff');
        root.style.setProperty('--footer-bg', '#1f2937');
        root.style.setProperty('--footer-text', '#f9fafb');
        
        // Remove dark class for Tailwind dark mode
        document.documentElement.classList.remove('dark');
        
        // Reset mobile menu in light mode
        const mobileMenu = document.getElementById('mobileMenu');
        if (mobileMenu) {
            mobileMenu.style.backgroundColor = '';
            mobileMenu.style.borderLeft = '';
        }
        
        // Reset mobile navigation links
        document.querySelectorAll('.mobile-nav-link').forEach(link => {
            // Remove event listeners first
            link.removeEventListener('mouseenter', function() {});
            link.removeEventListener('mouseleave', function() {});
            
            // Apply light mode styling
            link.style.color = '';
            
            // Add new event listeners for light mode
            link.addEventListener('mouseenter', function() {
                this.style.color = 'var(--primary-color)';
            });
            
            link.addEventListener('mouseleave', function() {
                this.style.color = '';
            });
        });
        
        // Update desktop navigation links for light mode
        document.querySelectorAll('.nav-link').forEach(link => {
            // Remove event listeners first
            link.removeEventListener('mouseenter', function() {});
            link.removeEventListener('mouseleave', function() {});
            
            if (!link.classList.contains('admin-btn')) {
                // Apply theme color to navigation in light mode
                link.style.color = 'var(--primary-color)';
                
                // Add hover effect for light mode
                link.addEventListener('mouseenter', function() {
                    this.style.color = 'var(--primary-dark)';
                });
                
                link.addEventListener('mouseleave', function() {
                    this.style.color = 'var(--primary-color)';
                });
            }
        });
        
        // Update lock icons in light mode
        document.querySelectorAll('#adminBtn i, #adminBtnMobile i').forEach(icon => {
            icon.style.color = 'var(--primary-color)';
        });
        
        // Reset hero overlay in light mode
        const heroOverlay = document.querySelector('#hero .absolute.inset-0.bg-gradient-to-r');
        if (heroOverlay) {
            heroOverlay.style.opacity = '';
            heroOverlay.style.mixBlendMode = '';
        }
        
        // Reset header in light mode
        const header = document.querySelector('header');
        if (header) {
            header.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
            header.style.backdropFilter = 'blur(4px)';
        }
        
        // Reset card styles in light mode
        document.querySelectorAll('.experience-card, .subject-card, .feature-card').forEach(card => {
            card.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
            card.style.border = 'none';
            card.style.backgroundColor = '';
            card.style.transform = '';
            
            // Remove event listeners
            card.removeEventListener('mouseenter', function() {});
            card.removeEventListener('mouseleave', function() {});
        });
        
        // Reset all headings and text in light mode
        document.querySelectorAll('.section-title, h2, h3, h4, h5, h6, .form-label, .form-input, label').forEach(element => {
            element.style.color = '';
        });
        
        // Reset form inputs in light mode
        document.querySelectorAll('.form-input').forEach(input => {
            input.style.backgroundColor = 'var(--card-bg)';
            input.style.borderColor = 'var(--border-color)';
            input.style.color = '';
        });
        
        // Reset button shadow
        document.querySelectorAll('.btn-primary').forEach(btn => {
            btn.style.boxShadow = '';
        });
        
        // Reset icon filter
        document.querySelectorAll('.fas').forEach(icon => {
            icon.style.filter = '';
        });
        
        // Reset Chart.js elements to default dark colors in light mode
        if (typeof Chart !== 'undefined') {
            Chart.defaults.color = '#666'; // Default chart text color
            Chart.defaults.borderColor = 'rgba(0, 0, 0, 0.1)'; // Default grid lines
            
            // If we have a chart instance, update it
            if (window.resultsChart && window.resultsChart.options && window.resultsChart.options.scales) {
                try {
                    // Only update if the properties exist
                    if (window.resultsChart.options.scales.x) {
                        window.resultsChart.options.scales.x.ticks.color = '';
                    }
                    if (window.resultsChart.options.scales.y) {
                        window.resultsChart.options.scales.y.ticks.color = '';
                    }
                    if (window.resultsChart.options.plugins && window.resultsChart.options.plugins.legend) {
                        window.resultsChart.options.plugins.legend.labels.color = '';
                    }
                    if (window.resultsChart.options.plugins && window.resultsChart.options.plugins.title) {
                        window.resultsChart.options.plugins.title.color = '';
                    }
                    window.resultsChart.update();
                } catch (err) {
                    console.warn('Error updating chart in light mode:', err);
                }
            }
        }
        
        // Reset admin panel
        const adminPanel = document.getElementById('adminPanel');
        if (adminPanel) {
            adminPanel.style.backgroundColor = '';
        }
        
        // Reset admin login modal
        const adminLoginModal = document.getElementById('adminLoginModal');
        if (adminLoginModal) {
            const modalContent = adminLoginModal.querySelector('.bg-white');
            if (modalContent) {
                modalContent.style.backgroundColor = '';
                modalContent.style.borderColor = '';
            }
        }
        
        // Reset sections
    document.querySelectorAll('section').forEach(section => {
            section.style.backgroundColor = '';
        });
        
        // Remove dark mode specific styles
        const darkModeStyle = document.getElementById('dark-mode-styles');
        if (darkModeStyle) {
            darkModeStyle.textContent = '';
        }
    }
    
    // Apply complementary styling to buttons based on mode
    document.querySelectorAll('.btn-primary').forEach(btn => {
        btn.style.color = 'var(--btn-text)';
    });
    
    // Apply section depth effects based on mode
    addSectionDepthEffect(mode);
}

// Load and apply saved theme
function loadSavedTheme() {
    try {
        console.log('Loading saved theme');
        
        if (siteData && siteData.theme) {
            const { color = 'blue', mode = 'light' } = siteData.theme;
            console.log(`Found saved theme: ${color} color, ${mode} mode`);
            
            // Apply the saved theme
            applyTheme(color, mode);
        } else {
            console.log('No saved theme found, using default');
            applyTheme('blue', 'light');
        }
    } catch (error) {
        console.error('Error loading saved theme:', error);
        applyTheme('blue', 'light');
    }
}

// Update alert styles based on theme color
function updateAlertStyles(color, primaryColorRgb) {
    // Define color mappings for each alert type
    const alertColors = {
        success: color === 'green' ? 'green' : 'green',
        error: color === 'red' ? 'red' : 'red',
        info: color,
        warning: 'yellow'
    };
    
    // Create a style element for the alert styles
    let alertStyleElement = document.getElementById('alert-theme-styles');
    if (!alertStyleElement) {
        alertStyleElement = document.createElement('style');
        alertStyleElement.id = 'alert-theme-styles';
        document.head.appendChild(alertStyleElement);
    }
    
    // Define the styles
    const alertStyles = `
        /* Info alert styles - these will use the theme color */
        .alert-info {
            background-color: rgba(${primaryColorRgb}, 0.1);
            border-color: rgba(${primaryColorRgb}, 0.3);
            color: var(--primary-color);
        }
        
        /* Update alert icons to match theme */
        .fa-info-circle {
            color: var(--primary-color) !important;
        }
        
        /* Success button hover in admin */
        .bg-green-500:hover {
            background-color: #059669 !important;
        }
        
        /* Error button hover in admin */
        .bg-red-500:hover {
            background-color: #dc2626 !important;
        }
    `;
    
    // Apply the styles
    alertStyleElement.textContent = alertStyles;
}

// Update drag and drop handlers to show preview
function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;
    if (files.length > 0) {
        const file = files[0];
        const reader = new FileReader();
        reader.onload = function(e) {
            if (e.target.dataset.type === 'hero') {
                heroPreview.querySelector('img').src = e.target.result;
                heroPreview.classList.remove('hidden');
            } else {
                aboutPreview.querySelector('img').src = e.target.result;
                aboutPreview.classList.remove('hidden');
            }
        }
        reader.dataset.type = e.target.dataset.type;
        reader.readAsDataURL(file);
        handleImageUpload(file, e.target.dataset.type);
    }
}

// Update drop zones to include type
heroDropZone.dataset.type = 'hero';
aboutDropZone.dataset.type = 'about';

// Save website data to Supabase
async function saveWebsiteData() {
    try {
        const currentSiteId = await getCurrentSiteId();
        // First get current data to make sure we don't overwrite other fields
        const { data: currentData, error: fetchError } = await supabase
            .from('teachers_websites')
            .select('*')
            .eq('id', currentSiteId)
            .single();
        if (fetchError) throw fetchError;
        // Prepare new data object, preserving existing data
        const dataToSave = {
            ...(currentData?.data || {}),
            heroImage: websiteData.heroImage || currentData?.data?.heroImage,
            aboutImage: websiteData.aboutImage || currentData?.data?.aboutImage
        };
        // Save to Supabase
        const { error: saveError } = await supabase
            .from('teachers_websites')
            .upsert({ 
                id: currentSiteId, 
                data: dataToSave 
            }, { onConflict: 'id' });
        if (saveError) throw saveError;
        console.log('Website data saved successfully');
        return true;
    } catch (error) {
        console.error('Error saving website data:', error);
        showAdminAlert('error', 'Failed to save image data: ' + error.message);
        return false;
    }
}

// Function to populate subjects grid
function updateSubjectsGrid(subjects) {
    const subjectsGrid = document.getElementById('subjects-grid');
    if (!subjectsGrid || !Array.isArray(subjects)) return;

    subjectsGrid.innerHTML = subjects.map(subject => `
        <div class="bg-white rounded-lg shadow-lg p-6 transform hover:-translate-y-1 transition-all duration-300">
            <div class="text-blue-600 mb-4 text-center">
                <i class="fas fa-book text-3xl"></i>
            </div>
            <h3 class="text-xl font-bold text-gray-800 text-center">${subject.subject}</h3>
        </div>
    `).join('');
}

// === Dynamic Grade Categories Logic (Supabase) ===
const DEFAULT_GRADE_CATEGORIES = ['A*', 'A', 'Other'];
let gradeCategories = [...DEFAULT_GRADE_CATEGORIES];
let gradeCategoriesId = null; // id of the row in grade_categories table

async function fetchGradeCategories() {
    const { data, error } = await supabase
        .from('grade_categories')
        .select('*')
        .limit(1)
        .single();
    if (error || !data) {
        gradeCategories = [...DEFAULT_GRADE_CATEGORIES];
        gradeCategoriesId = null;
        return gradeCategories;
    }
    gradeCategories = data.categories;
    gradeCategoriesId = data.id;
    return gradeCategories;
}

async function updateGradeCategoriesInSupabase(categories) {
    if (!gradeCategoriesId) {
        // Insert if not exists
        const { data, error } = await supabase
            .from('grade_categories')
            .insert([{ categories }])
            .select()
            .single();
        if (!error && data) {
            gradeCategoriesId = data.id;
            gradeCategories = data.categories;
        }
    } else {
        // Update existing row
        const { data, error } = await supabase
            .from('grade_categories')
            .update({ categories, updated_at: new Date().toISOString() })
            .eq('id', gradeCategoriesId)
            .select()
            .single();
        if (!error && data) {
            gradeCategories = data.categories;
        }
    }
}

function renderGradeCategoriesAdmin() {
    const container = document.getElementById('admin-grade-categories-container');
    if (!container) return;
    container.innerHTML = '';
    gradeCategories.forEach((cat, idx) => {
        const div = document.createElement('div');
        div.className = 'flex items-center gap-1';
        div.innerHTML = `
            <input type="text" value="${cat}" class="form-input grade-category-input" data-idx="${idx}" style="width: 80px;">
            <button class="remove-grade-category-btn text-red-500" data-idx="${idx}">&times;</button>
        `;
        container.appendChild(div);
    });
    // Remove button event
    container.querySelectorAll('.remove-grade-category-btn').forEach(btn => {
        btn.onclick = async function() {
            const idx = parseInt(this.dataset.idx);
            gradeCategories.splice(idx, 1);
            await updateGradeCategoriesInSupabase(gradeCategories);
            renderGradeCategoriesAdmin();
            updateResultsChartWithCategories();
        };
    });
    // Edit input event
    container.querySelectorAll('.grade-category-input').forEach(input => {
        input.onchange = async function() {
            const idx = parseInt(this.dataset.idx);
            gradeCategories[idx] = this.value;
            await updateGradeCategoriesInSupabase(gradeCategories);
            updateResultsChartWithCategories();
        };
    });
}

document.getElementById('addGradeCategoryBtn')?.addEventListener('click', async () => {
    const input = document.getElementById('newGradeCategoryInput');
    if (!input) return;
    const val = input.value.trim();
    if (!val) return;
    gradeCategories.push(val);
    await updateGradeCategoriesInSupabase(gradeCategories);
    input.value = '';
    renderGradeCategoriesAdmin();
    updateResultsChartWithCategories();
});

document.getElementById('saveGradeCategoriesBtn')?.addEventListener('click', async () => {
    await updateGradeCategoriesInSupabase(gradeCategories);
    showAdminAlert('success', 'Grade categories saved!');
});

async function updateResultsChartWithCategories() {
    // Re-render the results chart with the current categories
    if (typeof updateResultsChart === 'function') {
        updateResultsChart(window.currentSubjects || []);
    }
}

async function initializeGradeCategories() {
    // Show loading spinner/message in admin panel
    const container = document.getElementById('admin-grade-categories-container');
    if (container) {
        container.innerHTML = `<div class="flex flex-col items-center justify-center py-4">
            <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mb-2"></div>
            <p class="text-gray-500">Loading categories...</p>
        </div>`;
    }
    await fetchGradeCategories();
    renderGradeCategoriesAdmin();
    updateResultsChartWithCategories();
}

document.addEventListener('DOMContentLoaded', () => {
    initializeGradeCategories();
});

// === MIGRATED: All personal info, experience, and grades/results now use teachers_websites.data (id: 1) ===
// Helper to fetch all site data from teachers_websites
async function fetchAllSiteData() {
    const currentSiteId = await getCurrentSiteId();
    console.log('Fetching from table: teachers_websites [operation: select], id:', currentSiteId);
    const { data, error } = await supabase
        .from('teachers_websites')
        .select('data')
        .eq('id', currentSiteId)
        .single();
    if (error) throw error;
    return data && data.data ? data.data : {};
}

// Helper to save all site data to teachers_websites
async function saveAllSiteData(newData) {
    const currentSiteId = await getCurrentSiteId();
    console.log('Upserting to table: teachers_websites [operation: upsert]');
    const { error } = await supabase
        .from('teachers_websites')
        .upsert({ id: currentSiteId, data: newData }, { onConflict: 'id' });
    if (error) throw error;
}

// Replace all site_data fetches/updates with teachers_websites.data
// Example usage in DOMContentLoaded and saveAdminChanges:
// Instead of fetching from site_data, use fetchAllSiteData()
// Instead of upserting to site_data, use saveAllSiteData(newData)
// ... existing code ...

// Hide contact section if site owner email is not set
function showOrHideContactSection(siteOwnerEmail) {
  var contactSection = document.getElementById('contactSection');
  if (contactSection) {
    if (!siteOwnerEmail || siteOwnerEmail.trim() === '') {
      contactSection.style.display = 'none';
    } else {
      contactSection.style.display = '';
    }
  }
}

// Example: After fetching site data, call this with the email
// If you fetch from Supabase, call this after you have the email value
// Example usage:
// showOrHideContactSection(siteData?.contact?.email);

// If you want to run it on DOMContentLoaded with a global variable:
document.addEventListener('DOMContentLoaded', function() {
  // Replace this with your actual logic to get the site owner email
  var siteOwnerEmail = (window.siteData && window.siteData.contact && window.siteData.contact.email) || '';
  showOrHideContactSection(siteOwnerEmail);
});

// Helper function to set image src with fallback and logging
function setImageSrc(imgId, url, fallback) {
    const img = document.getElementById(imgId);
    if (img) {
        if (url) {
            img.src = url;
            img.classList.remove('hidden');
            console.log(`[Image] Set #${imgId} to:`, url);
        } else {
            img.src = fallback;
            img.classList.remove('hidden');
            console.log(`[Image] Set #${imgId} to default:`, fallback);
        }
    }
}

// After loading website data (replace this with your actual data loading logic)
function updateImagesFromData(data) {
    setImageSrc(
        'heroImage',
        data.heroImage,
        'https://static.vecteezy.com/system/resources/thumbnails/020/765/399/small_2x/default-profile-account-unknown-icon-black-silhouette-free-vector.jpg'
    );
    setImageSrc(
        'aboutImage',
        data.aboutImage,
        'https://static.vecteezy.com/system/resources/thumbnails/020/765/399/small_2x/default-profile-account-unknown-icon-black-silhouette-free-vector.jpg'
    );
}
// ... existing code ...
// Wherever you load your website data, call updateImagesFromData(data)
// For example, after fetching data:
// updateImagesFromData(websiteData);
// ... existing code ...

document.addEventListener('DOMContentLoaded', function() {
    // ... existing code ...
    // Hide Qualifications title if there are no qualifications
    const qualificationsList = document.querySelector('#about ul');
    const qualificationsTitle = document.querySelector('#about h3');
    if (qualificationsList && qualificationsTitle) {
        const hasContent = Array.from(qualificationsList.children).some(li => li.textContent.trim() !== '');
        if (!hasContent) {
            qualificationsTitle.style.display = 'none';
            console.log('Qualifications title hidden: No qualifications data found in the database.');
        }
    }
    // ... existing code ...
});

// Helper to hide preloader after data is loaded
function hidePreloader() {
    const preloader = document.querySelector('.preloader');
    if (preloader) {
        // Force a reflow to ensure the log is painted
        void preloader.offsetWidth;
        // Use requestAnimationFrame to start fade-out after paint
        requestAnimationFrame(() => {
            preloader.classList.add('fade-out');
            setTimeout(() => {
                preloader.style.display = 'none';
            }, 600); // Match your CSS transition duration
        });
    }
}

function maybeHidePreloader() {
    if (window.mainDataLoaded && window.reviewsLoaded) {
        hidePreloader();
    }
}
