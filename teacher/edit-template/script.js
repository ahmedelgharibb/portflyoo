// script.js

// Preloader
window.addEventListener('load', () => {
    const preloader = document.querySelector('.preloader');
    if (preloader) {
        preloader.classList.add('fade-out');
        setTimeout(() => {
            preloader.style.display = 'none';
        }, 600);
    }
});

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

// Supabase setup
const SUPABASE_URL = 'https://jckwvrzcjuggnfcbogrr.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impja3d2cnpjanVnZ25mY2JvZ3JyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA2OTIwMTYsImV4cCI6MjA1NjI2ODAxNn0.p2a0om1X40AJVhldUdtaU-at0SSPz6hLbrAg-ELHcnY';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

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
        // Try to load from Supabase
        try {
            const { data, error } = await supabase
                .from('site_data')
                .select('data')
                .eq('id', 1)
                .single();
            
            if (error) {
                console.error('Error loading initial data from Supabase:', error);
                // Data doesn't exist or there was an error, restore it
                console.log('Attempting to restore data to Supabase...');
                await restoreDataToSupabase();
            } else if (data && data.data) {
                siteData = data.data;
                console.log('✅ Initial data loaded from Supabase successfully');
                updateSiteContent(siteData);
            } else {
                console.log('No initial data found in Supabase');
                console.log('Attempting to restore data to Supabase...');
                await restoreDataToSupabase();
            }
        } catch (error) {
            console.error('Error during initialization:', error);
            await restoreDataToSupabase();
        }
    } catch (error) {
        console.error('Error during initialization:', error);
        initializeWithDefaultData();
    }
    
    // Setup admin panel event listeners if present and user is logged in
    if (isLoggedIn) {
        if (closeAdminPanelBtn) closeAdminPanelBtn.addEventListener('click', closeAdminPanel);
        if (saveChangesBtn) saveChangesBtn.addEventListener('click', saveAdminChanges);
        
        // Add result button
        if (addResultBtn) addResultBtn.addEventListener('click', addNewResult);
        
        // Logout button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) logoutBtn.addEventListener('click', adminLogout);
    }
    
    // Set up danger zone functionality
    setupDangerZone();
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
            .from('site_data')
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
            .from('site_data')
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
        results: [
            {name: 'Mathematics', score: 85},
            {name: 'Physics', score: 78},
            {name: 'Chemistry', score: 82},
            {name: 'Biology', score: 75}
        ],
        contact: {
            email: 'ahmed.mahmoud@mathseducator.com',
            formUrl: 'https://forms.google.com/your-form-link',
            assistantFormUrl: 'https://forms.google.com/assistant-form-link',
            phone: '+1 123-456-7890',
            contactMessage: 'Thank you for your interest in my teaching services. I will get back to you as soon as possible.'
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
    if (mobileMenu) {
        mobileMenu.classList.toggle('active');
        body.classList.toggle('menu-open');
    }
}

function closeMenu() {
    if (mobileMenu) {
        mobileMenu.classList.remove('active');
        body.classList.remove('menu-open');
    }
}

if (menuBtn) menuBtn.addEventListener('click', toggleMenu);
if (closeMenuBtn) closeMenuBtn.addEventListener('click', closeMenu);

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
    const navbar = document.querySelector('.navbar');
    if (navbar) {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    }
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
    const showDangerBtn = document.getElementById('showDangerBtn');
    const toggleDangerBtn = document.getElementById('toggleDangerBtn');
    const clearDataBtn = document.getElementById('clearDataBtn');
    
    // Only set up these listeners if user is logged in
    if (!isLoggedIn) return;
    
    // Set up toggle danger zone listener
    if (showDangerBtn) {
        showDangerBtn.addEventListener('click', toggleDangerZone);
    }
    
    // Set up hide danger zone listener
    if (toggleDangerBtn) {
        toggleDangerBtn.addEventListener('click', toggleDangerZone);
    }
    
    // Set up clear data listener
    if (clearDataBtn) {
        clearDataBtn.addEventListener('click', clearAllData);
    }
    
    // Set up admin panel event listeners
    document.addEventListener('adminPanelOpened', function() {
        if (showDangerBtn) showDangerBtn.classList.remove('hidden');
    });
    
    document.addEventListener('adminPanelClosed', function() {
        if (showDangerBtn) showDangerBtn.classList.add('hidden');
        if (dangerZone) dangerZone.classList.add('hidden');
    });
}

