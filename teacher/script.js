// script.js

// Preloader
window.addEventListener('load', () => {
    const preloader = document.querySelector('.preloader');
    preloader.classList.add('fade-out');
    setTimeout(() => {
        preloader.style.display = 'none';
    }, 600);
});

// Mobile Menu Toggle
const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
const mobileMenu = document.querySelector('.mobile-menu');
const mobileNavLinks = document.querySelectorAll('.mobile-nav-links a');
const closeBtn = document.querySelector('.mobile-menu .close-btn');

function closeMenu() {
    mobileMenu.classList.remove('active');
    mobileMenuBtn.classList.remove('active');
}

mobileMenuBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    mobileMenu.classList.toggle('active');
    mobileMenuBtn.classList.toggle('active');
});

// Close menu when clicking close button
closeBtn.addEventListener('click', closeMenu);

// Close mobile menu when clicking outside
document.addEventListener('click', (e) => {
    if (!mobileMenu.contains(e.target) && 
        !mobileMenuBtn.contains(e.target) && 
        mobileMenu.classList.contains('active')) {
        closeMenu();
    }
});

// Close menu when clicking a link
mobileNavLinks.forEach(link => {
    link.addEventListener('click', closeMenu);
});

// Prevent menu from closing when clicking inside it
mobileMenu.addEventListener('click', (e) => {
    e.stopPropagation();
});

// Smooth Scrolling
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        document.querySelector(this.getAttribute('href')).scrollIntoView({
            behavior: 'smooth'
        });
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

// Contact Form Submission
const contactForm = document.getElementById('contactForm');

contactForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(contactForm);
    const name = formData.get('name');
    const email = formData.get('email');
    const message = formData.get('message');

    // Simulate form submission
    setTimeout(() => {
        alert(`Thank you, ${name}! Your message has been sent.`);
        contactForm.reset();
    }, 1000);
});

// Scroll Reveal Animations
const scrollReveal = ScrollReveal({
    origin: 'bottom',
    distance: '60px',
    duration: 1000,
    delay: 200,
    reset: true
});

scrollReveal.reveal('.hero-content, .about-grid, .stats-grid, .gallery-grid, .timeline, .testimonial-slider, .contact-grid', {
    interval: 200
});

// Parallax Effect for Hero Section
window.addEventListener('scroll', () => {
    const hero = document.querySelector('.hero');
    const scrollPosition = window.scrollY;
    hero.style.backgroundPositionY = `${scrollPosition * 0.5}px`;
});

// Dynamic Year in Footer
const year = new Date().getFullYear();
document.querySelector('.footer-bottom').innerHTML = `&copy; ${year} Sportscout. All rights reserved.`;

// Update Chart with real data
document.addEventListener('DOMContentLoaded', function() {
    const ctx = document.getElementById('resultsChart').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Mathematics', 'Physics', 'Chemistry', 'Biology'],
            datasets: [{
                label: 'A* Grades',
                data: [45, 38, 42, 35],
                backgroundColor: 'rgba(59, 130, 246, 0.8)',
                borderColor: 'rgb(59, 130, 246)',
                borderWidth: 1,
                borderRadius: 5
            }, {
                label: 'A Grades',
                data: [65, 58, 62, 55],
                backgroundColor: 'rgba(16, 185, 129, 0.8)',
                borderColor: 'rgb(16, 185, 129)',
                borderWidth: 1,
                borderRadius: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                duration: 2000,
                easing: 'easeInOutQuart'
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Number of Students',
                        font: {
                            size: 14,
                            weight: 'bold'
                        }
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Subjects',
                        font: {
                            size: 14,
                            weight: 'bold'
                        }
                    },
                    grid: {
                        display: false
                    }
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: 'Student Performance Distribution (A* and A Grades)',
                    font: {
                        size: 16,
                        weight: 'bold'
                    },
                    padding: {
                        top: 10,
                        bottom: 30
                    }
                },
                legend: {
                    position: 'top',
                    labels: {
                        padding: 20,
                        font: {
                            size: 12
                        }
                    }
                }
            }
        }
    });
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
