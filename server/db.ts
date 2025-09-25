import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";
import fs from 'fs';
import path from 'path';

// Use database URL from environment variables - ONLY AIVEN ALLOWED
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL must be set. This application requires Aiven PostgreSQL database.",
  );
}

// SECURITY: Only allow Aiven databases
if (!databaseUrl.includes('aivencloud.com')) {
  throw new Error(
    "❌ SECURITY RESTRICTION: This application only supports Aiven PostgreSQL databases. " +
    "Please use a valid Aiven database connection string."
  );
}

console.log("🔄 Connecting to Aiven PostgreSQL database...");
const providerName = "Aiven PostgreSQL";

// Aiven SSL configuration with CA certificate from environment
const isDevelopment = process.env.NODE_ENV === 'development';

let sslConfig;
try {
  // Use CA certificate from environment variable if available
  let caCert = process.env.AIVEN_CA_CERT;
  
  // Fallback to file if environment variable is not set (for backward compatibility)
  if (!caCert) {
    const caCertPath = path.resolve(import.meta.dirname, '..', 'attached_assets', 'ca_1758665108054.pem');
    if (fs.existsSync(caCertPath)) {
      caCert = fs.readFileSync(caCertPath).toString();
    }
  }
  
  if (caCert) {
    console.log("📄 CA certificate loaded for Aiven connection");
    
    if (isDevelopment && process.env.DISABLE_DB_TLS_VALIDATION === 'true') {
      console.log("⚠️ WARNING: TLS validation disabled for development only");
      // For development, disable TLS verification globally as a workaround
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
      sslConfig = {
        rejectUnauthorized: false
      };
    } else {
      // Secure configuration for production or development with proper SSL
      console.log("🔒 Using secure TLS configuration with CA certificate");
      sslConfig = {
        rejectUnauthorized: true,
        ca: caCert,
        minVersion: 'TLSv1.2'
      };
    }
  } else {
    // No CA certificate available
    if (isDevelopment) {
      console.log("⚠️ No CA certificate found - using fallback SSL for development");
      sslConfig = { rejectUnauthorized: false };
    } else {
      throw new Error("❌ Production requires valid CA certificate for Aiven connection. Please set AIVEN_CA_CERT environment variable.");
    }
  }
} catch (error) {
  console.error(`❌ Failed to configure SSL: ${error}`);
  if (isDevelopment) {
    console.log("⚠️ Falling back to insecure SSL for development");
    sslConfig = { rejectUnauthorized: false };
  } else {
    throw new Error("Production requires valid CA certificate for Aiven connection");
  }
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
