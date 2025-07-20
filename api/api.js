// Vercel Serverless Function: API replacement for api.php
// WARNING: File writes are not persistent on Vercel. Use a database for production.
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  // Set CSP header with frame-ancestors directive
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com; font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com; img-src 'self' data: https:; connect-src 'self' https://*.supabase.co; object-src 'none'; frame-ancestors 'none'; base-uri 'self'; form-action 'self';");
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'interest-cohort=()');
  res.setHeader('Feature-Policy', "geolocation 'none'; microphone 'none'; camera 'none'");
  res.setHeader('Expect-CT', 'max-age=86400, enforce');
  res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Parse JSON body if needed (Vercel does not do this automatically)
  if (req.method === 'POST' && !req.body) {
    try {
      req.body = await new Promise((resolve, reject) => {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
          try {
            resolve(JSON.parse(body));
          } catch (err) {
            reject(err);
          }
        });
        req.on('error', reject);
      });
    } catch (err) {
      console.error('[API] Failed to parse JSON body:', err);
      return res.status(400).json({ error: 'Invalid JSON body' });
    }
  }

  const { action } = req.query;

  switch (action) {
    case 'login': {
      const { password } = req.body;
      if (!password) {
        return res.status(400).json({ success: false, message: 'Password is required' });
      }
      
      try {
        console.log('[API:login] Starting login process for password:', password);
        console.log('[API:login] Supabase URL:', process.env.SUPABASE_URL ? 'Set' : 'Not set');
        console.log('[API:login] Supabase Key:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Set' : 'Not set');
        
        // Get the raw database structure (not flattened like getData)
        const { data: getDataResult, error: getDataError } = await supabase
          .from('teachers_websites')
          .select('data')
          .limit(1)
          .maybeSingle();
        
        console.log('[API:login] Raw database query result:', { data: getDataResult, error: getDataError });
        
        if (getDataError) {
          console.error('[API:login] Database query error:', getDataError);
          return res.status(500).json({ success: false, message: 'Database connection error' });
        }
        
        if (!getDataResult) {
          console.error('[API:login] No data found in teachers_websites table');
          return res.status(500).json({ success: false, message: 'No website data found in database' });
        }
        
        // Extract admin password from the raw data structure
        let adminPassword = null;
        
        console.log('[API:login] Raw data structure received:', JSON.stringify(getDataResult, null, 2));
        
        // The raw data should have the structure: { data: { data: { admin: { password: "..." } } } }
        if (getDataResult.data && getDataResult.data.data && getDataResult.data.data.admin && getDataResult.data.data.admin.password) {
          adminPassword = getDataResult.data.data.admin.password;
          console.log('[API:login] Found password in data.data.admin.password:', adminPassword);
        } else {
          console.error('[API:login] No admin password found in expected location');
          console.log('[API:login] Available keys:', Object.keys(getDataResult));
          if (getDataResult.data) {
            console.log('[API:login] Data keys:', Object.keys(getDataResult.data));
            if (getDataResult.data.data) {
              console.log('[API:login] Data.data keys:', Object.keys(getDataResult.data.data));
            }
          }
          return res.status(500).json({ success: false, message: 'No password configured in database' });
        }
        
        console.log('[API:login] Stored password:', adminPassword);
        
        const isValid = password === adminPassword;
        console.log('[API:login] Password validation:', { provided: password, stored: adminPassword, valid: isValid });
        
        return res.status(200).json({
          success: isValid,
          message: isValid ? 'Login successful' : 'Invalid password'
        });
      } catch (err) {
        console.error('[API:login] Unexpected error:', err);
        return res.status(500).json({ success: false, message: 'Server error: ' + err.message });
      }
    }
    case 'getData': {
      const { data, error } = await supabase
        .from('teachers_websites')
        .select('*')
        .limit(1)
        .maybeSingle();
      if (error) {
        console.error('[API:getData] Supabase error:', error.message);
        return res.status(500).json({ error: error.message });
      }
      if (data && data.data) {
        const { personal = {}, ...rest } = data.data;
        const result = { ...personal, ...rest };
        console.log('[API:getData] Success. Flattened data sent:', result);
        res.status(200).json(result);
      } else {
        // Return a default data structure if no data is found
        const defaultData = {
          personal: {
            name: 'Dr. Ahmed Mahmoud',
            title: 'Mathematics Educator',
            subtitle: 'Inspiring the next generation',
            heroHeading: 'Inspiring Minds Through Mathematics',
            experience: '15+ years teaching experience',
            philosophy: 'I believe in creating an engaging and supportive learning environment where students can develop their mathematical thinking and problem-solving skills. My approach combines theoretical knowledge with practical applications to make mathematics accessible and enjoyable.',
            qualifications: [
              'Ph.D. in Mathematics Education',
              'Master\'s in Applied Mathematics',
              'Bachelor\'s in Mathematics'
            ]
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
              'MathPro Online',
              'EduTech Academy',
              'Virtual Learning Center'
            ]
          },
          results: [
            { subject: 'Mathematics', astar: 10, a: 15, other: 5 },
            { subject: 'Physics', astar: 8, a: 12, other: 7 },
            { subject: 'Chemistry', astar: 6, a: 10, other: 9 },
            { subject: 'Biology', astar: 5, a: 8, other: 12 }
          ],
          contact: {
            email: 'ahmed.mahmoud@mathseducator.com',
            formUrl: 'https://forms.google.com/your-form-link',
            assistantFormUrl: 'https://forms.google.com/assistant-form-link',
            phone: '+1 123-456-7890',
            contactMessage: 'Thank you for your interest in my teaching services. I will get back to you as soon as possible.'
          },
          theme: {
            color: 'blue',
            mode: 'light'
          }
        };
        console.warn('[API:getData] No data found. Returning default data structure.');
        res.status(200).json(defaultData);
      }
      break;
    }
    case 'saveData': {
      // Log incoming data for debugging
      console.log('[API:saveData] Incoming data:', JSON.stringify(req.body.data, null, 2));
      // Save the entire site data object in the 'data' column
      const { data, error } = await supabase
        .from('teachers_websites')
        .upsert([{ id: req.body.data.id, data: req.body.data }]);
      if (error) {
        // Log full error object for debugging
        console.error('[API:saveData] Supabase error:', error.message, error.details, error.hint);
        return res.status(500).json({ error: error.message, details: error.details, hint: error.hint });
      }
      console.log('[API:saveData] Success. Data saved:', req.body.data);
      res.status(200).json({ success: true, message: 'Data saved successfully' });
      break;
    }
    case 'getReviews': {
      let reviews = [];
      if (req.query.website_id || req.body.website_id) {
        const websiteId = req.query.website_id || req.body.website_id;
        const { data, error } = await supabase
          .from('reviews')
          .select('*')
          .eq('website_id', websiteId)
          .order('created_at', { ascending: false });
        if (error) {
          console.error('[API:getReviews] Supabase error:', error.message);
          return res.status(500).json({ error: error.message });
        }
        reviews = data;
      } else {
        const { data, error } = await supabase
          .from('reviews')
          .select('*')
          .order('created_at', { ascending: false });
        if (error) {
          console.error('[API:getReviews] Supabase error:', error.message);
          return res.status(500).json({ error: error.message });
        }
        reviews = data;
      }
      console.log('[API:getReviews] Success. Reviews sent:', reviews);
      res.status(200).json({ reviews });
      break;
    }
    case 'saveReviews': {
      const { reviews } = req.body;
      const { error } = await supabase
        .from('reviews')
        .upsert(reviews);
      if (error) {
        console.error('[API:saveReviews] Supabase error:', error.message);
        return res.status(500).json({ error: error.message });
      }
      console.log('[API:saveReviews] Success. Reviews saved:', reviews);
      res.status(200).json({ success: true, message: 'Reviews saved successfully' });
      break;
    }
    case 'uploadImage': {
      if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
      }
      try {
        const { base64, filename } = req.body;
        if (!base64 || !filename) {
          return res.status(400).json({ error: 'Missing base64 or filename' });
        }
        const buffer = Buffer.from(base64.split(',')[1], 'base64');
        const { data, error } = await supabase.storage
          .from('website-images')
          .upload(filename, buffer, { contentType: 'image/png', upsert: true });
        if (error) {
          console.error('[API:uploadImage] Supabase Storage error:', error.message);
          return res.status(500).json({ error: error.message });
        }
        const { publicUrl } = supabase.storage.from('website-images').getPublicUrl(filename).data;
        return res.status(200).json({ url: publicUrl });
      } catch (err) {
        console.error('[API:uploadImage] Unexpected error:', err);
        return res.status(500).json({ error: 'Unexpected error uploading image' });
      }
    }
    default:
      console.warn('[API] Unknown action:', action);
      res.status(400).json({ success: false, message: 'Unknown action' });
  }
} 