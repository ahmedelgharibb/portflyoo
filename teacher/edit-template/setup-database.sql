-- Create admin_settings table
CREATE TABLE IF NOT EXISTS public.admin_settings (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255),
    title VARCHAR(255),
    subtitle VARCHAR(255),
    hero_heading TEXT,
    experience TEXT,
    philosophy TEXT,
    qualifications TEXT,
    schools TEXT,
    centers TEXT,
    platforms TEXT,
    email VARCHAR(255),
    phone VARCHAR(50),
    form_url TEXT,
    assistant_form_url TEXT,
    contact_message TEXT,
    password_hash VARCHAR(255),
    results JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert initial admin settings
INSERT INTO public.admin_settings (
    name, 
    title, 
    subtitle,
    password_hash,
    results
) VALUES (
    'Teacher Name',
    'Teacher Title',
    'SUBJECT',
    'admin123', -- Change this password in production
    '[
        {
            "name": "Mathematics",
            "grades": {
                "A*": 25,
                "A": 30,
                "Rest": 45
            }
        },
        {
            "name": "Physics",
            "grades": {
                "A*": 20,
                "A": 35,
                "Rest": 45
            }
        },
        {
            "name": "Chemistry",
            "grades": {
                "A*": 22,
                "A": 33,
                "Rest": 45
            }
        },
        {
            "name": "Biology",
            "grades": {
                "A*": 18,
                "A": 37,
                "Rest": 45
            }
        }
    ]'::jsonb
) ON CONFLICT (id) DO NOTHING;

-- Enable RLS (Row Level Security)
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anonymous read access
CREATE POLICY "Allow anonymous read access" ON public.admin_settings
    FOR SELECT
    TO anon
    USING (true);

-- Create policy to allow authenticated updates
CREATE POLICY "Allow authenticated updates" ON public.admin_settings
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true); 