// Vercel Serverless Function: API replacement for api.php
// WARNING: File writes are not persistent on Vercel. Use a database for production.
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
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
        console.warn('[API:getData] No nested data property found. Raw data sent:', data);
        res.status(200).json(data);
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