import { db } from '../db/index.js';
import { unifiedSiteData, websites } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';

// Repository for site data operations
export class SiteDataRepository {
  // Get all data categories for a specific site
  async getAllForSite(siteId) {
    try {
      const data = await db
        .select()
        .from(unifiedSiteData)
        .where(eq(unifiedSiteData.siteId, siteId))
        .orderBy(unifiedSiteData.category);
      
      return { success: true, data };
    } catch (error) {
      console.error('Error getting site data:', error);
      return { success: false, error: error.message };
    }
  }

  // Get specific category data for a site
  async getByCategory(siteId, category) {
    try {
      const data = await db
        .select()
        .from(unifiedSiteData)
        .where(
          and(
            eq(unifiedSiteData.siteId, siteId),
            eq(unifiedSiteData.category, category)
          )
        )
        .limit(1);
      
      return { 
        success: true, 
        data: data.length ? data[0].data : null,
        record: data.length ? data[0] : null
      };
    } catch (error) {
      console.error(`Error getting ${category} data:`, error);
      return { success: false, error: error.message };
    }
  }

  // Create or update site data for a specific category
  async upsert(siteId, category, data) {
    try {
      // Check if record exists
      const existing = await this.getByCategory(siteId, category);
      
      if (existing.record) {
        // Update existing record
        const result = await db
          .update(unifiedSiteData)
          .set({ 
            data,
            updatedAt: new Date()
          })
          .where(
            and(
              eq(unifiedSiteData.siteId, siteId),
              eq(unifiedSiteData.category, category)
            )
          )
          .returning();
        
        return { success: true, data: result[0] };
      } else {
        // Create new record
        const result = await db
          .insert(unifiedSiteData)
          .values({
            siteId,
            category,
            data,
            createdAt: new Date(),
            updatedAt: new Date(),
            isActive: true
          })
          .returning();
        
        return { success: true, data: result[0] };
      }
    } catch (error) {
      console.error(`Error upserting ${category} data:`, error);
      return { success: false, error: error.message };
    }
  }

  // Delete site data for a specific category
  async delete(siteId, category) {
    try {
      const result = await db
        .delete(unifiedSiteData)
        .where(
          and(
            eq(unifiedSiteData.siteId, siteId),
            eq(unifiedSiteData.category, category)
          )
        )
        .returning();
      
      return { 
        success: true, 
        data: result[0],
        deleted: result.length > 0
      };
    } catch (error) {
      console.error(`Error deleting ${category} data:`, error);
      return { success: false, error: error.message };
    }
  }

  // Get all sites
  async getAllSites() {
    try {
      const sites = await db
        .select()
        .from(websites)
        .where(eq(websites.isActive, true))
        .orderBy(websites.name);
      
      return { success: true, data: sites };
    } catch (error) {
      console.error('Error getting sites:', error);
      return { success: false, error: error.message };
    }
  }

  // Get site by ID
  async getSite(siteId) {
    try {
      const site = await db
        .select()
        .from(websites)
        .where(eq(websites.siteId, siteId))
        .limit(1);
      
      return { 
        success: true, 
        data: site.length ? site[0] : null
      };
    } catch (error) {
      console.error('Error getting site:', error);
      return { success: false, error: error.message };
    }
  }
} 