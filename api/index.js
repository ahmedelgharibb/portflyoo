// Vercel Serverless Function: API replacement for api.php
// WARNING: File writes are not persistent on Vercel. Use a database for production.
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import fs from 'fs/promises';
import path from 'path';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Helper function to normalize data structure - handles data.data.data, data.data, or data
function normalizeDataStructure(data) {
  if (data && data.data && data.data.data) {
    return data.data.data; // Triple nested: data.data.data
  } else if (data && data.data) {
    return data.data; // Double nested: data.data
  } else {
    return data; // Flat: data
  }
}

// Helper function to get admin password from any data structure
function getAdminPassword(data) {
  const normalized = normalizeDataStructure(data);
  return normalized && normalized.admin && normalized.admin.password ? normalized.admin.password : null;
}

// Resolve website context from explicit params or by inferring from Referer path
async function resolveWebsiteContext(req) {
  // 1) Explicit website_id in query or body
  const rawId = (req.query && req.query.website_id) || (req.body && req.body.website_id);
  const parsedId = rawId ? parseInt(rawId, 10) : NaN;
  if (!Number.isNaN(parsedId) && parsedId > 0) {
    return { siteId: parsedId };
  }
  // 2) Infer from Referer folder and local site.config.json
  try {
    const referer = req.headers && (req.headers.referer || req.headers.origin);
    if (referer) {
      const urlObj = new URL(referer);
      const firstSegment = urlObj.pathname.split('/').filter(Boolean)[0];
      if (firstSegment) {
        const configPath = path.join(process.cwd(), 'public', 'websites', firstSegment, 'site.config.json');
        const json = await fs.readFile(configPath, 'utf-8');
        const cfg = JSON.parse(json);
        if (cfg && Number.isInteger(cfg.site_id)) {
          return { siteId: cfg.site_id, directory: firstSegment };
        }
      }
    }
  } catch (e) {
    console.warn('[API] resolveWebsiteContext fallback due to error:', e.message);
  }
  // 3) Default
  return { siteId: 1 };
}

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
  
  // Rate limiting for login attempts - DISABLED
  /*
  const clientIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  const rateLimitKey = `login_attempts_${clientIP}`;
  
  // Simple in-memory rate limiting (in production, use Redis or similar)
  if (!global.rateLimitStore) {
    global.rateLimitStore = new Map();
  }
  
  const now = Date.now();
  const windowMs = 30 * 60 * 1000; // 30 minutes (increased from 15)
  const maxAttempts = 10; // Increased from 5 to 10 attempts
  
  const attempts = global.rateLimitStore.get(rateLimitKey) || [];
  const recentAttempts = attempts.filter(time => now - time < windowMs);
  
  if (recentAttempts.length >= maxAttempts) {
    const remainingTime = Math.ceil((recentAttempts[0] + windowMs - now) / (1000 * 60));
    return res.status(429).json({ 
      success: false, 
      message: `Too many login attempts. Please try again in ${remainingTime} minutes.`,
      remainingAttempts: 0,
      timeRemaining: remainingTime
    });
  }
  */
  
  // Define clientIP for logging purposes (rate limiting disabled)
  const clientIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

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
        const { siteId } = await resolveWebsiteContext(req);
        console.log('[API:login] Site ID resolved:', siteId);
        console.log('[API:login] Supabase URL:', process.env.SUPABASE_URL ? 'Set' : 'Not set');
        console.log('[API:login] Supabase Key:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Set' : 'Not set');
        
        // Get the raw database structure for this site
        const { data: getDataResult, error: getDataError } = await supabase
          .from('teachers_websites')
          .select('data')
          .eq('id', siteId)
          .maybeSingle();
        
        console.log('[API:login] Raw database query result:', { data: getDataResult, error: getDataError });
        
        if (getDataError) {
          console.error('[API:login] Database query error:', getDataError);
          return res.status(500).json({ success: false, message: 'Database connection error' });
        }
        
        if (!getDataResult) {
          console.error('[API:login] No data found in teachers_websites for site', siteId);
          return res.status(404).json({ success: false, message: 'No website data found for this site' });
        }
        
        // Extract admin password from the raw data structure using helper function
        let adminPassword = null;
        console.log('[API:login] Raw data structure received:', JSON.stringify(getDataResult, null, 2));
        
        // Use helper function to get admin password from any data structure
        adminPassword = getAdminPassword(getDataResult);
        
        if (!adminPassword) {
          console.error('[API:login] No admin password found in any expected location');
          return res.status(500).json({ success: false, message: 'No password configured in database' });
        }
        
        console.log('[API:login] Found password using normalized structure:', !!adminPassword);
        
        // Compare with stored hash
        const isValid = await bcrypt.compare(password, adminPassword);
        // recentAttempts.push(now); // Rate limiting disabled
        // global.rateLimitStore.set(rateLimitKey, recentAttempts); // Rate limiting disabled
        if (!isValid) {
          console.log(`[API:login] Failed login attempt from IP: ${clientIP} for site ${siteId}`);
        }
        return res.status(200).json({
          success: isValid,
          message: isValid ? 'Login successful' : 'Invalid password'
        });
      } catch (err) {
        console.error('[API:login] Unexpected error:', err);
        return res.status(500).json({ success: false, message: 'Server error: ' + err.message });
      }
    }
    case 'changePassword': {
      const { newPassword } = req.body;
      if (!newPassword) {
        return res.status(400).json({ success: false, message: 'New password is required' });
      }
      
      try {
        console.log('[API:changePassword] Starting password change process');
        
        // Hash the new password
        const saltRounds = 12;
        const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);
        
        console.log('[API:changePassword] Password hashed successfully');
        
        // Return the hashed password to be stored in frontend data
        return res.status(200).json({ 
          success: true, 
          message: 'Password hashed successfully. Click "Save Changes" to update the database.',
          hashedPassword: hashedNewPassword
        });
      } catch (err) {
        console.error('[API:changePassword] Unexpected error:', err);
        return res.status(500).json({ success: false, message: 'Server error' });
      }
    }
    case 'getData': {
      try {
        const { siteId } = await resolveWebsiteContext(req);
        console.log('[API:getData] Fetching data from database with site ID:', siteId);
      const { data, error } = await supabase
        .from('teachers_websites')
        .select('*')
          .eq('id', siteId)
        .maybeSingle();
      if (error) {
        console.error('[API:getData] Supabase error:', error.message);
        return res.status(500).json({ error: error.message });
      }
        if (data) {
          // Use helper function to normalize data structure
          const normalizedData = normalizeDataStructure(data);
          const { personal = {}, ...rest } = normalizedData;
        const result = { ...personal, ...rest };
          console.log('[API:getData] Success. Normalized and flattened data sent for site', siteId);
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
          console.warn('[API:getData] No data found for site', siteId, '. Returning default data structure.');
        res.status(200).json(defaultData);
        }
      } catch (e) {
        console.error('[API:getData] Unexpected error:', e);
        return res.status(500).json({ error: 'Server error' });
      }
      break;
    }
    case 'saveData': {
      // Log incoming data for debugging
      console.log('[API:saveData] Incoming request body:', JSON.stringify(req.body, null, 2));
      
      // Handle the correct structure: { id: number, data: object }
      let { id, data: dataToSave } = req.body;
      
      // Fallback: infer id from context when not provided
      if (!id) {
        const { siteId } = await resolveWebsiteContext(req);
        id = siteId;
        console.log('[API:saveData] No id provided. Using resolved site id:', id);
      }
      
      if (!id || !dataToSave) {
        console.error('[API:saveData] Missing required fields: id or data');
        return res.status(400).json({ success: false, message: 'Missing required fields: id or data' });
      }
      
      // Password should already be hashed from changePassword API
      if (dataToSave.admin && dataToSave.admin.password) {
        console.log('[API:saveData] Password already hashed, saving as is');
      }
      
      // Save the entire site data object in the 'data' column
      console.log('[API:saveData] Saving data to database with site ID:', id);
      const { data, error } = await supabase
        .from('teachers_websites')
        .upsert([{ id: id, data: dataToSave }]);
      if (error) {
        // Log full error object for debugging
        console.error('[API:saveData] Supabase error:', error.message, error.details, error.hint);
        return res.status(500).json({ success: false, message: error.message, details: error.details, hint: error.hint });
      }
      console.log('[API:saveData] Success. Data saved for site', id);
      res.status(200).json({ success: true, message: 'Data saved successfully' });
      break;
    }
    case 'getReviews': {
      try {
        let websiteId = req.query.website_id || (req.body && req.body.website_id);
        if (!websiteId) {
          const ctx = await resolveWebsiteContext(req);
          websiteId = ctx.siteId;
        }
      let reviews = [];
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
        console.log('[API:getReviews] Success. Reviews sent for site', websiteId);
        res.status(200).json({ reviews });
      } catch (e) {
        console.error('[API:getReviews] Unexpected error:', e);
        return res.status(500).json({ error: 'Server error' });
      }
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