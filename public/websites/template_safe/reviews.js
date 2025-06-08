// [SECURITY] Removed all Supabase client initialization and logic. All review operations now use backend API endpoints only.

// Star rating component
class StarRating {
    constructor(container, initialRating = 0, isReadOnly = false) {
        this.container = container;
        this.rating = initialRating;
        this.isReadOnly = isReadOnly;
        this.render();
    }

    render() {
        this.container.innerHTML = '';
        for (let i = 1; i <= 5; i++) {
            const star = document.createElement('span');
            star.innerHTML = '★';
            star.className = `star ${i <= this.rating ? 'active' : ''}`;
            star.style.cursor = this.isReadOnly ? 'default' : 'pointer';
            star.style.color = i <= this.rating ? '#ffd700' : '#ccc';
            star.style.fontSize = '24px';
            star.style.padding = '0 2px';

            if (!this.isReadOnly) {
                star.addEventListener('click', () => this.setRating(i));
                star.addEventListener('mouseover', () => this.highlightStars(i));
                star.addEventListener('mouseout', () => this.highlightStars(this.rating));
            }

            this.container.appendChild(star);
        }
    }

    setRating(rating) {
        this.rating = rating;
        this.render();
        this.container.dispatchEvent(new CustomEvent('ratingChanged', { detail: rating }));
    }

    highlightStars(rating) {
        const stars = this.container.querySelectorAll('.star');
        stars.forEach((star, index) => {
            star.style.color = index < rating ? '#ffd700' : '#ccc';
        });
    }

    getRating() {
        return this.rating;
    }
}

// Toast notification system
const showToast = (message, type = 'success') => {
    console.log(`${type.toUpperCase()}: ${message}`); // Console logging

    const toast = document.createElement('div');
    toast.className = `fixed bottom-4 right-4 p-4 rounded-lg shadow-lg ${
        type === 'success' ? 'bg-green-500' : 'bg-red-500'
    } text-white z-50 animate-fade-in`;
    toast.textContent = message;

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('animate-fade-out');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
};

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

// Helper to fetch all reviews from backend
async function fetchAllReviewsFromTeachersWebsites() {
    const response = await fetch('/api/api?action=getReviews');
    if (!response.ok) throw new Error('Failed to fetch reviews');
    const data = await response.json();
    return Array.isArray(data.reviews) ? data.reviews : [];
}

// Helper to save all reviews to backend
async function saveAllReviewsToTeachersWebsites(reviews) {
    const response = await fetch('/api/api?action=saveReviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviews })
    });
    const data = await response.json();
    if (!data.success) throw new Error(data.message || 'Failed to save reviews');
}

