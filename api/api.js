// Vercel Serverless Function: API replacement for api.php
// WARNING: File writes are not persistent on Vercel. Use a database for production.
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
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
      const { data, error } = await supabase
        .from('teachers_websites')
        .upsert([req.body.data]);
      if (error) {
        console.error('[API:saveData] Supabase error:', error.message);
        return res.status(500).json({ error: error.message });
      }
      console.log('[API:saveData] Success. Data saved:', req.body.data);
      res.status(200).json({ success: true, message: 'Data saved successfully' });
      break;
    }
    case 'getReviews': {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) {
        console.error('[API:getReviews] Supabase error:', error.message);
        return res.status(500).json({ error: error.message });
      }
      console.log('[API:getReviews] Success. Reviews sent:', data);
      res.status(200).json({ reviews: data });
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
    default:
      console.warn('[API] Unknown action:', action);
      res.status(400).json({ success: false, message: 'Unknown action' });
  }
} 