// Supabase client initialization
const SUPABASE_URL = 'https://bqpchhitrbyfleqpyydz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJxcGNoaGl0cmJ5ZmxlcXB5eWR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM0NTU4ODgsImV4cCI6MjA1OTAzMTg4OH0.Yworu_EPLewJJGBFnW5W7GUsNZIONc3qOEJMTwJMzzQ';

// Create Supabase client properly
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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

// Review submission handling
async function submitReview(event) {
    event.preventDefault(); // Prevent form submission
    console.log('🚀 Starting review submission process...'); // Console logging
    console.log('----------------------------------------');

    const form = event.target;
    const studentName = form.querySelector('#reviewName').value.trim();
    const reviewText = form.querySelector('#reviewText').value.trim();
    const ratingContainer = form.querySelector('#ratingContainer');
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
        const { data, error } = await supabase
            .from('reviews')
            .insert([
                {
                    student_name: studentName,
                    rating: rating,
                    review_text: reviewText,
                    is_visible: false
                }
            ])
            .select();

        if (error) {
            console.error('❌ Supabase Error:', error);
            console.error('Error Code:', error.code);
            console.error('Error Message:', error.message);
            console.error('Error Details:', error.details);
            console.error('----------------------------------------');
            throw error;
        }

        console.log('✅ Review saved successfully!');
        console.log('📊 Database Response:', data);
        console.log('----------------------------------------');
        
        // Show success message
        showToast('Thank you! Your review has been submitted and will be visible after approval.');
        
        console.log('🔄 Resetting form...');
        // Reset form
        form.reset();
        ratingContainer.setAttribute('data-rating', '0');
        new StarRating(ratingContainer);

        // If we're in the admin panel, refresh the reviews list
        if (document.querySelector('#adminReviewsContainer')) {
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

// Fetch and display approved reviews
async function loadApprovedReviews() {
    console.log('Loading approved reviews...'); // Console logging

    try {
        const { data, error } = await supabase
            .from('reviews')
            .select('*')
            .eq('is_visible', true)
            .order('created_at', { ascending: false });

        if (error) throw error;

        console.log('Approved reviews loaded:', data); // Console logging
        displayReviews(data);
    } catch (error) {
        console.error('Error loading reviews:', error); // Console logging
        showToast('Failed to load reviews. Please refresh the page.', 'error');
    }
}

// Display reviews in the reviews container
function displayReviews(reviews) {
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
        new StarRating(
            reviewElement.querySelector('.star-rating'),
            review.rating,
            true
        );
    });
}

// Admin: Load all reviews
async function loadAllReviews() {
    console.log('Loading all reviews for admin...'); // Console logging

    try {
        const { data, error } = await supabase
            .from('reviews')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        console.log('All reviews loaded:', data); // Console logging
        displayAdminReviews(data);
    } catch (error) {
        console.error('Error loading admin reviews:', error); // Console logging
        showToast('Failed to load reviews. Please refresh the page.', 'error');
    }
}

// Admin: Display reviews in admin panel
function displayAdminReviews(reviews) {
    const container = document.querySelector('#adminReviewsContainer');
    if (!container) return;

    container.innerHTML = '';

    if (reviews.length === 0) {
        container.innerHTML = `
            <div class="text-center text-gray-500 py-8">
                <p>No reviews available.</p>
            </div>
        `;
        return;
    }

    reviews.forEach(review => {
        const reviewElement = document.createElement('div');
        reviewElement.className = `bg-white rounded-lg shadow-md p-6 mb-4 ${
            review.is_visible ? 'border-green-500' : 'border-red-500'
        } border-l-4`;
        reviewElement.innerHTML = `
            <div class="flex items-center justify-between mb-4">
                <h4 class="text-lg font-semibold">${review.student_name}</h4>
                <div class="star-rating" data-rating="${review.rating}"></div>
            </div>
            <p class="text-gray-600">${review.review_text}</p>
            <div class="flex items-center justify-between mt-4">
                <div class="text-sm text-gray-400">
                    ${new Date(review.created_at).toLocaleDateString()}
                </div>
                <div class="flex gap-2">
                    <button
                        class="px-4 py-2 rounded ${
                            review.is_visible
                                ? 'bg-red-500 hover:bg-red-600'
                                : 'bg-green-500 hover:bg-green-600'
                        } text-white"
                        onclick="toggleReviewVisibility('${review.id}', ${!review.is_visible})"
                    >
                        ${review.is_visible ? 'Hide' : 'Show'}
                    </button>
                    <button
                        class="px-4 py-2 rounded bg-red-500 hover:bg-red-600 text-white"
                        onclick="deleteReview('${review.id}')"
                    >
                        Delete
                    </button>
                </div>
            </div>
        `;

        container.appendChild(reviewElement);
        new StarRating(
            reviewElement.querySelector('.star-rating'),
            review.rating,
            true
        );
    });
}

// Admin: Toggle review visibility
async function toggleReviewVisibility(reviewId, isVisible) {
    console.log(`Toggling review visibility: ${reviewId} to ${isVisible}`); // Console logging

    try {
        const { data, error } = await supabase
            .from('reviews')
            .update({
                is_visible: isVisible,
                approved_at: isVisible ? new Date().toISOString() : null
            })
            .eq('id', reviewId);

        if (error) throw error;

        console.log('Review visibility updated:', data); // Console logging
        showToast(`Review ${isVisible ? 'shown' : 'hidden'} successfully`);
        loadAllReviews(); // Refresh admin view
    } catch (error) {
        console.error('Error toggling review visibility:', error); // Console logging
        showToast('Failed to update review visibility', 'error');
    }
}

// Admin: Delete review
async function deleteReview(reviewId) {
    if (!confirm('Are you sure you want to delete this review?')) return;

    console.log(`Deleting review: ${reviewId}`); // Console logging

    try {
        const { data, error } = await supabase
            .from('reviews')
            .delete()
            .eq('id', reviewId);

        if (error) throw error;

        console.log('Review deleted:', data); // Console logging
        showToast('Review deleted successfully');
        loadAllReviews(); // Refresh admin view
    } catch (error) {
        console.error('Error deleting review:', error); // Console logging
        showToast('Failed to delete review', 'error');
    }
}

// Initialize review system
document.addEventListener('DOMContentLoaded', () => {
    console.log('Initializing review system...'); // Console logging

    // Initialize star rating for new review form
    const ratingContainer = document.querySelector('#ratingContainer');
    if (ratingContainer) {
        const starRating = new StarRating(ratingContainer);
        // Update data-rating attribute when rating changes
        ratingContainer.addEventListener('ratingChanged', (event) => {
            ratingContainer.setAttribute('data-rating', event.detail);
            console.log('Rating updated:', event.detail); // Console logging
        });
    }

    // Load reviews
    loadApprovedReviews();

    // If admin panel is present, load all reviews
    if (document.querySelector('#adminReviewsContainer')) {
        loadAllReviews();
    }

    // Initialize review form
    const reviewForm = document.querySelector('#reviewForm');
    if (reviewForm) {
        reviewForm.addEventListener('submit', submitReview);
    }
});

// Export functions for use in other files
window.toggleReviewVisibility = toggleReviewVisibility;
window.deleteReview = deleteReview; 