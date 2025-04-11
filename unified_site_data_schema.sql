-- Unified Site Data Schema
-- This script merges all separate tables into a single comprehensive table
-- Created by Claude for Portflyoo

-- First, create a backup of existing tables
CREATE TABLE admin_settings_backup AS SELECT * FROM admin_settings;
CREATE TABLE admin_users_backup AS SELECT * FROM admin_users;
CREATE TABLE assistant_applications_backup AS SELECT * FROM assistant_applications;
CREATE TABLE contact_messages_backup AS SELECT * FROM contact_messages;
CREATE TABLE experience_backup AS SELECT * FROM experience;
CREATE TABLE qualifications_backup AS SELECT * FROM qualifications;
CREATE TABLE results_backup AS SELECT * FROM results;
CREATE TABLE site_data_backup AS SELECT * FROM site_data;
CREATE TABLE site_settings_backup AS SELECT * FROM site_settings;
CREATE TABLE student_registrations_backup AS SELECT * FROM student_registrations;
CREATE TABLE subjects_backup AS SELECT * FROM subjects;
CREATE TABLE teacher_websites_backup AS SELECT * FROM teacher_websites;
CREATE TABLE website_content_backup AS SELECT * FROM website_content;
CREATE TABLE website_settings_backup AS SELECT * FROM website_settings;
CREATE TABLE websites_backup AS SELECT * FROM websites;

-- Create the new unified table
CREATE TABLE unified_site_data (
  id SERIAL PRIMARY KEY,
  site_id VARCHAR(255) NOT NULL, -- Unique identifier for the site
  category VARCHAR(50) NOT NULL, -- Indicates data category (e.g., 'admin', 'contact', 'subjects')
  data JSONB NOT NULL, -- All data stored in JSON format
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  UNIQUE (site_id, category) -- Ensure each category is unique per site
);

-- Create index for faster lookups
CREATE INDEX idx_unified_site_data_site_id ON unified_site_data (site_id);
CREATE INDEX idx_unified_site_data_category ON unified_site_data (category);

-- Create view for backward compatibility
CREATE VIEW site_data_view AS 
SELECT id, data, created_at, updated_at 
FROM unified_site_data 
WHERE category = 'site_data';

-- Add Row Level Security
ALTER TABLE unified_site_data ENABLE ROW LEVEL SECURITY;

-- Create policies for access control
CREATE POLICY unified_site_data_select_policy
  ON unified_site_data
  FOR SELECT
  USING (true);

CREATE POLICY unified_site_data_insert_policy
  ON unified_site_data
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY unified_site_data_update_policy
  ON unified_site_data
  FOR UPDATE
  USING (true);

CREATE POLICY unified_site_data_delete_policy
  ON unified_site_data
  FOR DELETE
  USING (true);

-- Migration function to consolidate data from all tables
CREATE OR REPLACE FUNCTION migrate_to_unified_table() RETURNS void AS $$
DECLARE
  site_record RECORD;
  site_id TEXT;
  site_name TEXT;
