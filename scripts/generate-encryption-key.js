#!/usr/bin/env node

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

console.log('🔐 Generating secure encryption key for PMAI...\n');

const key = crypto.randomBytes(32).toString('hex');

console.log('Generated encryption key:');
console.log(`ENCRYPTION_KEY=${key}`);
console.log('\n📋 Instructions:');
console.log('1. Copy the above line to your .env.local file');
console.log('2. Make sure .env.local is in your .gitignore (it should be by default)');
console.log('3. For production, set this as an environment variable in your hosting platform');
console.log('4. IMPORTANT: Keep this key secure and never commit it to version control');
console.log('\n⚠️  WARNING: Changing this key will make existing encrypted data unrecoverable!');

const envPath = path.join(__dirname, '..', '.env.local');
const envExamplePath = path.join(__dirname, '..', '.env.example');

if (!fs.existsSync(envPath)) {
  console.log('\n💡 Tip: Creating .env.local file for you...');
  
  let envContent = '';
  if (fs.existsSync(envExamplePath)) {
    envContent = fs.readFileSync(envExamplePath, 'utf8');
    envContent = envContent.replace(/ENCRYPTION_KEY=.*/, `ENCRYPTION_KEY=${key}`);
  } else {
    envContent = `ENCRYPTION_KEY=${key}\n`;
  }
  
  fs.writeFileSync(envPath, envContent);
  console.log('✅ .env.local file created with the encryption key');
} else {
  console.log('\n⚠️  .env.local already exists. Please add the key manually.');
}