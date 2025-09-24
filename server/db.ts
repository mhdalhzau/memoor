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

if (databaseUrl.includes('neon.tech')) {
  console.log("🔄 Connected to Neon PostgreSQL database");
} else {
  console.log("⚠️ Warning: Not using Neon database - please verify DATABASE_URL points to your Neon instance");
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
