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
        .from('site_data')
        .select('*')
        .single();
      if (error) return res.status(500).json({ error: error.message });
      res.status(200).json(data);
      break;
    }
    case 'saveData': {
      const { data, error } = await supabase
        .from('site_data')
        .upsert([req.body.data]);
      if (error) return res.status(500).json({ error: error.message });
      res.status(200).json({ success: true, message: 'Data saved successfully' });
      break;
    }
    case 'getReviews': {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) return res.status(500).json({ error: error.message });
      res.status(200).json({ reviews: data });
      break;
    }
    case 'saveReviews': {
      const { reviews } = req.body;
      const { error } = await supabase
        .from('reviews')
        .upsert(reviews);
      if (error) return res.status(500).json({ error: error.message });
      res.status(200).json({ success: true, message: 'Reviews saved successfully' });
      break;
    }
    default:
      res.status(400).json({ success: false, message: 'Unknown action' });
  }
} 