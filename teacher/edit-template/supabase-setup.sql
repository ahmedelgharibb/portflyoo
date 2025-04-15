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
    "personalInfo": {
      "name": "Dr. Ahmed Mahmoud",
      "title": "Mathematics Educator",
      "qualifications": [
        "Ph.D. in Mathematics Education",
        "Master\'s in Applied Mathematics",
        "Bachelor\'s in Mathematics"
      ],
      "experience": "15+ years of teaching experience"
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
      "onlinePlatforms": [
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
      "formUrl": "https://forms.google.com/your-form-link"
    }
  }'
) ON CONFLICT (id) DO NOTHING;

-- Set up Row Level Security
ALTER TABLE site_data ENABLE ROW LEVEL SECURITY;

-- Create policy for read access (anyone can read)
CREATE POLICY site_data_select_policy
  ON site_data
  FOR SELECT
  USING (true);

-- Create policy for write access (requires authentication)
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

-- Note: In production, you would want more restrictive policies
-- The above policies allow anyone to modify the data for simplicity
-- and because this is a demo/educational site 