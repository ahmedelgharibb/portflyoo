# Image Hosting Migration Guide: Base64 to Supabase

This guide provides step-by-step instructions for migrating from base64 image hosting to Supabase storage hosting.

## Overview

The migration involves:
1. **Backend**: Already implemented Supabase storage upload functionality in `/api/api.js`
2. **Frontend**: Updated image upload functions to use Supabase URLs instead of base64
3. **Data Migration**: Converting existing base64 images to Supabase storage URLs
4. **Testing**: Verifying the migration works correctly

## Prerequisites

Before starting the migration, ensure you have:

- ✅ Supabase project configured with storage bucket `website-images`
- ✅ Environment variables set up (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`)
- ✅ API endpoint `/api/api.js` working with Supabase storage
- ✅ Development server running (for migration scripts)

## Migration Steps

### Step 1: Create Backup

**⚠️ IMPORTANT: Always create a backup before migration**

```bash
# Run the backup script
node scripts/backup-before-migration.js
```

This creates a timestamped backup in `backups/pre-migration-[timestamp]/` containing:
- All `siteData.json` files
- Important configuration files
- Backup manifest with details

### Step 2: Verify Supabase Configuration

Ensure your Supabase storage is properly configured:

1. **Check bucket exists**: Verify `website-images` bucket exists in Supabase dashboard
2. **Check permissions**: Ensure bucket allows public read access
3. **Test API endpoint**: Verify `/api/api?action=uploadImage` works

### Step 3: Run Migration Script

```bash
# Run the migration script
node scripts/migrate-images-to-supabase.js
```

This script will:
- Scan all site directories for base64 images
- Convert base64 images to Supabase storage
- Update `siteData.json` files with new URLs
- Provide detailed logging of the process

### Step 4: Test the Migration

After migration, test the following:

1. **Load existing sites**: Verify images load correctly from Supabase URLs
2. **Upload new images**: Test the new upload functionality
3. **Check admin panel**: Ensure image previews work properly
4. **Verify performance**: Images should load faster from Supabase

## What Changed

### Frontend Changes

#### Before (Base64)
```javascript
// Images stored as base64 strings
websiteData.heroImage = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ..."
```

#### After (Supabase URLs)
```javascript
// Images stored as Supabase URLs
websiteData.heroImage = "https://your-project.supabase.co/storage/v1/object/public/website-images/hero-image-1234567890.jpg"
```

### Key Function Updates

1. **`handleImageUpload()`**: Now uploads to Supabase via API instead of storing base64
2. **`updateAdminImagePreview()`**: Updated to handle URLs instead of base64
3. **`handleSelectedFile()`**: Uses object URLs for preview performance

### API Changes

The `/api/api.js` already includes the `uploadImage` action that:
- Accepts base64 data and filename
- Uploads to Supabase storage
- Returns public URL

## Rollback Plan

If something goes wrong, you can rollback using the backup:

```bash
# Restore from backup
cp backups/pre-migration-[timestamp]/template1/siteData.json public/websites/template1/
cp backups/pre-migration-[timestamp]/test1/siteData.json public/websites/test1/
```

## Benefits of Migration

### Performance
- **Faster loading**: Images load from CDN instead of base64 strings
- **Reduced payload**: Database queries return URLs instead of large base64 strings
- **Better caching**: Browser can cache images properly

### Scalability
- **Storage efficiency**: Images stored in optimized cloud storage
- **Bandwidth savings**: Only download images when needed
- **CDN benefits**: Global content delivery network

### Maintenance
- **Easier management**: Images can be managed separately from data
- **Better organization**: Clear separation of concerns
- **Future-proof**: Ready for advanced image features (resizing, optimization)

## Troubleshooting

### Common Issues

1. **Images not loading after migration**
   - Check Supabase bucket permissions
   - Verify URLs are accessible
   - Check browser console for errors

2. **Upload failures**
   - Verify API endpoint is working
   - Check Supabase credentials
   - Ensure bucket exists and is accessible

3. **Migration script errors**
   - Ensure development server is running
   - Check network connectivity
   - Verify file permissions

### Debug Commands

```bash
# Test API endpoint
curl -X POST http://localhost:3000/api/api?action=uploadImage \
  -H "Content-Type: application/json" \
  -d '{"base64":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==","filename":"test.png"}'

# Check Supabase bucket
# Use Supabase dashboard to verify bucket contents
```

## Post-Migration Tasks

1. **Monitor performance**: Check image loading times
2. **Clean up**: Consider removing old base64 data after verification
3. **Optimize**: Implement image optimization if needed
4. **Document**: Update any documentation referencing base64 images

## Support

If you encounter issues during migration:

1. Check the troubleshooting section above
2. Review the backup logs
3. Test with a single site first
4. Contact support if needed

---

**Migration completed successfully! 🎉**

Your images are now hosted on Supabase storage with improved performance and scalability. 