// Submit review (add to reviews array)
async function submitReview(event) {
    event.preventDefault();
    console.log('🚀 Starting review submission process...'); // Console logging
    console.log('----------------------------------------');

    // Get the form from the event target
    const form = event.target.closest('form') || event.target;
    if (!form) {
        console.error('❌ Form not found');
        showToast('Error: Form not found', 'error');
        return false;
    }

    // Get form elements with error checking
    const nameInput = form.querySelector('#reviewName');
    const reviewTextArea = form.querySelector('#reviewText');
    const ratingContainer = form.querySelector('#ratingContainer');

    // Validate form elements exist
    if (!nameInput || !reviewTextArea || !ratingContainer) {
        console.error('❌ Required form elements not found:');
        console.error('- Name input found:', !!nameInput);
        console.error('- Review text area found:', !!reviewTextArea);
        console.error('- Rating container found:', !!ratingContainer);
        showToast('Error: Form elements not found', 'error');
        return false;
    }

    // Get form values
    const studentName = nameInput.value.trim();
    const reviewText = reviewTextArea.value.trim();
    const rating = parseInt(ratingContainer.getAttribute('data-rating')) || 0;

    console.log('📝 Review Data Collected:');
    console.log('- Student Name:', studentName);
    console.log('- Rating:', rating, '⭐'.repeat(rating));
    console.log('- Review Text:', reviewText);
    console.log('----------------------------------------');

    // Validate input
    if (!studentName || !reviewText || !rating || rating < 1 || rating > 5) {
        console.error('❌ Validation Failed:');
        console.error('- Name present:', !!studentName);
        console.error('- Review present:', !!reviewText);
        console.error('- Valid rating:', rating >= 1 && rating <= 5);
        console.error('----------------------------------------');
        showToast('Please fill in all fields and select a rating', 'error');
        return false;
    }

    console.log('✅ Input validation passed');
    console.log('----------------------------------------');

    // Disable submit button while processing
    const submitButton = form.querySelector('button[type="submit"]');
    const originalButtonText = submitButton.textContent;
    submitButton.disabled = true;
    submitButton.textContent = 'Submitting...';

    console.log('💾 Attempting to save review to database...');

    try {
        console.log('📡 Sending request to Supabase...');
        let reviews = await fetchAllReviewsFromTeachersWebsites();
        const newReview = {
            id: crypto.randomUUID(),
            student_name: studentName,
            rating: rating,
            review_text: reviewText,
            is_visible: false,
            created_at: new Date().toISOString()
        };
        reviews.unshift(newReview);
        await saveAllReviewsToTeachersWebsites(reviews);
        console.log('✅ Review saved successfully!');
        console.log('📊 Database Response:', reviews);
        console.log('----------------------------------------');
        
        // Show success message
        showToast('Thank you! Your review has been submitted and will be visible after approval.');
        
        console.log('🔄 Resetting form...');
        // Reset form
        form.reset();
        ratingContainer.setAttribute('data-rating', '0');
        new StarRating(ratingContainer);

        // If we're in the admin panel, refresh the reviews list
        if (document.querySelector('#admin-reviews-container')) {
            console.log('🔄 Refreshing admin review list...');
            loadAllReviews();
        }

        // Refresh the public reviews list if it exists
        if (document.querySelector('#reviewsContainer')) {
            console.log('🔄 Refreshing public review list...');
            loadApprovedReviews();
        }

        console.log('✨ Review submission process completed successfully!');
        console.log('----------------------------------------');

    } catch (error) {
        console.error('❌ Error during review submission:');
        console.error('- Error Type:', error.name);
        console.error('- Error Message:', error.message);
        console.error('- Stack Trace:', error.stack);
        console.error('----------------------------------------');
        showToast(error.message || 'Failed to submit review. Please try again.', 'error');
    } finally {
        console.log('🔄 Resetting submit button state...');
        // Re-enable submit button
        submitButton.disabled = false;
        submitButton.textContent = originalButtonText;
        console.log('----------------------------------------');
    }

    return false;
}

// Load approved reviews (public)
async function loadApprovedReviews() {
    try {
        const reviews = await fetchAllReviewsFromTeachersWebsites();
        const approved = reviews.filter(r => r.is_visible);
        displayReviews(approved);
    } catch (error) {
        console.error('❌ Error in loadApprovedReviews:', error);
        console.error('Error details:', error.message);
        console.error('Stack trace:', error.stack);
        console.error('----------------------------------------');
        showToast('Failed to load reviews. Please refresh the page.', 'error');
    }
}

