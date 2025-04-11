import { SiteDataRepository } from '../repositories/siteDataRepository.js';

// Create an instance of the repository
const siteDataRepo = new SiteDataRepository();

// Controller for handling site data API endpoints
export const siteDataController = {
  // Get all data for a site
  getAllData: async (req, res) => {
    try {
      const { siteId } = req.params;
      
      if (!siteId) {
        return res.status(400).json({ success: false, error: 'Site ID is required' });
      }
      
      const result = await siteDataRepo.getAllForSite(siteId);
      
      if (!result.success) {
        return res.status(500).json({ success: false, error: result.error });
      }
      
      return res.status(200).json({ success: true, data: result.data });
    } catch (error) {
      console.error('Error in getAllData controller:', error);
      return res.status(500).json({ success: false, error: error.message });
    }
  },
  
  // Get data by category
  getDataByCategory: async (req, res) => {
    try {
      const { siteId, category } = req.params;
      
      if (!siteId || !category) {
        return res.status(400).json({ success: false, error: 'Site ID and category are required' });
      }
      
      const result = await siteDataRepo.getByCategory(siteId, category);
      
      if (!result.success) {
        return res.status(500).json({ success: false, error: result.error });
      }
      
      return res.status(200).json({ success: true, data: result.data });
    } catch (error) {
      console.error('Error in getDataByCategory controller:', error);
      return res.status(500).json({ success: false, error: error.message });
    }
  },
  
  // Save data for a category
  saveData: async (req, res) => {
    try {
      const { siteId, category } = req.params;
      const data = req.body;
      
      if (!siteId || !category) {
        return res.status(400).json({ success: false, error: 'Site ID and category are required' });
      }
      
      if (!data) {
        return res.status(400).json({ success: false, error: 'Data is required' });
      }
      
      const result = await siteDataRepo.upsert(siteId, category, data);
      
      if (!result.success) {
        return res.status(500).json({ success: false, error: result.error });
      }
      
      return res.status(200).json({ success: true, data: result.data });
    } catch (error) {
      console.error('Error in saveData controller:', error);
      return res.status(500).json({ success: false, error: error.message });
    }
  },
  
  // Get all sites
  getAllSites: async (req, res) => {
    try {
      const result = await siteDataRepo.getAllSites();
      
      if (!result.success) {
        return res.status(500).json({ success: false, error: result.error });
      }
      
      return res.status(200).json({ success: true, data: result.data });
    } catch (error) {
      console.error('Error in getAllSites controller:', error);
      return res.status(500).json({ success: false, error: error.message });
    }
  }
}; 