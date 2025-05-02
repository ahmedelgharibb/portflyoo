-- Drop existing reviews table if it exists
DROP TABLE IF EXISTS reviews;

-- Create reviews table with detailed structure
CREATE TABLE reviews (
    id BIGSERIAL PRIMARY KEY,
    student_name VARCHAR(255) NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT NOT NULL,
    is_visible BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    approved_at TIMESTAMPTZ
);

-- Create index for faster lookups
CREATE INDEX idx_reviews_visibility ON reviews(is_visible);

-- Create trigger function for updating timestamps
CREATE OR REPLACE FUNCTION update_review_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_review_timestamp
    BEFORE UPDATE ON reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_review_timestamp();

-- Create RLS policies
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Allow public to insert reviews
CREATE POLICY "Allow public to insert reviews"
    ON reviews FOR INSERT
    TO public
    WITH CHECK (true);

-- Allow public to view approved reviews
CREATE POLICY "Allow public to view approved reviews"
    ON reviews FOR SELECT
    TO public
    USING (is_visible = true);

-- Allow authenticated users full access
CREATE POLICY "Allow authenticated users full access"
    ON reviews FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Insert some sample data
INSERT INTO reviews (student_name, rating, review_text, is_visible)
VALUES 
    ('John Doe', 5, 'Excellent teaching methods!', true),
    ('Jane Smith', 4, 'Very helpful and patient.', true),
    ('Mike Johnson', 3, 'Good experience overall.', false); 