// Display reviews in the reviews container
function displayReviews(reviews) {
    const reviewsSection = document.getElementById('reviews');
    if (reviewsSection) {
        if (!reviews || reviews.length === 0) {
            reviewsSection.style.display = 'none';
        } else {
            reviewsSection.style.display = '';
        }
    }
    const container = document.querySelector('#reviewsContainer');
    if (!container) return;

    container.innerHTML = '';

    if (reviews.length === 0) {
        container.innerHTML = `
            <div class="text-center text-gray-500 py-8">
                <p>No reviews yet. Be the first to review!</p>
            </div>
        `;
        return;
    }

    // Show only the latest 3 reviews
    const reviewsToShow = reviews.slice(0, 3);
    reviewsToShow.forEach(review => {
        const reviewElement = document.createElement('div');
        reviewElement.className = 'bg-white rounded-lg shadow-md p-6 mb-4';
        reviewElement.innerHTML = `
            <div class="flex items-center justify-between mb-4">
                <h4 class="text-lg font-semibold">${review.student_name}</h4>
                <div class="star-rating" data-rating="${review.rating}"></div>
            </div>
            <p class="text-gray-600">${review.review_text}</p>
            <div class="text-sm text-gray-400 mt-2">
                ${new Date(review.created_at).toLocaleDateString()}
            </div>
        `;
        container.appendChild(reviewElement);
        const starRatingEl = reviewElement.querySelector('.star-rating');
        if (starRatingEl) {
            new StarRating(starRatingEl, review.rating, true);
        }
    });

    // Add 'See All Reviews' button if there are more than 3 reviews
    if (reviews.length > 3) {
        const seeAllBtn = document.createElement('button');
        seeAllBtn.className = 'w-full mt-4 py-3 px-6 rounded-md text-white transition duration-200';
        seeAllBtn.style.background = 'var(--primary-color)';
        seeAllBtn.onmouseover = function() { this.style.background = 'var(--primary-dark)'; };
        seeAllBtn.onmouseout = function() { this.style.background = 'var(--primary-color)'; };
        seeAllBtn.textContent = 'See All Reviews';
        seeAllBtn.onclick = function() {
            document.getElementById('allReviewsModal').classList.remove('hidden');
            setActiveSortModal('sortLatestModal');
            loadAllPublicReviewsModal('latest');
        };
        container.appendChild(seeAllBtn);
    }

    renderReviewStats(reviews, '#reviewsContainer');
}

// Load all reviews (admin)
async function loadAllReviews() {
    console.log('🔄 Loading all reviews from database...');
    console.log('----------------------------------------');

    // Show loading state
    const container = document.querySelector('#admin-reviews-container');
    if (!container) {
        console.error('❌ Admin reviews container not found!');
        return;
    }

    container.innerHTML = `
        <div class="text-center text-gray-500 py-8">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p>Loading reviews from database...</p>
        </div>
    `;

    try {
        console.log('📡 Sending request to Supabase...');
        console.log('Query: SELECT * FROM reviews ORDER BY created_at DESC');
        
        const reviews = await fetchAllReviewsFromTeachersWebsites();
        displayAdminReviews(reviews);

    } catch (error) {
        console.error('❌ Error in loadAllReviews:', error);
        container.innerHTML = `
            <div class="text-center text-red-500 py-8">
                <p>Failed to load reviews from database.</p>
                <p class="text-sm mt-2">Error: ${error.message}</p>
                <button onclick="loadAllReviews()" class="mt-4 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg">
                    Try Again
                </button>
            </div>
        `;
        showToast('Failed to load reviews. Please try again.', 'error');
    }
}

// Add this shared function to bind switch listeners
function bindReviewSwitchListeners(container) {
    const switches = container.querySelectorAll('.review-switch');
    switches.forEach(sw => {
        sw.onchange = async function() {
            const reviewId = sw.getAttribute('data-review-id');
            const makeVisible = sw.checked;
            sw.disabled = true;
            const card = sw.closest('.bg-white.rounded-lg.shadow-md.p-6.mb-4');
            try {
                // Update in database first
                let reviews = await fetchAllReviewsFromTeachersWebsites();
                reviews = reviews.map(r => r.id === reviewId ? { ...r, is_visible: makeVisible } : r);
                await saveAllReviewsToTeachersWebsites(reviews);
                showToast(`Review ${makeVisible ? 'shown' : 'hidden'}!`);
                // Animate out if hiding
                if (!makeVisible && card) {
                    card.style.transition = 'opacity 0.4s, transform 0.4s';
                    card.style.opacity = '0';
                    card.style.transform = 'scale(0.95)';
                    setTimeout(() => card.remove(), 400);
                }
            } catch (err) {
                showToast('Failed to update review visibility', 'error');
                sw.checked = !makeVisible;
            } finally {
                sw.disabled = false;
            }
        };
    });
}

