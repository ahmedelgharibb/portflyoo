/**
 * Useful SQL queries for the Supabase database
 * Copy these queries and run them in the Supabase SQL Editor or in the custom SQL query tool
 */

// Schema information - Run this to see the database structure
const SCHEMA_INFO = `
-- Get table structure for reviews table
SELECT 
    table_schema,
    table_name, 
    column_name, 
    data_type, 
    column_default,
    is_nullable
FROM 
    information_schema.columns
WHERE 
    table_name = 'reviews'
ORDER BY 
    ordinal_position;

-- Get table structure for site_data table
SELECT 
    table_schema,
    table_name, 
    column_name, 
    data_type, 
    column_default,
    is_nullable
FROM 
    information_schema.columns
WHERE 
    table_name = 'site_data'
ORDER BY 
    ordinal_position;
`;

// Basic review queries
const REVIEW_QUERIES = {
    // Get all reviews
    getAllReviews: `
SELECT * FROM reviews 
ORDER BY created_at DESC;`,

    // Get approved reviews only
    getApprovedReviews: `
SELECT * FROM reviews 
WHERE approved = true 
ORDER BY created_at DESC;`,

    // Get unapproved (pending) reviews
    getUnapprovedReviews: `
SELECT * FROM reviews 
WHERE approved = false 
ORDER BY created_at DESC;`,

    // Get review statistics
    getReviewStats: `
SELECT 
    COUNT(*) AS total_reviews,
    COUNT(CASE WHEN approved = true THEN 1 END) AS approved_reviews,
    COUNT(CASE WHEN approved = false THEN 1 END) AS pending_reviews,
    AVG(rating) AS average_rating,
    MIN(created_at) AS first_review_date,
    MAX(created_at) AS latest_review_date
FROM reviews;`,

    // Get reviews by date range (last 30 days)
    getRecentReviews: `
SELECT * FROM reviews 
WHERE created_at >= NOW() - INTERVAL '30 days'
ORDER BY created_at DESC;`,

    // Get review distribution by rating
    getRatingDistribution: `
SELECT 
    rating, 
    COUNT(*) as count, 
    ROUND((COUNT(*) * 100.0 / (SELECT COUNT(*) FROM reviews)), 1) as percentage
FROM reviews
GROUP BY rating
ORDER BY rating DESC;`
};

// Site data queries
const SITE_DATA_QUERIES = {
    // Get site data with reviews
    getSiteData: `
SELECT * FROM site_data
WHERE id = 1;`,

    // Get just the reviews array from site data
    getReviewsFromSiteData: `
SELECT data->'reviews' AS reviews
FROM site_data
WHERE id = 1;`
};

// Update operations (these should be executed through the Supabase API, not SQL)
const UPDATE_OPERATIONS = {
    // Approve a review - replace :id with the actual review ID
    approveReview: `
UPDATE reviews
SET approved = true
WHERE id = :id
RETURNING *;`,

    // Delete a review - replace :id with the actual review ID
    deleteReview: `
DELETE FROM reviews
WHERE id = :id
RETURNING *;`
};

console.log("SQL queries file loaded. Use these queries in your Supabase dashboard or the custom SQL query tool."); 