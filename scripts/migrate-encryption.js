#!/usr/bin/env node

const crypto = require('crypto');

// Migration utility for when encryption key changes
console.log('🔄 Encryption Key Migration Utility\n');

console.log('⚠️  WARNING: This utility is for migrating encrypted data when changing encryption keys.');
console.log('Only use this if you need to re-encrypt existing data with a new key.\n');

console.log('Migration process:');
console.log('1. Make sure you have both OLD_ENCRYPTION_KEY and ENCRYPTION_KEY in your environment');
console.log('2. Run this script to decrypt with old key and re-encrypt with new key');
console.log('3. Test that the migration worked correctly');
console.log('4. Remove OLD_ENCRYPTION_KEY from your environment\n');

console.log('Example usage:');
console.log('OLD_ENCRYPTION_KEY=<old-key> ENCRYPTION_KEY=<new-key> node scripts/migrate-encryption.js\n');

console.log('This feature requires implementation in the user-storage service.');
console.log('The actual migration would need to:');
console.log('- Connect to Redis');
console.log('- Iterate through all user profiles');
console.log('- Decrypt API keys with old key');
console.log('- Re-encrypt with new key');
console.log('- Save back to Redis\n');

if (process.env.OLD_ENCRYPTION_KEY && process.env.ENCRYPTION_KEY) {
  console.log('✅ Both OLD_ENCRYPTION_KEY and ENCRYPTION_KEY are set.');
  console.log('Migration implementation would run here...');
} else {
  console.log('❌ Missing required environment variables:');
  if (!process.env.OLD_ENCRYPTION_KEY) console.log('  - OLD_ENCRYPTION_KEY');
  if (!process.env.ENCRYPTION_KEY) console.log('  - ENCRYPTION_KEY');
}