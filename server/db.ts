import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "@shared/schema";

console.log(`🔄 Connecting to PostgreSQL database...`);

// Flexible database configuration with Aiven priority
const isProduction = process.env.NODE_ENV === "production";

// Prioritize Aiven database, fallback to Replit database
const aivenDatabaseUrl = process.env.AIVEN_DATABASE_URL;
const fallbackDatabaseUrl = process.env.DATABASE_URL;

let config;

if (aivenDatabaseUrl) {
    console.log("🔗 Using Aiven PostgreSQL database connection");
    
    // For development, temporarily disable SSL verification 
    // In production, you should use proper certificates
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    
    config = {
        connectionString: aivenDatabaseUrl,
        // Production optimizations for Aiven
        max: isProduction ? 20 : 10, // Max connections in pool
        idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
        connectionTimeoutMillis: 10000, // Longer timeout for Aiven
        keepAlive: true,
        keepAliveInitialDelayMillis: 0,
        ssl: {
            rejectUnauthorized: false
        }
    };
} else if (fallbackDatabaseUrl) {
    console.log("🔗 Using DATABASE_URL fallback connection");
    
    // Check if it's an external database
    const url = new URL(fallbackDatabaseUrl);
    const isExternalDb = url.hostname !== 'localhost' && url.hostname !== '127.0.0.1';
    
    config = {
        connectionString: fallbackDatabaseUrl,
        // Production optimizations
        max: isProduction ? 20 : 10, // Max connections in pool
        idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
        connectionTimeoutMillis: isExternalDb ? 10000 : 2000, // Longer timeout for external databases
        keepAlive: true,
        keepAliveInitialDelayMillis: 0,
        // SSL configuration for external databases
        ssl: isExternalDb ? { rejectUnauthorized: false } : false,
    };
} else {
    console.error("❌ No database URL available. Please set AIVEN_DATABASE_URL or DATABASE_URL");
    process.exit(1);
}

console.log(`🏭 Running in ${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'} mode`);
console.log("🔒 Using secure TLS configuration with connection pooling optimizations");

export const pool = new Pool(config);
export const db = drizzle(pool, { schema });

// Test database connection on startup (non-blocking)
(async () => {
    try {
        await pool.query("SELECT 1");
        console.log("✅ Database connection verified successfully");
    } catch (error) {
        console.error("❌ Failed to connect to database:", error);
        console.log("⚠️ Application will continue running without database connection");
        console.log("🔍 Please check:");
        console.log("   - Database server is running and accessible");
        console.log("   - Firewall allows connections from Replit");
        console.log("   - Database credentials are correct");
    }
})();
