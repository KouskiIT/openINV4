#!/usr/bin/env node
// Railway deployment build script that ensures vite is properly externalized

import { execSync } from 'child_process';
import fs from 'fs';

console.log('🚀 Railway Deployment Build');

try {
  // Step 1: Build frontend
  console.log('Building frontend...');
  execSync('npx vite build', { stdio: 'inherit' });
  
  // Step 2: Build backend with proper externalization
  console.log('Building backend...');
  execSync('npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist --external:./vite.js', { stdio: 'inherit' });
  
  // Step 3: Copy vite.js to production build
  console.log('Copying vite module...');
  fs.copyFileSync('server/vite.js', 'dist/vite.js');
  
  // Step 4: Verify build
  const serverExists = fs.existsSync('dist/index.js');
  const viteExists = fs.existsSync('dist/vite.js');
  const publicExists = fs.existsSync('dist/public');
  
  if (serverExists && viteExists && publicExists) {
    console.log('✅ Build successful - ready for Railway deployment');
  } else {
    console.log('❌ Build verification failed');
    process.exit(1);
  }
  
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}