# Ahmed Teacher Portfolio Backend

This is a backend implementation for Ahmed's teacher portfolio website using Drizzle ORM for database operations.

## Features

- Drizzle ORM for database operations
- Express.js API server
- PostgreSQL database
- Repository pattern for data access
- Authentication endpoints

## Prerequisites

- Node.js v14+ 
- PostgreSQL database (can use Supabase)

## Setup

1. Install dependencies:
   ```bash
   cd backend
   npm install
   ```

2. Set up environment variables:
   - Rename `.env.example` to `.env`
   - Update the `DATABASE_URL` with your PostgreSQL connection string

3. Run database migrations:
   ```bash
   npm run migrate
   ```

4. Start the server:
   ```bash
   npm run dev
   ```

## API Endpoints

### Site Data

- `GET /api/data/sites` - Get all sites
- `GET /api/data/:siteId` - Get all data for a specific site
- `GET /api/data/:siteId/:category` - Get specific category data for a site
- `POST /api/data/:siteId/:category` - Save data for a specific category

### Authentication

- `POST /api/auth/login` - User login
- `POST /api/auth/register` - Create new user

## Schema

The database uses three main tables:

1. `unified_site_data` - Stores all site data by category (JSON format)
2. `websites` - Manages multiple websites information
3. `users` - Handles user authentication

## Usage in Frontend

Update your `script.js` file to use the API instead of direct Supabase calls:

```javascript
// Example of fetching site data
async function loadSiteData(siteId, category) {
  try {
    const response = await fetch(`http://localhost:3000/api/data/${siteId}/${category}`);
    const data = await response.json();
    
    if (data.success) {
      return data.data;
    } else {
      console.error('Error loading data:', data.error);
      return null;
    }
  } catch (error) {
    console.error('Error:', error);
    return null;
  }
}

// Example of saving site data
async function saveSiteData(siteId, category, data) {
  try {
    const response = await fetch(`http://localhost:3000/api/data/${siteId}/${category}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    
    const result = await response.json();
    
    if (result.success) {
      return true;
    } else {
      console.error('Error saving data:', result.error);
      return false;
    }
  } catch (error) {
    console.error('Error:', error);
    return false;
  }
}
```

## Development

To explore the database with Drizzle Studio:

```bash
npm run studio
```

This provides a visual interface to explore and modify your database tables. 