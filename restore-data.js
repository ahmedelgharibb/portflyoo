// Restore Data Script

// Default data structure
const defaultData = {
  personal: {
    name: 'Dr. Ahmed Mahmoud',
    title: 'Mathematics Educator',
    qualifications: [
      'Ph.D. in Mathematics Education',
      'Master\'s in Applied Mathematics',
      'Bachelor\'s in Mathematics'
    ],
    experience: '15+ years of teaching experience'
  },
  experience: {
    schools: [
      'International School of Mathematics',
      'Elite Academy',
      'Science High School'
    ],
    centers: [
      'Math Excellence Center',
      'Advanced Learning Institute',
      'STEM Education Hub'
    ],
    platforms: [
      'Khan Academy',
      'Coursera - Mathematics for Machine Learning',
      'Udemy - Advanced Calculus',
      'edX - Linear Algebra',
      'YouTube Math Channel'
    ]
  },
  results: [
    {name: 'Mathematics', score: 85},
    {name: 'Physics', score: 78},
    {name: 'Chemistry', score: 82},
    {name: 'Biology', score: 75}
  ],
  contact: {
    email: 'ahmed.mahmoud@mathseducator.com',
    formUrl: 'https://forms.google.com/your-form-link'
  }
};

// Supabase configuration
const SUPABASE_URL = 'https://jckwvrzcjuggnfcbogrr.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impja3d2cnpjanVnZ25mY2JvZ3JyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA2OTIwMTYsImV4cCI6MjA1NjI2ODAxNn0.p2a0om1X40AJVhldUdtaU-at0SSPz6hLbrAg-ELHcnY';

// Function to restore data to Supabase
async function restoreDataToSupabase() {
  console.log('Starting data restoration to Supabase...');
  
  try {
    // Make the API call to Supabase using fetch
    const response = await fetch(`${SUPABASE_URL}/rest/v1/site_data`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        id: 1,
        data: defaultData
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(`Failed to restore data: ${response.status} ${response.statusText} ${errorData ? JSON.stringify(errorData) : ''}`);
    }
    
    console.log('✅ Data successfully restored to Supabase!');
    
    // Also save to localStorage as backup
    localStorage.setItem('siteData', JSON.stringify(defaultData));
    console.log('✅ Data saved to localStorage as backup.');
    
  } catch (error) {
    console.error('Error during data restoration:', error);
    return { success: false, error: error.message };
  }
  
  return { success: true };
}

// Execute the restoration
restoreDataToSupabase()
  .then(result => {
    if (result.success) {
      console.log('Restoration process completed successfully.');
      alert('Data has been restored to the database successfully!');
    } else {
      console.error('Restoration failed:', result.error);
      alert('Restoration failed: ' + result.error);
    }
  }); 