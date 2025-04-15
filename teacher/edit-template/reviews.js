// Reviews functionality for teacher portfolio website

// Initialize Supabase client if not already defined
let supabase;
const SUPABASE_URL = 'https://bqpchhitrbyfleqpyydz.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJxcGNoaGl0cmJ5ZmxlcXB5eWR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM0NTU4ODgsImV4cCI6MjA1OTAzMTg4OH0.Yworu_EPLewJJGBFnW5W4EHO4YLRDGU6p0xJhGbj_as';

// Initialize Supabase client
try {
    if (window.supabase) {
        // Create a new Supabase client
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
        console.log('Supabase initialized in reviews.js');
    } else {
        console.warn('Supabase library not found. Reviews will use localStorage only.');
    }
} catch (error) {
    console.error('Error initializing Supabase in reviews.js:', error);
    console.warn('Reviews functionality will continue using localStorage only');
}

// Setup reviews functionality
function setupReviews() {
    console.log('Setting up reviews functionality');
    
    // Ensure reviews array exists in localStorage
    if (!localStorage.getItem('reviews')) {
        localStorage.setItem('reviews', JSON.stringify([]));
        console.log('Created initial empty reviews array in localStorage');
    } else {
        // Validate stored reviews are an array
        try {
            const storedReviews = JSON.parse(localStorage.getItem('reviews'));
            if (!Array.isArray(storedReviews)) {
                console.warn('Stored reviews is not an array, resetting');
                localStorage.setItem('reviews', JSON.stringify([]));
            }
        } catch (e) {
            console.warn('Error parsing stored reviews, resetting', e);
            localStorage.setItem('reviews', JSON.stringify([]));
        }
    }
    
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
    } else {
        console.warn('Star rating elements not found in the DOM');
    }
    
    // Handle review form submission
    const reviewForm = document.getElementById('reviewForm');
    if (reviewForm) {
        reviewForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            try {
                // Get form values with validation
                const nameInput = document.getElementById('reviewName');
                const ratingInput = document.getElementById('reviewRating');
                const commentInput = document.getElementById('reviewComment');
                
                if (!nameInput || !ratingInput || !commentInput) {
                    console.error('Review form inputs not found');
                    alert('Something went wrong with the review form. Please try again later.');
                    return;
                }
                
                const name = nameInput.value.trim();
                const rating = parseInt(ratingInput.value) || 0;
                const comment = commentInput.value.trim();
                
                if (!name || !comment || rating === 0) {
                    alert('Please fill in all fields and provide a rating');
                    return;
                }
                
                // Show loading state
                const submitBtn = reviewForm.querySelector('button[type="submit"]');
                const originalBtnText = submitBtn ? submitBtn.innerHTML : '';
                if (submitBtn) {
                    submitBtn.disabled = true;
                    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Submitting...';
                }
                
                // Create a review object
                const review = {
                    id: Date.now().toString(), // Use timestamp as a simple unique ID
                    name,
                    rating,
                    comment,
                    date: new Date().toISOString(),
                    approved: true // Auto-approve by default
                };
                
                console.log('Submitting review:', review);
                
                // Save the review
                await saveReview(review);
                
                // Clear the form
                reviewForm.reset();
                
                // Reset rating stars
                const setRating = typeof window.setRating === 'function' ? window.setRating : null;
                if (setRating) {
                    setRating(0);
                } else {
                    document.getElementById('reviewRating').value = "0";
                    
                    const selectedRating = document.getElementById('selected-rating');
                    if (selectedRating) {
                        selectedRating.textContent = "0/5";
                    }
                    
                    document.querySelectorAll('.rating-container .star').forEach(star => {
                        star.classList.remove('active');
                    });
                }
                
                // Show success message
                alert('Thanks for your review! It has been posted successfully.');
                
                // Reset button state
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalBtnText;
                }
                
                // Load reviews again to show the new one
                await loadReviews();
                
                // Scroll to the reviews section
                const reviewsSection = document.getElementById('reviews');
                if (reviewsSection) {
                    reviewsSection.scrollIntoView({ behavior: 'smooth' });
                }
            } catch (error) {
                console.error('Error submitting review:', error);
                alert('An error occurred while submitting your review. Please try again.');
                
                // Reset button state if there was an error
                const submitBtn = reviewForm.querySelector('button[type="submit"]');
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = 'Submit Review';
                }
            }
        });
    }
    
    // Setup admin review management
    const refreshReviewsBtn = document.getElementById('refreshReviewsBtn');
    if (refreshReviewsBtn) {
        refreshReviewsBtn.addEventListener('click', function() {
            console.log('Refresh reviews button clicked');
            
            // Clear the reviews for a clean reload
            const adminContainer = document.getElementById('admin-reviews-container');
            if (adminContainer) {
                adminContainer.innerHTML = `
                    <div class="p-6 text-center text-gray-500">
                        <i class="fas fa-spinner fa-spin text-gray-300 text-4xl mb-2"></i>
                        <p>Loading reviews...</p>
                    </div>
                `;
            }
            
            // Force reload reviews from localStorage
            const localReviews = localStorage.getItem('reviews');
            if (localReviews) {
                try {
                    const parsedReviews = JSON.parse(localReviews);
                    if (Array.isArray(parsedReviews)) {
                        console.log('Displaying reviews from localStorage directly:', parsedReviews.length);
                        displayAdminReviews(parsedReviews);
                    }
                } catch (e) {
                    console.error('Error parsing reviews for refresh:', e);
                }
            }
            
            // Also try the standard loading method
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

// Load reviews from Supabase
async function loadReviews(includeUnapproved = false) {
    try {
        console.log('Loading reviews, includeUnapproved:', includeUnapproved);
        
        // First try to get reviews from localStorage
        let reviews = [];
        const localData = localStorage.getItem('reviews');
        
        if (localData) {
            try {
                reviews = JSON.parse(localData);
                if (!Array.isArray(reviews)) {
                    console.warn('localStorage reviews is not an array, resetting');
                    reviews = [];
                } else {
                    console.log(`Found ${reviews.length} reviews in localStorage`);
                }
            } catch (e) {
                console.error('Error parsing reviews from localStorage:', e);
                reviews = [];
            }
        }
        
        // If we already have reviews in localStorage, use those
        if (reviews.length > 0) {
            console.log('Using reviews from localStorage');
            
            // Display reviews based on approval status
            if (includeUnapproved) {
                console.log('Displaying all reviews including unapproved in admin panel');
                displayAdminReviews(reviews);
            } else {
                console.log('Displaying only approved reviews in public view');
                displayReviews(reviews.filter(review => review.approved !== false));
            }
            
            return reviews;
        }
        
        // Otherwise try to fetch from Supabase
        console.log('Attempting to fetch reviews from Supabase');
        
        // If no supabase client, return empty array
        if (!supabase) {
            console.warn('Supabase client not initialized');
            return [];
        }
        
        // Get reviews from Supabase
        const { data, error } = await supabase
            .from('reviews')
            .select('*')
            .order('created_at', { ascending: false });
            
        if (error) {
            console.error('Error loading reviews from Supabase:', error);
            // Continue with any cached reviews we might have
        }
        
        if (data && Array.isArray(data)) {
            console.log(`Retrieved ${data.length} reviews from Supabase`);
            reviews = data;
            
            // Cache in localStorage
            localStorage.setItem('reviews', JSON.stringify(reviews));
            
            // Display reviews based on approval status
            if (includeUnapproved) {
                console.log('Displaying all reviews including unapproved in admin panel');
                displayAdminReviews(reviews);
            } else {
                console.log('Displaying only approved reviews in public view');
                displayReviews(reviews.filter(review => review.approved !== false));
            }
        } else {
            console.warn('No reviews found or invalid data format received');
        }
        
        return reviews;
    } catch (error) {
        console.error('Error in loadReviews function:', error);
        return [];
    }
}

// Save a review to storage
async function saveReview(review) {
    try {
        // Try to load existing reviews
        let existingReviews = [];
        
        // First try to get reviews from localStorage
        const localData = localStorage.getItem('reviews');
        if (localData) {
            try {
                existingReviews = JSON.parse(localData);
                console.log('Loaded reviews from localStorage:', existingReviews);
            } catch (e) {
                console.warn('Error parsing localStorage reviews, starting fresh', e);
                existingReviews = [];
            }
        }
        
        // If we get here and existingReviews is not an array, initialize it as one
        if (!Array.isArray(existingReviews)) {
            console.warn('existingReviews is not an array, resetting to empty array');
            existingReviews = [];
        }
        
        // Add the new review
        existingReviews.push(review);
        
        // Force a deep clone to avoid reference issues
        const reviewsToSave = JSON.parse(JSON.stringify(existingReviews));
        
        // Always save to localStorage first as backup
        localStorage.setItem('reviews', JSON.stringify(reviewsToSave));
        console.log('Saved review to localStorage:', reviewsToSave);
        
        // Try to save to Supabase if available
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
                        reviews: reviewsToSave
                    };
                    
                    // Save back to Supabase
                    const { error } = await supabase
                        .from('site_data')
                        .update({ data: updatedData })
                        .eq('id', 1);
                    
                    if (error) {
                        console.error('Error saving reviews to Supabase:', error);
                    } else {
                        console.log('Saved review to Supabase');
                    }
                } else {
                    console.warn('Unable to get site data from Supabase:', siteError);
                }
            } catch (e) {
                console.error('Error updating site data with reviews:', e);
            }
        } else {
            console.log('Supabase not available, reviews saved to localStorage only');
        }
        
        // Immediately update the UI with the new review
        displayReviews(reviewsToSave);
        
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
    
    try {
        // Clear existing reviews (except empty state)
        Array.from(container.children).forEach(child => {
            if (!child.classList.contains('review-empty-state')) {
                child.remove();
            }
        });
        
        // Make sure reviews is an array
        if (!Array.isArray(reviews)) {
            console.error('Expected reviews to be an array, got:', typeof reviews);
            reviews = [];
        }
        
        // Show or hide empty state
        if (!reviews || reviews.length === 0) {
            if (emptyState) emptyState.style.display = 'block';
            console.log('No reviews to display');
            return;
        } else {
            if (emptyState) emptyState.style.display = 'none';
        }
        
        // Sort reviews by date (newest first)
        reviews.sort((a, b) => {
            try {
                return new Date(b.date) - new Date(a.date);
            } catch (e) {
                return 0; // Keep original order if date comparison fails
            }
        });
        
        console.log('Displaying', reviews.length, 'reviews');
        
        // Add reviews to the container
        reviews.forEach((review, index) => {
            try {
                // Validate review data
                if (!review || typeof review !== 'object') {
                    console.warn('Invalid review data:', review);
                    return;
                }
                
                const card = document.createElement('div');
                card.className = 'review-card';
                
                // Format the date safely
                let formattedDate = '';
                try {
                    const reviewDate = new Date(review.date || new Date());
                    formattedDate = reviewDate.toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric' 
                    });
                } catch (e) {
                    formattedDate = 'Unknown date';
                    console.warn('Error formatting date:', e);
                }
                
                // Get initials for avatar safely
                let initials = '??';
                try {
                    if (review.name && typeof review.name === 'string') {
                        initials = review.name
                            .split(' ')
                            .map(name => name[0])
                            .join('')
                            .toUpperCase();
                    }
                } catch (e) {
                    console.warn('Error creating initials:', e);
                }
                
                // Create stars safely
                let stars = '';
                try {
                    const rating = parseInt(review.rating) || 0;
                    for (let i = 1; i <= 5; i++) {
                        if (i <= rating) {
                            stars += '★';
                        } else {
                            stars += '☆';
                        }
                    }
                } catch (e) {
                    stars = '☆☆☆☆☆';
                    console.warn('Error creating stars:', e);
                }
                
                card.innerHTML = `
                    <div class="review-header">
                        <div class="review-avatar">${initials}</div>
                        <div>
                            <div class="review-author">${review.name || 'Anonymous'}</div>
                            <div class="review-date">${formattedDate}</div>
                        </div>
                    </div>
                    <div class="review-rating">${stars}</div>
                    <div class="review-content">${review.comment || 'No comment provided'}</div>
                `;
                
                container.appendChild(card);
            } catch (error) {
                console.error('Error displaying review:', error, review);
            }
        });
        
        console.log('All reviews displayed successfully');
    } catch (error) {
        console.error('Error in displayReviews:', error);
        
        // Fallback to simple display
        if (emptyState) {
            emptyState.style.display = 'none';
        }
        
        const fallbackCard = document.createElement('div');
        fallbackCard.className = 'review-card';
        fallbackCard.innerHTML = `
            <div class="review-content">
                There was an error displaying reviews. Please try refreshing the page.
            </div>
        `;
        container.appendChild(fallbackCard);
    }
}

