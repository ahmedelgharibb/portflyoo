/**
 * Unified Site Data Helper Library
 * 
 * This library provides functions to work with the unified_site_data table
 * which replaces all the separate tables for site data.
 */

// Import Supabase client
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = 'https://your-supabase-url.supabase.co';
const supabaseKey = 'your-supabase-anon-key';
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Main class for interacting with the unified site data
 */
class UnifiedSiteData {
  constructor(siteId) {
    this.siteId = siteId;
    this.cache = {};
  }

  /**
   * Get data for a specific category
   * @param {string} category - The data category (e.g., 'site_data', 'admin_settings', etc.)
   * @returns {Promise<object>} - The data object
   */
  async getData(category) {
    try {
      // Check cache first
      if (this.cache[category]) {
        return this.cache[category];
      }

      const { data, error } = await supabase
        .from('unified_site_data')
        .select('data')
        .eq('site_id', this.siteId)
        .eq('category', category)
        .single();

      if (error) {
        console.error(`Error fetching ${category} data:`, error);
        return null;
      }

      if (!data) {
        console.log(`No ${category} data found for site ${this.siteId}`);
        return null;
      }

      // Cache the result
      this.cache[category] = data.data;
      return data.data;
    } catch (error) {
      console.error(`Error in getData(${category}):`, error);
      return null;
    }
  }

  /**
   * Save data for a specific category
   * @param {string} category - The data category
   * @param {object} data - The data to save
   * @returns {Promise<boolean>} - Success status
   */
  async saveData(category, data) {
    try {
      // Get current data to preserve existing values
      const { data: currentRecord, error: fetchError } = await supabase
        .from('unified_site_data')
        .select('*')
        .eq('site_id', this.siteId)
        .eq('category', category)
        .single();

      // Prepare the record
      const record = {
        site_id: this.siteId,
        category,
        data,
        updated_at: new Date().toISOString()
      };

      let result;
      
      if (fetchError && fetchError.code === 'PGRST116') {
        // Record doesn't exist, insert new record
        result = await supabase
          .from('unified_site_data')
          .insert(record);
      } else {
        // Record exists, update it
        result = await supabase
          .from('unified_site_data')
          .update({
            data,
            updated_at: new Date().toISOString()
          })
          .eq('site_id', this.siteId)
          .eq('category', category);
      }

      const { error } = result;
      
      if (error) {
        console.error(`Error saving ${category} data:`, error);
        return false;
      }

      // Update cache
      this.cache[category] = data;
      return true;
    } catch (error) {
      console.error(`Error in saveData(${category}):`, error);
      return false;
    }
  }

  /**
   * Get all data categories for this site
   * @returns {Promise<object>} - Object with all categories as keys
   */
  async getAllData() {
    try {
      const { data, error } = await supabase
        .from('unified_site_data')
        .select('category, data')
        .eq('site_id', this.siteId);

      if (error) {
        console.error('Error fetching all site data:', error);
        return null;
      }

      if (!data || data.length === 0) {
        console.log(`No data found for site ${this.siteId}`);
        return null;
      }

      // Convert array to object with categories as keys
      const allData = {};
      data.forEach(item => {
        allData[item.category] = item.data;
        // Update cache
        this.cache[item.category] = item.data;
      });

      return allData;
    } catch (error) {
      console.error('Error in getAllData():', error);
      return null;
    }
  }

  /**
   * Delete data for a specific category
   * @param {string} category - The data category
   * @returns {Promise<boolean>} - Success status
   */
  async deleteData(category) {
    try {
      const { error } = await supabase
        .from('unified_site_data')
        .delete()
        .eq('site_id', this.siteId)
        .eq('category', category);

      if (error) {
        console.error(`Error deleting ${category} data:`, error);
        return false;
      }

      // Remove from cache
      delete this.cache[category];
      return true;
    } catch (error) {
      console.error(`Error in deleteData(${category}):`, error);
      return false;
    }
  }

  /**
   * Get site_data (backward compatibility with old structure)
   * @returns {Promise<object>} - The site data
   */
  async getSiteData() {
    return this.getData('site_data');
  }

  /**
   * Save site_data (backward compatibility with old structure)
   * @param {object} data - The site data to save
   * @returns {Promise<boolean>} - Success status
   */
  async saveSiteData(data) {
    return this.saveData('site_data', data);
  }

  /**
   * Get admin settings
   * @returns {Promise<object>} - Admin settings data
   */
  async getAdminSettings() {
    return this.getData('admin_settings');
  }

  /**
   * Get admin users
   * @returns {Promise<Array>} - Array of admin users
   */
  async getAdminUsers() {
    return this.getData('admin_users');
  }

  /**
   * Get assistant applications
   * @returns {Promise<Array>} - Array of assistant applications
   */
  async getAssistantApplications() {
    return this.getData('assistant_applications');
  }

  /**
   * Get contact messages
   * @returns {Promise<Array>} - Array of contact messages
   */
  async getContactMessages() {
    return this.getData('contact_messages');
  }

  /**
   * Get experience data
   * @returns {Promise<object>} - Experience data
   */
  async getExperience() {
    return this.getData('experience');
  }

  /**
   * Get qualifications
   * @returns {Promise<Array>} - Array of qualifications
   */
  async getQualifications() {
    return this.getData('qualifications');
  }

  /**
   * Get results data
   * @returns {Promise<object>} - Results data
   */
  async getResults() {
    return this.getData('results');
  }

  /**
   * Get site settings
   * @returns {Promise<object>} - Site settings data
   */
  async getSiteSettings() {
    return this.getData('site_settings');
  }

  /**
   * Get student registrations
   * @returns {Promise<Array>} - Array of student registrations
   */
  async getStudentRegistrations() {
    return this.getData('student_registrations');
  }

  /**
   * Get subjects
   * @returns {Promise<Array>} - Array of subjects
   */
  async getSubjects() {
    return this.getData('subjects');
  }

  /**
   * Get teacher website data
   * @returns {Promise<object>} - Teacher website data
   */
  async getTeacherWebsite() {
    return this.getData('teacher_website');
  }

  /**
   * Get website content
   * @returns {Promise<object>} - Website content data
   */
  async getWebsiteContent() {
    return this.getData('website_content');
  }

  /**
   * Get website settings
   * @returns {Promise<object>} - Website settings data
   */
  async getWebsiteSettings() {
    return this.getData('website_settings');
  }

  /**
   * Get website data
   * @returns {Promise<object>} - Website data
   */
  async getWebsite() {
    return this.getData('website');
  }

  // Add more convenience methods as needed
}

export default UnifiedSiteData; 