import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

// Use Neon database URL - no fallback to prevent using Replit database
const databaseUrl = process.env.NEON_DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "NEON_DATABASE_URL must be set. This application requires Neon PostgreSQL database.",
  );
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
