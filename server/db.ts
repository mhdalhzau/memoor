import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "@shared/schema";

console.log(`🔄 Connecting to PostgreSQL database...`);

// Aiven PostgreSQL configuration
const config = {
    user: "avnadmin",
    password: "",
    host: "",
    port: 18498,
    database: "defaultdb",
    ssl: {
        rejectUnauthorized: true,
        ca: ``,
    },
};

console.log("📄 CA certificate loaded for database connection");
console.log("🔒 Using secure TLS configuration with CA certificate");

export const pool = new Pool(config);
export const db = drizzle(pool, { schema });

// Test database connection on startup
try {
    await pool.query("SELECT 1");
    console.log("✅ Database connection verified successfully");
} catch (error) {
    console.error("❌ Failed to connect to database:", error);
    process.exit(1);
}
