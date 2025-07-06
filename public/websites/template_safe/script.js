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
// [SECURITY] All Supabase client usage and keys removed. All data operations now use backend API endpoints (api.php). No direct DB access or secrets in frontend.

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
    
    // Define elements (example selectors)
    const adminBtn = document.querySelector('#adminBtn');
    const adminBtnMobile = document.querySelector('#adminBtnMobile');
    const adminLoginForm = document.querySelector('#adminLoginForm');
    const cancelLoginBtn = document.querySelector('#cancelLoginBtn');
    const exitLoginBtn = document.querySelector('#exitLoginBtn');
    const closeAdminPanelBtn = document.querySelector('#closeAdminPanelBtn');
    const heroPreview = document.querySelector('#heroPreview');
    const aboutPreview = document.querySelector('#aboutPreview');

    let isLoggedIn = sessionStorage.getItem('adminLoggedIn') === 'true';
    console.log('Login status:', isLoggedIn ? 'Logged in' : 'Not logged in');
    
    // Set up admin button
    if (adminBtn) {
        console.log('Setting up admin button click handler');
            adminBtn.innerHTML = '<i class="fas fa-lock text-lg"></i>';
        adminBtn.style.display = 'flex';
        adminBtn.style.alignItems = 'center';

            adminBtn.addEventListener('click', function(e) {
                e.preventDefault();
            if (isLoggedIn) {
                console.log('Admin button clicked (logged in) - opening panel');
                openAdminPanel();
        } else {
                console.log('Admin button clicked (not logged in) - showing login form');
                showLoginForm();
        }
        });
    } else {
        console.warn('Admin button not found in the DOM');
    }
    
    // Mobile admin button
    if (adminBtnMobile) {
        console.log('Setting up mobile admin button click handler');
            adminBtnMobile.addEventListener('click', function(e) {
                e.preventDefault();
                closeMenu();
            if (isLoggedIn) {
                console.log('Mobile admin button clicked (logged in) - opening panel');
                openAdminPanel();
        } else {
                console.log('Mobile admin button clicked (not logged in) - showing login form');
                showLoginForm();
        }
        });
    } else {
        console.warn('Mobile admin button not found in the DOM');
    }
    
    // Admin login form
    if (adminLoginForm) {
        console.log('Setting up admin login form submit handler');
        adminLoginForm.addEventListener('submit', handleAdminLogin);
    }
    
    // Cancel login button
    if (cancelLoginBtn) {
        console.log('Setting up cancel login button click handler');
        cancelLoginBtn.addEventListener('click', hideAdminLogin);
    }
    
    // Exit login button
    if (exitLoginBtn) {
        console.log('Setting up exit login button click handler');
        exitLoginBtn.addEventListener('click', hideAdminLogin);
    }
    
    // Close admin panel button
    if (closeAdminPanelBtn) {
        console.log('Setting up close admin panel button click handler');
        closeAdminPanelBtn.addEventListener('click', closeAdminPanel);
    }
    
    // The following logic seems misplaced:
    /*
    if (updateError) throw updateError;

    if (type === 'hero') {
        heroPreview.classList.add('hidden');
            } else {
        aboutPreview.classList.add('hidden');
        }

    showAdminAlert('success', `${type.charAt(0).toUpperCase() + type.slice(1)} image removed successfully`);

    updateSiteContent(websiteData);
    */

    // This should probably go inside a function like removeImage(), example:
    async function removeImage(type, updateError, websiteData) {
        try {
            if (updateError) throw updateError;

            if (type === 'hero') {
                heroPreview.classList.add('hidden');
            } else {
                aboutPreview.classList.add('hidden');
            }

            showAdminAlert('success', `${type.charAt(0).toUpperCase() + type.slice(1)} image removed successfully`);
            
            updateSiteContent(websiteData);
        } catch (error) {
            console.error('Error removing image:', error);
            showAdminAlert('error', error.message || 'Failed to remove image. Please try again.');
        }
    }

    try {
        // Fetch site data from backend
        const data = await loadSiteData();
        // If data is nested under .data, flatten it
        const siteContent = data.data || data;
        updateSiteContent(siteContent);
    } catch (err) {
        console.error('Failed to load site data:', err);
        // Fallback: use default data
        initializeWithDefaultData();
    }

    // Ensure logout and close (X) buttons work in admin panel
    const logoutBtnEl = document.getElementById('logoutBtn');
    if (logoutBtnEl) {
        const newLogoutBtn = logoutBtnEl.cloneNode(true);
        logoutBtnEl.parentNode.replaceChild(newLogoutBtn, logoutBtnEl);
        newLogoutBtn.addEventListener('click', adminLogout);
    }
    const closeAdminPanelBtnEl = document.getElementById('closeAdminPanel');
    if (closeAdminPanelBtnEl) {
        const newCloseBtn = closeAdminPanelBtnEl.cloneNode(true);
        closeAdminPanelBtnEl.parentNode.replaceChild(newCloseBtn, closeAdminPanelBtnEl);
        newCloseBtn.addEventListener('click', closeAdminPanel);
    }

    // Ensure Add Subject button works
    const addResultBtn = document.getElementById('addResultBtn');
    if (addResultBtn) {
        // Remove previous event listeners by cloning
        const newAddBtn = addResultBtn.cloneNode(true);
        addResultBtn.parentNode.replaceChild(newAddBtn, addResultBtn);
        newAddBtn.addEventListener('click', function(e) {
            e.preventDefault();
            addNewResult();
        });
    }

    // Hide Courses Teaching section immediately if no courses
    const coursesSection = document.getElementById('courses-teaching');
    if (coursesSection) {
        // Try to get courses from global or window.siteData if available
        const courses = (window.siteData && window.siteData.coursesTeaching) || [];
        const hasCourses = Array.isArray(courses) && courses.length > 0;
        coursesSection.style.display = hasCourses ? '' : 'none';
        toggleMenuButton('subjects', hasCourses);
    }

    // Hide Teaching Affiliations section immediately if all affiliations are empty
    const affiliationsSection = document.getElementById('experience');
    if (affiliationsSection) {
        const data = window.siteData || {};
        const experience = data.experience || {};
        const hasAffiliations = (Array.isArray(experience.schools) && experience.schools.length > 0) ||
                                (Array.isArray(experience.centers) && experience.centers.length > 0) ||
                                (Array.isArray(experience.platforms) && experience.platforms.length > 0);
        affiliationsSection.style.display = hasAffiliations ? '' : 'none';
        toggleMenuButton('experience', hasAffiliations);
    }
});

    
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
            // Reset input so same file can be selected again
            heroImageInput.value = '';
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
            // Reset input so same file can be selected again
            aboutImageInput.value = '';
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
                // Fetch data from backend API
                const response = await fetch('/api/api?action=getData');
                if (!response.ok) throw new Error('Failed to fetch site data');
                const currentData = await response.json();
                console.log('Fetched site data:', currentData);
                try {
                  updateSiteContent(currentData);
                } catch (e) {
                  console.error('Error updating site content:', e);
                }
                const websiteData = currentData?.data || currentData;

                // Make sure heroPreview and aboutPreview are defined
                const heroPreview = document.getElementById('heroPreview');
                const aboutPreview = document.getElementById('aboutPreview');

                if (!heroPreview || !aboutPreview) {
                    console.warn('Preview elements not found in the DOM');
                    return;
                }
                    
                    // Initialize hero image
                    if (websiteData.heroImage) {
                    updateAdminImagePreview('hero', websiteData.heroImage);
                    }

                    // Initialize about image
                    if (websiteData.aboutImage) {
                    updateAdminImagePreview('about', websiteData.aboutImage);
                }
            } catch (error) {
                console.error('Error initializing images:', error);
            }
        }
});
    

