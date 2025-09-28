import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '@shared/schema';

// Get database URL from environment variables (Using PostgreSQL for now)
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL environment variable is required for database connection');
}

// Create PostgreSQL connection pool (with MySQL-compatible business logic)
const pool = new Pool({
  connectionString: databaseUrl,
  max: 25,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test database connection
export async function testDatabaseConnection(): Promise<boolean> {
  try {
    console.log('🔄 Connecting to database...');
    const client = await pool.connect();
    console.log('🔄 Using PostgreSQL database with MySQL schema compatibility');
    
    // Test query - Simple select that works with PostgreSQL
    await client.query('SELECT 1 as test');
    client.release();
    
    console.log('✅ Database connection verified successfully');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
}

// Check if database is connected before allowing any database operations
export async function ensureDatabaseConnection(): Promise<void> {
  const isConnected = await testDatabaseConnection();
  if (!isConnected) {
    throw new Error('❌ Database tidak terhubung! Tidak dapat mengakses data.');
  }
}

// Create Drizzle database instance with PostgreSQL (MySQL schema compatible)
export const db = drizzle(pool, { schema, mode: 'default' });

// Export pool for advanced usage if needed
export { pool };

// Export database connection for use in other modules
export default db;