// Admin: Display reviews in admin panel
function displayAdminReviews(reviews) {
    const container = document.querySelector('#admin-reviews-container');
    if (!container) {
        console.error('❌ Admin reviews container not found in displayAdminReviews!');
        return;
    }
    container.innerHTML = '';
    if (!reviews || reviews.length === 0) {
        container.innerHTML = `
            <div class="text-center text-gray-500 py-8">
                <svg class="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                </svg>
                <p class="text-xl font-semibold">No reviews available</p>
                <p class="text-gray-500 mt-2">Reviews submitted by students will appear here.</p>
            </div>
        `;
        return;
    }
    reviews.forEach((review) => {
        const reviewElement = document.createElement('div');
        reviewElement.className = 'bg-white rounded-lg shadow-md p-6 mb-4';
        reviewElement.innerHTML = `
            <div class="flex items-center justify-between mb-4">
                <div>
                    <h4 class="text-lg font-semibold">${review.student_name || 'Anonymous'}</h4>
                    <div class="star-rating flex items-center mt-1"></div>
                </div>
                <div class="flex gap-2 items-center">
                    <label class="switch">
                        <input type="checkbox" class="review-switch" data-review-id="${review.id}" ${review.is_visible ? 'checked' : ''}>
                        <span class="slider"></span>
                    </label>
                </div>
            </div>
            <p class="text-gray-600 mt-2">${review.review_text}</p>
            <div class="text-sm text-gray-500 mt-2">
                ${new Date(review.created_at).toLocaleDateString()}
            </div>
        `;
        container.appendChild(reviewElement);
        const starRatingEl = reviewElement.querySelector('.star-rating');
        if (starRatingEl) {
            new StarRating(starRatingEl, review.rating, true);
        }
    });
    bindReviewSwitchListeners(container);
}

// Toggle review visibility (admin)
async function toggleReviewVisibility(reviewId, makeVisible) {
    const container = document.querySelector('#admin-reviews-container');
    if (container) {
        const btn = container.querySelector(`button[onclick*="toggleReviewVisibility('${reviewId}'"]`);
        const card = btn ? btn.closest('.bg-white.rounded-lg.shadow-md.p-6.mb-4') : null;
        if (btn) {
            btn.disabled = true;
            btn.textContent = makeVisible ? 'Show...' : 'Hide...';
            btn.classList.add('opacity-60', 'pointer-events-none');
        }
        if (card && btn) {
            // Optimistically update the card and button instantly
            setTimeout(() => {
                // Update button color and text
                btn.textContent = makeVisible ? 'Hide' : 'Show';
                btn.className = `px-4 py-2 rounded ${makeVisible ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-green-500 hover:bg-green-600'} text-white`;
                btn.disabled = false;
                btn.classList.remove('opacity-60', 'pointer-events-none');
                // Animate out if hiding
                if (!makeVisible) {
                    card.style.transition = 'opacity 0.4s, transform 0.4s';
                    card.style.opacity = '0';
                    card.style.transform = 'scale(0.95)';
                    setTimeout(() => card.remove(), 400);
                }
            }, 400);
        }
    }
    try {
        let reviews = await fetchAllReviewsFromTeachersWebsites();
        reviews = reviews.map(r => r.id === reviewId ? { ...r, is_visible: makeVisible } : r);
        await saveAllReviewsToTeachersWebsites(reviews);
        showToast(`Review ${makeVisible ? 'shown' : 'hidden'}!`);
    } catch (err) {
        showToast('Failed to update review visibility', 'error');
        // Fallback: reload reviews list if error
        if (container) {
            fetchAllReviewsFromTeachersWebsites().then(displayAdminReviews);
        }
    }
}

