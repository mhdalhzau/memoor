import { defineConfig } from "drizzle-kit";

// Use database URL from environment variables
let databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL must be set. This application requires a PostgreSQL database.");
}

// Configure SSL for database connection
function getSSLConfig() {
  const isDevelopment = process.env.NODE_ENV === 'development';
  console.log("✅ Drizzle: Configuring SSL for database connection");
  
  // In development with explicit flag, allow insecure connection
  if (isDevelopment && process.env.DISABLE_DB_TLS_VALIDATION === 'true') {
    console.log("⚠️ Drizzle WARNING: TLS validation disabled for development");
    return { rejectUnauthorized: false };
  }
  
  // Try to load CA certificate for secure connection
  try {
    const fs = require('fs');
    
    // Use CA certificate from environment variable if available
    let caCert = process.env.DATABASE_CA_CERT;
    
    // Fallback to file if environment variable is not set
    if (!caCert) {
      const path = require('path');
      const caCertPath = path.resolve(__dirname, 'attached_assets', 'ca_1758665108054.pem');
      if (fs.existsSync(caCertPath)) {
        caCert = fs.readFileSync(caCertPath).toString();
      }
    }
    
    if (caCert) {
      return {
        rejectUnauthorized: true,
        ca: caCert
      };
    } else {
      if (isDevelopment) {
        console.log("⚠️ Drizzle: No CA certificate found - falling back to insecure SSL for development");
        return { rejectUnauthorized: false };
      } else {
        throw new Error("Production requires valid CA certificate for database connection");
      }
    }
  } catch (error) {
    if (isDevelopment) {
      console.log("⚠️ Drizzle: Falling back to insecure SSL for development");
      return { rejectUnauthorized: false };
    } else {
      throw new Error("Production requires valid CA certificate for database connection");
    }
  }
}

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: databaseUrl,
    ssl: getSSLConfig(),
  },
});
