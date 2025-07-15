#!/usr/bin/env node
import { neon } from '@neondatabase/serverless';
import fs from 'fs';
import path from 'path';

// Check if DATABASE_URL is provided
if (!process.env.DATABASE_URL) {
  console.error('❌ ERROR: DATABASE_URL environment variable is required');
  process.exit(1);
}

// Get import file from command line argument
const importFile = process.argv[2];
if (!importFile) {
  console.error('❌ ERROR: Please provide the import file path');
  console.error('Usage: node scripts/railway-import.js <export-file.json>');
  process.exit(1);
}

if (!fs.existsSync(importFile)) {
  console.error(`❌ ERROR: Import file not found: ${importFile}`);
  process.exit(1);
}

console.log('📦 Importing data to Railway PostgreSQL...');

try {
  const sql = neon(process.env.DATABASE_URL);
  
  // Read export file
  console.log(`📄 Reading import file: ${importFile}`);
  const exportData = JSON.parse(fs.readFileSync(importFile, 'utf8'));
  
  if (!exportData.data) {
    throw new Error('Invalid export file format');
  }

  console.log('📊 Import summary:');
  console.log(`   - Source: ${exportData.metadata?.source || 'Unknown'}`);
  console.log(`   - Export Date: ${exportData.metadata?.exportDate || 'Unknown'}`);
  
  // Import users first (they may be referenced by other tables)
  if (exportData.data.users && exportData.data.users.length > 0) {
    console.log('👥 Importing users...');
    for (const user of exportData.data.users) {
      await sql`
        INSERT INTO users (id, email, first_name, last_name, profile_image_url, created_at, updated_at)
        VALUES (${user.id}, ${user.email}, ${user.first_name}, ${user.last_name}, 
                ${user.profile_image_url}, ${user.created_at}, ${user.updated_at})
        ON CONFLICT (id) DO UPDATE SET
          email = EXCLUDED.email,
          first_name = EXCLUDED.first_name,
          last_name = EXCLUDED.last_name,
          profile_image_url = EXCLUDED.profile_image_url,
          updated_at = EXCLUDED.updated_at
      `;
    }
    console.log(`   ✅ Imported ${exportData.data.users.length} users`);
  }

  // Import inventory items
  if (exportData.data.inventoryItems && exportData.data.inventoryItems.length > 0) {
    console.log('📦 Importing inventory items...');
    let importedCount = 0;
    for (const item of exportData.data.inventoryItems) {
      await sql`
        INSERT INTO inventory_items (
          id, code_barre, num_inventaire, departement, num_bureau, beneficiaire,
          designation, quantite, condition, prix, categorie, date_ajouter, date_modification, custom_fields
        )
        VALUES (
          ${item.id}, ${item.code_barre}, ${item.num_inventaire}, ${item.departement},
          ${item.num_bureau}, ${item.beneficiaire}, ${item.designation}, ${item.quantite},
          ${item.condition}, ${item.prix}, ${item.categorie}, ${item.date_ajouter},
          ${item.date_modification}, ${item.custom_fields}
        )
        ON CONFLICT (id) DO UPDATE SET
          code_barre = EXCLUDED.code_barre,
          num_inventaire = EXCLUDED.num_inventaire,
          departement = EXCLUDED.departement,
          num_bureau = EXCLUDED.num_bureau,
          beneficiaire = EXCLUDED.beneficiaire,
          designation = EXCLUDED.designation,
          quantite = EXCLUDED.quantite,
          condition = EXCLUDED.condition,
          prix = EXCLUDED.prix,
          categorie = EXCLUDED.categorie,
          date_modification = EXCLUDED.date_modification,
          custom_fields = EXCLUDED.custom_fields
      `;
      importedCount++;
      if (importedCount % 100 === 0) {
        console.log(`   📊 Progress: ${importedCount}/${exportData.data.inventoryItems.length} items`);
      }
    }
    console.log(`   ✅ Imported ${exportData.data.inventoryItems.length} inventory items`);
  }

  // Import deleted items
  if (exportData.data.deletedItems && exportData.data.deletedItems.length > 0) {
    console.log('🗑️ Importing deleted items...');
    for (const item of exportData.data.deletedItems) {
      await sql`
        INSERT INTO deleted_items (
          id, original_id, code_barre, num_inventaire, departement, num_bureau,
          beneficiaire, designation, quantite, condition, prix, categorie,
          date_ajouter, date_modification, custom_fields, deleted_at
        )
        VALUES (
          ${item.id}, ${item.original_id}, ${item.code_barre}, ${item.num_inventaire},
          ${item.departement}, ${item.num_bureau}, ${item.beneficiaire}, ${item.designation},
          ${item.quantite}, ${item.condition}, ${item.prix}, ${item.categorie},
          ${item.date_ajouter}, ${item.date_modification}, ${item.custom_fields}, ${item.deleted_at}
        )
        ON CONFLICT (id) DO UPDATE SET
          original_id = EXCLUDED.original_id,
          code_barre = EXCLUDED.code_barre,
          num_inventaire = EXCLUDED.num_inventaire,
          departement = EXCLUDED.departement,
          num_bureau = EXCLUDED.num_bureau,
          beneficiaire = EXCLUDED.beneficiaire,
          designation = EXCLUDED.designation,
          quantite = EXCLUDED.quantite,
          condition = EXCLUDED.condition,
          prix = EXCLUDED.prix,
          categorie = EXCLUDED.categorie,
          date_ajouter = EXCLUDED.date_ajouter,
          date_modification = EXCLUDED.date_modification,
          custom_fields = EXCLUDED.custom_fields,
          deleted_at = EXCLUDED.deleted_at
      `;
    }
    console.log(`   ✅ Imported ${exportData.data.deletedItems.length} deleted items`);
  }

  // Import search results
  if (exportData.data.searchResults && exportData.data.searchResults.length > 0) {
    console.log('🔍 Importing search results...');
    for (const result of exportData.data.searchResults) {
      await sql`
        INSERT INTO search_results (id, barcode, found, searched_at)
        VALUES (${result.id}, ${result.barcode}, ${result.found}, ${result.searched_at})
        ON CONFLICT (id) DO UPDATE SET
          barcode = EXCLUDED.barcode,
          found = EXCLUDED.found,
          searched_at = EXCLUDED.searched_at
      `;
    }
    console.log(`   ✅ Imported ${exportData.data.searchResults.length} search results`);
  }

  // Import audit log
  if (exportData.data.auditLog && exportData.data.auditLog.length > 0) {
    console.log('📝 Importing audit log...');
    for (const log of exportData.data.auditLog) {
      await sql`
        INSERT INTO audit_log (
          id, user_id, action, table_name, record_id, old_values, new_values, description, created_at
        )
        VALUES (
          ${log.id}, ${log.user_id}, ${log.action}, ${log.table_name}, ${log.record_id},
          ${log.old_values}, ${log.new_values}, ${log.description}, ${log.created_at}
        )
        ON CONFLICT (id) DO UPDATE SET
          user_id = EXCLUDED.user_id,
          action = EXCLUDED.action,
          table_name = EXCLUDED.table_name,
          record_id = EXCLUDED.record_id,
          old_values = EXCLUDED.old_values,
          new_values = EXCLUDED.new_values,
          description = EXCLUDED.description,
          created_at = EXCLUDED.created_at
      `;
    }
    console.log(`   ✅ Imported ${exportData.data.auditLog.length} audit log entries`);
  }

  console.log('');
  console.log('🎉 Data import completed successfully!');
  console.log('✅ Your Railway database is now ready with all your data.');

} catch (error) {
  console.error('❌ Import failed:', error);
  process.exit(1);
}