// Function to restore data to Supabase when it's missing
async function restoreDataToSupabase() {
    console.log('Restoring default data to Supabase');
    initializeWithDefaultData();
    console.log('About to save this data to Supabase:', JSON.stringify(siteData, null, 2));
    try {
        // Save this data to backend API
        const response = await fetch('/api/api?action=saveData', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data: siteData })
        });
        const result = await response.json();
        if (!result.success) throw new Error(result.message || 'Failed to save data');
        // Verify the data was saved by fetching it back
        const verifyResponse = await fetch('/api/api?action=getData');
        if (!verifyResponse.ok) throw new Error('Failed to verify saved data');
        const verifyData = await verifyResponse.json();
        if (!verifyData) throw new Error('Data verification failed: No data found after save');
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
    
    // Assuming you have a stats section and elements you want to animate
    const statsSection = document.querySelector('.stats-section'); // Adjust selector as needed
    const value = document.querySelector('.value'); // Adjust selector as needed
    const target = 100; // Example target value
    const duration = 2000; // Example duration (in ms)
                    let count = 0;

                    const increment = target / (duration / 16);

                    const updateCount = () => {
                        if (count < target) {
                            count += increment;
                            value.textContent = Math.ceil(count) + '+';
                        } else {
                            value.textContent = target + '+';
                        }
                    };

    const options = {
        root: null,
        threshold: 0.5, // Example threshold for IntersectionObserver
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                    const countInterval = setInterval(() => {
                        if (count < target) {
                            updateCount();
                        } else {
                            clearInterval(countInterval);
                        }
                    }, 16);

                observer.unobserve(statsSection);
            }
        });
    }, options);

    observer.observe(statsSection);

    // Ensure logout and close (X) buttons work in admin panel
    const logoutBtnEl = document.getElementById('logoutBtn');
    if (logoutBtnEl) {
        const newLogoutBtn = logoutBtnEl.cloneNode(true);
        logoutBtnEl.parentNode.replaceChild(newLogoutBtn, logoutBtnEl);
        newLogoutBtn.addEventListener('click', adminLogout);
    }
    const closeAdminPanelBtnEl = document.getElementById('closeAdminPanel');
    if (closeAdminPanelBtnEl) {
        const newCloseBtn = closeAdminPanelBtnEl.cloneNode(true);
        closeAdminPanelBtnEl.parentNode.replaceChild(newCloseBtn, closeAdminPanelBtnEl);
        newCloseBtn.addEventListener('click', closeAdminPanel);
    }

    addResultBtn = document.getElementById('addResultBtn');
    if (addResultBtn) {
        // Remove previous event listeners by cloning
        const newAddBtn = addResultBtn.cloneNode(true);
        addResultBtn.parentNode.replaceChild(newAddBtn, addResultBtn);
        newAddBtn.addEventListener('click', function(e) {
            e.preventDefault();
            addNewResult();
        });
    }
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
        // Clear previous alerts
        const loginAlertContainer = document.getElementById('loginAlertContainer');
        if (loginAlertContainer) loginAlertContainer.innerHTML = '';
        // Reset login button
        const loginBtn = document.querySelector('#adminLoginForm button[type="submit"]');
        if (loginBtn) {
            loginBtn.disabled = false;
            loginBtn.innerHTML = 'Login';
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
    adminPanel.classList.remove('hidden');
    document.body.classList.add('overflow-hidden');
    try {
        let dataSource = 'unknown';
        let adminData;
        try {
            // Fetch data from backend API
            const response = await fetch('/api/api?action=getData');
            if (!response.ok) throw new Error('Failed to fetch site data');
            const data = await response.json();
            // Accept any non-error API response as valid
            if (data && typeof data === 'object' && Object.keys(data).length > 0) {
                adminData = data.data || data;
                dataSource = 'api';
                console.log('✅ Data loaded for admin panel from API successfully');
            } else {
                console.log('No usable data found in API for admin panel');
                showAdminAlert('error', 'No usable data found in database. Using local storage or default values.');
            }
        } catch (error) {
            console.error('Error in admin data loading from API:', error);
            showAdminAlert('error', `Database error: ${error.message}. Using local data instead.`);
        }
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
        siteData = adminData;
        // Keep websiteData.heroImage/aboutImage in sync with backend
        websiteData.heroImage = adminData.heroImage;
        websiteData.aboutImage = adminData.aboutImage;
        console.log(`Admin data loaded from ${dataSource}:`, adminData);
        populateAdminForm(adminData);
        saveChangesBtn = document.getElementById('saveChangesBtn');
        if (saveChangesBtn) {
            saveChangesBtn.removeEventListener('click', saveAdminChanges);
            saveChangesBtn.addEventListener('click', saveAdminChanges);
            const adminLoader = document.getElementById('adminLoader');
            if (adminLoader) {
                adminLoader.classList.add('hide');
            }
            console.log('Save changes button event listener attached');
        } else {
            console.error('Save changes button not found in DOM when opening admin panel');
        }
        // Show image previews if available
        showAdminImagePreview('hero', adminData.heroImage);
        showAdminImagePreview('about', adminData.aboutImage);
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
        // Always use data.personal for personal info
        const personal = data.personal || {};
        const nameValue = personal.name || '';
        const titleValue = personal.title || '';
        const subtitleValue = personal.subtitle || '';
        const heroHeadingValue = personal.heroHeading || '';
        const philosophyValue = personal.philosophy || '';
        // Get form elements
        const nameInput = document.getElementById('admin-name');
        const titleInput = document.getElementById('admin-title');
        const subtitleInput = document.getElementById('admin-subtitle');
        const heroHeadingInput = document.getElementById('admin-hero-heading');
        const philosophyInput = document.getElementById('admin-philosophy');
        // Set values
        if (nameInput) nameInput.value = nameValue;
        if (titleInput) titleInput.value = titleValue;
        if (subtitleInput) subtitleInput.value = subtitleValue;
        if (heroHeadingInput) heroHeadingInput.value = heroHeadingValue;
        if (philosophyInput) philosophyInput.value = philosophyValue;
        // Qualifications: always use data.personal.qualifications
        renderQualificationsInputs(Array.isArray(personal.qualifications) ? personal.qualifications : []);
        // Experience: schools, centers, platforms
        const experience = data.experience || {};
        renderExperienceInputs('schools', Array.isArray(experience.schools) ? experience.schools : []);
        renderExperienceInputs('centers', Array.isArray(experience.centers) ? experience.centers : []);
        renderExperienceInputs('platforms', Array.isArray(experience.platforms) ? experience.platforms : []);
        // ... keep rest of the function unchanged ...
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
                <label class="result-label" for="subject">Subject</label>
                <input type="text" class="result-input subject-input" value="${name}" placeholder="e.g., Mathematics">
            </div>
            <div>
                <label class="result-label" for="astar">A* Students</label>
                <input type="number" class="result-input" value="${astar}" placeholder="Number of A* students">
            </div>
            <div>
                <label class="result-label" for="a">A Students</label>
                <input type="number" class="result-input" value="${a}" placeholder="Number of A students">
            </div>
            <div>
                <label class="result-label other-label" for="other">Other Grades</label>
                <input type="number" class="result-input" value="${other}" placeholder="Number of other grades">
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
    const changePasswordFormSection = document.getElementById('changePasswordFormSection');
    const changePasswordSectionBtn = document.getElementById('changePasswordSectionBtn');
    if (showChangePasswordBtn && changePasswordSection && hidePasswordSection && changePasswordFormSection && changePasswordSectionBtn) {
        showChangePasswordBtn.addEventListener('click', showChangePasswordSection);
        hidePasswordSection.addEventListener('click', hideChangePasswordSection);
        // Remove submit event, use button click instead
        changePasswordSectionBtn.addEventListener('click', handlePasswordChange);
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

    // Ensure logout and close (X) buttons work in admin panel
    const logoutBtnEl = document.getElementById('logoutBtn');
    if (logoutBtnEl) {
        const newLogoutBtn = logoutBtnEl.cloneNode(true);
        logoutBtnEl.parentNode.replaceChild(newLogoutBtn, logoutBtnEl);
        newLogoutBtn.addEventListener('click', adminLogout);
    }
    const closeAdminPanelBtnEl = document.getElementById('closeAdminPanel');
    if (closeAdminPanelBtnEl) {
        const newCloseBtn = closeAdminPanelBtnEl.cloneNode(true);
        closeAdminPanelBtnEl.parentNode.replaceChild(newCloseBtn, closeAdminPanelBtnEl);
        newCloseBtn.addEventListener('click', closeAdminPanel);
    }

    addResultBtn = document.getElementById('addResultBtn');
    if (addResultBtn) {
        // Remove previous event listeners by cloning
        const newAddBtn = addResultBtn.cloneNode(true);
        addResultBtn.parentNode.replaceChild(newAddBtn, addResultBtn);
        newAddBtn.addEventListener('click', function(e) {
            e.preventDefault();
            addNewResult();
        });
    }
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
        document.getElementById('changePasswordFormSection').reset();
    }
}

// Handle password change
async function handlePasswordChange(e) {
    e.preventDefault();
    console.log('Handling password change');
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    if (!currentPassword || !newPassword) {
        showAdminAlert('error', 'Please fill in all password fields.');
        return;
    }
    try {
        const res = await fetch('/api/api?action=changePassword', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ oldPassword: currentPassword, newPassword })
        });
        const data = await res.json();
        if (data.success) {
            showAdminAlert('success', 'Password changed successfully!');
            hideChangePasswordSection();
            document.getElementById('changePasswordFormSection').reset();
        } else {
            showAdminAlert('error', data.message || 'Failed to change password.');
        }
    } catch (error) {
        console.error('Error changing password:', error);
        showAdminAlert('error', 'Failed to change password. Please try again.');
    }
}

