// Reviews functionality for teacher portfolio website

// Initialize Supabase client if not already defined
let supabase;
if (window.supabase) {
    try {
        const SUPABASE_URL = 'https://bqpchhitrbyfleqpyydz.supabase.co';
        const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJxcGNoaGl0cmJ5ZmxlcXB5eWR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM0NTU4ODgsImV4cCI6MjA1OTAzMTg4OH0.Yworu_EPLewJJGBFnW5W4EHO4YLRDGU6p0xJhGbj_as';
        
        // Use the global supabase client if defined in script.js
        if (window.supabase) {
            supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
            console.log('Supabase initialized in reviews.js');
        }
    } catch (error) {
        console.error('Error initializing Supabase in reviews.js:', error);
    }
}

// Setup reviews functionality
function setupReviews() {
    console.log('Setting up reviews functionality');
    
    // Set up star rating functionality
    const stars = document.querySelectorAll('.rating-container .star');
    const selectedRating = document.getElementById('selected-rating');
    const ratingInput = document.getElementById('reviewRating');
    
    if (stars.length > 0 && selectedRating && ratingInput) {
        stars.forEach(star => {
            star.addEventListener('click', function() {
                const rating = parseInt(this.getAttribute('data-rating'));
                setRating(rating);
            });
            
            star.addEventListener('mouseover', function() {
                const rating = parseInt(this.getAttribute('data-rating'));
                highlightStars(rating);
            });
        });
        
        const ratingContainer = document.querySelector('.rating-container');
        if (ratingContainer) {
            ratingContainer.addEventListener('mouseout', function() {
                const currentRating = parseInt(ratingInput.value);
                highlightStars(currentRating);
            });
        }
        
        function setRating(rating) {
            ratingInput.value = rating;
            selectedRating.textContent = `${rating}/5`;
            highlightStars(rating);
        }
        
        function highlightStars(rating) {
            stars.forEach(star => {
                const starRating = parseInt(star.getAttribute('data-rating'));
                if (starRating <= rating) {
                    star.classList.add('active');
                } else {
                    star.classList.remove('active');
                }
            });
        }
    }
    
    // Handle review form submission
    const reviewForm = document.getElementById('reviewForm');
    if (reviewForm) {
        reviewForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const name = document.getElementById('reviewName').value;
            const rating = parseInt(document.getElementById('reviewRating').value);
            const comment = document.getElementById('reviewComment').value;
            
            if (!name || !comment || rating === 0) {
                alert('Please fill in all fields and provide a rating');
                return;
            }
            
            try {
                // Create a review object
                const review = {
                    id: Date.now().toString(), // Use timestamp as a simple unique ID
                    name,
                    rating,
                    comment,
                    date: new Date().toISOString(),
                    approved: true // Auto-approve by default
                };
                
                // Save the review
                await saveReview(review);
                
                // Clear the form
                reviewForm.reset();
                if (typeof setRating === 'function') {
                    setRating(0);
                } else {
                    document.getElementById('reviewRating').value = "0";
                    document.getElementById('selected-rating').textContent = "0/5";
                    document.querySelectorAll('.rating-container .star').forEach(star => {
                        star.classList.remove('active');
                    });
                }
                
                // Show success message
                alert('Thanks for your review! It has been posted successfully.');
                
                // Load reviews again to show the new one
                loadReviews();
            } catch (error) {
                console.error('Error submitting review:', error);
                alert('An error occurred while submitting your review. Please try again.');
            }
        });
    }
    
    // Setup admin review management
    const refreshReviewsBtn = document.getElementById('refreshReviewsBtn');
    if (refreshReviewsBtn) {
        refreshReviewsBtn.addEventListener('click', function() {
            loadAdminReviews();
        });
    }
    
    // Load initial reviews for the public page
    loadReviews();
    
    // Load admin reviews if in admin panel
    if (document.getElementById('admin-reviews-container')) {
        loadAdminReviews();
    }
}

