import { defineConfig } from "drizzle-kit";

// Use database URL from environment variables
let databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL must be set. This application requires a PostgreSQL database.");
}

// Configure SSL for database connection (DISABLED)
function getSSLConfig() {
  console.log("🚫 Drizzle: SSL completely disabled for database connection");
  return false;
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