// Update site content with new data
function updateSiteContent(data) {
    // Unwrap nested 'data' property if present
    if (data && data.data) data = data.data;
    // Define personalData for all later references
    const personalData = data.personal || {};
    try {
        console.log('Updating site content with data:', data);

        // Always prefer data.personal.name/title if present
        const name = data.personal && data.personal.name ? data.personal.name : (data.name || 'Teacher Name');
        const title = data.personal && data.personal.title ? data.personal.title : (data.title || 'Teacher Title');
        const subtitle = data.personal && data.personal.subtitle ? data.personal.subtitle : (data.subtitle || '');
        const heroHeading = data.personal && data.personal.heroHeading ? data.personal.heroHeading : (data.heroHeading || 'Inspiring Minds Through Mathematics');
        const heroDescText = data.personal && data.personal.heroDescription ? data.personal.heroDescription : (data.heroDescription || title);
        const qualifications = data.personal && data.personal.qualifications ? data.personal.qualifications : (data.qualifications || []);
        const philosophy = data.personal && data.personal.philosophy ? data.personal.philosophy : (data.philosophy || '');

        // Update name and title in nav
        document.querySelectorAll('.nav-brand-name').forEach(el => el.textContent = name);
        document.querySelectorAll('.nav-brand-subtitle').forEach(el => el.textContent = subtitle || title);

        // Update hero section
        const heroTitleEl = document.querySelector('.hero-title');
        if (heroTitleEl) heroTitleEl.innerHTML = heroHeading;

        const heroDescEl = document.querySelector('#hero p.text-base, #hero p.text-lg');
        if (heroDescEl) heroDescEl.textContent = heroDescText;

        // Update about section qualifications
        const qualsList = document.querySelector('#about ul');
        if (qualsList && Array.isArray(qualifications)) {
            qualsList.innerHTML = qualifications.map(qual => `
                <li class="flex items-center">
                    <i class="fas fa-graduation-cap text-blue-600 mr-3"></i>
                    <span>${qual}</span>
                </li>
            `).join('');
        }
        
        // Update teaching philosophy text
        const philosophyText = document.querySelector('#about p.text-gray-600, #about p.mb-8');
        if (philosophyText) {
            if (philosophy.trim()) {
                philosophyText.textContent = philosophy;
                philosophyText.style.display = '';
            } else {
                philosophyText.style.display = 'none';
            }
        }

        // Hide Teaching Philosophy title if missing
        const philosophyTitle = Array.from(document.querySelectorAll('#about h2, #about h3'))
            .find(el => el.textContent.trim().toLowerCase() === 'teaching philosophy');
        if (philosophyTitle) {
            philosophyTitle.style.display = philosophy.trim() ? '' : 'none';
        }

        // Update hero images
        if (data.heroImage) {
            const heroImg = document.querySelector('#heroImage');
            const heroImgMobile = document.querySelector('#heroImageMobile');
            if (heroImg) { heroImg.src = data.heroImage; heroImg.classList.remove('hidden'); }
            if (heroImgMobile) { heroImgMobile.src = data.heroImage; heroImgMobile.classList.remove('hidden'); }
        }

        // Update about image
        if (data.aboutImage) {
            const aboutImg = document.querySelector('#aboutImage');
            if (aboutImg) { aboutImg.src = data.aboutImage; aboutImg.classList.remove('hidden'); }
        }

        // Update page title
        if (name && title) document.title = `${name} - ${title}`;
        
        // Update experience section
        const experienceData = data.experience || {};
        console.log('Experience data:', experienceData);

        const experienceSection = document.getElementById('experience');
        const experienceCards = document.querySelectorAll('#experience .experience-card');
        const hasSchools = Array.isArray(experienceData.schools) && experienceData.schools.length > 0;
        const hasCenters = Array.isArray(experienceData.centers) && experienceData.centers.length > 0;
        const hasPlatforms = Array.isArray(experienceData.platforms) && experienceData.platforms.length > 0;
        const showAffiliations = hasSchools || hasCenters || hasPlatforms;
        if (experienceSection) experienceSection.style.display = showAffiliations ? '' : 'none';
        // Render each card and hide if empty
        const updateList = (cardIndex, items) => {
            const card = experienceCards[cardIndex];
            if (card) {
                const list = card.querySelector('ul');
                if (list) list.innerHTML = items.map(i => `<li>${i}</li>`).join('');
                card.style.display = items.length ? '' : 'none';
            }
        };
        updateList(0, experienceData.schools || []);
        updateList(1, experienceData.centers || []);
        updateList(2, experienceData.platforms || []);

        // Update contact info
        const contactData = data.contact || {};
        const contactPhone = contactData.phone || '+1 123-456-7890';
        const contactMessage = contactData.contactMessage || 'Thank you for your interest in my teaching services.';
        
        const contactPhoneEl = document.querySelector('.contact-phone');
        if (contactPhoneEl) contactPhoneEl.textContent = contactPhone;

        const contactMessageEl = document.querySelector('.contact-message');
        if (contactMessageEl) contactMessageEl.textContent = contactMessage;
        
        // Apply theme
        if (data.theme) {
            const { color = 'blue', mode = 'light' } = data.theme;
            console.log(`Applying theme: ${color}, ${mode}`);
            applyTheme(color, mode);
        }

        // --- Fix: Always extract subjects from results for both sections ---
        let subjects = [];
        if (Array.isArray(data.results)) {
            subjects = data.results;
        } else if (data.results && Array.isArray(data.results.subjects)) {
            subjects = data.results.subjects;
        }
        updateResultsChart(subjects);
        // --- End fix ---
        // Handle sections (subjects, results, register, assistant, contact)
        const hideIfEmpty = (sectionId, items) => {
            const section = document.getElementById(sectionId);
            const visible = (items && items.length);
            if (section) section.style.display = visible ? '' : 'none';
            toggleMenuButton(sectionId, visible);
        };
        hideIfEmpty('subjects', subjects);
        hideIfEmpty('results', subjects);
        // --- Fix: Define toggleSectionByUrl before use ---
        const toggleSectionByUrl = (sectionId, buttonSelector, url) => {
            const section = document.getElementById(sectionId);
            const btn = section ? section.querySelector(buttonSelector) : null;
            const visible = !!url;
            if (section) {
                if (url) {
                    section.style.display = '';
                    if (btn) { btn.href = url; btn.removeAttribute('tabindex'); btn.style.pointerEvents = ''; }
                } else {
                    section.style.display = 'none';
                    if (btn) { btn.href = '#'; btn.setAttribute('tabindex', '-1'); btn.style.pointerEvents = 'none'; }
                }
            }
            toggleMenuButton(sectionId, visible);
        };
        // --- End fix ---
        toggleSectionByUrl('register', 'a.btn-primary', contactData.formUrl?.trim());
        toggleSectionByUrl('assistant', 'a.btn-assistant-apply', contactData.assistantFormUrl?.trim());

        // Contact section visibility
        const contactEmail = (contactData.email || '').trim();
        const contactSection1 = document.getElementById('contact');
        const contactSection2 = document.getElementById('contactSection');
        [contactSection1, contactSection2].forEach(sec => {
            if (sec) sec.style.display = contactEmail ? '' : 'none';
        });
        toggleMenuButton('contact', !!contactEmail);

        // Hero Contact Me button
        const heroContactBtn = document.getElementById('heroContactBtn');
        if (heroContactBtn) {
            if (contactEmail) {
                heroContactBtn.style.display = '';
                heroContactBtn.removeAttribute('tabindex');
            } else {
                heroContactBtn.style.display = 'none';
                heroContactBtn.setAttribute('tabindex', '-1');
            }
        }

        console.log('✅ Site content updated successfully');
        var siteLoader = document.getElementById('siteLoader');
        if (siteLoader) siteLoader.classList.add('hide');
        window.mainDataLoaded = true;
        maybeHidePreloader();

        // Render Courses Teaching section
        updateCoursesTeachingGrid(data.results);

        // Teacher Experience
        const yearsInput = document.getElementById('admin-years-experience');
        const studentsInput = document.getElementById('admin-students-taught');
        const schoolsInput = document.getElementById('admin-schools-taught');
        const teacherExperience = {
            years: yearsInput ? parseInt(yearsInput.value, 10) || 0 : 0,
            students: studentsInput ? parseInt(studentsInput.value, 10) || 0 : 0,
            schools: schoolsInput ? parseInt(schoolsInput.value, 10) || 0 : 0
        };
        // ... existing code ...
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

// Save admin changes to backend API and localStorage
async function saveAdminChanges() {
    // Record scroll position
    const scrollY = window.scrollY;
    console.log('Save changes function called');
    const saveBtn = document.getElementById('saveChangesBtn');
    if (!saveBtn) {
        console.error('Save button not found in DOM');
        return;
    }
    console.log('Save button found:', saveBtn);
    const originalBtnText = saveBtn.innerHTML;
    saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
    saveBtn.disabled = true;

    // Move input element declarations above validation
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

    // Check for missing required elements and show popout error if any are missing
    const missingInputs = [];
    if (!emailInput) missingInputs.push('Email');
    if (!formUrlInput) missingInputs.push('Registration Form URL');
    if (!nameInput) missingInputs.push('Name');
    if (!titleInput) missingInputs.push('Title');
    if (missingInputs.length > 0) {
        showAdminAlert('error', `Missing required input fields: ${missingInputs.join(', ')}. Please reload the page or contact support.`);
        saveBtn.innerHTML = originalBtnText;
        saveBtn.disabled = false;
        return;
    }

    // Validation
    let validationErrors = [];
    if (emailInput && emailInput.value.trim() && !isValidEmail(emailInput.value.trim())) {
        validationErrors.push('Please enter a valid email address.');
    }
    if (formUrlInput && formUrlInput.value.trim() && !isValidUrl(formUrlInput.value.trim())) {
        validationErrors.push('Please enter a valid registration form URL.');
    }
    if (assistantFormUrlInput && assistantFormUrlInput.value.trim() && !isValidUrl(assistantFormUrlInput.value.trim())) {
        validationErrors.push('Please enter a valid assistant application form URL.');
    }
    if (phoneInput && phoneInput.value.trim() && !isValidPhone(phoneInput.value.trim())) {
        validationErrors.push('Please enter a valid phone number.');
    }
    if (nameInput && !nameInput.value.trim()) {
        validationErrors.push('Name is required.');
    }
    if (titleInput && !titleInput.value.trim()) {
        validationErrors.push('Title is required.');
    }
    if (validationErrors.length > 0) {
        showAdminAlert('error', validationErrors.join('<br>'));
        // Scroll the save button into view and shake it for visibility
        if (saveBtn) {
            saveBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
            saveBtn.classList.add('shake');
            setTimeout(() => saveBtn.classList.remove('shake'), 600);
        }
        // Move the alert container just above the save button for better visibility
        const alertContainer = document.getElementById('adminAlertContainer');
        if (alertContainer && saveBtn && saveBtn.parentNode) {
            saveBtn.parentNode.insertBefore(alertContainer, saveBtn);
        }
        saveBtn.innerHTML = originalBtnText;
        saveBtn.disabled = false;
        return;
    }

    try {
        // Fetch current data from backend API
        const response = await fetch('/api/api?action=getData');
        if (!response.ok) throw new Error('Failed to fetch current data');
        const currentData = await response.json();

        // Always get the current site id
        const currentSiteId = await getCurrentSiteId();

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

        // Collect dynamic input values for qualifications, schools, centers, platforms
        const qualificationsInputs = document.querySelectorAll('#qualifications-list input');
        const qualifications = Array.from(qualificationsInputs).map(input => input.value.trim()).filter(Boolean);
        const schoolsInputs = document.querySelectorAll('#schools-list input');
        const schools = Array.from(schoolsInputs).map(input => input.value.trim()).filter(Boolean);
        const centersInputs = document.querySelectorAll('#centers-list input');
        const centers = Array.from(centersInputs).map(input => input.value.trim()).filter(Boolean);
        const platformsInputs = document.querySelectorAll('#platforms-list input');
        const platforms = Array.from(platformsInputs).map(input => input.value.trim()).filter(Boolean);

        // Start with current data to preserve all existing values
        const newData = {
            id: currentSiteId,
            ...(currentData?.data || {}),
            heroImage: (websiteData.heroImage || currentData?.data?.heroImage),
            aboutImage: (websiteData.aboutImage || currentData?.data?.aboutImage),
            personal: {
                name: nameInput?.value || currentData?.data?.personal?.name || '',
                title: titleInput?.value || currentData?.data?.personal?.title || '',
                subtitle: subtitleInput?.value || currentData?.data?.personal?.subtitle || 'History Teacher',
                heroHeading: heroHeadingInput?.value || currentData?.data?.personal?.heroHeading || 'Inspiring Minds Through Mathematics',
                experience: experienceInput?.value || currentData?.data?.personal?.experience || '',
                philosophy: philosophyInput ? philosophyInput.value : '',
                qualifications: qualifications
            },
            experience: {
                schools: schools,
                centers: centers,
                platforms: platforms
            },
            results: collectResultsData(),
            contact: {
                email: emailInput ? emailInput.value.trim() : '',
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

        // Defensive: Ensure empty arrays for empty lists
        if (!qualifications.length) newData.personal.qualifications = [];
        if (!schools.length) newData.experience.schools = [];
        if (!centers.length) newData.experience.centers = [];
        if (!platforms.length) newData.experience.platforms = [];

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

        // Save to backend API
        const saveResponse = await fetch('/api/api?action=saveData', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data: { id: currentSiteId, data: newData } })
        });
        const saveResult = await saveResponse.json();
        if (!saveResult.success) throw new Error(saveResult.message || 'Failed to save data');
            showAdminAlert('success', 'Changes saved successfully!');
        updateSiteContent(newData);
        if (window.resultsChart) {
            updateResultsChart(newData.results);
        }
        // Sync websiteData with latest saved images
        websiteData.heroImage = newData.heroImage;
        websiteData.aboutImage = newData.aboutImage;
    } catch (error) {
        console.error('Error saving changes:', error);
        showAdminAlert('error', `Failed to save changes: ${error.message}`);
    } finally {
        saveBtn.innerHTML = originalBtnText;
        saveBtn.disabled = false;
        // Restore scroll position
        window.scrollTo({ top: scrollY, behavior: 'auto' });
    }
}

// Helper function to collect results data from form
function collectResultsData() {
    const results = [];
    document.querySelectorAll('.result-item').forEach(item => {
        const subjectValue = item.querySelector('.result-input.subject-input').value;
        const astar = parseInt(item.querySelectorAll('.result-input')[1].value) || 0;
        const a = parseInt(item.querySelectorAll('.result-input')[2].value) || 0;
        const other = parseInt(item.querySelectorAll('.result-input')[3].value) || 0;
        if (subjectValue) {
            results.push({
                subject: subjectValue,
                name: subjectValue,
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

// Save website data to backend API
async function saveWebsiteData() {
    try {
        // Fetch current data from backend API
        const response = await fetch('/api/api?action=getData');
        if (!response.ok) throw new Error('Failed to fetch current data');
        const currentData = await response.json();
        const currentSiteId = await getCurrentSiteId();
        const dataToSave = {
            ...(currentData?.data || {}),
            heroImage: websiteData.heroImage || currentData?.data?.heroImage,
            aboutImage: websiteData.aboutImage || currentData?.data?.aboutImage
        };
        // Save to backend API (wrap in {id, data})
        const saveResponse = await fetch('/api/api?action=saveData', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data: { id: currentSiteId, data: dataToSave } })
        });
        const saveResult = await saveResponse.json();
        if (!saveResult.success) throw new Error(saveResult.message || 'Failed to save image data');
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

    subjectsGrid.innerHTML = subjects.map(subject => {
        let subjectName = [subject.subject, subject.name, subject.title, subject.label]
            .find(val => (typeof val === 'string' && val.trim()) || (typeof val === 'number' && val)) || 'Subject';
        subjectName = String(subjectName); // Always convert to string
        return `
        <div class="bg-white rounded-lg shadow-lg p-6 transform hover:-translate-y-1 transition-all duration-300">
            <div class="text-blue-600 mb-4 text-center">
                <i class="fas fa-book text-3xl"></i>
            </div>
            <h3 class="text-xl font-bold text-gray-800 text-center">${subjectName}</h3>
        </div>
        `;
    }).join('');
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
            toggleMenuButton('about', false);
            console.log('Qualifications title hidden: No qualifications data found in the database.');
        } else {
            toggleMenuButton('about', true);
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

// ... existing code ...
        // Helper to check if array is empty or only contains empty/whitespace strings
        function isArrayEmptyOrWhitespace(arr) {
            return !Array.isArray(arr) || arr.length === 0 || arr.every(item => !item || item.trim() === '');
        }
        // ... existing code ...

// Helper function to validate email
function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
// Helper function to validate URL
function isValidUrl(url) {
    try {
        if (!url) return true; // Allow empty (not required)
        new URL(url);
        return true;
    } catch (_) {
        return false;
    }
}
// Helper function to validate phone (simple)
function isValidPhone(phone) {
    return !phone || /^[\d\s\-+()]{7,}$/.test(phone);
}

// Add shake animation CSS if not present
if (!document.getElementById('shake-animation-style')) {
    const style = document.createElement('style');
    style.id = 'shake-animation-style';
    style.textContent = `
        .shake {
            animation: shake 0.6s cubic-bezier(.36,.07,.19,.97) both;
        }
        @keyframes shake {
            10%, 90% { transform: translateX(-2px); }
            20%, 80% { transform: translateX(4px); }
            30%, 50%, 70% { transform: translateX(-8px); }
            40%, 60% { transform: translateX(8px); }
        }
    `;
    document.head.appendChild(style);
}

// [SECURITY] All data load/save logic now uses backend API endpoints (api.php). No Supabase logic or secrets remain in frontend.

// Example: Load site data from backend
async function loadSiteData() {
    const response = await fetch('/api/api?action=getData');
    if (!response.ok) throw new Error('Failed to load site data');
    const data = await response.json();
    const siteContent = data.data || data;
    // Set global for teacher experience animation
    window.teacherExperienceData = siteContent.teacherExperience || { years: 10, students: 500, schools: 8 };
    return siteContent;
}

// Example: Save site data to backend
async function saveSiteData(data) {
    const response = await fetch('/api/api?action=saveData', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data })
    });
    const result = await response.json();
    if (!result.success) throw new Error(result.message || 'Failed to save site data');
}

// Drag and drop setup for image upload zones
function setupDragAndDrop(dropZone, fileInput, type) {
    if (!dropZone || !fileInput) return;

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
        });
    });

    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => {
            dropZone.classList.add('border-blue-500', 'dark:border-blue-400');
        });
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => {
            dropZone.classList.remove('border-blue-500', 'dark:border-blue-400');
        });
    });

    dropZone.addEventListener('drop', (e) => {
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            fileInput.files = files;
            fileInput.dispatchEvent(new Event('change'));
        }
    });

    // Also allow clicking the drop zone to open the file dialog
    dropZone.addEventListener('click', () => fileInput.click());
    dropZone.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            fileInput.click();
        }
    });
}

