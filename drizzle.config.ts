import { defineConfig } from "drizzle-kit";

// ONLY use Aiven database URL - no fallback to prevent using Replit database  
let databaseUrl = process.env.AIVEN_DATABASE_URL;

if (!databaseUrl) {
  throw new Error("AIVEN_DATABASE_URL must be set. This application requires Aiven PostgreSQL database.");
}

// Function to properly decode Aiven CA certificate
function getSSLConfig() {
  const aivenCert = process.env.AIVEN_CA_CERT;
  
  if (!aivenCert) {
    console.warn("⚠️ AIVEN_CA_CERT not found for drizzle-kit");
    return { rejectUnauthorized: false };
  }

  try {
    // Decode certificate properly (handle base64 or escaped newlines)
    let decodedCert = aivenCert;
    
    // If it looks like base64, decode it
    if (!decodedCert.includes('-----BEGIN CERTIFICATE-----')) {
      decodedCert = Buffer.from(aivenCert, 'base64').toString();
    }
    
    // Fix escaped newlines
    decodedCert = decodedCert.replace(/\\n/g, '\n');
    
    console.log("✅ Drizzle: Aiven SSL certificate loaded successfully");
    return {
      rejectUnauthorized: true,
      ca: decodedCert
    };
  } catch (error) {
    console.error("❌ Drizzle: Failed to decode Aiven CA certificate:", error);
    return { rejectUnauthorized: false };
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
