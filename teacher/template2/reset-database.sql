-- RESET DATABASE SCRIPT
-- This script will drop and recreate all necessary tables, policies, and storage buckets
-- Run this in the Supabase SQL Editor to completely reset your database

-- Step 1: Drop existing tables and objects
-- ----------------------------------------

-- Function to safely drop tables
DO $$
DECLARE
    tables_to_drop TEXT[] := ARRAY['site_data'];
    table_name TEXT;
BEGIN
    FOREACH table_name IN ARRAY tables_to_drop
    LOOP
        EXECUTE format('DROP TABLE IF EXISTS %I CASCADE', table_name);
        RAISE NOTICE 'Dropped table %', table_name;
    END LOOP;
END
$$;

-- Step 2: Clean up existing policies
-- ----------------------------------

-- Drop all existing row level security policies on the site_data table
DO $$
DECLARE
    policy_name TEXT;
BEGIN
    FOR policy_name IN
        SELECT policyname
        FROM pg_policies
        WHERE tablename = 'site_data'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON site_data', policy_name);
        RAISE NOTICE 'Dropped policy % on site_data', policy_name;
    END LOOP;
END
$$;

-- Drop all storage policies
DO $$
DECLARE
    policy_name TEXT;
BEGIN
    FOR policy_name IN
        SELECT policyname
        FROM pg_policies
        WHERE tablename = 'objects' AND schemaname = 'storage'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', policy_name);
        RAISE NOTICE 'Dropped policy % on storage.objects', policy_name;
    END LOOP;
END
$$;

-- Step 3: Clean up storage buckets
-- --------------------------------

-- Delete the website-images bucket if it exists
DO $$
BEGIN
    DELETE FROM storage.buckets WHERE id = 'website-images';
    RAISE NOTICE 'Deleted website-images bucket if it existed';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error deleting bucket: %', SQLERRM;
END
$$;

-- Step 4: Recreate tables
-- -----------------------

-- Create the site_data table
CREATE TABLE IF NOT EXISTS site_data (
  id BIGINT PRIMARY KEY,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert a default empty row that we'll update later
INSERT INTO site_data (id, data)
VALUES (
  1, 
  '{
    "personal": {
      "name": "Dr. Ahmed Mahmoud",
      "title": "Mathematics Educator",
      "subtitle": "Inspiring the next generation",
      "heroHeading": "Inspiring Minds Through Mathematics",
      "experience": "15+ years teaching experience",
      "philosophy": "I believe in creating an engaging and supportive learning environment where students can develop their mathematical thinking and problem-solving skills. My approach combines theoretical knowledge with practical applications to make mathematics accessible and enjoyable.",
      "qualifications": [
        "Ph.D. in Mathematics Education",
        "Master\'s in Applied Mathematics",
        "Bachelor\'s in Mathematics"
      ]
    },
    "experience": {
      "schools": [
        "International School of Mathematics",
        "Elite Academy",
        "Science High School"
      ],
      "centers": [
        "Math Excellence Center",
        "Advanced Learning Institute",
        "STEM Education Hub"
      ],
      "platforms": [
        "MathPro Online",
        "EduTech Academy",
        "Virtual Learning Center"
      ]
    },
    "results": {
      "subjects": [
        {"name": "Mathematics", "score": 85},
        {"name": "Physics", "score": 78},
        {"name": "Chemistry", "score": 82},
        {"name": "Biology", "score": 75}
      ]
    },
    "contact": {
      "email": "teacher@example.com",
      "formUrl": "https://forms.google.com/your-form-link",
      "assistantFormUrl": "",
      "phone": "+1 234 567 890",
      "contactMessage": "Feel free to reach out with any questions about tutoring."
    },
    "theme": {
      "color": "blue",
      "mode": "light"
    }
  }'
) ON CONFLICT (id) DO NOTHING;

-- Step 5: Set up Row Level Security
-- ---------------------------------

-- Enable RLS on the site_data table
ALTER TABLE site_data ENABLE ROW LEVEL SECURITY;

-- Create policies for the site_data table
CREATE POLICY site_data_select_policy
  ON site_data
  FOR SELECT
  USING (true);

CREATE POLICY site_data_insert_policy
  ON site_data
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY site_data_update_policy
  ON site_data
  FOR UPDATE
  USING (true);

CREATE POLICY site_data_delete_policy
  ON site_data
  FOR DELETE
  USING (true);

-- Step 6: Set up storage bucket
-- -----------------------------

-- Create a new storage bucket for website images
INSERT INTO storage.buckets (id, name, public)
VALUES ('website-images', 'website-images', true)
ON CONFLICT (id) DO UPDATE
SET public = true;

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Create storage policies
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'website-images');

CREATE POLICY "Allow anonymous uploads"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'website-images');

CREATE POLICY "Allow anonymous updates"
ON storage.objects FOR UPDATE
USING (bucket_id = 'website-images');

CREATE POLICY "Allow anonymous deletes"
ON storage.objects FOR DELETE
USING (bucket_id = 'website-images');

-- Final message to confirm completion
DO $$
BEGIN
    RAISE NOTICE 'Database reset complete: All tables, policies, and buckets have been recreated.';
END
$$; 