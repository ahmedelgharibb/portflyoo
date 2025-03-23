# Supabase Setup Instructions

Follow these steps to set up Supabase for your teacher profile website:

## 1. Create a Supabase Account

1. Go to [https://supabase.com/](https://supabase.com/)
2. Click "Start your project" or "Sign Up"
3. Create an account using GitHub, Google, or email

## 2. Create a New Project

1. Once logged in, click "New Project"
2. Give your project a name (e.g., "TeacherProfile")
3. Set a secure database password (save this somewhere safe)
4. Choose the region closest to your users
5. Click "Create new project"

## 3. Create a Table for Site Data

1. Go to the "Table Editor" in the left sidebar
2. Click "New Table"
3. Set table name to `site_data`
4. Add the following columns:
   - `id` (type: int8, primary key)
   - `data` (type: jsonb)
   - `created_at` (type: timestamptz, default: now())
5. Click "Save"

## 4. Configure Row Level Security (RLS)

1. Go to "Authentication" > "Policies" in the left sidebar
2. Find your `site_data` table
3. Enable RLS by turning on the toggle
4. Add a policy that allows anyone to read but only authenticated users to write:
   - Click "New Policy"
   - Choose "Select for all users" template
   - Save that policy
   - Click "New Policy" again
   - Choose "Insert, Update, Delete for authenticated users only" template
   - Save that policy

## 5. Get Your Supabase URL and Key

1. Go to "Project Settings" > "API" in the left sidebar
2. You'll find your:
   - API URL (copy the URL in "Project URL" section)
   - Anon/Public Key (under "Project API Keys")

## 6. Update Your Website Configuration

1. Open `script.js`
2. Replace the placeholder values with your actual Supabase URL and public key:

```javascript
const SUPABASE_URL = 'your-project-url';
const SUPABASE_KEY = 'your-anon-key';
```

## Testing Your Setup

1. Open your website and log in to the admin panel
2. Make some changes and save them
3. Refresh the page - your changes should persist
4. Check the Supabase Table Editor - you should see your data stored in the `site_data` table

## Troubleshooting

- If changes aren't saving, check the browser console for error messages
- Verify your Supabase URL and key are correct
- Make sure your RLS policies are properly configured
- Check that your table structure matches the expected format 