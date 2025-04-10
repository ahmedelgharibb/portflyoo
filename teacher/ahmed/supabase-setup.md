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

## 3. Set Up the Database Using SQL

1. Go to the "SQL Editor" in the left sidebar
2. Click "New Query"
3. Copy and paste the SQL code from `supabase-setup.sql` into the editor
4. Click "Run" to execute the SQL commands
5. This will:
   - Create the `site_data` table
   - Set up the necessary row-level security policies
   - Insert a default row with sample data

## 4. Your Supabase Credentials

Your Supabase URL and anon key have already been configured in the application:

- **URL**: `https://jckwvrzcjuggnfcbogrr.supabase.co`
- **Anon Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impja3d2cnpjanVnZ25mY2JvZ3JyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA2OTIwMTYsImV4cCI6MjA1NjI2ODAxNn0.p2a0om1X40AJVhldUdtaU-at0SSPz6hLbrAg-ELHcnY`

These credentials are already set in:
- `script.js` for the main application
- `test-supabase.html` for testing the connection

## Testing Your Setup

1. Open `test-supabase.html` in your browser
2. Click "Test Connection" to verify your Supabase connection works
3. If successful, you can use the buttons to:
   - Get Data: Retrieve the current data from Supabase
   - Save Sample Data: Insert or update test data
   - Delete Data: Remove the data

## Using the Admin Panel

1. Open your website and click the Admin button
2. Login using the password: `admin123`
3. Make changes in the admin panel
4. Click "Save Changes"
5. The data will be saved to both Supabase and localStorage

## Troubleshooting

- If changes aren't saving, check the browser console for error messages
- Verify the SQL script ran successfully by checking if the `site_data` table exists
- Make sure you've run the SQL setup script from `supabase-setup.sql`
- Check that your RLS policies are properly configured by reviewing them in the Supabase dashboard 