import { defineConfig } from "drizzle-kit";

// Use MySQL database URL from environment variables (matches server/db.ts configuration)
let databaseUrl = process.env.MYSQL_DATABASE_URL || process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("MYSQL_DATABASE_URL or DATABASE_URL must be set for MySQL connection.");
}

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "mysql",
  dbCredentials: {
    url: databaseUrl,
  },
});