// Load reviews from storage
async function loadReviews(includeUnapproved = false) {
    try {
        let reviews = [];
        
        // Try to get from Supabase if available
        if (supabase && supabase.from) {
            try {
                const { data, error } = await supabase
                    .from('site_data')
                    .select('data')
                    .eq('id', 1)
                    .single();
                
                if (!error && data && data.data && data.data.reviews) {
                    reviews = data.data.reviews;
                    console.log('Loaded reviews from Supabase:', reviews);
                }
            } catch (e) {
                console.warn('Error loading reviews from Supabase, trying localStorage', e);
            }
        }
        
        // If no reviews from Supabase, try localStorage
        if (reviews.length === 0) {
            const localData = localStorage.getItem('reviews');
            if (localData) {
                reviews = JSON.parse(localData);
                console.log('Loaded reviews from localStorage:', reviews);
            }
        }
        
        // Add ID field if missing (for backward compatibility)
        reviews = reviews.map(review => {
            if (!review.id) {
                review.id = Date.now().toString() + Math.random().toString(36).substr(2, 5);
            }
            // Add approved field if missing (for backward compatibility)
            if (review.approved === undefined) {
                review.approved = true;
            }
            return review;
        });
        
        // Filter out unapproved reviews for public display
        if (!includeUnapproved) {
            reviews = reviews.filter(review => review.approved !== false);
        }
        
        // Display the reviews on the public-facing section
        const container = document.getElementById('reviews-container');
        if (container) {
            displayReviews(reviews);
        }
        
        return reviews;
    } catch (error) {
        console.error('Error loading reviews:', error);
        return [];
    }
}

// Save a review to storage
async function saveReview(review) {
    try {
        // Try to load existing reviews
        let existingReviews = [];
        try {
            // First try to get from Supabase if available
            if (supabase && supabase.from) {
                const { data, error } = await supabase
                    .from('site_data')
                    .select('data')
                    .eq('id', 1)
                    .single();
                
                if (!error && data && data.data && data.data.reviews) {
                    existingReviews = data.data.reviews;
                }
            }
        } catch (e) {
            console.warn('Error loading reviews from Supabase, trying localStorage', e);
            
            // Fall back to localStorage
            const localData = localStorage.getItem('reviews');
            if (localData) {
                existingReviews = JSON.parse(localData);
            }
        }
        
        // Add the new review
        existingReviews.push(review);
        
        // Save back to storage
        await saveReviews(existingReviews);
        
        return true;
    } catch (error) {
        console.error('Error saving review:', error);
        throw error;
    }
}

// Display reviews in the DOM
function displayReviews(reviews) {
    const container = document.getElementById('reviews-container');
    const emptyState = document.querySelector('.review-empty-state');
    
    if (!container) {
        console.error('Reviews container not found');
        return;
    }
    
    // Clear existing reviews (except empty state)
    Array.from(container.children).forEach(child => {
        if (!child.classList.contains('review-empty-state')) {
            child.remove();
        }
    });
    
    // Show or hide empty state
    if (reviews.length === 0) {
        if (emptyState) emptyState.style.display = 'block';
        return;
    } else {
        if (emptyState) emptyState.style.display = 'none';
    }
    
    // Sort reviews by date (newest first)
    reviews.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Add reviews to the container
    reviews.forEach(review => {
        const card = document.createElement('div');
        card.className = 'review-card';
        
        // Format the date
        const reviewDate = new Date(review.date);
        const formattedDate = reviewDate.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
        
        // Get initials for avatar
        const initials = review.name
            .split(' ')
            .map(name => name[0])
            .join('')
            .toUpperCase();
        
        // Create stars
        let stars = '';
        for (let i = 1; i <= 5; i++) {
            if (i <= review.rating) {
                stars += '★';
            } else {
                stars += '☆';
            }
        }
        
        card.innerHTML = `
            <div class="review-header">
                <div class="review-avatar">${initials}</div>
                <div>
                    <div class="review-author">${review.name}</div>
                    <div class="review-date">${formattedDate}</div>
                </div>
            </div>
            <div class="review-rating">${stars}</div>
            <div class="review-content">${review.comment}</div>
        `;
        
        container.appendChild(card);
    });
}

// Load reviews for the admin panel
async function loadAdminReviews() {
    const reviews = await loadReviews(true); // Pass true to get all reviews including unapproved
    displayAdminReviews(reviews);
}

