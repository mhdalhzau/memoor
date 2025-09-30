import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import fs from "fs";
import * as schema from "@shared/schema";

// Get MySQL database URL from environment variables
const databaseUrl =
  "mysql://avnadmin:AVNS_Woo6_cb4krTtGU7mJQi@marlokk-mhdalhzau.j.aivencloud.com:18498/defaultdb?ssl-mode=REQUIRED" ||
  process.env.MYSQL_DATABASE_URL ||
  process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "MYSQL_DATABASE_URL environment variable is required for MySQL connection",
  );
}

// Parse the database URL to extract connection parameters
const url = new URL(databaseUrl);

// Create MySQL connection pool with SSL configuration
let sslConfig: any = false;

// Try to use CA certificate if available, otherwise use basic SSL
try {
  if (fs.existsSync("attached_assets/ca.pem")) {
    sslConfig = {
      ca: fs.readFileSync("attached_assets/ca.pem", "utf8"),
      rejectUnauthorized: true,
    };
  } else if (
    url.searchParams.get("ssl-mode") === "REQUIRED" ||
    databaseUrl.includes("ssl-mode=REQUIRED")
  ) {
    sslConfig = { rejectUnauthorized: false };
  }
} catch (error) {
  console.warn("SSL certificate not found, using basic SSL connection");
  sslConfig = { rejectUnauthorized: false };
}

const pool = mysql.createPool({
  host: url.hostname,
  port: parseInt(url.port) || 3306,
  user: url.username,
  password: url.password,
  database: url.pathname.slice(1), // Remove leading slash
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ssl: sslConfig,
});

// Test MySQL database connection
export async function testDatabaseConnection(): Promise<boolean> {
  try {
    console.log("🔄 Connecting to MySQL database...");
    const connection = await pool.getConnection();
    console.log("🔄 Using MySQL database");

    // Test query - Simple select that works with all MySQL versions
    await connection.execute("SELECT 1 as test");
    connection.release();

    console.log("✅ MySQL database connection verified successfully");
    return true;
  } catch (error) {
    console.error("❌ MySQL database connection failed:", error);
    return false;
  }
}

// Check if MySQL is connected before allowing any database operations
export async function ensureDatabaseConnection(): Promise<void> {
  const isConnected = await testDatabaseConnection();
  if (!isConnected) {
    throw new Error(
      "❌ Database tidak terhubung! Tidak dapat mengakses data tanpa koneksi MySQL.",
    );
  }
}

// Ensure shifts column exists in stores table
export async function ensureShiftsColumn(): Promise<void> {
  try {
    console.log("🔄 Checking if shifts column exists in stores table...");
    const connection = await pool.getConnection();

    // Check if column exists
    const [columns] = await connection.execute(
      "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'stores' AND COLUMN_NAME = 'shifts'",
    );

    if ((columns as any[]).length === 0) {
      console.log("➕ Adding shifts column to stores table...");
      await connection.execute(
        "ALTER TABLE stores ADD COLUMN shifts TEXT DEFAULT NULL",
      );
      console.log("✅ Shifts column added successfully");
    } else {
      console.log("✅ Shifts column already exists");
    }

    connection.release();
  } catch (error) {
    console.error("❌ Failed to ensure shifts column:", error);
    throw error;
  }
}

// Create Drizzle database instance with MySQL schema
export const db = drizzle(pool, { schema, mode: "default" });

// Export pool for advanced usage if needed
export { pool };

// Export database connection for use in other modules
export default db;
