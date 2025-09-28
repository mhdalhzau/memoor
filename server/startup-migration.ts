import { promises as fs } from "fs";
import path from "path";
import { storage } from "./storage";
import { testDatabaseConnection } from "./db";

/**
 * Flag file to track whether startup migration has been run
 * This prevents the migration from running multiple times
 */
const MIGRATION_FLAG_FILE = path.join(process.cwd(), '.migration-completed');

/**
 * Store ID for Patam Lestari store that needs migration
 */
const PATAM_LESTARI_STORE_ID = 2;

/**
 * Check if the startup migration has already been completed
 */
async function isMigrationCompleted(): Promise<boolean> {
  try {
    await fs.access(MIGRATION_FLAG_FILE);
    return true;
  } catch {
    return false;
  }
}

/**
 * Mark the migration as completed by creating a flag file
 */
async function markMigrationCompleted(): Promise<void> {
  try {
    const timestamp = new Date().toISOString();
    const content = `Migration completed at: ${timestamp}\nStore ID: ${PATAM_LESTARI_STORE_ID}\n`;
    await fs.writeFile(MIGRATION_FLAG_FILE, content, 'utf8');
    console.log(`✅ Migration completion flag created at: ${MIGRATION_FLAG_FILE}`);
  } catch (error) {
    console.warn(`⚠️ Failed to create migration flag file: ${error}`);
    // This is not critical - migration will still work, just might run again next time
  }
}

/**
 * Run sales data migration for Patam Lestari store (store ID 2)
 * This function runs automatically during server startup
 */
export async function runStartupMigration(): Promise<void> {
  console.log('🚀 STARTUP MIGRATION - Starting sales data migration check...');
  
  try {
    // Check if migration has already been completed
    const migrationCompleted = await isMigrationCompleted();
    if (migrationCompleted) {
      console.log(`✅ STARTUP MIGRATION - Migration already completed for store ${PATAM_LESTARI_STORE_ID}`);
      console.log(`📄 Flag file exists at: ${MIGRATION_FLAG_FILE}`);
      return;
    }

    console.log(`🔄 STARTUP MIGRATION - Migration not yet completed, proceeding with migration for store ${PATAM_LESTARI_STORE_ID}...`);

    // Wait for database connection to be established
    console.log('🔗 STARTUP MIGRATION - Verifying database connection...');
    const dbHealthy = await testDatabaseConnection();
    
    if (!dbHealthy) {
      console.error('❌ STARTUP MIGRATION - Database connection not available, skipping migration');
      return;
    }
    
    console.log('✅ STARTUP MIGRATION - Database connection verified');

    // Verify the target store exists
    console.log(`🏪 STARTUP MIGRATION - Verifying store ${PATAM_LESTARI_STORE_ID} exists...`);
    const store = await storage.getStore(PATAM_LESTARI_STORE_ID);
    
    if (!store) {
      console.error(`❌ STARTUP MIGRATION - Store ${PATAM_LESTARI_STORE_ID} not found, skipping migration`);
      return;
    }
    
    console.log(`✅ STARTUP MIGRATION - Store found: ${store.name} (ID: ${store.id})`);

    // Run the migration
    console.log(`🔄 STARTUP MIGRATION - Starting sales data migration for ${store.name} (ID: ${PATAM_LESTARI_STORE_ID})...`);
    const startTime = Date.now();
    
    const migrationResult = await storage.migrateSalesData(PATAM_LESTARI_STORE_ID);
    
    const duration = Date.now() - startTime;
    console.log(`✅ STARTUP MIGRATION - Migration completed in ${duration}ms`);
    
    // Log migration results
    console.log('📊 STARTUP MIGRATION - Migration Results:');
    console.log(`   • Sales records processed: ${migrationResult.salesProcessed}`);
    console.log(`   • Cashflow records created: ${migrationResult.cashflowRecordsCreated}`);
    console.log(`   • Piutang records created: ${migrationResult.piutangRecordsCreated}`);
    console.log(`   • Errors encountered: ${migrationResult.errors.length}`);
    
    if (migrationResult.errors.length > 0) {
      console.warn('⚠️ STARTUP MIGRATION - Errors during migration:');
      migrationResult.errors.forEach((error, index) => {
        console.warn(`   ${index + 1}. ${error}`);
      });
    }
    
    // Mark migration as completed
    await markMigrationCompleted();
    
    console.log(`🎉 STARTUP MIGRATION - Successfully completed migration for ${store.name}`);
    
  } catch (error: any) {
    console.error('🔥 STARTUP MIGRATION - Migration failed with error:', error.message);
    console.error('📋 STARTUP MIGRATION - Error stack:', error.stack);
    
    // Log additional context
    console.error('📄 STARTUP MIGRATION - Migration context:');
    console.error(`   • Target store ID: ${PATAM_LESTARI_STORE_ID}`);
    console.error(`   • Flag file path: ${MIGRATION_FLAG_FILE}`);
    console.error(`   • Timestamp: ${new Date().toISOString()}`);
    
    // Don't throw the error - we want the server to continue starting even if migration fails
    console.warn('⚠️ STARTUP MIGRATION - Server will continue starting despite migration failure');
  }
}

/**
 * Reset migration flag (for testing/debugging purposes)
 * This function can be called manually if needed to re-run the migration
 */
export async function resetMigrationFlag(): Promise<void> {
  try {
    await fs.unlink(MIGRATION_FLAG_FILE);
    console.log('🗑️ Migration flag file removed - migration will run on next server start');
  } catch (error) {
    console.log('ℹ️ Migration flag file does not exist or could not be removed');
  }
}