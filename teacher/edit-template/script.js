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

// DOM Elements
const menuBtn = document.getElementById('menuBtn');
const closeMenuBtn = document.getElementById('closeMenuBtn');
const mobileMenu = document.getElementById('mobileMenu');
const mobileMenuLinks = document.querySelectorAll('.mobile-nav-link');
const body = document.body;
const adminBtn = document.getElementById('adminBtn');
const adminBtnMobile = document.getElementById('adminBtnMobile');
const adminLoginModal = document.getElementById('adminLoginModal');
const adminLoginForm = document.getElementById('adminLoginForm');
const cancelLoginBtn = document.getElementById('cancelLogin');
const adminPanel = document.getElementById('adminPanel');
const closeAdminPanelBtn = document.getElementById('closeAdminPanel');
const saveChangesBtn = document.getElementById('saveChangesBtn');
const addResultBtn = document.getElementById('addResultBtn');
const adminResultsContainer = document.getElementById('admin-results-container');

// Global state
let siteData = null;
let isLoggedIn = false;

// Supabase setup
const SUPABASE_URL = 'https://jckwvrzcjuggnfcbogrr.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impja3d2cnpjanVnZ25mY2JvZ3JyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA2OTIwMTYsImV4cCI6MjA1NjI2ODAxNn0.p2a0om1X40AJVhldUdtaU-at0SSPz6hLbrAg-ELHcnY';
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Once the document is ready
document.addEventListener('DOMContentLoaded', async function() {
    console.log('Document ready, initializing...');
    
    // Define elements
    body = document.body;
    adminPanel = document.getElementById('adminPanel');
    adminBtn = document.getElementById('adminBtn');
    closeAdminBtn = document.getElementById('closeAdminBtn');
    saveChangesBtn = document.getElementById('saveChangesBtn');
    adminAlert = document.getElementById('adminAlert');
    adminResultsContainer = document.getElementById('admin-results');
    
    // Check if user is logged in (using sessionStorage for session-only login)
    isLoggedIn = sessionStorage.getItem('adminLoggedIn') === 'true';
    console.log('Login status:', isLoggedIn ? 'Logged in' : 'Not logged in');
    
    if (adminBtn) {
        if (isLoggedIn) {
            adminBtn.textContent = 'Open Admin Panel';
            adminBtn.addEventListener('click', openAdminPanel);
        } else {
            adminBtn.textContent = 'Admin Login';
            adminBtn.addEventListener('click', showLoginForm);
        }
    }
    
    // Initialize Supabase client
    try {
        // Load initial data
        const { data, error } = await supabaseClient
            .from('site_data')
            .select('data')
            .eq('id', 1)
            .single();
        
        if (error) {
            console.error('Error loading initial data from Supabase:', error);
            // Try to initialize with default data
            initializeWithDefaultData();
        } else if (data && data.data) {
            siteData = data.data;
            console.log('✅ Initial data loaded from Supabase successfully');
            updateSiteContent(siteData);
        } else {
            console.log('No initial data found in Supabase');
            initializeWithDefaultData();
        }
    } catch (error) {
        console.error('Error during initialization:', error);
        initializeWithDefaultData();
    }
    
    // Set up admin panel event listeners if logged in
    if (isLoggedIn) {
        if (closeAdminBtn) closeAdminBtn.addEventListener('click', closeAdminPanel);
        if (saveChangesBtn) saveChangesBtn.addEventListener('click', saveAdminChanges);
    }
    
    // Set up danger zone functionality
    setupDangerZone();
});