// Delete review (admin)
async function deleteReview(reviewId) {
    if (!confirm('Are you sure you want to delete this review?')) return;
    try {
        let reviews = await fetchAllReviewsFromTeachersWebsites();
        reviews = reviews.filter(r => r.id !== reviewId);
        await saveAllReviewsToTeachersWebsites(reviews);
        showToast('Review deleted successfully');
        loadAllReviews();
    } catch (error) {
        showToast('Failed to delete review', 'error');
    }
}

// Function to load reviews in admin panel (now uses teachers_websites.data.reviews)
async function loadAdminReviews() {
    try {
        const reviews = await fetchAllReviewsFromTeachersWebsites();
        const reviewsContainer = document.getElementById('admin-reviews-container');
        reviewsContainer.innerHTML = '';
        if (reviews.length === 0) {
            reviewsContainer.innerHTML = `
                <div class="p-6 text-center text-gray-500">
                    <i class="fas fa-comments text-gray-300 text-4xl mb-2"></i>
                    <p>No reviews found.</p>
                </div>
            `;
            return;
        }
        reviews.forEach(review => {
            const reviewElement = document.createElement('div');
            reviewElement.className = 'bg-white rounded-lg shadow-md p-6 mb-4';
            reviewElement.innerHTML = `
                <div class="flex items-center justify-between mb-4">
                    <div>
                        <h4 class="text-lg font-semibold">${review.student_name || 'Anonymous'}</h4>
                        <div class="star-rating flex items-center mt-1"></div>
                    </div>
                    <div class="flex gap-2 items-center">
                        <label class="switch">
                            <input type="checkbox" class="review-switch" data-review-id="${review.id}" ${review.is_visible ? 'checked' : ''}>
                            <span class="slider"></span>
                        </label>
                    </div>
                </div>
                <p class="text-gray-600 mt-2">${review.review_text}</p>
                <div class="text-sm text-gray-500 mt-2">
                    ${new Date(review.created_at).toLocaleDateString()}
                </div>
            `;
            reviewsContainer.appendChild(reviewElement);
            const starRatingEl = reviewElement.querySelector('.star-rating');
            if (starRatingEl) {
                new StarRating(starRatingEl, review.rating, true);
            }
        });
        bindReviewSwitchListeners(reviewsContainer);
    } catch (error) {
        console.error('Error loading reviews:', error);
        showToast('Failed to load reviews', 'error');
    }
}

// Function to generate star rating HTML
function generateStarRating(rating) {
    let stars = '';
    for (let i = 1; i <= 5; i++) {
        stars += `<i class="fas fa-star ${i <= rating ? 'text-yellow-400' : 'text-gray-300'}"></i>`;
    }
    return stars;
}

// Add event listener for refresh button
document.getElementById('refreshReviewsBtn')?.addEventListener('click', loadAdminReviews);

// Load admin reviews when admin panel is opened
document.getElementById('adminBtn')?.addEventListener('click', () => {
    if (isLoggedIn) {
        loadAdminReviews();
    }
});

// Initialize review system
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Initializing review system...');
    console.log('----------------------------------------');

    // Initialize star rating for new review form
    const ratingContainer = document.querySelector('#ratingContainer');
    if (ratingContainer) {
        console.log('⭐ Initializing star rating component...');
        const starRating = new StarRating(ratingContainer);
        // Update data-rating attribute when rating changes
        ratingContainer.addEventListener('ratingChanged', (event) => {
            ratingContainer.setAttribute('data-rating', event.detail);
            console.log('⭐ Rating updated:', event.detail);
        });
    }

    // Check if we're on the admin page
    const adminContainer = document.querySelector('#admin-reviews-container');
    if (adminContainer) {
        console.log('👩‍💼 Admin panel detected, loading all reviews...');
        await loadAllReviews();
    } else {
        console.log('👥 Public page detected, loading approved reviews...');
        await loadApprovedReviews();
    }

    // Initialize review form
    const reviewForm = document.querySelector('#reviewForm');
    if (reviewForm) {
        console.log('📝 Initializing review form...');
        reviewForm.addEventListener('submit', submitReview);
    }

    // Hide the site loader when review system is initialized
    const siteLoader = document.getElementById('siteLoader');
    if (siteLoader) {
        siteLoader.classList.add('hide');
    }
    console.log('✅ Review system initialization complete');
    console.log('----------------------------------------');
});