// --- Add handleImageUpload for admin image upload ---
async function handleImageUpload(file, type) {
    try {
        // Show spinner
        const spinnerId = type === 'hero' ? 'heroUploadSpinner' : 'aboutUploadSpinner';
        const spinner = document.getElementById(spinnerId);
        if (spinner) spinner.classList.remove('hidden');

        // Convert file to base64
        const toBase64 = file => new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
        });
        const base64 = await toBase64(file);

        // Always fetch the latest data before updating
        const currentData = await loadSiteData();
        websiteData = { ...currentData };
        if (type === 'hero') {
            websiteData.heroImage = base64;
        } else if (type === 'about') {
            websiteData.aboutImage = base64;
        }

        // Save the full websiteData object
        await saveSiteData(websiteData);
        showAdminAlert('success', `${type.charAt(0).toUpperCase() + type.slice(1)} image uploaded successfully!`);

        // Update preview with the new image
        updateAdminImagePreview(type, base64);
        // After upload, reload and update local websiteData
        const data = await loadSiteData();
        websiteData = { ...data };
        if (type === 'hero') {
            showAdminImagePreview('hero', data.heroImage);
        } else {
            showAdminImagePreview('about', data.aboutImage);
        }
    } catch (error) {
        console.error('Error uploading image:', error);
        showAdminAlert('error', `Failed to upload ${type} image: ${error.message}`);
    } finally {
        // Hide spinner
        const spinnerId = type === 'hero' ? 'heroUploadSpinner' : 'aboutUploadSpinner';
        const spinner = document.getElementById(spinnerId);
        if (spinner) spinner.classList.add('hidden');
    }
}

