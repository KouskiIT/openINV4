#!/usr/bin/env node
import { neon } from '@neondatabase/serverless';
import fs from 'fs';
import path from 'path';

// Check if DATABASE_URL is provided
if (!process.env.DATABASE_URL) {
  console.error('❌ ERROR: DATABASE_URL environment variable is required');
  process.exit(1);
}

console.log('📦 Exporting database backup for Railway deployment...');

try {
  const sql = neon(process.env.DATABASE_URL);
  
  // Export all data from main tables
  console.log('📊 Exporting inventory items...');
  const inventoryItems = await sql`SELECT * FROM inventory_items ORDER BY id`;
  
  console.log('👥 Exporting users...');
  const users = await sql`SELECT * FROM users ORDER BY id`;
  
  console.log('🗑️ Exporting deleted items...');
  const deletedItems = await sql`SELECT * FROM deleted_items ORDER BY id`;
  
  console.log('🔍 Exporting search results...');
  const searchResults = await sql`SELECT * FROM search_results ORDER BY id`;
  
  console.log('📝 Exporting audit log...');
  const auditLog = await sql`SELECT * FROM audit_log ORDER BY id`;

  // Create export object
  const exportData = {
    metadata: {
      exportDate: new Date().toISOString(),
      source: 'Replit Development',
      destination: 'Railway Production',
      totalRecords: {
        inventoryItems: inventoryItems.length,
        users: users.length,
        deletedItems: deletedItems.length,
        searchResults: searchResults.length,
        auditLog: auditLog.length
      }
    },
    data: {
      inventoryItems,
      users,
      deletedItems,
      searchResults,
      auditLog
    }
  };

  // Ensure export directory exists
  const exportDir = path.join(process.cwd(), 'railway-export');
  if (!fs.existsSync(exportDir)) {
    fs.mkdirSync(exportDir, { recursive: true });
  }

  // Write export file
  const exportFile = path.join(exportDir, `inventory-export-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
  fs.writeFileSync(exportFile, JSON.stringify(exportData, null, 2));

  console.log('✅ Export completed successfully!');
  console.log(`📄 Export file: ${exportFile}`);
  console.log(`📊 Total records exported:`);
  console.log(`   - Inventory Items: ${inventoryItems.length}`);
  console.log(`   - Users: ${users.length}`);
  console.log(`   - Deleted Items: ${deletedItems.length}`);
  console.log(`   - Search Results: ${searchResults.length}`);
  console.log(`   - Audit Logs: ${auditLog.length}`);
  console.log('');
  console.log('🚀 Ready for Railway deployment!');

} catch (error) {
  console.error('❌ Export failed:', error);
  process.exit(1);
}