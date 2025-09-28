import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from '@shared/schema';
import fs from 'fs';
import path from 'path';

// Get database URL from environment variables or fallback to example
const databaseUrl = process.env.DATABASE_URL || process.env.MYSQL_DATABASE_URL || 'mysql://avnadmin:AVNS_Woo6_cb4krTtGU7mJQi@marlokk-mhdalhzau.j.aivencloud.com:18498/defaultdb?ssl-mode=REQUIRED';

if (!databaseUrl) {
  throw new Error('DATABASE_URL or MYSQL_DATABASE_URL environment variable is required for database connection');
}

// Configure SSL for Aiven MySQL connection
let sslConfig: any = false;

if (databaseUrl.includes('aivencloud.com') || databaseUrl.includes('ssl-mode=REQUIRED')) {
  const caCertPath = path.join(process.cwd(), 'attached_assets', 'ca.pem');
  
  if (fs.existsSync(caCertPath)) {
    const caCert = fs.readFileSync(caCertPath, 'utf8');
    sslConfig = {
      ca: caCert,
      rejectUnauthorized: false // More lenient for Aiven connections in Replit
    };
    console.log('🔒 Using SSL certificate for Aiven MySQL connection');
  } else {
    // Fallback SSL config for Aiven without explicit CA
    sslConfig = {
      rejectUnauthorized: false
    };
    console.log('🔒 Using basic SSL for Aiven MySQL connection');
  }
}

// Create MySQL connection pool with optimized settings for Aiven
const pool = mysql.createPool({
  uri: databaseUrl,
  connectionLimit: 10, // Reduced for better stability
  acquireTimeout: 60000, // Increased for slow connections
  timeout: 60000, // Increased connection timeout
  ssl: sslConfig,
  reconnect: true,
  keepAliveInitialDelay: 0,
  enableKeepAlive: true,
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