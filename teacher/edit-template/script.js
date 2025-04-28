// Supabase configuration
const supabaseUrl = 'https://bqpchhitrbyfleqpyydz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJxcGNoaGl0cmJ5ZmxlcXB5eWR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM0NTU4ODgsImV4cCI6MjA1OTAzMTg4OH0.Yworu_EPLewJJGBFnW5W7GUsNZIONc3qOEJMTwJMzzQ';
let supabase;

// DOM Elements
const adminBtn = document.getElementById('adminBtn');
const adminLoginModal = document.getElementById('adminLoginModal');
const adminLoginForm = document.getElementById('adminLoginForm');
const adminPanel = document.getElementById('adminPanel');
        const logoutBtn = document.getElementById('logoutBtn');
const closeAdminPanel = document.getElementById('closeAdminPanel');
const menuBtn = document.getElementById('menuBtn');
const mobileMenu = document.getElementById('mobileMenu');
const closeMenuBtn = document.getElementById('closeMenuBtn');
const mobileMenuBackdrop = document.getElementById('mobileMenuBackdrop');
const contactForm = document.getElementById('contactForm');

// Theme elements
const themeColorInputs = document.querySelectorAll('input[name="theme-color"]');
const themeModeInputs = document.querySelectorAll('input[name="theme-mode"]');
const previewThemeBtn = document.getElementById('previewThemeBtn');

// Chart initialization
let resultsChart;

// Handle file uploads
    const heroImageInput = document.getElementById('heroImageInput');
    const aboutImageInput = document.getElementById('aboutImageInput');

// Database verification function
async function verifyDatabase() {
        try {
            const { data, error } = await supabase
            .from('admin_settings')
            .select('*');
            
        if (error) {
            console.error('Database connection error:', error);
            return false;
        }
        
        console.log('Database connection successful');
        console.log('Available data:', data);
        return true;
        } catch (error) {
        console.error('Database verification failed:', error);
        return false;
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Initialize Supabase client
        supabase = window.supabase.createClient(supabaseUrl, supabaseKey);
        
        // Verify database connection
        const isConnected = await verifyDatabase();
        if (!isConnected) {
            showAlert('Unable to connect to database', 'error', 'alertContainer');
                return;
            }

        // Load website content for all users
        const { data, error } = await supabase
            .from('admin_settings')
                .select('*')
                .single();

        if (error) throw error;
        
        if (data) {
            updateWebsiteContent(data);
            } else {
            console.log('No admin settings found in database');
        }
        
        initializeTheme();
        if (data && data.results) {
            initializeCharts(data.results);
        }
        checkAdminStatus();
        setupEventListeners();
            } catch (error) {
        console.error('Error initializing website:', error);
        showAlert('Failed to load website content', 'error', 'alertContainer');
    }
});

function setupEventListeners() {
    // Admin Authentication
    adminBtn.addEventListener('click', showAdminLogin);
    adminLoginForm.addEventListener('submit', handleAdminLogin);
    logoutBtn.addEventListener('click', handleLogout);
    closeAdminPanel.addEventListener('click', () => adminPanel.classList.add('hidden'));

    // Mobile Menu
    menuBtn.addEventListener('click', toggleMobileMenu);
    closeMenuBtn.addEventListener('click', closeMobileMenu);
    mobileMenuBackdrop.addEventListener('click', closeMobileMenu);

    // Theme Management
    themeColorInputs.forEach(input => {
        input.addEventListener('change', handleThemeChange);
    });
    themeModeInputs.forEach(input => {
        input.addEventListener('change', handleThemeChange);
    });
    previewThemeBtn.addEventListener('click', previewTheme);

    // Contact Form
    contactForm.addEventListener('submit', handleContactSubmit);

    // Smooth Scrolling
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', handleSmoothScroll);
    });

    // Handle file uploads
    heroImageInput.addEventListener('change', handleImageUpload);
    aboutImageInput.addEventListener('change', handleImageUpload);

    // Password Change Functions
    const changePasswordForm = document.getElementById('changePasswordForm');
    const showChangePasswordBtn = document.getElementById('showChangePasswordBtn');
    const hidePasswordSection = document.getElementById('hidePasswordSection');
    const changePasswordSection = document.getElementById('changePasswordSection');

    showChangePasswordBtn?.addEventListener('click', () => {
        changePasswordSection.classList.remove('hidden');
    });

    hidePasswordSection?.addEventListener('click', () => {
        changePasswordSection.classList.add('hidden');
    });

    changePasswordForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;

        try {
            // Verify current password first
            const { data: adminData, error: verifyError } = await supabase
                .from('admin_settings')
                .select('password_hash')
                .single();

            if (verifyError) throw verifyError;

            if (currentPassword !== adminData.password_hash) {
                showAlert('Current password is incorrect', 'error', 'adminAlertContainer');
        return;
    }
    
            // Update password
            const { error: updateError } = await supabase
                .from('admin_settings')
                .update({ password_hash: newPassword })
                .eq('id', 1);

            if (updateError) throw updateError;

            showAlert('Password changed successfully', 'success', 'adminAlertContainer');
            changePasswordForm.reset();
            changePasswordSection.classList.add('hidden');
        } catch (error) {
            console.error('Error changing password:', error);
            showAlert('Failed to change password', 'error', 'adminAlertContainer');
        }
    });
}

