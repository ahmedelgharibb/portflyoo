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

// Function to resolve website context and get site ID
async function resolveWebsiteContext(req) {
  // 1) Explicit website_id in query or body
  const rawId = (req.query && req.query.website_id) || (req.body && req.body.website_id);
  const parsedId = rawId ? parseInt(rawId, 10) : NaN;
  if (!Number.isNaN(parsedId) && parsedId > 0) {
    console.log('[API] Using explicit website_id:', parsedId);
    return { siteId: parsedId };
  }
  // 2) Infer from Referer folder and local site.config.json
  try {
    const referer = req.headers && (req.headers.referer || req.headers.origin);
    console.log('[API] Referer header:', referer);
    if (referer) {
      const urlObj = new URL(referer);
      console.log('[API] URL pathname:', urlObj.pathname);
      const pathSegments = urlObj.pathname.split('/').filter(Boolean);
      console.log('[API] Path segments:', pathSegments);
      const firstSegment = pathSegments[0];
      console.log('[API] First segment:', firstSegment);
      if (firstSegment) {
        const configPath = path.join(process.cwd(), 'public', 'websites', firstSegment, 'site.config.json');
        console.log('[API] Config path:', configPath);
        const json = await fs.readFile(configPath, 'utf-8');
        const cfg = JSON.parse(json);
        console.log('[API] Config content:', cfg);
        if (cfg && Number.isInteger(cfg.site_id)) {
          console.log('[API] Resolved site_id:', cfg.site_id, 'for directory:', firstSegment);
          return { siteId: cfg.site_id, directory: firstSegment };
        }
      }
    }
  } catch (e) {
    console.warn('[API] resolveWebsiteContext fallback due to error:', e.message);
  }
  // 3) Default
  console.log('[API] Using default site_id: 1');
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
        
        // Extract admin password from the raw data structure using helper function
        let adminPassword = null;
        
        console.log('[API:login] Raw data structure received:', JSON.stringify(getDataResult, null, 2));
        
        // Use helper function to get admin password from any data structure
        adminPassword = getAdminPassword(getDataResult);
        
        if (!adminPassword) {
          console.error('[API:login] No admin password found in any expected location');
          console.log('[API:login] Available keys:', Object.keys(getDataResult));
          if (getDataResult.data) {
            console.log('[API:login] Data keys:', Object.keys(getDataResult.data));
            if (getDataResult.data.data) {
              console.log('[API:login] Data.data keys:', Object.keys(getDataResult.data.data));
            }
          }
          return res.status(500).json({ success: false, message: 'No password configured in database' });
        }
        
        console.log('[API:login] Found password using normalized structure:', adminPassword);
        
        console.log('[API:login] Stored password:', adminPassword);
        
        // Hash the provided password and compare with stored hash
        const isValid = await bcrypt.compare(password, adminPassword);
        console.log('[API:login] Password validation:', { provided: password, stored: adminPassword, valid: isValid });
        
        // Track login attempts for rate limiting - DISABLED
        // recentAttempts.push(now);
        // global.rateLimitStore.set(rateLimitKey, recentAttempts);
        
        if (!isValid) {
          console.log(`[API:login] Failed login attempt from IP: ${clientIP}`);
          return res.status(200).json({
            success: false,
            message: 'Invalid password'
          });
        }
        
        return res.status(200).json({
          success: true,
          message: 'Login successful'
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
      console.log('[API:saveData] Success. Data saved:', dataToSave);
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