BEGIN
  -- For each site in the site_data table
  FOR site_record IN SELECT id, data FROM site_data LOOP
    site_id := site_record.id::text;
    site_name := site_record.data->>'siteName';
    
    -- If site_name is null, use a fallback name
    IF site_name IS NULL THEN
      site_name := 'Site ' || site_id;
    END IF;
    
    -- Insert general site data
    INSERT INTO unified_site_data (site_id, category, data)
    VALUES (site_id, 'site_data', site_record.data);
    
    -- Try to insert admin settings if they exist
    BEGIN
      INSERT INTO unified_site_data (site_id, category, data)
      SELECT site_id, 'admin_settings', row_to_json(a)::jsonb
      FROM admin_settings a
      WHERE a.site_id = site_id::text
      OR a.site_id = site_record.id::bigint;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Could not migrate admin_settings for site %: %', site_id, SQLERRM;
    END;
    
    -- Try to insert admin users if they exist
    BEGIN
      INSERT INTO unified_site_data (site_id, category, data)
      SELECT site_id, 'admin_users', json_agg(row_to_json(u))::jsonb
      FROM admin_users u
      WHERE u.site_id = site_id::text
      OR u.site_id = site_record.id::bigint
      GROUP BY site_id;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Could not migrate admin_users for site %: %', site_id, SQLERRM;
    END;
    
    -- Continue with other tables following same pattern
    -- Assistant applications
    BEGIN
      INSERT INTO unified_site_data (site_id, category, data)
      SELECT site_id, 'assistant_applications', json_agg(row_to_json(a))::jsonb
      FROM assistant_applications a
      WHERE a.site_id = site_id::text
      OR a.site_id = site_record.id::bigint
      GROUP BY site_id;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Could not migrate assistant_applications for site %: %', site_id, SQLERRM;
    END;
    
    -- Contact messages
    BEGIN
      INSERT INTO unified_site_data (site_id, category, data)
      SELECT site_id, 'contact_messages', json_agg(row_to_json(c))::jsonb
      FROM contact_messages c
      WHERE c.site_id = site_id::text
      OR c.site_id = site_record.id::bigint
      GROUP BY site_id;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Could not migrate contact_messages for site %: %', site_id, SQLERRM;
    END;
    
    -- Experience
    BEGIN
      INSERT INTO unified_site_data (site_id, category, data)
      SELECT site_id, 'experience', row_to_json(e)::jsonb
      FROM experience e
      WHERE e.site_id = site_id::text
      OR e.site_id = site_record.id::bigint;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Could not migrate experience for site %: %', site_id, SQLERRM;
    END;
    
    -- Qualifications
    BEGIN
      INSERT INTO unified_site_data (site_id, category, data)
      SELECT site_id, 'qualifications', json_agg(row_to_json(q))::jsonb
      FROM qualifications q
      WHERE q.site_id = site_id::text
      OR q.site_id = site_record.id::bigint
      GROUP BY site_id;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Could not migrate qualifications for site %: %', site_id, SQLERRM;
    END;
    
    -- Results
    BEGIN
      INSERT INTO unified_site_data (site_id, category, data)
      SELECT site_id, 'results', row_to_json(r)::jsonb
      FROM results r
      WHERE r.site_id = site_id::text
      OR r.site_id = site_record.id::bigint;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Could not migrate results for site %: %', site_id, SQLERRM;
    END;
    
    -- Site settings
    BEGIN
      INSERT INTO unified_site_data (site_id, category, data)
      SELECT site_id, 'site_settings', row_to_json(s)::jsonb
      FROM site_settings s
      WHERE s.site_id = site_id::text
      OR s.site_id = site_record.id::bigint;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Could not migrate site_settings for site %: %', site_id, SQLERRM;
    END;
    
    -- Student registrations
    BEGIN
      INSERT INTO unified_site_data (site_id, category, data)
      SELECT site_id, 'student_registrations', json_agg(row_to_json(sr))::jsonb
      FROM student_registrations sr
      WHERE sr.site_id = site_id::text
      OR sr.site_id = site_record.id::bigint
      GROUP BY site_id;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Could not migrate student_registrations for site %: %', site_id, SQLERRM;
    END;
    
    -- Subjects
    BEGIN
      INSERT INTO unified_site_data (site_id, category, data)
      SELECT site_id, 'subjects', json_agg(row_to_json(su))::jsonb
      FROM subjects su
      WHERE su.site_id = site_id::text
      OR su.site_id = site_record.id::bigint
      GROUP BY site_id;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Could not migrate subjects for site %: %', site_id, SQLERRM;
    END;
    
    -- Teacher websites
    BEGIN
      INSERT INTO unified_site_data (site_id, category, data)
      SELECT site_id, 'teacher_website', row_to_json(tw)::jsonb
      FROM teacher_websites tw
      WHERE tw.site_id = site_id::text
      OR tw.site_id = site_record.id::bigint;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Could not migrate teacher_websites for site %: %', site_id, SQLERRM;
    END;
    
    -- Website content
    BEGIN
      INSERT INTO unified_site_data (site_id, category, data)
      SELECT site_id, 'website_content', row_to_json(wc)::jsonb
      FROM website_content wc
      WHERE wc.site_id = site_id::text
      OR wc.site_id = site_record.id::bigint;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Could not migrate website_content for site %: %', site_id, SQLERRM;
    END;
    
    -- Website settings
    BEGIN
      INSERT INTO unified_site_data (site_id, category, data)
      SELECT site_id, 'website_settings', row_to_json(ws)::jsonb
      FROM website_settings ws
      WHERE ws.site_id = site_id::text
      OR ws.site_id = site_record.id::bigint;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Could not migrate website_settings for site %: %', site_id, SQLERRM;
    END;
    
    -- Websites
    BEGIN
      INSERT INTO unified_site_data (site_id, category, data)
      SELECT site_id, 'website', row_to_json(w)::jsonb
      FROM websites w
      WHERE w.id = site_id::text
      OR w.id = site_record.id::bigint;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Could not migrate websites for site %: %', site_id, SQLERRM;
    END;
    
  END LOOP;
  
  RAISE NOTICE 'Migration completed successfully';
END;
$$ LANGUAGE plpgsql;

-- Run the migration function
-- UNCOMMENT THIS WHEN READY TO MIGRATE:
-- SELECT migrate_to_unified_table();

-- Verify the migration
-- SELECT site_id, category, COUNT(*) FROM unified_site_data GROUP BY site_id, category ORDER BY site_id, category;

-- After verifying the migration, you can drop the old tables if desired:
-- DROP TABLE admin_settings CASCADE;
-- DROP TABLE admin_users CASCADE;
-- ... (and so on for all tables)

-- IMPORTANT: Update your application to use the new unified_site_data table
-- instead of the individual tables that were previously used. 