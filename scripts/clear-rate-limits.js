#!/usr/bin/env node

/**
 * Utility script to clear rate limiting for testing purposes
 * Run this script to reset rate limiting when testing password functionality
 */

const fs = require('fs');
const path = require('path');

console.log('🔓 Clearing rate limiting for testing...');

// Clear Node.js in-memory rate limiting (if running)
if (global.rateLimitStore) {
  global.rateLimitStore.clear();
  console.log('✅ Cleared Node.js in-memory rate limiting');
}

// Clear PHP file-based rate limiting
const tempDir = require('os').tmpdir();
const phpRateLimitFiles = fs.readdirSync(tempDir)
  .filter(file => file.startsWith('api_rate_limit_'));

if (phpRateLimitFiles.length > 0) {
  phpRateLimitFiles.forEach(file => {
    try {
      fs.unlinkSync(path.join(tempDir, file));
      console.log(`✅ Deleted PHP rate limit file: ${file}`);
    } catch (err) {
      console.log(`⚠️  Could not delete ${file}: ${err.message}`);
    }
  });
} else {
  console.log('ℹ️  No PHP rate limit files found');
}

console.log('🎉 Rate limiting cleared successfully!');
console.log('💡 You can now test password functionality without 429 errors');
console.log('⚠️  Remember: This is for testing only. Rate limiting protects against brute force attacks.'); 