// Export functions for use in other files
window.toggleReviewVisibility = toggleReviewVisibility;
window.deleteReview = deleteReview;

// Function to load reviews for the public view (now uses teachers_websites.data.reviews)
async function loadReviews() {
    try {
        const reviews = await fetchAllReviewsFromTeachersWebsites();
        const approved = reviews.filter(r => r.is_visible);
        const reviewsContainer = document.getElementById('reviewsContainer');
        if (reviewsContainer) reviewsContainer.innerHTML = '';
        renderReviewStats(approved, '#reviewsContainer');
        if (approved.length === 0) {
            reviewsContainer.innerHTML += `
                <div class="text-center text-gray-500">
                    <p>No reviews yet. Be the first to leave a review!</p>
                </div>
            `;
            return;
        }
        const reviewsGrid = document.createElement('div');
        reviewsGrid.className = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6';
        approved.forEach(review => {
            const reviewCard = document.createElement('div');
            reviewCard.className = 'bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow';
            reviewCard.innerHTML = `
                <div class="flex items-start justify-between mb-4">
                    <div>
                        <h4 class="font-semibold text-gray-800">${review.student_name}</h4>
                        <div class="flex items-center mt-1">
                            ${generateStarRating(review.rating)}
                        </div>
                    </div>
                    <div class="text-sm text-gray-500">
                        ${new Date(review.created_at).toLocaleDateString()}
                    </div>
                </div>
                <p class="text-gray-600">${review.review_text}</p>
            `;
            reviewsGrid.appendChild(reviewCard);
        });
        reviewsContainer.appendChild(reviewsGrid);
    } catch (error) {
        console.error('Error loading reviews:', error);
        showAlert('error', 'Failed to load reviews');
    }
}

// Export a function to load all reviews for the new page (now uses teachers_websites.data.reviews)
window.loadAllPublicReviews = async function(sortBy = 'latest') {
    try {
        let reviews = await fetchAllReviewsFromTeachersWebsites();
        reviews = reviews.filter(r => r.is_visible);
        if (sortBy === 'highest') {
            reviews = reviews.sort((a, b) => b.rating - a.rating);
        } else {
            reviews = reviews.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        }
        window.displayAllReviews(reviews || []);
    } catch (error) {
        console.error('Error loading all public reviews:', error);
        const container = document.getElementById('allReviewsContainer');
        if (container) {
            container.innerHTML = '<div class="text-center text-red-500 py-8">Failed to load reviews.</div>';
        }
    }
};

// Export display function for all reviews page
window.displayAllReviews = function(reviews) {
    const container = document.getElementById('allReviewsContainer');
    if (!container) return;
    container.innerHTML = '';
    if (reviews.length === 0) {
        container.innerHTML = '<div class="text-center text-gray-500 py-8">No reviews found.</div>';
        return;
    }
    reviews.forEach(review => {
        const reviewElement = document.createElement('div');
        reviewElement.className = 'bg-white rounded-lg shadow-md p-6 mb-4';
        reviewElement.innerHTML = `
            <div class="flex items-center justify-between mb-4">
                <h4 class="text-lg font-semibold">${review.student_name}</h4>
                <div class="star-rating" data-rating="${review.rating}"></div>
            </div>
            <p class="text-gray-600">${review.review_text}</p>
            <div class="text-sm text-gray-400 mt-2">
                ${new Date(review.created_at).toLocaleDateString()}
            </div>
        `;
        container.appendChild(reviewElement);
        const starRatingEl = reviewElement.querySelector('.star-rating');
        if (starRatingEl) {
            new StarRating(starRatingEl, review.rating, true);
        }
    });
};

