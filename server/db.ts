import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from '@shared/schema';

// Get MySQL database URL from environment variables
const databaseUrl = process.env.MYSQL_DATABASE_URL || process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('MYSQL_DATABASE_URL environment variable is required for MySQL connection');
}

// Create MySQL connection pool
const pool = mysql.createPool({
  uri: databaseUrl,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test MySQL database connection
export async function testDatabaseConnection(): Promise<boolean> {
  try {
    console.log('🔄 Connecting to MySQL database...');
    const connection = await pool.getConnection();
    console.log('🔄 Using MySQL database');
    
    // Test query
    await connection.execute('SELECT NOW() as current_time');
    connection.release();
    
    console.log('✅ MySQL database connection verified successfully');
    return true;
  } catch (error) {
    console.error('❌ MySQL database connection failed:', error);
    return false;
  }
}

// Check if MySQL is connected before allowing any database operations
export async function ensureDatabaseConnection(): Promise<void> {
  const isConnected = await testDatabaseConnection();
  if (!isConnected) {
    throw new Error('❌ Database tidak terhubung! Tidak dapat mengakses data tanpa koneksi MySQL.');
  }
}

// Create Drizzle database instance with MySQL schema
export const db = drizzle(pool, { schema, mode: 'default' });

// Export pool for advanced usage if needed
export { pool };

// Export database connection for use in other modules
export default db;