#!/usr/bin/env node
// Railway build script with proper error handling

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🚀 Starting Railway build process...');

try {
  // Check if we're in the right directory
  if (!fs.existsSync('package.json')) {
    throw new Error('package.json not found. Make sure you are in the project root.');
  }

  console.log('📦 Installing dependencies...');
  execSync('npm ci', { stdio: 'inherit' });

  console.log('🏗️ Building application...');
  
  // Build frontend
  console.log('   Building frontend with Vite...');
  execSync('npx vite build', { stdio: 'inherit' });
  
  // Build backend with proper externals to avoid vite import issues
  console.log('   Building backend with esbuild...');
  execSync('npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist --external:vite --external:@vitejs/plugin-react --external:@replit/vite-plugin-runtime-error-modal --external:@replit/vite-plugin-cartographer', { stdio: 'inherit' });
  
  console.log('✅ Build completed successfully!');
  
  // Verify build outputs
  const distExists = fs.existsSync('dist');
  const clientDistExists = fs.existsSync('dist/public');
  const serverDistExists = fs.existsSync('dist/index.js');
  
  console.log('📊 Build verification:');
  console.log(`   - dist/ directory: ${distExists ? '✅' : '❌'}`);
  console.log(`   - Frontend build: ${clientDistExists ? '✅' : '❌'}`);
  console.log(`   - Backend build: ${serverDistExists ? '✅' : '❌'}`);
  
  if (!distExists || !serverDistExists) {
    throw new Error('Build verification failed. Some outputs are missing.');
  }
  
  console.log('🎉 Railway build process completed successfully!');
  
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}