// Modal logic for all reviews (now uses teachers_websites.data.reviews)
window.loadAllPublicReviewsModal = async function(sortBy = 'latest') {
    const container = document.getElementById('allReviewsModalContainer');
    if (container) {
        container.innerHTML = '<div class="flex flex-col items-center justify-center py-12"><div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-4"></div><p class="text-gray-500">Loading reviews...</p></div>';
    }
    try {
        let reviews = await fetchAllReviewsFromTeachersWebsites();
        reviews = reviews.filter(r => r.is_visible);
        if (sortBy === 'highest') {
            reviews = reviews.sort((a, b) => b.rating - a.rating);
        } else {
            reviews = reviews.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        }
        displayAllReviewsModal(reviews || []);
    } catch (error) {
        console.error('Error loading all public reviews (modal):', error);
        if (container) {
            container.innerHTML = '<div class="text-center text-red-500 py-8">Failed to load reviews.</div>';
        }
    }
};

function displayAllReviewsModal(reviews) {
    const container = document.getElementById('allReviewsModalContainer');
    if (!container) return;
    container.innerHTML = '';
    if (reviews.length === 0) {
        container.innerHTML = '<div class="text-center text-gray-500 py-8">No reviews found.</div>';
        return;
    }
    reviews.forEach(review => {
        const reviewElement = document.createElement('div');
        reviewElement.className = 'bg-white rounded-lg shadow-md p-6 mb-4';
        reviewElement.innerHTML = `
            <div class="flex items-center justify-between mb-4">
                <h4 class="text-lg font-semibold">${review.student_name}</h4>
                <div class="star-rating" data-rating="${review.rating}"></div>
            </div>
            <p class="text-gray-600">${review.review_text}</p>
            <div class="text-sm text-gray-400 mt-2">
                ${new Date(review.created_at).toLocaleDateString()}
            </div>
        `;
        container.appendChild(reviewElement);
        const starRatingEl = reviewElement.querySelector('.star-rating');
        if (starRatingEl) {
            new StarRating(starRatingEl, review.rating, true);
        }
    });
}

// Modal event listeners
document.addEventListener('DOMContentLoaded', function() {
    const closeModalBtn = document.getElementById('closeAllReviewsModal');
    if (closeModalBtn) {
        closeModalBtn.onclick = function() {
            document.getElementById('allReviewsModal').classList.add('hidden');
        };
    }
    const sortLatestBtn = document.getElementById('sortLatestModal');
    const sortHighestBtn = document.getElementById('sortHighestModal');
    if (sortLatestBtn && sortHighestBtn) {
        sortLatestBtn.onclick = function() {
            setActiveSortModal('sortLatestModal');
            window.loadAllPublicReviewsModal('latest');
        };
        sortHighestBtn.onclick = function() {
            setActiveSortModal('sortHighestModal');
            window.loadAllPublicReviewsModal('highest');
        };
    }
});

// Modal logic for all reviews
function setActiveSortModal(btnId) {
    document.getElementById('sortLatestModal').classList.remove('active');
    document.getElementById('sortHighestModal').classList.remove('active');
    document.getElementById(btnId).classList.add('active');
}

/* Add switch styles */
const style = document.createElement('style');
style.innerHTML = `
.switch {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;
}
.switch input { opacity: 0; width: 0; height: 0; }
.slider {
  position: absolute;
  cursor: pointer;
  top: 0; left: 0; right: 0; bottom: 0;
  background-color: #ccc;
  transition: .4s;
  border-radius: 24px;
}
.slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: .4s;
  border-radius: 50%;
}
input:checked + .slider {
  background-color: #10b981;
}
input:checked + .slider:before {
  transform: translateX(20px);
}
`;
document.head.appendChild(style);

