# Teacher Website Creator

A system for creating and managing multiple teacher websites from a single database.

## Features

- Create new teacher websites with a simple web interface
- Store all website data in a single database table (`teacher_websites`)
- Support for multiple websites with isolated data
- Automated file and directory creation
- Default template with customizable content

## Setup Instructions

### Prerequisites

- Node.js 14+ installed
- npm or yarn package manager
- Access to a PostgreSQL database (Supabase is recommended)

### Database Setup

1. Create a new table in your database called `teacher_websites` with the following SQL command:

```sql
-- Drop table if it exists
DROP TABLE IF EXISTS teacher_websites;

-- Create a consolidated teacher_websites table
CREATE TABLE teacher_websites (
    id SERIAL PRIMARY KEY,
    site_id VARCHAR(100) NOT NULL UNIQUE,  -- Unique identifier for each teacher website
    
    -- Admin information
    admin_username VARCHAR(50) NOT NULL,
    admin_password_hash VARCHAR(255) NOT NULL,
    admin_email VARCHAR(100),
    admin_last_login TIMESTAMP,
    
    -- Basic information
    teacher_name VARCHAR(100) NOT NULL,
    teacher_title VARCHAR(100),
    hero_heading TEXT,
    experience_years VARCHAR(20),
    teaching_philosophy TEXT,
    contact_email VARCHAR(100),
    phone_number VARCHAR(50),
    registration_form_url VARCHAR(255),
    assistant_form_url VARCHAR(255),
    contact_message TEXT,
    
    -- Theme settings
    theme_color VARCHAR(50) DEFAULT 'blue',
    theme_mode VARCHAR(20) DEFAULT 'light',
    hero_image_url VARCHAR(255),
    about_image_url VARCHAR(255),
    
    -- JSON fields for complex data
    subjects JSONB DEFAULT '[]',
    qualifications JSONB DEFAULT '[]',
    experience_schools JSONB DEFAULT '[]',
    experience_centers JSONB DEFAULT '[]',
    experience_platforms JSONB DEFAULT '[]',
    results JSONB DEFAULT '[]',
    student_registrations JSONB DEFAULT '[]',
    assistant_applications JSONB DEFAULT '[]',
    contact_messages JSONB DEFAULT '[]',
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index on site_id for quick lookups
CREATE INDEX idx_teacher_websites_site_id ON teacher_websites(site_id);
```

2. Make sure your Supabase URL and key are updated in the `create-website.js` file.

### Installation

1. Clone this repository:

```bash
git clone <repository-url>
cd teacher-website-creator
```

2. Install dependencies:

```bash
npm install
```

## Usage

### Web Interface (Recommended)

1. Start the web server:

```bash
npm start
```

2. Open your browser and go to http://localhost:3000

3. Fill in the form with the teacher's name and a folder name (using only letters, numbers, underscores, and hyphens)

4. Click "Create Website" and wait for the process to complete

5. Follow the on-screen instructions to access your new website

### Command Line

You can also create websites directly from the command line:

```bash
npm run create "Teacher Name" "folder_name"
```

Or:

```bash
node create-website.js "Teacher Name" "folder_name"
```

## How It Works

1. The system generates a unique site ID for each website
2. It creates a new record in the `teacher_websites` table with default template data
3. It copies the template files from `teacher/edit-template/` to a new folder
4. It creates a `site-config.js` file in the new folder with site-specific information
5. The website can now be accessed and customized through its admin interface

## Customizing Websites

Each website has its own admin interface accessible by clicking the lock icon in the header. The default admin password is "teacher123" (you should change this after first login).

## Multi-Tenant Structure

This system uses a multi-tenant database design where:

- All websites share the same database table
- Each website is identified by a unique `site_id`
- Data is isolated between different websites
- Common code is shared across all sites

## Maintenance

To manage existing websites, you can:

1. Query the database to get a list of all websites:

```sql
SELECT site_id, teacher_name, folder_name, created_at 
FROM teacher_websites 
ORDER BY created_at DESC;
```

2. Backup all website data:

```sql
COPY teacher_websites TO '/path/to/backup.csv' WITH CSV HEADER;
```

## Troubleshooting

If you encounter issues:

1. Check the server logs for error messages
2. Verify that the database connection is working
3. Ensure the template directory exists
4. Make sure you have write permissions in the teacher directory

## License

This project is licensed under the MIT License - see the LICENSE file for details. 