// Toggle danger zone visibility
function toggleDangerZone() {
    const dangerZone = document.getElementById('dangerZone');
    const showDangerBtn = document.getElementById('showDangerBtn');
    
    if (dangerZone) {
        if (dangerZone.classList.contains('hidden')) {
            dangerZone.classList.remove('hidden');
            showDangerBtn.classList.add('hidden');
        } else {
            dangerZone.classList.add('hidden');
            showDangerBtn.classList.remove('hidden');
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
        
        // Save login state
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
function showAdminAlert(type, message, inLoginModal = false) {
    // Determine which alert container to use
    const alertContainerId = inLoginModal ? 'loginAlertContainer' : 'adminAlertContainer';
    const alertContainer = document.getElementById(alertContainerId);
    
    if (!alertContainer) {
        console.error(`Alert container ${alertContainerId} not found`);
        // Fallback to JavaScript alert if container not found
        alert(message);
        return;
    }
    
    const alertClass = type === 'success' ? 'bg-green-100 border-green-400 text-green-700' : 'bg-red-100 border-red-400 text-red-700';
    
    const alertElement = document.createElement('div');
    alertElement.className = `${alertClass} px-4 py-3 rounded relative mb-4 border`;
    alertElement.innerHTML = `
        <span class="block sm:inline">${message}</span>
        <span class="absolute top-0 bottom-0 right-0 px-4 py-3">
            <i class="fas fa-times cursor-pointer"></i>
        </span>
    `;
    
    // Add click event to close button
    const closeBtn = alertElement.querySelector('i');
    closeBtn.addEventListener('click', () => {
        alertElement.remove();
    });
    
    // Clear any existing alerts
    alertContainer.innerHTML = '';
    
    // Add the new alert
    alertContainer.appendChild(alertElement);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (alertElement.parentNode === alertContainer) {
            alertElement.remove();
        }
    }, 5000);
}

// Open admin panel and load data
async function openAdminPanel() {
    console.log('Opening admin panel, login status:', isLoggedIn);
    
    // Double-check login status
    if (sessionStorage.getItem('adminLoggedIn') === 'true') {
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
        
        // Try to load from Supabase
        try {
            console.log('Attempting to load data from Supabase');
            const { data, error } = await supabase
                .from('site_data')
                .select('data')
                .eq('id', 1)
                .single();
            
            console.log('Supabase query response:', data, error);
            
            if (error) {
                console.error('Error loading from Supabase:', error);
                showAdminAlert('error', 'Failed to load data from database. Using local data instead.');
            } else if (data && data.data) {
                console.log('✅ Raw data from Supabase:', data);
                console.log('✅ Parsed data structure:', JSON.stringify(data.data, null, 2));
                siteData = data.data;
                dataLoaded = true;
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
        
        // If neither worked, use default data
        if (!dataLoaded || !siteData) {
            console.log('No data found in any storage, using defaults');
            initializeWithDefaultData();
            dataSource = 'default';
            showAdminAlert('success', 'Using default data as no saved data was found.');
        }
        
        console.log(`FINAL DATA LOAD [source: ${dataSource}]:`, JSON.stringify(siteData, null, 2));
        
        // Check data structure before form population
        if (!siteData) {
            console.error('CRITICAL ERROR: siteData is null or undefined after all attempts to load');
            showAdminAlert('error', 'Failed to load any data. Please refresh and try again.');
            return;
        }
        
        // Validate data structure
        const hasPersonalData = siteData.personal || siteData.personalInfo;
        const hasExperienceData = siteData.experience;
        const hasResults = Array.isArray(siteData.results);
        const hasContactData = siteData.contact;
        
        console.log('Data validation before form population:', {
            hasPersonalData,
            hasExperienceData,
            hasResults,
            hasContactData
        });
        
        // Populate admin form with data
        populateAdminForm(siteData);
        
        // Verify form population after completion
        validateFormPopulation(siteData);
        
        // Show admin panel
        if (adminPanel) {
            adminPanel.classList.remove('hidden');
            body.classList.add('overflow-hidden');
            
            // Also show the danger zone button
            if (showDangerBtn) {
                showDangerBtn.classList.remove('hidden');
            }
            
            // Dispatch admin panel opened event
            document.dispatchEvent(new CustomEvent('adminPanelOpened'));
        } else {
            console.error('Admin panel element not found');
            alert('Error: Admin panel not found. Please refresh the page and try again.');
        }
    } catch (error) {
        console.error('Error opening admin panel:', error);
        showAdminAlert('error', `Failed to open admin panel: ${error.message}. Please try again.`);
    }
}

// Validate that form was properly populated
function validateFormPopulation(data) {
    console.log('Validating form population with data:', JSON.stringify(data, null, 2));
    
    // Get form element values
    const nameInput = document.getElementById('admin-name');
    const titleInput = document.getElementById('admin-title');
    const experienceInput = document.getElementById('admin-experience');
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
        experience: experienceInput ? experienceInput.value : 'element not found',
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
        const experienceInput = document.getElementById('admin-experience');
        const qualificationsInput = document.getElementById('admin-qualifications');
        
        // Log which elements were found
        console.log('Form elements found:', {
            nameInput: !!nameInput,
            titleInput: !!titleInput,
            experienceInput: !!experienceInput,
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
        
        if (experienceInput) {
            experienceInput.value = personalData.experience || '';
            console.log(`Set experience input to "${personalData.experience || ''}"`);
        } else {
            console.error('admin-experience input not found in DOM');
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
            const platforms = experienceData.platforms || [];
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
        
        console.log('✅ Admin form population completed');
    } catch (error) {
        console.error('Error populating admin form:', error);
        showAdminAlert('error', `There was an error loading form fields: ${error.message}`);
    }
}

// Populate results form
function populateResultsForm(subjects) {
    if (!adminResultsContainer) return;
    
    // Clear container
    adminResultsContainer.innerHTML = '';
    
    // Add each subject
    subjects.forEach((subject, index) => {
        addResultItem(subject.name, subject.score);
    });
    
    // Add an empty one if none exist
    if (subjects.length === 0) {
        addResultItem('', '');
    }
}

// Add a new result item to the form
function addResultItem(name = '', score = '') {
    if (!adminResultsContainer) return;
    
    const resultItem = document.createElement('div');
    resultItem.className = 'admin-result-row flex items-center gap-4 mb-4 p-4 bg-gray-50 rounded-lg';
    resultItem.innerHTML = `
        <div class="flex-grow">
            <label class="block text-sm font-medium text-gray-700 mb-1">Subject Name</label>
            <input type="text" class="subject-name form-input w-full" value="${name}" placeholder="e.g. Mathematics">
        </div>
        <div class="w-24">
            <label class="block text-sm font-medium text-gray-700 mb-1">Score (%)</label>
            <input type="number" class="subject-score form-input w-full" value="${score}" min="0" max="100" placeholder="0-100">
        </div>
        <div>
            <button type="button" class="remove-result-btn mt-6 p-2 bg-red-100 text-red-600 rounded hover:bg-red-200 transition-colors">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    // Add event listener to remove button
    const removeBtn = resultItem.querySelector('.remove-result-btn');
    if (removeBtn) {
        removeBtn.addEventListener('click', () => {
            resultItem.remove();
        });
    }
    
    adminResultsContainer.appendChild(resultItem);
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
    
    console.log('DOM elements initialized');
    
    // Log which admin elements were found
    console.log('Admin elements found:', {
        adminBtn: !!adminBtn,
        adminBtnMobile: !!adminBtnMobile,
        adminPanel: !!adminPanel,
        adminLoginModal: !!adminLoginModal,
        exitLoginBtn: !!exitLoginBtn
    });
}

// Update site content with new data
function updateSiteContent(data) {
    try {
        console.log('Updating site content with new data');
        
        if (!data) {
            console.error('No data provided to updateSiteContent');
            return;
        }
        
        // For compatibility, check both personal and personalInfo
        const personalData = data.personal || data.personalInfo || {};
        
        // Update page title
        if (personalData.name && personalData.title) {
            document.title = `${personalData.name} - ${personalData.title}`;
        }
        
        // Update name in navigation
        const navName = document.querySelector('header nav a.text-2xl');
        if (navName && personalData.name) {
            navName.textContent = personalData.name;
        }
        
        // Update hero section
        const heroTitle = document.querySelector('#hero h1');
        if (heroTitle) {
            const spanElement = heroTitle.querySelector('span');
            const spanHTML = spanElement ? spanElement.outerHTML : '<span class="text-yellow-400">Mathematics</span>';
            heroTitle.innerHTML = `Inspiring Minds Through ${spanHTML}`;
        }
        
        const heroDesc = document.querySelector('#hero p.text-lg');
        if (heroDesc && personalData.experience) {
            heroDesc.textContent = personalData.experience;
        }
        
        // Update about section
        const qualsList = document.querySelector('#about ul');
        if (qualsList && Array.isArray(personalData.qualifications)) {
            qualsList.innerHTML = personalData.qualifications.map(qual => `
                <li class="flex items-center">
                    <i class="fas fa-graduation-cap text-blue-600 mr-3"></i>
                    <span>${qual}</span>
                </li>
            `).join('');
        }
        
        // Update experience section
        const experienceData = data.experience || {};
        
        const schoolsList = document.querySelector('#experience .experience-card:nth-child(1) ul');
        if (schoolsList && Array.isArray(experienceData.schools)) {
            schoolsList.innerHTML = experienceData.schools.map(school => `
                <li class="flex items-center">
                    <i class="fas fa-check text-green-500 mr-2"></i>
                    <span>${school}</span>
                </li>
            `).join('');
        }
        
        const centersList = document.querySelector('#experience .experience-card:nth-child(2) ul');
        if (centersList && Array.isArray(experienceData.centers)) {
            centersList.innerHTML = experienceData.centers.map(center => `
                <li class="flex items-center">
                    <i class="fas fa-check text-green-500 mr-2"></i>
                    <span>${center}</span>
                </li>
            `).join('');
        }
        
        const platformsList = document.querySelector('#experience .experience-card:nth-child(3) ul');
        if (platformsList && Array.isArray(experienceData.platforms)) {
            platformsList.innerHTML = experienceData.platforms.map(platform => `
                <li class="flex items-center">
                    <i class="fas fa-check text-green-500 mr-2"></i>
                    <span>${platform}</span>
                </li>
            `).join('');
        }
        
        // Update results chart - wrap in try/catch to prevent errors from breaking everything
        try {
            const resultsData = data.results || [];
            console.log('Results data for chart update:', JSON.stringify(resultsData, null, 2));
            
            if (!Array.isArray(resultsData)) {
                console.error('Results data is not an array:', typeof resultsData);
                return;
            }
            
            if (resultsData.length === 0) {
                console.warn('Results data array is empty, skipping chart update');
                return;
            }
            
            // Validate the structure of results data
            const validResults = resultsData.every(item => 
                item && typeof item === 'object' && 'name' in item && 'score' in item);
                
            if (!validResults) {
                console.error('Invalid results data structure:', resultsData);
                // Try to fix the data if possible
                const fixedResults = resultsData.filter(item => 
                    item && typeof item === 'object' && 'name' in item && 'score' in item);
                    
                if (fixedResults.length > 0) {
                    console.log('Using fixed results data:', fixedResults);
                    updateResultsChart(fixedResults);
                }
                return;
            }
            
            console.log('Updating chart with valid results data');
            updateResultsChart(resultsData);
        } catch (chartError) {
            console.error('Error updating chart:', chartError);
        }
        
        // Update contact form
        const contactData = data.contact || {};
        
        // Ensure all contact fields have default values if missing
        contactData.email = contactData.email || 'ahmed.mahmoud@mathseducator.com';
        contactData.formUrl = contactData.formUrl || 'https://forms.google.com/your-form-link';
        contactData.assistantFormUrl = contactData.assistantFormUrl || 'https://forms.google.com/assistant-form-link';
        contactData.phone = contactData.phone || '+1 123-456-7890';
        contactData.contactMessage = contactData.contactMessage || 'Thank you for your interest in my teaching services.';
        
        // Update register button with form URL
        const registerBtn = document.querySelector('#register a.btn');
        if (registerBtn && contactData && contactData.formUrl) {
            registerBtn.href = contactData.formUrl;
        }
        
        // Update assistant application button with form URL if it exists
        const assistantBtn = document.querySelector('#assistant a.btn');
        if (assistantBtn && contactData && contactData.assistantFormUrl) {
            assistantBtn.href = contactData.assistantFormUrl;
        }
        
        // Update contact information if it exists
        const contactPhoneEl = document.querySelector('.contact-phone');
        if (contactPhoneEl && contactData && contactData.phone) {
            contactPhoneEl.textContent = contactData.phone;
        }
        
        const contactMessageEl = document.querySelector('.contact-message');
        if (contactMessageEl && contactData && contactData.contactMessage) {
            contactMessageEl.textContent = contactData.contactMessage;
        }
        
        console.log('✅ Site content updated successfully');
    } catch (error) {
        console.error('Error updating site content:', error);
    }
}

// Update results chart with new data
function updateResultsChart(subjects) {
    // Ensure we have data to work with
    if (!subjects || !Array.isArray(subjects) || subjects.length === 0) {
        console.log('No chart data provided or invalid data format');
        return;
    }
    
    // Make sure Chart.js is loaded
    if (typeof Chart === 'undefined') {
        console.error('Chart.js is not loaded or available');
        return;
    }
    
    // Get the chart canvas
    const ctx = document.getElementById('resultsChart');
    if (!ctx) {
        console.error('Chart canvas element not found');
        return;
    }
    
    try {
        // First destroy any existing chart to prevent memory leaks and conflicts
        if (window.resultsChart && typeof window.resultsChart.destroy === 'function') {
            try {
                window.resultsChart.destroy();
                window.resultsChart = null;
            } catch (e) {
                console.error('Error destroying chart during data reset:', e);
            }
        }
        
        // Always create a fresh chart
        window.resultsChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: subjects.map(subject => subject.name),
                datasets: [{
                    label: 'Student Performance (%)',
                    data: subjects.map(subject => subject.score),
                    backgroundColor: [
                        'rgba(59, 130, 246, 0.8)',
                        'rgba(16, 185, 129, 0.8)',
                        'rgba(245, 158, 11, 0.8)',
                        'rgba(239, 68, 68, 0.8)'
                    ],
                    borderColor: [
                        'rgba(59, 130, 246, 1)',
                        'rgba(16, 185, 129, 1)',
                        'rgba(245, 158, 11, 1)',
                        'rgba(239, 68, 68, 1)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            callback: function(value) {
                                return value + '%';
                            }
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return context.raw + '%';
                            }
                        }
                    }
                },
                animation: {
                    duration: 1000,
                    easing: 'easeOutQuart'
                }
            }
        });
        console.log('✅ Chart created/updated successfully');
    } catch (error) {
        console.error('Failed to create/update chart:', error);
        // Don't throw error, just log it, to prevent breaking the save process
    }
}

// Save admin changes to Supabase and localStorage
async function saveAdminChanges() {
    // Show loading state on button
    const saveBtn = document.getElementById('saveChangesBtn');
    const originalBtnText = saveBtn.innerHTML;
    saveBtn.innerHTML = '<div class="admin-loading"></div> Saving...';
    saveBtn.disabled = true;

    try {
        // Get form elements or use defaults if not found
        const nameInput = document.getElementById('admin-name') || { value: 'Dr. Ahmed Mahmoud' };
        const titleInput = document.getElementById('admin-title') || { value: 'Mathematics Educator' };
        const experienceInput = document.getElementById('admin-experience') || { value: '15+ years of teaching experience' };
        const qualificationsInput = document.getElementById('admin-qualifications') || { value: '' };
        const schoolsInput = document.getElementById('admin-schools') || { value: '' };
        const centersInput = document.getElementById('admin-centers') || { value: '' };
        const platformsInput = document.getElementById('admin-platforms') || { value: '' };
        const emailInput = document.getElementById('admin-email') || { value: 'ahmed.mahmoud@mathseducator.com' };
        const formUrlInput = document.getElementById('admin-form-url') || { value: 'https://forms.google.com/your-form-link' };
        const assistantFormUrlInput = document.getElementById('admin-assistant-form-url') || { value: 'https://forms.google.com/assistant-form-link' };
        const phoneInput = document.getElementById('admin-phone') || { value: '+1 123-456-7890' };
        const contactMessageInput = document.getElementById('admin-contact-message') || { value: 'Thank you for your interest in my teaching services.' };

        // Collect data from form fields
        const newData = {
            personal: {
                name: nameInput.value,
                title: titleInput.value,
                experience: experienceInput.value,
                qualifications: qualificationsInput.value.split('\n').filter(item => item.trim() !== '')
            },
            experience: {
                schools: schoolsInput.value.split('\n').filter(item => item.trim() !== ''),
                centers: centersInput.value.split('\n').filter(item => item.trim() !== ''),
                platforms: platformsInput.value.split('\n').filter(item => item.trim() !== '')
            },
            results: collectResultsData(),
            contact: {
                email: emailInput.value,
                formUrl: formUrlInput.value,
                assistantFormUrl: assistantFormUrlInput.value,
                phone: phoneInput.value,
                contactMessage: contactMessageInput.value
            }
        };

        console.log('Saving data:', JSON.stringify(newData, null, 2));
        console.log('Results data specifically:', JSON.stringify(newData.results, null, 2));
        
        // Update our global state
        siteData = newData;

        // Save to Supabase with verification
        let supabaseSaveSuccess = false;
        try {
            console.log('Attempting to save to Supabase...');
            const { error } = await supabase
                .from('site_data')
                .upsert({ id: 1, data: newData }, { onConflict: 'id' });

            if (error) {
                console.error('Supabase upsert error:', error);
                throw new Error(`Supabase error: ${error.message}`);
            }
            
            // Verify the data was saved correctly
            console.log('Verifying Supabase data after save...');
            const { data: verifyData, error: verifyError } = await supabase
                .from('site_data')
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
            
            // Log the verification results
            console.log('✅ Supabase data verification successful');
            console.log('Saved data structure:', JSON.stringify(verifyData.data, null, 2));
            console.log('Saved results specifically:', JSON.stringify(verifyData.data.results, null, 2));
            
            supabaseSaveSuccess = true;
            console.log('✅ Data saved to Supabase successfully');
        } catch (supabaseError) {
            console.error('Failed to save to Supabase:', supabaseError);
            // We'll continue and try localStorage as backup
        }

        // Save to localStorage as backup
        try {
            localStorage.setItem('siteData', JSON.stringify(newData));
            console.log('✅ Data saved to localStorage successfully');
            
            // Verify localStorage save
            const storedData = localStorage.getItem('siteData');
            if (storedData) {
                const parsedData = JSON.parse(storedData);
                console.log('localStorage verification:', parsedData);
                console.log('localStorage results:', parsedData.results);
            }
        } catch (localStorageError) {
            console.error('Failed to save to localStorage:', localStorageError);
            
            // If both Supabase and localStorage failed, throw error
            if (!supabaseSaveSuccess) {
                throw new Error('Failed to save data to both Supabase and localStorage');
            }
        }

        // Update site content with new data
        console.log('Updating site content with new data...');
        updateSiteContent(newData);
        
        // Force update of results chart
        if (Array.isArray(newData.results) && newData.results.length > 0) {
            console.log('Force updating results chart with:', newData.results);
            try {
                updateResultsChart(newData.results);
            } catch (chartError) {
                console.error('Error updating chart after save:', chartError);
            }
        }
        
        // Show success message
        showAdminAlert('success', 'Changes saved successfully!');
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
    const resultsContainer = document.getElementById('admin-results-container');
    const resultRows = resultsContainer.querySelectorAll('.admin-result-row');
    const results = [];

    resultRows.forEach(row => {
        const nameInput = row.querySelector('.subject-name');
        const scoreInput = row.querySelector('.subject-score');
        
        if (nameInput && scoreInput) {
            const name = nameInput.value.trim();
            const scoreVal = parseInt(scoreInput.value);
            const score = isNaN(scoreVal) ? 0 : Math.min(Math.max(scoreVal, 0), 100);
            
            if (name) {
                results.push({ name, score });
            }
        }
    });

    return results;
}

// Add new result when clicking the Add Subject button
function addNewResult() {
    addResultItem('', '');
}

// Close admin panel
function closeAdminPanel() {
    console.log('Closing admin panel');
    
    if (adminPanel) {
        adminPanel.classList.add('hidden');
        body.classList.remove('overflow-hidden');
        
        // Also hide the danger zone and its button
        const dangerZone = document.getElementById('dangerZone');
        const showDangerBtn = document.getElementById('showDangerBtn');
        
        if (dangerZone) dangerZone.classList.add('hidden');
        if (showDangerBtn) showDangerBtn.classList.add('hidden');
        
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

// Clear all data
async function clearAllData() {
    if (!confirm('Are you sure you want to clear all data? This cannot be undone.')) {
        return;
    }
    
    try {
        // Show loading state on button
        const clearBtn = document.getElementById('clearDataBtn');
        const originalBtnText = clearBtn.innerHTML;
        clearBtn.innerHTML = '<div class="admin-loading"></div> Clearing...';
        clearBtn.disabled = true;
        
        // Clear from Supabase
        let supabaseClearSuccess = false;
        try {
            const { error } = await supabase
                .from('site_data')
                .delete()
                .eq('id', 1);
                
            if (error) {
                throw new Error(`Supabase error: ${error.message}`);
            }
            supabaseClearSuccess = true;
            console.log('✅ Data cleared from Supabase successfully');
        } catch (supabaseError) {
            console.error('Failed to clear data from Supabase:', supabaseError);
        }
        
        // Clear from localStorage
        try {
            localStorage.removeItem('siteData');
            console.log('✅ Data cleared from localStorage successfully');
        } catch (localStorageError) {
            console.error('Failed to clear data from localStorage:', localStorageError);
            
            if (!supabaseClearSuccess) {
                throw new Error('Failed to clear data from both Supabase and localStorage');
            }
        }
        
        // Reset to default data
        initializeWithDefaultData();
        
        // Repopulate admin form with default data
        populateAdminForm(siteData);
        
        // Reset chart
        if (window.resultsChart && typeof window.resultsChart.destroy === 'function') {
            try {
                window.resultsChart.destroy();
                window.resultsChart = null;
            } catch (e) {
                console.error('Error destroying chart during data reset:', e);
            }
        }
        
        // Show success message
        showAdminAlert('success', 'All data has been cleared and reset to defaults.');
    } catch (error) {
        console.error('Error clearing data:', error);
        showAdminAlert('error', `Failed to clear data: ${error.message}`);
    } finally {
        // Restore button state
        const clearBtn = document.getElementById('clearDataBtn');
        if (clearBtn) {
            clearBtn.innerHTML = '<i class="fas fa-trash-alt mr-2"></i> Clear All Data';
            clearBtn.disabled = false;
        }
    }
}