// --- Add: Helper to render average rating and total reviews ---
function renderReviewStats(reviews, containerSelector = '#reviewsContainer') {
    const container = document.querySelector(containerSelector);
    if (!container) return;
    if (!reviews || reviews.length === 0) {
        container.insertAdjacentHTML('afterbegin', '<div class="text-center text-gray-500 mb-4">No reviews yet.</div>');
        return;
    }
    const total = reviews.length;
    const avg = (reviews.reduce((sum, r) => sum + (parseInt(r.rating) || 0), 0) / total) || 0;
    const avgFixed = avg.toFixed(1);
    // Render stars (rounded to nearest half)
    const fullStars = Math.floor(avg);
    const halfStar = avg - fullStars >= 0.5;
    let starsHtml = '';
    for (let i = 0; i < fullStars; i++) starsHtml += '<i class="fas fa-star text-yellow-400"></i>';
    if (halfStar) starsHtml += '<i class="fas fa-star-half-alt text-yellow-400"></i>';
    for (let i = fullStars + halfStar; i < 5; i++) starsHtml += '<i class="far fa-star text-yellow-300"></i>';
    container.insertAdjacentHTML('afterbegin', `
        <div class="flex items-center gap-2 mb-6 justify-center">
            <span class="flex">${starsHtml}</span>
            <span class="font-semibold text-lg text-gray-800">${avgFixed}/5.0</span>
            <span class="text-gray-500">(${total} review${total !== 1 ? 's' : ''})</span>
        </div>
    `);
}

// Patch: Show average rating and total reviews in displayReviews
const origDisplayReviews = displayReviews;
displayReviews = function(reviews) {
    const container = document.querySelector('#reviewsContainer');
    if (container) container.innerHTML = '';
    renderReviewStats(reviews, '#reviewsContainer');
    origDisplayReviews(reviews);
}

// Patch: Show average rating and total reviews in loadReviews
const origLoadReviews = loadReviews;
loadReviews = async function() {
    try {
        const reviews = await fetchAllReviewsFromTeachersWebsites();
        const approved = reviews.filter(r => r.is_visible);
        const reviewsContainer = document.getElementById('reviewsContainer');
        if (reviewsContainer) reviewsContainer.innerHTML = '';
        renderReviewStats(approved, '#reviewsContainer');
        if (approved.length === 0) {
            reviewsContainer.innerHTML += `
                <div class="text-center text-gray-500">
                    <p>No reviews yet. Be the first to leave a review!</p>
                </div>
            `;
            return;
        }
        const reviewsGrid = document.createElement('div');
        reviewsGrid.className = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6';
        approved.forEach(review => {
            const reviewCard = document.createElement('div');
            reviewCard.className = 'bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow';
            reviewCard.innerHTML = `
                <div class="flex items-start justify-between mb-4">
                    <div>
                        <h4 class="font-semibold text-gray-800">${review.student_name}</h4>
                        <div class="flex items-center mt-1">
                            ${generateStarRating(review.rating)}
                        </div>
                    </div>
                    <div class="text-sm text-gray-500">
                        ${new Date(review.created_at).toLocaleDateString()}
                    </div>
                </div>
                <p class="text-gray-600">${review.review_text}</p>
            `;
            reviewsGrid.appendChild(reviewCard);
        });
        reviewsContainer.appendChild(reviewsGrid);
    } catch (error) {
        console.error('Error loading reviews:', error);
        showAlert('error', 'Failed to load reviews');
    }
}

// On DOMContentLoaded, bind refresh button
document.addEventListener('DOMContentLoaded', function() {
    const refreshBtn = document.getElementById('refreshReviewsBtn');
    if (refreshBtn) {
        refreshBtn.onclick = loadAllReviews;
    }
}); 