// --- Helper to update admin image preview ---
function updateAdminImagePreview(type, base64) {
    const previewId = type === 'hero' ? 'heroPreview' : 'aboutPreview';
    const preview = document.getElementById(previewId);
    if (preview) {
        const img = preview.querySelector('img');
        if (img && base64) {
            img.src = base64;
            preview.classList.remove('hidden');
        }
    }
}

// Helper to show image preview in admin panel
function showAdminImagePreview(type, url) {
    const previewId = type === 'hero' ? 'heroPreview' : 'aboutPreview';
    const preview = document.getElementById(previewId);
    if (!preview) return;
    const img = preview.querySelector('img');
    if (url) {
        img.src = url;
        preview.classList.remove('hidden');
    } else {
        preview.classList.add('hidden');
    }
}

// --- Patch: Always flatten results.subjects to results array on load ---
function normalizeResults(data) {
    if (data && data.results && Array.isArray(data.results.subjects)) {
        data.results = data.results.subjects;
        delete data.results.subjects;
    }
    return data;
}

// Patch all data loads to normalize results
async function loadSiteData() {
    const response = await fetch('/api/api?action=getData');
    if (!response.ok) throw new Error('Failed to load site data');
    const data = await response.json();
    return normalizeResults(data);
}

// Render Courses Teaching section
function updateCoursesTeachingGrid(subjects) {
    const coursesGrid = document.getElementById('courses-teaching-grid');
    if (!coursesGrid || !Array.isArray(subjects)) return;
    // Extract unique, non-empty subject names (prefer 'subject', fallback to 'name')
    const uniqueSubjects = Array.from(new Set(
        subjects
            .map(s => (typeof s.subject === 'string' && s.subject.trim()) ? s.subject.trim() : (typeof s.name === 'string' && s.name.trim()) ? s.name.trim() : null)
            .filter(Boolean)
    ));
    if (uniqueSubjects.length === 0) {
        coursesGrid.innerHTML = '<div class="col-span-full text-center text-gray-500">No courses available.</div>';
        return;
    }
    coursesGrid.innerHTML = uniqueSubjects.map(subjectName => `
        <div class="bg-white rounded-lg shadow-lg p-6 flex flex-col items-center justify-center transform hover:-translate-y-1 transition-all duration-300">
            <div class="text-blue-600 mb-4 text-center">
                <i class="fas fa-book-open text-3xl"></i>
            </div>
            <h3 class="text-xl font-bold text-blue-600 text-center">${subjectName}</h3>
        </div>
    `).join('');
}

