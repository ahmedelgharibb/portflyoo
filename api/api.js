// Vercel Serverless Function: API replacement for api.php
// WARNING: File writes are not persistent on Vercel. Use a database for production.
import fs from 'fs/promises';
import path from 'path';

export default async function handler(req, res) {
  const { action } = req.query;
  const dataFile = path.join(process.cwd(), 'public/websites/template1/siteData.json');
  const reviewsFile = path.join(process.cwd(), 'public/websites/template1/reviews.json');

  switch (action) {
    case 'getData':
      try {
        const data = await fs.readFile(dataFile, 'utf-8');
        res.status(200).json(JSON.parse(data));
      } catch {
        res.status(200).json({}); // or your default data
      }
      break;
    case 'saveData':
      try {
        await fs.writeFile(dataFile, JSON.stringify(req.body.data, null, 2));
        res.status(200).json({ success: true, message: 'Data saved successfully' });
      } catch {
        res.status(500).json({ success: false, message: 'Failed to save data' });
      }
      break;
    case 'getReviews':
      try {
        const data = await fs.readFile(reviewsFile, 'utf-8');
        res.status(200).json({ reviews: JSON.parse(data) });
      } catch {
        res.status(200).json({ reviews: [] });
      }
      break;
    case 'saveReviews':
      try {
        await fs.writeFile(reviewsFile, JSON.stringify(req.body.reviews, null, 2));
        res.status(200).json({ success: true, message: 'Reviews saved successfully' });
      } catch {
        res.status(500).json({ success: false, message: 'Failed to save reviews' });
      }
      break;
    default:
      res.status(400).json({ success: false, message: 'Unknown action' });
  }
} 