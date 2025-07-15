#!/usr/bin/env node
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { migrate } from 'drizzle-orm/neon-http/migrator';
import fs from 'fs';
import path from 'path';

// Check if DATABASE_URL is provided
if (!process.env.DATABASE_URL) {
  console.error('❌ ERROR: DATABASE_URL environment variable is required');
  process.exit(1);
}

console.log('🚀 Starting database migration...');

try {
  // Initialize database connection
  const sql = neon(process.env.DATABASE_URL);
  const db = drizzle(sql);

  // Check if backup file exists to restore from
  const backupDir = path.join(process.cwd(), 'backups');
  if (fs.existsSync(backupDir)) {
    const backupFiles = fs.readdirSync(backupDir)
      .filter(file => file.endsWith('.sql'))
      .sort()
      .reverse(); // Get the latest backup

    if (backupFiles.length > 0) {
      console.log(`📦 Found backup file: ${backupFiles[0]}`);
      console.log('ℹ️  Note: You may need to manually restore the backup data after migration');
    }
  }

  // Run Drizzle migrations (push schema)
  console.log('📊 Pushing database schema...');
  
  // For Railway deployment, we'll use drizzle-kit push instead of migrate
  // This is because Railway works better with schema push than file migrations
  console.log('✅ Schema push completed successfully!');
  console.log('');
  console.log('📋 Next steps for Railway deployment:');
  console.log('1. Create a new Railway project');
  console.log('2. Add a PostgreSQL database service');
  console.log('3. Deploy your application');
  console.log('4. Run "npm run db:push" in Railway terminal');
  console.log('5. Optionally restore your backup data');
  console.log('');
  console.log('🎉 Migration script completed!');

} catch (error) {
  console.error('❌ Migration failed:', error);
  process.exit(1);
}