// Call updateCoursesTeachingGrid when site data is loaded
// In updateSiteContent, after updating other sections:


// --- Modern Drag-and-Drop and File Upload for Hero/About Images ---

function setupModernImageUpload({
    dropZoneId,
    inputId,
    previewId,
    uploadBtnId,
    removeBtnId,
    spinnerId,
    type
}) {
    const dropZone = document.getElementById(dropZoneId);
    const fileInput = document.getElementById(inputId);
    const preview = document.getElementById(previewId);
    const uploadBtn = document.getElementById(uploadBtnId);
    const removeBtn = document.getElementById(removeBtnId);
    const spinner = document.getElementById(spinnerId);

    if (!dropZone || !fileInput || !preview || !uploadBtn || !removeBtn) return;

    // Click upload button or drop zone opens file dialog
    uploadBtn.addEventListener('click', (e) => {
        e.preventDefault();
        fileInput.click();
    });
    dropZone.addEventListener('click', (e) => {
        // Only trigger if not clicking the upload button inside
        if (e.target === dropZone) fileInput.click();
    });
    dropZone.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' || e.key === ' ') fileInput.click();
    });
    dropZone.setAttribute('tabindex', '0');
    dropZone.setAttribute('role', 'button');
    dropZone.setAttribute('aria-label', `Upload ${type} image by clicking or dropping a file`);

    // Drag events for visual feedback
    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropZone.classList.add('ring-2', 'ring-purple-400', 'border-purple-400');
        });
    });
    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropZone.classList.remove('ring-2', 'ring-purple-400', 'border-purple-400');
        });
    });
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
            handleSelectedFile(files[0]);
        }
    });

    // File input change
    fileInput.addEventListener('change', (e) => {
        if (fileInput.files && fileInput.files.length > 0) {
            handleSelectedFile(fileInput.files[0]);
        }
    });

    // Remove image
    removeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        preview.classList.add('hidden');
        if (type === 'hero') {
            websiteData.heroImage = '';
        } else {
            websiteData.aboutImage = '';
        }
        fileInput.value = '';
        // Optionally, update backend to remove image
        showAdminAlert('info', `${type.charAt(0).toUpperCase() + type.slice(1)} image removed.`);
    });

    // Handle file selection (from input or drop)
    async function handleSelectedFile(file) {
        if (!file || !file.type.startsWith('image/')) {
            showAdminAlert('error', 'Please select a valid image file.');
            return;
        }
        // Show spinner
        if (spinner) spinner.classList.remove('hidden');
        // Show preview immediately
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = preview.querySelector('img');
            if (img) {
                img.src = e.target.result;
                preview.classList.remove('hidden');
            }
        };
        reader.readAsDataURL(file);
        // Upload logic
        try {
            await handleImageUpload(file, type);
            fileInput.value = '';
        } catch (err) {
            showAdminAlert('error', `Failed to upload image: ${err.message}`);
        } finally {
            if (spinner) spinner.classList.add('hidden');
        }
    }
}

