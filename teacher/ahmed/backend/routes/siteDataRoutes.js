import express from 'express';
import { siteDataController } from '../controllers/siteDataController.js';

const router = express.Router();

// Get all sites
router.get('/sites', siteDataController.getAllSites);

// Get all data for a site
router.get('/:siteId', siteDataController.getAllData);

// Get specific category data
router.get('/:siteId/:category', siteDataController.getDataByCategory);

// Save data for a category
router.post('/:siteId/:category', siteDataController.saveData);

export default router; 