// Display reviews in the admin panel
function displayAdminReviews(reviews) {
    const container = document.getElementById('admin-reviews-container');
    if (!container) return;
    
    // Clear existing content
    container.innerHTML = '';
    
    if (!reviews || reviews.length === 0) {
        container.innerHTML = `
            <div class="p-6 text-center text-gray-500">
                <i class="fas fa-comments text-gray-300 text-4xl mb-2"></i>
                <p>No reviews found.</p>
            </div>
        `;
        return;
    }
    
    // Sort reviews by date (newest first)
    reviews.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Add reviews to the container
    reviews.forEach(review => {
        const reviewEl = document.createElement('div');
        reviewEl.className = 'p-4 hover:bg-gray-50 transition-colors';
        reviewEl.dataset.reviewId = review.id || Date.now().toString(); // Fallback ID
        
        // Format the date
        const reviewDate = new Date(review.date);
        const formattedDate = reviewDate.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
        
        // Create stars
        let stars = '';
        for (let i = 1; i <= 5; i++) {
            if (i <= review.rating) {
                stars += '★';
            } else {
                stars += '☆';
            }
        }
        
        reviewEl.innerHTML = `
            <div class="flex justify-between items-start mb-2">
                <div>
                    <h5 class="font-semibold text-gray-800">${review.name}</h5>
                    <p class="text-sm text-gray-500">${formattedDate}</p>
                </div>
                <div class="text-yellow-500">${stars}</div>
            </div>
            <p class="text-gray-600 mb-4">${review.comment}</p>
            <div class="flex justify-end gap-2">
                <button class="delete-review-btn px-3 py-1 bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors">
                    <i class="fas fa-trash-alt"></i> Delete
                </button>
                ${review.approved !== false ? 
                    `<button class="unapprove-review-btn px-3 py-1 bg-yellow-50 text-yellow-600 rounded hover:bg-yellow-100 transition-colors">
                        <i class="fas fa-eye-slash"></i> Hide
                    </button>` : 
                    `<button class="approve-review-btn px-3 py-1 bg-green-50 text-green-600 rounded hover:bg-green-100 transition-colors">
                        <i class="fas fa-check"></i> Approve
                    </button>`
                }
            </div>
        `;
        
        // Add event listeners for action buttons
        const deleteBtn = reviewEl.querySelector('.delete-review-btn');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', async () => {
                if (confirm('Are you sure you want to delete this review? This action cannot be undone.')) {
                    await deleteReview(reviewEl.dataset.reviewId);
                    reviewEl.remove();
                    // Refresh the public reviews
                    loadReviews();
                }
            });
        }
        
        const approveBtn = reviewEl.querySelector('.approve-review-btn');
        if (approveBtn) {
            approveBtn.addEventListener('click', async () => {
                await toggleReviewApproval(reviewEl.dataset.reviewId, true);
                loadAdminReviews(); // Reload admin reviews
                loadReviews(); // Reload public reviews
            });
        }
        
        const unapproveBtn = reviewEl.querySelector('.unapprove-review-btn');
        if (unapproveBtn) {
            unapproveBtn.addEventListener('click', async () => {
                await toggleReviewApproval(reviewEl.dataset.reviewId, false);
                loadAdminReviews(); // Reload admin reviews
                loadReviews(); // Reload public reviews
            });
        }
        
        container.appendChild(reviewEl);
    });
}

// Toggle review approval status
async function toggleReviewApproval(reviewId, approved) {
    try {
        // Get reviews from storage
        let reviews = await loadReviews(true);
        
        // Find and update the review
        const index = reviews.findIndex(review => review.id === reviewId);
        if (index !== -1) {
            reviews[index].approved = approved;
            
            // Save updated reviews back to storage
            await saveReviews(reviews);
            
            return true;
        }
        return false;
    } catch (error) {
        console.error('Error toggling review approval:', error);
        throw error;
    }
}

// Delete a review
async function deleteReview(reviewId) {
    try {
        // Get reviews from storage
        let reviews = await loadReviews(true);
        
        // Filter out the deleted review
        reviews = reviews.filter(review => review.id !== reviewId);
        
        // Save updated reviews back to storage
        await saveReviews(reviews);
        
        return true;
    } catch (error) {
        console.error('Error deleting review:', error);
        throw error;
    }
}

// Save reviews to storage (helper function for bulk operations)
async function saveReviews(reviews) {
    try {
        // Save to Supabase if available
        if (supabase && supabase.from) {
            try {
                // Get current site data
                const { data: siteData, error: siteError } = await supabase
                    .from('site_data')
                    .select('data')
                    .eq('id', 1)
                    .single();
                
                if (!siteError && siteData && siteData.data) {
                    // Update the reviews in the site data
                    const updatedData = {
                        ...siteData.data,
                        reviews: reviews
                    };
                    
                    // Save back to Supabase
                    const { error } = await supabase
                        .from('site_data')
                        .update({ data: updatedData })
                        .eq('id', 1);
                    
                    if (error) {
                        console.error('Error saving reviews to Supabase:', error);
                    }
                }
            } catch (e) {
                console.error('Error updating site data with reviews:', e);
            }
        }
        
        // Always save to localStorage as backup
        localStorage.setItem('reviews', JSON.stringify(reviews));
        
        return true;
    } catch (error) {
        console.error('Error saving reviews:', error);
        throw error;
    }
}

// Initialize the reviews functionality when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('Initializing reviews functionality...');
    setupReviews();
}); 