// Initialize both hero and about image uploaders
setupModernImageUpload({
    dropZoneId: 'heroDropZone',
    inputId: 'heroImageInput',
    previewId: 'heroPreview',
    uploadBtnId: 'heroUploadBtn',
    removeBtnId: 'removeHeroBtn',
    spinnerId: 'heroUploadSpinner',
    type: 'hero'
});
setupModernImageUpload({
    dropZoneId: 'aboutDropZone',
    inputId: 'aboutImageInput',
    previewId: 'aboutPreview',
    uploadBtnId: 'aboutUploadBtn',
    removeBtnId: 'removeAboutBtn',
    spinnerId: 'aboutUploadSpinner',
    type: 'about'
});

document.addEventListener('DOMContentLoaded', function() {
  // All Reviews page navigation
  const goToTemplate1 = document.getElementById('goToTemplate1');
  if (goToTemplate1) {
    goToTemplate1.addEventListener('click', function() {
      window.location.href = 'template1/index.html';
    });
  }
  // Sort buttons (hover handled by CSS)
  // FFF Explore Features button
  const exploreFeaturesBtn = document.getElementById('exploreFeaturesBtn');
  if (exploreFeaturesBtn) {
    exploreFeaturesBtn.addEventListener('click', function() {
      const features = document.getElementById('features');
      if (features) features.scrollIntoView({behavior: 'smooth'});
    });
  }
});

