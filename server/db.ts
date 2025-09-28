import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from '@shared/schema';

// Get database URL from environment variables
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL environment variable is required for database connection');
}

// Create MySQL connection pool
const pool = mysql.createPool({
  uri: databaseUrl,
  connectionLimit: 25,
  acquireTimeout: 30000,
  connectTimeout: 2000,
  ssl: databaseUrl.includes('ssl=true') ? { rejectUnauthorized: false } : false,
});

// Test database connection
export async function testDatabaseConnection(): Promise<boolean> {
  try {
    console.log('🔄 Connecting to database...');
    const connection = await pool.getConnection();
    console.log('🔄 Using MySQL database');
    
    // Test query - MySQL syntax
    await connection.execute('SELECT 1 as test');
    connection.release();
    
    console.log('✅ Database connection verified successfully');
    console.log('✅ Database health check passed - MySQL connection verified');
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

// Create Drizzle database instance with MySQL
export const db = drizzle(pool, { schema, mode: 'default' });

// Export pool for advanced usage if needed
export { pool };

// Export database connection for use in other modules
export default db;