// Load reviews for the admin panel
async function loadAdminReviews() {
    const reviews = await loadReviews(true); // Pass true to get all reviews including unapproved
    displayAdminReviews(reviews);
}

// Display reviews in the admin panel
function displayAdminReviews(reviews) {
    const container = document.getElementById('admin-reviews-container');
    if (!container) {
        console.error('Admin reviews container not found');
        return;
    }
    
    try {
        console.log('Displaying admin reviews:', reviews ? reviews.length : 0);
        
        // Clear existing content
        container.innerHTML = '';
        
        // Validate reviews is an array
        if (!Array.isArray(reviews) || reviews.length === 0) {
            console.log('No reviews to display in admin panel');
            container.innerHTML = `
                <div class="p-6 text-center text-gray-500">
                    <i class="fas fa-comments text-gray-300 text-4xl mb-2"></i>
                    <p>No reviews found.</p>
                </div>
            `;
            return;
        }
        
        // Sort reviews by date (newest first)
        reviews.sort((a, b) => {
            try {
                return new Date(b.date) - new Date(a.date);
            } catch (e) {
                return 0;
            }
        });
        
        // Add reviews to the container
        reviews.forEach(review => {
            try {
                // Skip invalid reviews
                if (!review || typeof review !== 'object') {
                    console.warn('Invalid review object in admin display:', review);
                    return;
                }
                
                const reviewEl = document.createElement('div');
                reviewEl.className = 'p-4 hover:bg-gray-50 transition-colors';
                reviewEl.dataset.reviewId = review.id || Date.now().toString(); // Fallback ID
                
                // Format the date safely
                let formattedDate = 'Unknown date';
                try {
                    const reviewDate = new Date(review.date || new Date());
                    formattedDate = reviewDate.toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric' 
                    });
                } catch (e) {
                    console.warn('Error formatting date for admin review:', e);
                }
                
                // Create stars safely
                let stars = '';
                try {
                    const rating = parseInt(review.rating) || 0;
                    for (let i = 1; i <= 5; i++) {
                        if (i <= rating) {
                            stars += '★';
                        } else {
                            stars += '☆';
                        }
                    }
                } catch (e) {
                    stars = '☆☆☆☆☆';
                    console.warn('Error creating stars for admin review:', e);
                }
                
                reviewEl.innerHTML = `
                    <div class="flex justify-between items-start mb-2">
                        <div>
                            <h5 class="font-semibold text-gray-800">${review.name || 'Anonymous'}</h5>
                            <p class="text-sm text-gray-500">${formattedDate}</p>
                        </div>
                        <div class="text-yellow-500">${stars}</div>
                    </div>
                    <p class="text-gray-600 mb-4">${review.comment || 'No comment provided'}</p>
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
                        await approveReview(reviewEl.dataset.reviewId);
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
            } catch (error) {
                console.error('Error creating admin review element:', error);
            }
        });
        
        console.log('Admin reviews displayed successfully');
    } catch (error) {
        console.error('Error displaying admin reviews:', error);
        container.innerHTML = `
            <div class="p-6 text-center text-gray-500">
                <i class="fas fa-exclamation-triangle text-yellow-500 text-4xl mb-2"></i>
                <p>There was an error displaying reviews. Please try refreshing the page.</p>
            </div>
        `;
    }
}

// Toggle review approval status
async function toggleReviewApproval(reviewId, approved) {
    try {
        console.log('Toggling review approval:', reviewId, approved);
        
        // Get reviews directly from localStorage first
        let reviews = [];
        const localData = localStorage.getItem('reviews');
        
        if (localData) {
            try {
                reviews = JSON.parse(localData);
                if (!Array.isArray(reviews)) {
                    console.warn('localStorage reviews is not an array');
                    reviews = [];
                }
            } catch (e) {
                console.error('Error parsing reviews from localStorage:', e);
                reviews = [];
            }
        }
        
        // If no reviews in localStorage, try to load them
        if (reviews.length === 0) {
            reviews = await loadReviews(true);
        }
        
        // Find and update the review
        const index = reviews.findIndex(review => review.id === reviewId);
        
        if (index !== -1) {
            reviews[index].approved = approved;
            console.log('Updated review approval status:', reviewId, approved);
            
            // Save updated reviews back to localStorage immediately
            localStorage.setItem('reviews', JSON.stringify(reviews));
            
            // Save updated reviews back to storage
            await saveReviews(reviews);
            
            // Reload reviews in UI
            displayAdminReviews(reviews);
            displayReviews(reviews.filter(review => review.approved !== false));
            
            return true;
        } else {
            console.warn('Review not found for approval toggle:', reviewId);
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
        console.log('Deleting review:', reviewId);
        
        // Get reviews directly from localStorage first
        let reviews = [];
        const localData = localStorage.getItem('reviews');
        
        if (localData) {
            try {
                reviews = JSON.parse(localData);
                if (!Array.isArray(reviews)) {
                    console.warn('localStorage reviews is not an array');
                    reviews = [];
                }
            } catch (e) {
                console.error('Error parsing reviews from localStorage:', e);
                reviews = [];
            }
        }
        
        // If no reviews in localStorage, try to load them
        if (reviews.length === 0) {
            reviews = await loadReviews(true);
        }
        
        // Count reviews before filtering
        const countBefore = reviews.length;
        
        // Filter out the deleted review
        reviews = reviews.filter(review => review.id !== reviewId);
        
        // Count reviews after filtering
        const countAfter = reviews.length;
        
        if (countBefore !== countAfter) {
            console.log('Review deleted successfully:', reviewId);
            
            // Save updated reviews back to localStorage immediately
            localStorage.setItem('reviews', JSON.stringify(reviews));
            
            // Save updated reviews back to storage
            await saveReviews(reviews);
            
            // Reload reviews in UI
            displayAdminReviews(reviews);
            displayReviews(reviews.filter(review => review.approved !== false));
            
            return true;
        } else {
            console.warn('Review not found for deletion:', reviewId);
        }
        
        return false;
    } catch (error) {
        console.error('Error deleting review:', error);
        throw error;
    }
}

// Save reviews to storage (helper function for bulk operations)
async function saveReviews(reviews) {
    try {
        // Validate input
        if (!Array.isArray(reviews)) {
            console.error('saveReviews expects an array, got:', typeof reviews);
            return false;
        }
        
        // Always save to localStorage first as backup
        try {
            localStorage.setItem('reviews', JSON.stringify(reviews));
            console.log('Saved reviews to localStorage:', reviews.length, 'reviews');
        } catch (localStorageError) {
            console.error('Error saving to localStorage:', localStorageError);
            // Try saving with a smaller subset if localStorage is full
            if (reviews.length > 10) {
                try {
                    // Save just the 10 most recent reviews
                    const recentReviews = reviews
                        .sort((a, b) => new Date(b.date) - new Date(a.date))
                        .slice(0, 10);
                    localStorage.setItem('reviews', JSON.stringify(recentReviews));
                    console.log('Saved 10 most recent reviews to localStorage as fallback');
                } catch (e) {
                    console.error('Could not save even reduced reviews to localStorage:', e);
                }
            }
        }
        
        // Try to save to Supabase if available
        if (supabase && supabase.from) {
            try {
                // Get current site data
                const { data: siteData, error: siteError } = await supabase
                    .from('site_data')
                    .select('data')
                    .eq('id', 1)
                    .single();
                
                if (siteError) {
                    console.error('Error getting site data from Supabase:', siteError);
                    return false;
                }
                
                if (!siteData || !siteData.data) {
                    console.error('No site data found in Supabase');
                    
                    // Try to create initial data
                    const initialData = { reviews: reviews };
                    const { error: insertError } = await supabase
                        .from('site_data')
                        .insert([{ id: 1, data: initialData }]);
                    
                    if (insertError) {
                        console.error('Error creating initial site data:', insertError);
                        return false;
                    }
                    
                    console.log('Created initial site data with reviews');
                    return true;
                }
                
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
                    return false;
                }
                
                console.log('Successfully saved reviews to Supabase');
                return true;
            } catch (e) {
                console.error('Error in Supabase save operation:', e);
                return false;
            }
        } else {
            console.log('Supabase not available, reviews saved to localStorage only');
            return true; // Consider localStorage save a success
        }
    } catch (error) {
        console.error('Error in saveReviews:', error);
        return false;
    }
}

// Initialize the reviews functionality when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('Initializing reviews functionality...');
    try {
        // Create a default empty reviews array if none exists
        if (!localStorage.getItem('reviews')) {
            localStorage.setItem('reviews', JSON.stringify([]));
            console.log('Created empty reviews array in localStorage');
        }
        
        // Initialize the reviews system
        setupReviews();
        console.log('Reviews functionality initialized successfully');
    } catch (error) {
        console.error('Error initializing reviews:', error);
        
        // Fallback initialization to ensure basic functionality
        const reviewForm = document.getElementById('reviewForm');
        const reviewsContainer = document.getElementById('reviews-container');
        
        if (reviewForm) {
            reviewForm.addEventListener('submit', function(e) {
                e.preventDefault();
                alert('Thank you for your review!');
                reviewForm.reset();
            });
        }
        
        if (reviewsContainer) {
            const emptyState = reviewsContainer.querySelector('.review-empty-state');
            if (emptyState) {
                emptyState.style.display = 'block';
            }
        }
    }
});

// Submit a new review
async function submitReview(event) {
    event.preventDefault();
    
    try {
        const form = event.target;
        const nameField = form.querySelector('#review-name');
        const ratingField = form.querySelector('#review-rating');
        const commentField = form.querySelector('#review-comment');
        
        // Basic validation
        if (!nameField.value || !ratingField.value || !commentField.value) {
            showAlert('Please fill in all fields', 'error');
            return;
        }
        
        // Create the review object
        const newReview = {
            id: Date.now().toString() + Math.random().toString(36).substring(2, 5),
            name: nameField.value.trim(),
            rating: parseInt(ratingField.value, 10),
            comment: commentField.value.trim(),
            date: new Date().toISOString(),
            approved: false // New reviews start as unapproved
        };
        
        console.log('Submitting new review:', newReview);
        
        // Get current reviews from localStorage
        let reviews = [];
        try {
            const localData = localStorage.getItem('reviews');
            if (localData) {
                reviews = JSON.parse(localData);
                if (!Array.isArray(reviews)) {
                    console.warn('localStorage reviews is not an array, resetting');
                    reviews = [];
                }
            }
        } catch (e) {
            console.error('Error parsing reviews from localStorage:', e);
            reviews = [];
        }
        
        // Add the new review
        reviews.unshift(newReview); // Add to the beginning of the array
        
        // Save to localStorage
        localStorage.setItem('reviews', JSON.stringify(reviews));
        
        // If Supabase is available, also save there
        if (supabase) {
            try {
                const { data, error } = await supabase
                    .from('reviews')
                    .insert([newReview]);
                    
                if (error) {
                    console.error('Error saving review to Supabase:', error);
                    // Continue anyway as we saved to localStorage
                } else {
                    console.log('Review saved to Supabase successfully');
                }
            } catch (e) {
                console.error('Exception when saving to Supabase:', e);
                // Continue anyway as we saved to localStorage
            }
        } else {
            console.log('Supabase not available, review saved only to localStorage');
        }
        
        // Clear the form
        form.reset();
        
        // Show success message
        showAlert('Thank you for your review! It will be visible after approval.', 'success');
        
        // Refresh the reviews display
        await loadReviews();
        
        // If we're in the admin panel, refresh the admin view too
        if (document.getElementById('admin-reviews-container')) {
            await loadReviews(true);
        }
        
        return true;
    } catch (error) {
        console.error('Error submitting review:', error);
        showAlert('An error occurred while submitting your review. Please try again.', 'error');
        return false;
    }
} 