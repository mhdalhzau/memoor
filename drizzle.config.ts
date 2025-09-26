import { defineConfig } from "drizzle-kit";

// Use MySQL database URL from environment variables
let databaseUrl = process.env.MYSQL_DATABASE_URL || process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("MYSQL_DATABASE_URL must be set. This application requires a MySQL database.");
}

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "mysql",
  dbCredentials: {
    url: databaseUrl,
  },
});
