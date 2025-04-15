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

// JSON queries - for reviews stored in site_data.data.reviews
const JSON_REVIEW_QUERIES = {
    // Get all reviews from site_data JSON
    getAllJsonReviews: `
SELECT 
    data->'reviews' as reviews
FROM 
    site_data
WHERE 
    id = 1;`,

    // Get review count from site_data
    getJsonReviewCount: `
SELECT 
    jsonb_array_length(data->'reviews') as review_count
FROM 
    site_data
WHERE 
    id = 1;`,

    // Get individual reviews as rows from JSON array
    getJsonReviewsAsRows: `
SELECT 
    jsonb_array_elements(data->'reviews') as review
FROM 
    site_data
WHERE 
    id = 1;`,

    // Get approved reviews only from JSON
    getApprovedJsonReviews: `
SELECT 
    jsonb_array_elements(data->'reviews') as review
FROM 
    site_data
WHERE 
    id = 1
    AND (jsonb_array_elements(data->'reviews')->>'approved')::boolean = true;`,

    // Get pending reviews only from JSON
    getPendingJsonReviews: `
SELECT 
    jsonb_array_elements(data->'reviews') as review
FROM 
    site_data
WHERE 
    id = 1
    AND (jsonb_array_elements(data->'reviews')->>'approved')::boolean = false;`,
    
    // Get average rating from JSON reviews
    getJsonAverageRating: `
WITH reviews AS (
    SELECT 
        jsonb_array_elements(data->'reviews') as review
    FROM 
        site_data
    WHERE 
        id = 1
)
SELECT 
    AVG((review->>'rating')::numeric) as average_rating
FROM 
    reviews;`,
    
    // Get distribution of ratings from JSON reviews
    getJsonRatingDistribution: `
WITH reviews AS (
    SELECT 
        jsonb_array_elements(data->'reviews') as review
    FROM 
        site_data
    WHERE 
        id = 1
)
SELECT 
    (review->>'rating') as rating,
    COUNT(*) as count
FROM 
    reviews
GROUP BY 
    rating
ORDER BY 
    rating DESC;`
};

// Create site_data table if it doesn't exist
const CREATE_SITE_DATA_SQL = `
-- Create site_data table if it doesn't exist
CREATE TABLE IF NOT EXISTS site_data (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    data JSONB DEFAULT '{}'::jsonb
);

-- Insert default row if not exists
INSERT INTO site_data (id, data)
VALUES (1, '{"reviews": []}'::jsonb)
ON CONFLICT (id) DO NOTHING;
`;

// Update site_data with reviews
const ADD_REVIEW_TO_SITE_DATA = `
-- Example: Add a review to the reviews array
UPDATE site_data
SET 
    data = jsonb_set(
        CASE 
            WHEN data ? 'reviews' THEN data 
            ELSE jsonb_set(data, '{reviews}', '[]'::jsonb) 
        END,
        '{reviews}',
        (data->'reviews') || jsonb_build_array(
            jsonb_build_object(
                'id', 'review-id-123',
                'name', 'John Doe',
                'rating', 5,
                'comment', 'Great template!',
                'date', to_char(now(), 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
                'approved', true
            )
        )
    ),
    updated_at = NOW()
WHERE id = 1;
`;

console.log("SQL queries file loaded. Use these queries in your Supabase dashboard or the custom SQL query tool."); 