// Initialize with default data
function initializeWithDefaultData() {
    console.log('Using default data');
    siteData = {
        personalInfo: {
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
            onlinePlatforms: [
                'MathPro Online',
                'EduTech Academy',
                'Virtual Learning Center'
            ]
        },
        results: {
            subjects: [
                {name: 'Mathematics', score: 85},
                {name: 'Physics', score: 78},
                {name: 'Chemistry', score: 82},
                {name: 'Biology', score: 75}
            ]
        },
        contact: {
            email: 'teacher@example.com',
            formUrl: 'https://forms.google.com/your-form-link'
        }
    };
    
    // Apply default data to the page
    updateSiteContent(siteData);
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
mobileMenuLinks.forEach(link => {
    link.addEventListener('click', closeMenu);
});

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

// Dynamic Year in Footer
const footerBottom = document.querySelector('.footer-bottom');
if (footerBottom) {
    const year = new Date().getFullYear();
    
    // Try to get name from localStorage if available
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

// Admin Functionality
if (adminBtn) adminBtn.addEventListener('click', showAdminLogin);
if (adminBtnMobile) adminBtnMobile.addEventListener('click', showAdminLogin);
if (cancelLoginBtn) cancelLoginBtn.addEventListener('click', hideAdminLogin);
if (closeAdminPanelBtn) closeAdminPanelBtn.addEventListener('click', closeAdminPanel);
if (adminLoginForm) adminLoginForm.addEventListener('submit', handleAdminLogin);
if (saveChangesBtn) saveChangesBtn.addEventListener('click', saveAdminChanges);
if (addResultBtn) addResultBtn.addEventListener('click', addNewResult);

// Add logout functionality
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) logoutBtn.addEventListener('click', adminLogout);

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
function showAdminLogin() {
    if (isLoggedIn) {
        // If already logged in, just open the admin panel
        openAdminPanel();
        return;
    }
    
    if (adminLoginModal) {
        adminLoginModal.classList.remove('hidden');
        const passwordInput = document.getElementById('adminPassword');
        if (passwordInput) passwordInput.focus();
    }
}

// Hide admin login modal
function hideAdminLogin() {
    if (adminLoginModal) {
        adminLoginModal.classList.add('hidden');
        if (adminLoginForm) adminLoginForm.reset();
    }
}

// Handle admin login
async function handleAdminLogin(event) {
    event.preventDefault();
    
    const passwordInput = document.getElementById('adminPassword');
    if (!passwordInput) return;
    
    const password = passwordInput.value;
    if (!password) return;
    
    // Show a loading message
    const submitBtn = adminLoginForm.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="admin-loading"></span> Logging in...';
    
    // DIRECT CHECK: Always check password directly for reliability
    if (password === 'admin123') {
        console.log('✅ Login successful via direct password check');
        isLoggedIn = true;
        // Save login state to sessionStorage (cleared when browser is closed)
        sessionStorage.setItem('adminLoggedIn', 'true');
        hideAdminLogin();
        openAdminPanel(); 
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
        return;
    }
    
    // If direct check failed, show an error
    console.log('❌ Login failed: Invalid password');
    showAdminAlert('Invalid password. Please try again.', true);
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalBtnText;
}

// Show admin alert
function showAdminAlert(message, isError = false) {
    // Find the alert container
    const alertContainer = document.getElementById('adminAlertContainer');
    
    // If no container found, create one where needed
    let container = alertContainer;
    if (!container) {
        container = document.createElement('div');
        container.id = 'tempAlertContainer';
        container.className = 'mb-4';
        
        if (adminPanel && !adminPanel.classList.contains('hidden')) {
            // Add to admin panel
            const panelHeader = document.querySelector('#adminPanel .container > div:first-child');
            if (panelHeader) panelHeader.parentNode.insertBefore(container, panelHeader.nextSibling);
        } else {
            // Add to login modal
            const form = document.getElementById('adminLoginForm');
            if (form) form.parentNode.insertBefore(container, form);
        }
    }
    
    // Create alert element
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert ${isError ? 'bg-red-100 border-red-400 text-red-700' : 'bg-green-100 border-green-400 text-green-700'} px-4 py-3 rounded relative mb-4 border`;
    alertDiv.innerHTML = `
        <span class="block sm:inline">${message}</span>
        <span class="absolute top-0 bottom-0 right-0 px-4 py-3">
            <svg class="fill-current h-6 w-6" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <title>Close</title>
                <path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z"/>
            </svg>
        </span>
    `;
    
    // Add close button functionality
    const closeBtn = alertDiv.querySelector('svg');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => alertDiv.remove());
    }
    
    // Add to container
    container.appendChild(alertDiv);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (document.body.contains(alertDiv)) {
            alertDiv.style.opacity = '0';
            alertDiv.style.transition = 'opacity 0.5s';
            setTimeout(() => {
                if (document.body.contains(alertDiv)) {
                    alertDiv.remove();
                }
                
                // Also remove temp container if it's empty
                if (container.id === 'tempAlertContainer' && container.children.length === 0) {
                    container.remove();
                }
            }, 500);
        }
    }, 5000);
}

// Open admin panel and load data
async function openAdminPanel() {
    if (!isLoggedIn) return;
    
    try {
        // Try to load from Supabase
        try {
            const { data, error } = await supabaseClient
                .from('site_data')
                .select('data')
                .eq('id', 1)
                .single();
            
            if (error) {
                console.error('Error loading from Supabase:', error);
                // If no data is loaded yet, use defaults
                if (!siteData) {
                    initializeWithDefaultData();
                }
            } else if (data && data.data) {
                siteData = data.data;
                console.log('✅ Data loaded for admin panel from Supabase successfully');
            } else {
                console.log('No data found in Supabase for admin panel');
                // If no data is loaded yet, use defaults
                if (!siteData) {
                    initializeWithDefaultData();
                }
            }
        } catch (error) {
            console.error('Error in admin data loading:', error);
            // Use current data or defaults
            if (!siteData) {
                initializeWithDefaultData();
            }
        }
        
        // Populate admin form with data
        populateAdminForm(siteData);
        
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
        }
    } catch (error) {
        console.error('Error opening admin panel:', error);
        showAdminAlert('Failed to open admin panel. Please try again.', true);
    }
}

// Populate admin form with data
function populateAdminForm(data) {
    // Personal Info
    document.getElementById('admin-name').value = data.personalInfo.name || '';
    document.getElementById('admin-title').value = data.personalInfo.title || '';
    document.getElementById('admin-experience').value = data.personalInfo.experience || '';
    document.getElementById('admin-qualifications').value = (data.personalInfo.qualifications || []).join('\n');
    
    // Experience
    document.getElementById('admin-schools').value = (data.experience.schools || []).join('\n');
    document.getElementById('admin-centers').value = (data.experience.centers || []).join('\n');
    document.getElementById('admin-platforms').value = (data.experience.onlinePlatforms || []).join('\n');
    
    // Results
    populateResultsForm(data.results.subjects || []);
    
    // Contact
    document.getElementById('admin-email').value = data.contact.email || '';
    document.getElementById('admin-form-url').value = data.contact.formUrl || '';
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
    resultItem.className = 'admin-result-item';
    resultItem.innerHTML = `
        <input type="text" class="form-input subject-name" placeholder="Subject name" value="${name}">
        <input type="number" class="form-input subject-score" placeholder="Score" min="0" max="100" value="${score}">
        <button type="button" class="remove-btn">
            <i class="fas fa-trash-alt"></i>
        </button>
    `;
    
    // Add remove functionality
    const removeBtn = resultItem.querySelector('.remove-btn');
    if (removeBtn) {
        removeBtn.addEventListener('click', () => {
            // Only remove if there's more than one result item
            if (adminResultsContainer.children.length > 1) {
                resultItem.remove();
            }
        });
    }
    
    adminResultsContainer.appendChild(resultItem);
}

// Add a new empty result
function addNewResult() {
    addResultItem();
}

// Close admin panel
function closeAdminPanel() {
    if (adminPanel) {
        adminPanel.classList.add('hidden');
        body.classList.remove('overflow-hidden');
        
        // Also hide danger zone components
        if (showDangerBtn) {
            showDangerBtn.classList.add('hidden');
        }
        if (dangerZone) {
            dangerZone.classList.add('hidden');
        }
        
        // Dispatch admin panel closed event
        document.dispatchEvent(new CustomEvent('adminPanelClosed'));
    }
}

// Logout function
function adminLogout() {
    isLoggedIn = false;
    sessionStorage.removeItem('adminLoggedIn');
    closeAdminPanel();
    showAdminAlert('You have been logged out successfully.');
}

// Save admin changes
async function saveAdminChanges() {
    saveChangesBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Saving...';
    saveChangesBtn.disabled = true;
    
    try {
        // Collect data from form
        const updatedData = {
            personalInfo: {
                name: document.getElementById('admin-name').value,
                title: document.getElementById('admin-title').value,
                experience: document.getElementById('admin-experience').value,
                qualifications: Array.from(document.querySelectorAll('#admin-qualifications-list li'))
                    .map(li => li.textContent.trim())
                    .filter(text => text !== '')
            },
            experience: {
                schools: Array.from(document.querySelectorAll('#admin-schools-list li'))
                    .map(li => li.textContent.trim())
                    .filter(text => text !== ''),
                centers: Array.from(document.querySelectorAll('#admin-centers-list li'))
                    .map(li => li.textContent.trim())
                    .filter(text => text !== ''),
                onlinePlatforms: Array.from(document.querySelectorAll('#admin-platforms-list li'))
                    .map(li => li.textContent.trim())
                    .filter(text => text !== '')
            },
            results: {
                subjects: Array.from(document.querySelectorAll('#admin-results-list .result-item')).map(item => {
                    return {
                        name: item.querySelector('.subject-name').textContent.trim(),
                        score: parseInt(item.querySelector('.subject-score').textContent.trim())
                    };
                })
            },
            contact: {
                email: document.getElementById('admin-email').value,
                formUrl: document.getElementById('admin-form-url').value
            }
        };

        // Update the chart with new data (if needed)
        updateResultsChart(updatedData.results.subjects);
        
        // Save to Supabase
        const { data, error } = await supabaseClient
            .from('site_data')
            .upsert({ 
                id: 1, 
                data: updatedData,
                updated_at: new Date()
            })
            .select();
            
        if (error) {
            console.error('Error saving to Supabase:', error);
            throw new Error(`Failed to save to Supabase: ${error.message}`);
        }
        
        // Update local data reference
        siteData = updatedData;
        
        // Update website content with the new data
        updateSiteContent(siteData);
        
        showAdminAlert('Changes saved successfully! Data updated in Supabase.');
        console.log('✅ Changes saved to Supabase');
        
    } catch (error) {
        console.error('Error saving changes:', error);
        showAdminAlert('Failed to save changes. Please try again.', true);
    } finally {
        saveChangesBtn.innerHTML = '<i class="fas fa-save mr-2"></i> Save Changes';
        saveChangesBtn.disabled = false;
    }
}

// Update site content with new data
function updateSiteContent(data) {
    // Update page title
    document.title = `${data.personalInfo.name} - ${data.personalInfo.title}`;
    
    // Update name in navigation
    const navName = document.querySelector('header nav a.text-2xl');
    if (navName) navName.textContent = data.personalInfo.name;
    
    // Update hero section
    const heroTitle = document.querySelector('#hero h1');
    if (heroTitle) {
        const spanElement = heroTitle.querySelector('span');
        const spanHTML = spanElement ? spanElement.outerHTML : '<span class="text-yellow-400">Mathematics</span>';
        heroTitle.innerHTML = `Inspiring Minds Through ${spanHTML}`;
    }
    
    const heroDesc = document.querySelector('#hero p.text-lg');
    if (heroDesc) {
        heroDesc.textContent = data.personalInfo.experience;
    }
    
    // Update about section
    const qualsList = document.querySelector('#about ul');
    if (qualsList) {
        qualsList.innerHTML = data.personalInfo.qualifications.map(qual => `
            <li class="flex items-center">
                <i class="fas fa-graduation-cap text-blue-600 mr-3"></i>
                <span>${qual}</span>
            </li>
        `).join('');
    }
    
    // Update experience section
    const schoolsList = document.querySelector('#experience .experience-card:nth-child(1) ul');
    if (schoolsList) {
        schoolsList.innerHTML = data.experience.schools.map(school => `
            <li class="flex items-center">
                <i class="fas fa-check text-green-500 mr-2"></i>
                <span>${school}</span>
            </li>
        `).join('');
    }
    
    const centersList = document.querySelector('#experience .experience-card:nth-child(2) ul');
    if (centersList) {
        centersList.innerHTML = data.experience.centers.map(center => `
            <li class="flex items-center">
                <i class="fas fa-check text-green-500 mr-2"></i>
                <span>${center}</span>
            </li>
        `).join('');
    }
    
    const platformsList = document.querySelector('#experience .experience-card:nth-child(3) ul');
    if (platformsList) {
        platformsList.innerHTML = data.experience.onlinePlatforms.map(platform => `
            <li class="flex items-center">
                <i class="fas fa-check text-green-500 mr-2"></i>
                <span>${platform}</span>
            </li>
        `).join('');
    }
    
    // Update results chart - wrap in try/catch to prevent errors from breaking everything
    try {
        if (data.results && data.results.subjects) {
            updateResultsChart(data.results.subjects);
        }
    } catch (chartError) {
        console.error('Error updating chart:', chartError);
    }
    
    // Update contact form
    const registerBtn = document.querySelector('#register a.btn');
    if (registerBtn && data.contact && data.contact.formUrl) {
        registerBtn.href = data.contact.formUrl;
    }
}

// Update results chart with new data
function updateResultsChart(subjects) {
    // First destroy any existing chart to prevent memory leaks and conflicts
    if (window.resultsChart) {
        try {
            window.resultsChart.destroy();
            window.resultsChart = null;
        } catch (e) {
            console.error('Error destroying existing chart:', e);
        }
    }
    
    // Get the chart canvas
    const ctx = document.getElementById('resultsChart');
    if (!ctx) {
        console.error('Chart canvas element not found');
        return;
    }
    
    try {
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
        console.error('Failed to create chart:', error);
    }
}

// Initialize results chart
document.addEventListener('DOMContentLoaded', function() {
    // Initial chart data
    let subjectsData = [
        {name: 'Mathematics', score: 85},
        {name: 'Physics', score: 78},
        {name: 'Chemistry', score: 82},
        {name: 'Biology', score: 75}
    ];
    
    try {
        const storedData = localStorage.getItem('siteData');
        if (storedData) {
            const data = JSON.parse(storedData);
            if (data.results && data.results.subjects && data.results.subjects.length > 0) {
                subjectsData = data.results.subjects;
            }
        }
    } catch (error) {
        console.error('Error loading chart data:', error);
    }
    
    // Initialize the chart with data
    updateResultsChart(subjectsData);
});

// Contact form submission
document.addEventListener('DOMContentLoaded', function() {
    const contactForm = document.getElementById('contactForm');
    if (!contactForm) return;
    
    contactForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const submitBtn = contactForm.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<span class="loading"></span> Sending...';
        submitBtn.disabled = true;
        
        try {
            // Simulate form submission (in a real app, send to a server)
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            // Show success message
            contactForm.innerHTML = `
                <div class="text-center p-8">
                    <i class="fas fa-check-circle text-green-500 text-5xl mb-4"></i>
                    <h3 class="text-2xl font-bold text-gray-800 mb-2">Message Sent!</h3>
                    <p class="text-gray-600">Thank you for your message. I'll get back to you shortly.</p>
                </div>
            `;
        } catch (error) {
            console.error('Form submission error:', error);
            submitBtn.innerHTML = originalBtnText;
            submitBtn.disabled = false;
            
            // Show error message
            const errorMsg = document.createElement('div');
            errorMsg.className = 'text-red-500 mt-4';
            errorMsg.textContent = 'There was an error sending your message. Please try again.';
            contactForm.appendChild(errorMsg);
        }
    });
});

// Scroll reveal animations
document.addEventListener('DOMContentLoaded', function() {
    const revealElements = document.querySelectorAll('.reveal');
    
    const revealSection = function() {
        revealElements.forEach(element => {
            const elementTop = element.getBoundingClientRect().top;
            const elementVisible = 150;
            
            if (elementTop < window.innerHeight - elementVisible) {
                element.classList.add('active');
            }
        });
    };
    
    window.addEventListener('scroll', revealSection);
    revealSection();
});

// Clear all data
function clearAllData() {
    if (confirm('Are you sure you want to clear all saved data? This action cannot be undone.')) {
        // Clear localStorage data
        localStorage.removeItem('siteData');
        
        // Clear Supabase data
        supabaseClient
            .from('site_data')
            .delete()
            .eq('id', 1)
            .then(({ data, error }) => {
                if (error) {
                    console.error('Error clearing Supabase data:', error);
                } else {
                    console.log('✅ Supabase data cleared successfully');
                }
            });
        
        // Reset chart if it exists
        if (window.resultsChart) {
            try {
                window.resultsChart.destroy();
                window.resultsChart = null;
                console.log('✅ Chart destroyed successfully');
            } catch (chartError) {
                console.error('Error destroying chart:', chartError);
            }
        }
        
        // Show alert
        showAdminAlert('All saved data has been cleared. Reload the page to see default values.');
        
        // Disable the save button until page reload
        if (saveChangesBtn) {
            saveChangesBtn.disabled = true;
            saveChangesBtn.innerHTML = '<i class="fas fa-sync mr-2"></i> Reload Page Required';
        }
    }
}