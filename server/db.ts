import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '@shared/schema';

// Get database URL from environment variables
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL environment variable is required');
}

// Create PostgreSQL connection pool
const pool = new Pool({
  connectionString: databaseUrl,
  ssl: false // SSL disabled as configured in drizzle.config.ts
});

// Test database connection
export async function testDatabaseConnection(): Promise<boolean> {
  try {
    console.log('🔄 Connecting to PostgreSQL database...');
    const client = await pool.connect();
    console.log('🔄 Using PostgreSQL database');
    
    // Test query
    await client.query('SELECT NOW()');
    client.release();
    
    console.log('✅ Database connection verified successfully');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
}

// Create Drizzle database instance with schema
export const db = drizzle(pool, { schema });

// Export pool for advanced usage if needed
export { pool };

// Export database connection for use in other modules
export default db;