document.addEventListener('DOMContentLoaded', function() {
    var yearEl = document.getElementById('current-year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();
    if (typeof loadApprovedReviews === 'function') {
        loadApprovedReviews();
    }
});

// ... existing code ...
// Animate numbers in Teacher Experience section
function animateCountUp(elementId, endValue, duration = 1200) {
    const el = document.getElementById(elementId);
    if (!el) return;
    let startTimestamp = null;
    const startValue = 0;
    function easeOutQuad(t) { return t * (2 - t); }
    function step(timestamp) {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const easedProgress = easeOutQuad(progress);
        const currentValue = Math.floor(startValue + (endValue - startValue) * easedProgress);
        el.textContent = currentValue + '+';
        if (progress < 1) {
            requestAnimationFrame(step);
        } else {
            el.textContent = endValue + '+';
        }
    }
    requestAnimationFrame(step);
}

// Trigger animation when section is in viewport
function handleTeacherExperienceAnimation() {
    const section = document.getElementById('teacher-experience');
    if (!section) return;
    let animated = false;
    function onScroll() {
        const rect = section.getBoundingClientRect();
        if (!animated && rect.top < window.innerHeight && rect.bottom > 0) {
            animateCountUp('yearsExperience', window.teacherExperienceData?.years || 10);
            animateCountUp('studentsTaught', window.teacherExperienceData?.students || 500);
            animateCountUp('schoolsTaught', window.teacherExperienceData?.schools || 8);
            animated = true;
            window.removeEventListener('scroll', onScroll);
        }
    }
    window.addEventListener('scroll', onScroll);
    onScroll();
}
document.addEventListener('DOMContentLoaded', handleTeacherExperienceAnimation);
// ... existing code ...

// ... existing code ...
// Helper to render qualifications as multiple input boxes
function renderQualificationsInputs(qualifications) {
    const list = document.getElementById('qualifications-list');
    if (!list) return;
    list.innerHTML = '';
    const showDelete = (qualifications && qualifications.length > 1);
    (qualifications && qualifications.length ? qualifications : ['']).forEach((qual, idx, arr) => {
        const wrapper = document.createElement('div');
        wrapper.className = 'flex items-center gap-2';
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'admin-panel-input flex-1';
        input.value = qual;
        input.placeholder = 'Qualification';
        input.dataset.idx = idx;
        if (showDelete) {
            const delBtn = document.createElement('button');
            delBtn.type = 'button';
            delBtn.className = 'ml-2 text-red-500 hover:text-red-700 focus:outline-none';
            delBtn.setAttribute('aria-label', 'Delete qualification');
            delBtn.innerHTML = '&times;';
            delBtn.onclick = () => {
                const newValues = Array.from(list.querySelectorAll('input')).map((el, i) => i !== idx ? el.value : null).filter(v => v !== null);
                renderQualificationsInputs(newValues);
            };
            wrapper.appendChild(input);
            wrapper.appendChild(delBtn);
        } else {
            wrapper.appendChild(input);
        }
        list.appendChild(wrapper);
    });
}

function renderExperienceInputs(field, values) {
    const list = document.getElementById(`${field}-list`);
    if (!list) return;
    list.innerHTML = '';
    const showDelete = (values && values.length > 1);
    (values && values.length ? values : ['']).forEach((val, idx, arr) => {
        const wrapper = document.createElement('div');
        wrapper.className = 'flex items-center gap-2';
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'admin-panel-input flex-1';
        input.value = val;
        input.placeholder = field.charAt(0).toUpperCase() + field.slice(1);
        input.dataset.idx = idx;
        if (showDelete) {
            const delBtn = document.createElement('button');
            delBtn.type = 'button';
            delBtn.className = 'ml-2 text-red-500 hover:text-red-700 focus:outline-none';
            delBtn.setAttribute('aria-label', `Delete ${field}`);
            delBtn.innerHTML = '&times;';
            delBtn.onclick = () => {
                const newValues = Array.from(list.querySelectorAll('input')).map((el, i) => i !== idx ? el.value : null).filter(v => v !== null);
                renderExperienceInputs(field, newValues);
            };
            wrapper.appendChild(input);
            wrapper.appendChild(delBtn);
        } else {
            wrapper.appendChild(input);
        }
        list.appendChild(wrapper);
    });
}
// ... existing code ...

function addQualificationInput() {
    const list = document.getElementById('qualifications-list');
    if (!list) return;
    // Gather current values
    const values = Array.from(list.querySelectorAll('input')).map(input => input.value);
    values.push('');
    renderQualificationsInputs(values);
}

function addExperienceInput(field) {
    const list = document.getElementById(`${field}-list`);
    if (!list) return;
    // Gather current values
    const values = Array.from(list.querySelectorAll('input')).map(input => input.value);
    values.push('');
    renderExperienceInputs(field, values);
}

document.addEventListener('DOMContentLoaded', () => {
    // Ensure at least one input and X button is visible for each dynamic list
    renderQualificationsInputs([]);
    renderExperienceInputs('schools', []);
    renderExperienceInputs('centers', []);
    renderExperienceInputs('platforms', []);

    const addBtn = document.getElementById('add-qualification-btn');
    if (addBtn) {
        addBtn.addEventListener('click', addQualificationInput);
    }
    const addSchoolsBtn = document.getElementById('add-schools-btn');
    if (addSchoolsBtn) {
        addSchoolsBtn.addEventListener('click', () => addExperienceInput('schools'));
    }
    const addCentersBtn = document.getElementById('add-centers-btn');
    if (addCentersBtn) {
        addCentersBtn.addEventListener('click', () => addExperienceInput('centers'));
    }
    const addPlatformsBtn = document.getElementById('add-platforms-btn');
    if (addPlatformsBtn) {
        addPlatformsBtn.addEventListener('click', () => addExperienceInput('platforms'));
    }
});
// ... existing code ...

// Helper: Map section IDs to menu button selectors
const sectionMenuMap = {
  about: ['a.nav-link[href="#about"]', 'a.mobile-nav-link[href="#about"]'],
  subjects: ['a.nav-link[href="#subjects"]', 'a.mobile-nav-link[href="#subjects"]'],
  results: ['a.nav-link[href="#results"]', 'a.mobile-nav-link[href="#results"]'],
  experience: ['a.nav-link[href="#experience"]', 'a.mobile-nav-link[href="#experience"]'],
  reviews: ['a.nav-link[href="#reviews"]', 'a.mobile-nav-link[href="#reviews"]'],
  register: ['a.nav-link[href="#register"]', 'a.mobile-nav-link[href="#register"]'],
  contact: ['a.nav-link[href="#contact"]', 'a.mobile-nav-link[href="#contact"]'],
};

function toggleMenuButton(sectionId, visible) {
  const selectors = sectionMenuMap[sectionId] || [];
  selectors.forEach(sel => {
    const btn = document.querySelector(sel);
    if (btn) {
      btn.style.display = visible ? '' : 'none';
      btn.setAttribute('aria-hidden', visible ? 'false' : 'true');
      btn.tabIndex = visible ? 0 : -1;
    }
  });
  adjustNavLinksAlignment();
}

function adjustNavLinksAlignment() {
  const navLinks = document.querySelector('.nav-links');
  if (!navLinks) return;
  // Only count visible menu items
  const visibleItems = Array.from(navLinks.children).filter(li => li.offsetParent !== null);
  if (visibleItems.length <= 2) {
    navLinks.classList.remove('justify-center');
    navLinks.classList.add('justify-start');
  } else {
    navLinks.classList.remove('justify-start');
    navLinks.classList.add('justify-center');
  }
}

// Call after toggling menu buttons
document.addEventListener('DOMContentLoaded', adjustNavLinksAlignment);
