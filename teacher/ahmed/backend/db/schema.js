import { pgTable, serial, varchar, jsonb, timestamp, boolean, index, uniqueIndex } from 'drizzle-orm/pg-core';

// Main unified site data table
export const unifiedSiteData = pgTable(
  'unified_site_data',
  {
    id: serial('id').primaryKey(),
    siteId: varchar('site_id', { length: 255 }).notNull(),
    category: varchar('category', { length: 50 }).notNull(),
    data: jsonb('data').notNull(),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
    isActive: boolean('is_active').default(true),
  },
  (table) => {
    return {
      siteIdIdx: index('idx_unified_site_data_site_id').on(table.siteId),
      categoryIdx: index('idx_unified_site_data_category').on(table.category),
      siteIdCategoryUniq: uniqueIndex('uniq_site_id_category').on(table.siteId, table.category),
    };
  }
);

// Sites table for managing multiple websites
export const websites = pgTable(
  'websites',
  {
    id: serial('id').primaryKey(),
    siteId: varchar('site_id', { length: 255 }).notNull().unique(),
    name: varchar('name', { length: 255 }).notNull(),
    domain: varchar('domain', { length: 255 }),
    folderName: varchar('folder_name', { length: 255 }),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
    isActive: boolean('is_active').default(true),
  },
  (table) => {
    return {
      siteIdIdx: index('idx_websites_site_id').on(table.siteId),
    };
  }
);

// Users table for authentication
export const users = pgTable(
  'users',
  {
    id: serial('id').primaryKey(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    password: varchar('password', { length: 255 }).notNull(),
    name: varchar('name', { length: 255 }),
    role: varchar('role', { length: 50 }).default('user'),
    siteId: varchar('site_id', { length: 255 }),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
    isActive: boolean('is_active').default(true),
  },
  (table) => {
    return {
      emailIdx: index('idx_users_email').on(table.email),
      siteIdIdx: index('idx_users_site_id').on(table.siteId),
    };
  }
);

// Define relationships
export const siteRelations = {
  website: (siteData) => ({
    website: websites.findFirst({
      where: (websites, { eq }) => eq(websites.siteId, siteData.siteId),
    }),
  }),
};

export const userRelations = {
  site: (user) => ({
    site: websites.findFirst({
      where: (websites, { eq }) => eq(websites.siteId, user.siteId),
    }),
  }),
}; 