// Admin Authentication Functions
function showAdminLogin() {
        adminLoginModal.classList.remove('hidden');
}

async function handleAdminLogin(e) {
    e.preventDefault();
    const password = document.getElementById('adminPassword').value;

    try {
        // Here you would typically make a call to your backend to verify the password
            const { data, error } = await supabase
            .from('admin_settings')
            .select('password_hash')
                .single();
            
        if (error) throw error;

        // In production, use proper password hashing
        if (password === data.password_hash) {
            localStorage.setItem('isAdmin', 'true');
            adminLoginModal.classList.add('hidden');
            adminPanel.classList.remove('hidden');
            loadAdminData();
        } else {
            showAlert('Invalid password', 'error', 'loginAlertContainer');
        }
    } catch (error) {
        console.error('Login error:', error);
        showAlert('An error occurred during login', 'error', 'loginAlertContainer');
    }
}

function handleLogout() {
    localStorage.removeItem('isAdmin');
    adminPanel.classList.add('hidden');
    showAlert('Logged out successfully', 'success', 'adminAlertContainer');
}

// Theme Management Functions
function initializeTheme() {
    const savedTheme = localStorage.getItem('theme') || 'blue';
    const savedMode = localStorage.getItem('mode') || 'light';
    
    document.querySelector(`input[value="${savedTheme}"]`).checked = true;
    document.querySelector(`input[value="${savedMode}"]`).checked = true;
    
    applyTheme(savedTheme, savedMode);
}

function handleThemeChange() {
    const selectedColor = document.querySelector('input[name="theme-color"]:checked').value;
    const selectedMode = document.querySelector('input[name="theme-mode"]:checked').value;
    
    applyTheme(selectedColor, selectedMode);
}

function applyTheme(color, mode) {
    document.body.className = `theme-${color} ${mode}-mode`;
    localStorage.setItem('theme', color);
    localStorage.setItem('mode', mode);
}

