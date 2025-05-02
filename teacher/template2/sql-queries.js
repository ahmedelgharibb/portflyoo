/**
 * Useful SQL queries for the Supabase database
 * Copy these queries and run them in the Supabase SQL Editor or in the custom SQL query tool
 */

// Schema information - Run this to see the database structure
const SCHEMA_INFO = `
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

// Basic site_data queries
const REVIEW_QUERIES = {
    // Get all site_data
    getAllReviews: `
SELECT * FROM site_data 
WHERE id = 1;`,

    // Get site_data count
    getReviewStats: `
SELECT 
    COUNT(*) AS site_data_count
FROM site_data;`
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
    // Dummy operations - these are for reference only, not for direct execution
    approveReview: `
-- This operation should be performed using JavaScript, not SQL
-- Example of how to update a specific review in the site_data.reviews array:

-- 1. Get the current site_data
-- 2. Find the review by ID in the site_data.data.reviews array
-- 3. Update the approved status to true
-- 4. Save the updated site_data back to the database`,

    // Delete a review - reference only
    deleteReview: `
-- This operation should be performed using JavaScript, not SQL
-- Example of how to delete a review from the site_data.reviews array:

-- 1. Get the current site_data
-- 2. Filter out the review with the specified ID from site_data.data.reviews
-- 3. Save the updated site_data back to the database`
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

// Add a review example
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