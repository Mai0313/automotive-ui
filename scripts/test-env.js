#!/usr/bin/env node
// filepath: /proj/ds906659/aith/AutomotiveUI/scripts/test-env.js
// Test script to verify environment variables are properly set

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env file
dotenv.config({ path: join(__dirname, '..', '.env') });

console.log('🔍 Testing environment variables...\n');

// Frontend environment variables
const requiredFrontendVars = [
  'EXPO_PUBLIC_WS_SERVER_URL',
  'EXPO_PUBLIC_HTTP_SERVER_URL'
];

// Backend environment variables
const requiredBackendVars = [
  'WS_SERVER_PORT',
  'HTTP_SERVER_PORT'
];

let hasErrors = false;

console.log('📱 Frontend Variables:');
requiredFrontendVars.forEach(varName => {
  const value = process.env[varName];
  if (!value) {
    console.log(`❌ ${varName}: NOT SET`);
    hasErrors = true;
  } else {
    console.log(`✅ ${varName}: ${value}`);
  }
});

console.log('\n🖥️  Backend Variables:');
requiredBackendVars.forEach(varName => {
  const value = process.env[varName];
  if (!value) {
    console.log(`❌ ${varName}: NOT SET`);
    hasErrors = true;
  } else {
    console.log(`✅ ${varName}: ${value}`);
  }
});

if (hasErrors) {
  console.log('\n❌ Some required environment variables are missing!');
  console.log('Please check your .env file and make sure all required variables are set.');
  process.exit(1);
} else {
  console.log('\n✅ All required environment variables are properly set!');
}
