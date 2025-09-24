import { defineConfig } from "drizzle-kit";

// Use Neon database URL - check both NEON_DATABASE_URL and DATABASE_URL  
let databaseUrl = process.env.NEON_DATABASE_URL || process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("NEON_DATABASE_URL or DATABASE_URL must be set. This application requires Neon PostgreSQL database.");
}

// Neon uses standard SSL configuration - no custom certificates needed
function getSSLConfig() {
  console.log("✅ Drizzle: Using Neon standard SSL configuration");
  return {
    rejectUnauthorized: true  // Neon uses proper SSL certificates
  };
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
