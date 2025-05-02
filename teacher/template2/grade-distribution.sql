-- Drop existing table if it exists
DROP TABLE IF EXISTS public.grade_distribution;

-- Create grade_distribution table
CREATE TABLE IF NOT EXISTS public.grade_distribution (
    id SERIAL PRIMARY KEY,
    subject VARCHAR(255) NOT NULL UNIQUE,
    a_star_count INTEGER NOT NULL DEFAULT 0,
    a_count INTEGER NOT NULL DEFAULT 0,
    rest_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert initial grade distribution data
INSERT INTO public.grade_distribution (
    subject,
    a_star_count,
    a_count,
    rest_count
) VALUES 
    ('Mathematics', 25, 35, 40),
    ('Physics', 20, 30, 50),
    ('Chemistry', 15, 40, 45),
    ('Biology', 10, 45, 45)
ON CONFLICT (subject) DO NOTHING;

-- Enable RLS (Row Level Security)
ALTER TABLE public.grade_distribution ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anonymous read access
CREATE POLICY "Allow anonymous read access" ON public.grade_distribution
    FOR SELECT
    TO anon
    USING (true);

-- Create policy to allow authenticated updates
CREATE POLICY "Allow authenticated updates" ON public.grade_distribution
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true); 