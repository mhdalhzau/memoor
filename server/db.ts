import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";
import fs from 'fs';
import path from 'path';

// Use database URL from environment variables
const databaseUrl = process.env.NEON_DATABASE_URL || process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL must be set. This application requires a PostgreSQL database.",
  );
}

// Determine database provider and configure SSL accordingly
let sslConfig;
let providerName = "PostgreSQL";

if (databaseUrl.includes('neon.tech')) {
  console.log("🔄 Connecting to Neon PostgreSQL database...");
  providerName = "Neon PostgreSQL";
  sslConfig = {
    rejectUnauthorized: true  // Neon uses proper SSL certificates
  };
} else if (databaseUrl.includes('aivencloud.com')) {
  console.log("🔄 Connecting to Aiven PostgreSQL database...");
  providerName = "Aiven PostgreSQL";
  
  // Proper Aiven SSL configuration with CA certificate from environment
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  try {
    // Use CA certificate from environment variable if available
    let caCert = process.env.AIVEN_CA_CERT;
    
    // Fallback to file if environment variable is not set (for backward compatibility)
    if (!caCert) {
      const caCertPath = path.resolve(import.meta.dirname, '..', 'attached_assets', 'ca_1758665108054.pem');
      caCert = fs.readFileSync(caCertPath).toString();
    }
    
    console.log("📄 CA certificate loaded for Aiven connection");
    
    if (isDevelopment && process.env.DISABLE_DB_TLS_VALIDATION === 'true') {
      console.log("⚠️ WARNING: TLS validation disabled for development only");
      // For development, disable TLS verification globally as a workaround
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
      sslConfig = {
        rejectUnauthorized: false
      };
    } else {
      // Secure configuration for production
      console.log("🔒 Using secure TLS configuration with CA certificate");
      sslConfig = {
        rejectUnauthorized: true,
        ca: caCert,
        minVersion: 'TLSv1.2'
      };
    }
  } catch (error) {
    console.error(`❌ Failed to read CA certificate: ${error}`);
    if (isDevelopment) {
      console.log("⚠️ Falling back to insecure SSL for development");
      sslConfig = { rejectUnauthorized: false };
    } else {
      throw new Error("Production requires valid CA certificate for Aiven connection");
    }
  }
} else {
  console.log("🔄 Connecting to PostgreSQL database...");
  // Secure default for unknown providers
  const isDevelopment = process.env.NODE_ENV === 'development';
  sslConfig = isDevelopment ? 
    { rejectUnauthorized: false } : 
    { rejectUnauthorized: true, minVersion: 'TLSv1.2' };
}

console.log(`🔄 Using ${providerName} database`);

export const pool = new Pool({ 
  connectionString: databaseUrl,
  ssl: sslConfig
});
export const db = drizzle(pool, { schema });

// Test database connection on startup
try {
  await pool.query('SELECT 1');
  console.log("✅ Database connection verified successfully");
} catch (error) {
  console.error("❌ Failed to connect to database:", error);
  process.exit(1);
}
