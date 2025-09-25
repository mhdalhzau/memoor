import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";
import fs from 'fs';
import path from 'path';

// Use database URL from environment variables
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL must be set. This application requires a PostgreSQL database.",
  );
}

// Database provider detection
let providerType = "cloud";
if (databaseUrl.includes('localhost') || databaseUrl.includes('127.0.0.1')) {
  providerType = "local";
}

console.log(`🔄 Connecting to PostgreSQL database...`);

// SSL configuration based on database provider
const isDevelopment = process.env.NODE_ENV === 'development';

let sslConfig;
try {
  if (providerType === "local") {
    // Local databases typically don't use SSL
    console.log("🔓 Using non-SSL configuration for local database");
    sslConfig = false;
  } else {
    // For cloud databases, check for custom CA certificate
    let caCert = process.env.DATABASE_CA_CERT;
    
    // Fallback to file if environment variable is not set (for backward compatibility)
    if (!caCert) {
      const caCertPath = path.resolve(import.meta.dirname, '..', 'attached_assets', 'ca_1758665108054.pem');
      if (fs.existsSync(caCertPath)) {
        caCert = fs.readFileSync(caCertPath).toString();
      }
    }
    
    if (caCert) {
      console.log("📄 CA certificate loaded for database connection");
      
      if (isDevelopment && process.env.DISABLE_DB_TLS_VALIDATION === 'true') {
        console.log("⚠️ WARNING: TLS validation disabled for development only");
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
        sslConfig = { rejectUnauthorized: false };
      } else {
        console.log("🔒 Using secure TLS configuration with CA certificate");
        sslConfig = {
          rejectUnauthorized: true,
          ca: caCert,
          minVersion: 'TLSv1.2'
        };
      }
    } else {
      // Standard SSL configuration for cloud databases
      if (isDevelopment && process.env.DISABLE_DB_TLS_VALIDATION === 'true') {
        console.log("⚠️ WARNING: TLS validation disabled for development only");
        sslConfig = { rejectUnauthorized: false };
      } else {
        console.log("🔒 Using standard TLS configuration");
        sslConfig = { rejectUnauthorized: true };
      }
    }
  }
} catch (error) {
  console.error(`❌ Failed to configure SSL: ${error}`);
  if (isDevelopment) {
    console.log("⚠️ Falling back to development SSL configuration");
    sslConfig = { rejectUnauthorized: false };
  } else {
    throw new Error("Failed to configure database SSL");
  }
}

console.log(`🔄 Using PostgreSQL database`);

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
