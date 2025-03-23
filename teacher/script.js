// script.js

// Preloader
window.addEventListener('load', () => {
    const preloader = document.querySelector('.preloader');
    preloader.classList.add('fade-out');
    setTimeout(() => {
        preloader.style.display = 'none';
    }, 600);
});

// DOM Elements
const menuBtn = document.getElementById('menuBtn');
const closeMenuBtn = document.getElementById('closeMenuBtn');
const mobileMenu = document.getElementById('mobileMenu');
const mobileMenuLinks = document.querySelectorAll('.mobile-nav-link');
const body = document.body;

// Mobile Menu Functionality
function toggleMenu() {
    mobileMenu.classList.toggle('active');
    body.classList.toggle('menu-open');
}

function closeMenu() {
    mobileMenu.classList.remove('active');
    body.classList.remove('menu-open');
}

menuBtn.addEventListener('click', toggleMenu);
closeMenuBtn.addEventListener('click', closeMenu);

// Close menu when clicking outside
document.addEventListener('click', (e) => {
    if (mobileMenu.classList.contains('active') && 
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
        const target = document.querySelector(this.getAttribute('href'));
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
    if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
});

// Hero Section Typing Effect
const heroText = document.querySelector('.hero h1');
let index = 0;

function typeWriter() {
    const playerName = window.playerConfig?.personalInfo?.name || 'Welcome';
    const text = `Welcome ${playerName}`;
    if (index < text.length) {
        heroText.innerHTML = text.substring(0, index + 1);
        index++;
        setTimeout(typeWriter, 100);
    }
}

// Don't start typing until config is loaded
document.addEventListener('DOMContentLoaded', async () => {
    await loadConfig();
    typeWriter();
});

// Stats Counter Animation
const statCards = document.querySelectorAll('.stat-card');
const statsSection = document.querySelector('.stats-section');

const options = {
    threshold: 0.5
};

const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            statCards.forEach(card => {
                const value = card.querySelector('.stat-value');
                const target = parseInt(value.textContent);
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

// Gallery Hover Effect
const galleryItems = document.querySelectorAll('.gallery-item');

galleryItems.forEach(item => {
    item.addEventListener('mouseenter', () => {
        item.querySelector('.gallery-overlay').style.opacity = '1';
    });

    item.addEventListener('mouseleave', () => {
        item.querySelector('.gallery-overlay').style.opacity = '0';
    });
});

// Testimonial Slider
const testimonialItems = document.querySelectorAll('.testimonial-item');
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

setInterval(nextTestimonial, 5000); // Change testimonial every 5 seconds

// Contact Form Handling
const contactForm = document.getElementById('contactForm');

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

// Scroll Reveal Animation
const revealElements = document.querySelectorAll('.reveal');

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

// Results Chart
const ctx = document.getElementById('resultsChart').getContext('2d');

const resultsChart = new Chart(ctx, {
    type: 'bar',
    data: {
        labels: ['Mathematics', 'Physics', 'Chemistry', 'Biology'],
        datasets: [
            {
                label: 'A* Grades',
                data: [85, 78, 72, 68],
                backgroundColor: '#3b82f6',
                borderRadius: 6,
            },
            {
                label: 'A Grades',
                data: [92, 85, 80, 75],
                backgroundColor: '#60a5fa',
                borderRadius: 6,
            }
        ]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
                labels: {
                    padding: 20,
                    font: {
                        size: 14
                    }
                }
            },
            title: {
                display: true,
                text: 'Student Performance by Subject',
                padding: {
                    top: 10,
                    bottom: 30
                },
                font: {
                    size: 16,
                    weight: 'bold'
                }
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                max: 100,
                ticks: {
                    callback: value => value + '%'
                }
            }
        },
        animation: {
            duration: 2000,
            easing: 'easeInOutQuart'
        }
    }
});

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
const year = new Date().getFullYear();
document.querySelector('.footer-bottom').innerHTML = `&copy; ${year} Sportscout. All rights reserved.`;
