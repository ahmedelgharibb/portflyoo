-- Create a new storage bucket for website images if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('website-images', 'website-images', true)
ON CONFLICT (id) DO UPDATE
SET public = true;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete images" ON storage.objects;

-- Set up storage policies to allow public access to the bucket
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'website-images');

-- Allow anonymous access for all operations
CREATE POLICY "Allow anonymous uploads"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'website-images');

CREATE POLICY "Allow anonymous updates"
ON storage.objects FOR UPDATE
USING (bucket_id = 'website-images');

CREATE POLICY "Allow anonymous deletes"
ON storage.objects FOR DELETE
USING (bucket_id = 'website-images');

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY; 