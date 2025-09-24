import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

// ONLY use Aiven database URL - no fallback to prevent using Replit database
const databaseUrl = process.env.AIVEN_DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "AIVEN_DATABASE_URL must be set. This application requires Aiven PostgreSQL database.",
  );
}

// For now, prioritize data persistence over SSL security in development
// We'll use the working connection that allows data to be saved
console.log("🔄 Using development SSL configuration for data persistence");

const sslConfig = {
  rejectUnauthorized: false  // Allow connection to work and save data
};

export const pool = new Pool({ 
  connectionString: databaseUrl,
  ssl: sslConfig
});
export const db = drizzle(pool, { schema });
