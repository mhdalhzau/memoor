import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

// Use Neon database URL - check both NEON_DATABASE_URL and DATABASE_URL
const databaseUrl = process.env.NEON_DATABASE_URL || process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "NEON_DATABASE_URL or DATABASE_URL must be set. This application requires Neon PostgreSQL database.",
  );
}

// Determine which environment variable is being used
const usingNeonVar = !!process.env.NEON_DATABASE_URL;
const usingDatabaseVar = !process.env.NEON_DATABASE_URL && !!process.env.DATABASE_URL;

if (process.env.NEON_DATABASE_URL && process.env.DATABASE_URL && process.env.NEON_DATABASE_URL !== process.env.DATABASE_URL) {
  console.log("⚠️ Warning: Both NEON_DATABASE_URL and DATABASE_URL are set with different values. Using NEON_DATABASE_URL.");
}

console.log(`🔄 Using database connection from ${usingNeonVar ? 'NEON_DATABASE_URL' : 'DATABASE_URL'}`);

if (databaseUrl.includes('neon.tech')) {
  console.log("🔄 Connecting to Neon PostgreSQL database...");
} else {
  console.log("⚠️ Warning: Database URL does not appear to be Neon - please verify it points to your Neon instance");
}

// Test database connection on startup
try {
  await pool.query('SELECT 1');
  console.log("✅ Database connection verified successfully");
} catch (error) {
  console.error("❌ Failed to connect to database:", error);
  process.exit(1);
}

// Neon uses standard SSL configuration
console.log("🔄 Using Neon PostgreSQL database");

const sslConfig = {
  rejectUnauthorized: true  // Neon uses proper SSL certificates
};

export const pool = new Pool({ 
  connectionString: databaseUrl,
  ssl: sslConfig
});
export const db = drizzle(pool, { schema });