// Chart Functions
function initializeCharts(results) {
    if (!results || !results.length) {
        console.log('No results data available');
        return;
    }
    
    const chartsContainer = document.getElementById('results-charts');
    if (!chartsContainer) {
        console.log('Charts container not found');
        return;
    }
    
    // Clear existing charts
    chartsContainer.innerHTML = '';
    
    results.forEach((subject, index) => {
        const chartContainer = document.createElement('div');
        chartContainer.className = 'bg-white rounded-lg shadow-lg p-4';
        chartContainer.innerHTML = `
            <h3 class="text-lg font-semibold mb-4">${subject.name}</h3>
            <div class="w-full" style="height: 300px;">
                <canvas id="chart-${index}"></canvas>
            </div>
        `;
        chartsContainer.appendChild(chartContainer);
        
        const ctx = document.getElementById(`chart-${index}`).getContext('2d');
        new Chart(ctx, {
            type: 'pie',
            data: {
                labels: ['A*', 'A', 'Rest'],
                datasets: [{
                    data: [
                        subject.grades['A*'],
                        subject.grades['A'],
                        subject.grades['Rest']
                    ],
                    backgroundColor: [
                        'rgba(59, 130, 246, 0.8)',
                        'rgba(16, 185, 129, 0.8)',
                        'rgba(245, 158, 11, 0.8)'
                    ],
                    borderColor: [
                        'rgba(59, 130, 246, 1)',
                        'rgba(16, 185, 129, 1)',
                        'rgba(245, 158, 11, 1)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            padding: 20,
                            font: {
                                size: 14
                            }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `${context.label}: ${context.raw} students`;
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
    });
}

function updateWebsiteContent(data) {
    // Update website content with admin data
    const navBrandName = document.querySelector('.nav-brand-name');
    const navBrandSubtitle = document.querySelector('.nav-brand-subtitle');
    const heroTitle = document.querySelector('.hero-title');
    const experienceSection = document.querySelector('.experience-section');
    
    if (navBrandName) navBrandName.textContent = data.name || '';
    if (navBrandSubtitle) navBrandSubtitle.textContent = data.title || '';
    if (heroTitle) heroTitle.innerHTML = `Inspiring Minds Through <span class="text-blue-600">${data.subtitle || ''}</span>`;
    if (experienceSection) experienceSection.textContent = data.experience || '';
    
    // Update other elements
    const elements = {
        'philosophy': data.philosophy,
        'qualifications': data.qualifications,
        'schools': data.schools,
        'centers': data.centers,
        'platforms': data.platforms,
        'email': data.email,
        'phone': data.phone,
        'contact-message': data.contact_message
    };
    
    for (const [id, value] of Object.entries(elements)) {
        const element = document.getElementById(id);
        if (element && value) {
            element.textContent = value;
        }
    }
}

// Utility Functions
function showAlert(message, type, containerId) {
    const container = document.getElementById(containerId);
    const alert = document.createElement('div');
    alert.className = `alert alert-${type} mb-4 p-4 rounded`;
    alert.innerHTML = message;
    
    container.innerHTML = '';
    container.appendChild(alert);
    
    setTimeout(() => {
        alert.remove();
    }, 5000);
}

function handleSmoothScroll(e) {
            e.preventDefault();
    const targetId = this.getAttribute('href');
    const targetElement = document.querySelector(targetId);
    
    if (targetElement) {
        targetElement.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
        
        if (mobileMenu.classList.contains('active')) {
            closeMobileMenu();
        }
    }
}

// Mobile Menu Functions
function toggleMobileMenu() {
    mobileMenu.classList.toggle('active');
    mobileMenuBackdrop.classList.toggle('hidden');
    document.body.classList.toggle('overflow-hidden');
}

function closeMobileMenu() {
    mobileMenu.classList.remove('active');
    mobileMenuBackdrop.classList.add('hidden');
    document.body.classList.remove('overflow-hidden');
}

// Contact Form Handler
async function handleContactSubmit(e) {
    e.preventDefault();
    const formData = new FormData(contactForm);
    
    try {
        const { data, error } = await supabase
            .from('contacts')
            .insert([{
                name: formData.get('name'),
                email: formData.get('email'),
                message: formData.get('message')
            }]);

        if (error) throw error;
        
        showAlert('Message sent successfully!', 'success', 'contactForm');
        contactForm.reset();
    } catch (error) {
        console.error('Contact form error:', error);
        showAlert('Failed to send message. Please try again.', 'error', 'contactForm');
    }
}

// Admin Panel Functions
async function loadAdminData() {
    try {
        const { data, error } = await supabase
            .from('admin_settings')
            .select('*')
            .single();

        if (error) throw error;

        // Populate admin panel fields
        document.getElementById('admin-name').value = data.name || '';
        document.getElementById('admin-title').value = data.title || '';
        document.getElementById('admin-subtitle').value = data.subtitle || '';
        document.getElementById('admin-hero-heading').value = data.hero_heading || '';
        document.getElementById('admin-experience').value = data.experience || '';
        document.getElementById('admin-philosophy').value = data.philosophy || '';
        document.getElementById('admin-qualifications').value = data.qualifications || '';
        document.getElementById('admin-schools').value = data.schools || '';
        document.getElementById('admin-centers').value = data.centers || '';
        document.getElementById('admin-platforms').value = data.platforms || '';
        document.getElementById('admin-email').value = data.email || '';
        document.getElementById('admin-form-url').value = data.form_url || '';
        document.getElementById('admin-assistant-form-url').value = data.assistant_form_url || '';
        document.getElementById('admin-phone').value = data.phone || '';
        document.getElementById('admin-contact-message').value = data.contact_message || '';

        // Update results chart if data exists
        if (data.results) {
            initializeCharts(data.results);
        }

        // Load admin data and initialize adminResults
        window.adminResults = Array.isArray(data.results) ? data.results : [];
        renderAdminResults(window.adminResults);
    } catch (error) {
        console.error('Error loading admin data:', error);
        showAlert('Failed to load admin data', 'error', 'adminAlertContainer');
    }
}

// Save admin changes
document.getElementById('saveChangesBtn').addEventListener('click', async () => {
    try {
        const adminData = {
            name: document.getElementById('admin-name').value,
            title: document.getElementById('admin-title').value,
            subtitle: document.getElementById('admin-subtitle').value,
            hero_heading: document.getElementById('admin-hero-heading').value,
            experience: document.getElementById('admin-experience').value,
            philosophy: document.getElementById('admin-philosophy').value,
            qualifications: document.getElementById('admin-qualifications').value,
            schools: document.getElementById('admin-schools').value,
            centers: document.getElementById('admin-centers').value,
            platforms: document.getElementById('admin-platforms').value,
            email: document.getElementById('admin-email').value,
            form_url: document.getElementById('admin-form-url').value,
            assistant_form_url: document.getElementById('admin-assistant-form-url').value,
            phone: document.getElementById('admin-phone').value,
            contact_message: document.getElementById('admin-contact-message').value
        };

        const { error } = await supabase
            .from('admin_settings')
            .update(adminData)
            .eq('id', 1); // Assuming there's only one admin settings row

        if (error) throw error;

        showAlert('Changes saved successfully!', 'success', 'adminAlertContainer');
        updateWebsiteContent(adminData);
    } catch (error) {
        console.error('Error saving changes:', error);
        showAlert('Failed to save changes', 'error', 'adminAlertContainer');
    }
});

// Initialize the page
function checkAdminStatus() {
    const isAdmin = localStorage.getItem('isAdmin') === 'true';
    if (isAdmin) {
        adminPanel.classList.remove('hidden');
        loadAdminData();
    }
}

// Handle file uploads
async function handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    try {
        const { data, error } = await supabase.storage
            .from('images')
            .upload(`${Date.now()}_${file.name}`, file);

        if (error) throw error;

        const imageUrl = `${supabaseUrl}/storage/v1/object/public/images/${data.path}`;
        updateImagePreview(e.target.id, imageUrl);
    } catch (error) {
        console.error('Error uploading image:', error);
        showAlert('Failed to upload image', 'error', 'adminAlertContainer');
    }
}

function updateImagePreview(inputId, imageUrl) {
    const previewId = inputId === 'heroImageInput' ? 'heroPreview' : 'aboutPreview';
    const preview = document.getElementById(previewId);
    const img = preview.querySelector('img');
    
    img.src = imageUrl;
    preview.classList.remove('hidden');
}

// Admin Panel Results Section
function renderAdminResults(subjects) {
    const container = document.getElementById('admin-results-container');
    if (!container) return;
    container.innerHTML = '';
    
    subjects.forEach((subject, idx) => {
        const row = document.createElement('div');
        row.className = 'flex flex-col md:flex-row items-center gap-4 mb-4 p-4 bg-gray-50 rounded-lg';
        row.innerHTML = `
            <div class="flex-1">
                <label class="block text-sm font-medium text-gray-700 mb-1">Subject Name</label>
                <input type="text" class="subject-name form-input w-full" value="${subject.name || ''}" placeholder="e.g. Mathematics" data-idx="${idx}">
            </div>
            <div class="flex flex-row gap-2">
                <div>
                    <label class="block text-xs font-medium text-gray-700 mb-1">A*</label>
                    <input type="number" class="grade-input form-input w-20" value="${subject.grades?.['A*'] ?? 0}" min="0" data-idx="${idx}" data-grade="A*">
                </div>
                <div>
                    <label class="block text-xs font-medium text-gray-700 mb-1">A</label>
                    <input type="number" class="grade-input form-input w-20" value="${subject.grades?.A ?? 0}" min="0" data-idx="${idx}" data-grade="A">
                </div>
                <div>
                    <label class="block text-xs font-medium text-gray-700 mb-1">Rest</label>
                    <input type="number" class="grade-input form-input w-20" value="${subject.grades?.Rest ?? 0}" min="0" data-idx="${idx}" data-grade="Rest">
                </div>
            </div>
            <button class="remove-subject-btn ml-2 bg-red-100 text-red-600 px-3 py-2 rounded hover:bg-red-200" data-idx="${idx}">✕</button>
        `;
        container.appendChild(row);
    });
    
    // Add event listeners
    container.querySelectorAll('.subject-name').forEach(input => {
        input.addEventListener('input', (e) => {
            const idx = e.target.dataset.idx;
            window.adminResults[idx].name = e.target.value;
        });
    });
    container.querySelectorAll('.grade-input').forEach(input => {
        input.addEventListener('input', (e) => {
            const idx = e.target.dataset.idx;
            const grade = e.target.dataset.grade;
            window.adminResults[idx].grades[grade] = parseInt(e.target.value) || 0;
        });
    });
    container.querySelectorAll('.remove-subject-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const idx = e.target.dataset.idx;
            window.adminResults.splice(idx, 1);
            renderAdminResults(window.adminResults);
        });
    });
}

// Add Subject Button
const addResultBtn = document.getElementById('addResultBtn');
if (addResultBtn) {
    addResultBtn.addEventListener('click', () => {
        window.adminResults.push({ name: '', grades: { 'A*': 0, 'A': 0, 'Rest': 0 } });
        renderAdminResults(window.adminResults);
    });
}

// Save Changes Button
const saveChangesBtn = document.getElementById('saveChangesBtn');
if (saveChangesBtn) {
    saveChangesBtn.addEventListener('click', async () => {
        try {
            const { error } = await supabase
                .from('admin_settings')
                .update({ results: window.adminResults })
                .eq('id', 1);
            if (error) throw error;
            showAlert('Changes saved successfully!', 'success', 'adminAlertContainer');
            initializeCharts(window.adminResults);
        } catch (error) {
            console.error('Error saving changes:', error);
            showAlert('Failed to save changes', 'error', 'adminAlertContainer');
        }
    });
}