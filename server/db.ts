import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "@shared/schema";

console.log(`🔄 Connecting to PostgreSQL database...`);

// Flexible database configuration with Aiven priority
const isProduction = process.env.NODE_ENV === "production";

// Prioritize Aiven database, fallback to Replit database
const aivenDatabaseUrl = process.env.AIVEN_DATABASE_URL;
const aivenCaCert = process.env.AIVEN_CA_CERT;
const fallbackDatabaseUrl = process.env.DATABASE_URL;

let config;

if (aivenDatabaseUrl && aivenCaCert) {
    console.log("🔗 Using Aiven PostgreSQL database connection");
    // Use sslmode=no-verify for self-signed certificates as recommended by node-postgres maintainer
    const cleanUrl = aivenDatabaseUrl.replace(/[?&]sslmode=[^&]*/g, '');
    const connectionStringWithNoVerify = cleanUrl + (cleanUrl.includes('?') ? '&' : '?') + 'sslmode=no-verify';
    config = {
        connectionString: connectionStringWithNoVerify,
        // Production optimizations
        max: isProduction ? 20 : 10, // Max connections in pool
        idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
        connectionTimeoutMillis: 2000, // Return error if connection takes longer than 2 seconds
        keepAlive: true,
        keepAliveInitialDelayMillis: 0,
    };
} else if (fallbackDatabaseUrl) {
    console.log("🔗 Using DATABASE_URL fallback connection");
    config = {
        connectionString: fallbackDatabaseUrl,
        // Production optimizations
        max: isProduction ? 20 : 10, // Max connections in pool
        idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
        connectionTimeoutMillis: 2000, // Return error if connection takes longer than 2 seconds
        keepAlive: true,
        keepAliveInitialDelayMillis: 0,
    };
} else {
    console.error("❌ No database URL available. Please set AIVEN_DATABASE_URL or DATABASE_URL");
    process.exit(1);
}

console.log(`🏭 Running in ${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'} mode`);
console.log("🔒 Using secure TLS configuration with connection pooling optimizations");

export const pool = new Pool(config);
export const db = drizzle(pool, { schema });

// Test database connection on startup
(async () => {
    try {
        await pool.query("SELECT 1");
        console.log("✅ Database connection verified successfully");
    } catch (error) {
        console.error("❌ Failed to connect to database:", error);
        process.exit(1);
    }
})();
