import { pool } from "./db";
import fs from "fs";
import path from "path";

// Database backup functionality
export async function createDatabaseBackup(): Promise<string> {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join(process.cwd(), 'database_backup');
    
    // Create backup directory if it doesn't exist
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    const backupFile = path.join(backupDir, `mysql_backup_${timestamp}.sql`);
    
    console.log('🔄 Starting MySQL database backup...');
    
    // Get database name from connection
    const connection = await pool.getConnection();
    
    // Ensure MySQL-compatible SQL mode (remove ANSI_QUOTES if present)
    const [sqlModeBeforeResult] = await connection.execute('SELECT @@sql_mode as current_mode');
    console.log('📋 SQL mode before fix:', (sqlModeBeforeResult as any)[0]?.current_mode);
    
    // Set explicit SQL mode without ANSI_QUOTES
    await connection.execute("SET SESSION sql_mode='REAL_AS_FLOAT,PIPES_AS_CONCAT,IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_ALL_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION'");
    
    const [sqlModeAfterResult] = await connection.execute('SELECT @@sql_mode as current_mode');
    console.log('📋 SQL mode after fix:', (sqlModeAfterResult as any)[0]?.current_mode);
    
    const [dbNameResult] = await connection.execute('SELECT DATABASE() as db_name');
    const dbName = (dbNameResult as any)[0]?.db_name;
    
    if (!dbName) {
      throw new Error('Could not determine database name');
    }
    
    // Get all tables
    const [tablesResult] = await connection.execute('SHOW TABLES');
    const tables = (tablesResult as any[]).map(row => Object.values(row)[0]);
    
    let backupContent = `-- MySQL Database Backup\n-- Generated: ${new Date().toISOString()}\n-- Database: ${dbName}\n\n`;
    backupContent += `USE \`${dbName}\`;\n\n`;
    
    // Backup each table
    for (const tableName of tables) {
      console.log(`📋 Backing up table: ${tableName}`);
      
      // Get table structure - MySQL SHOW CREATE TABLE should return proper backtick syntax
      const [createTableResult] = await connection.execute(`SHOW CREATE TABLE \`${tableName}\``);
      const createTableSQL = (createTableResult as any)[0]['Create Table'];
      
      backupContent += `-- Table: ${tableName}\n`;
      backupContent += `DROP TABLE IF EXISTS \`${tableName}\`;\n`;
      backupContent += `${createTableSQL};\n\n`;
      
      // Get table data
      const [rows] = await connection.execute(`SELECT * FROM \`${tableName}\``);
      
      if ((rows as any[]).length > 0) {
        backupContent += `-- Data for table: ${tableName}\n`;
        
        for (const row of rows as any[]) {
          const values = Object.values(row).map(value => {
            if (value === null) return 'NULL';
            // Use mysql2's built-in escaping for proper handling of all data types
            return connection.escape(value);
          }).join(', ');
          
          const columns = Object.keys(row).map(col => `\`${col}\``).join(', ');
          backupContent += `INSERT INTO \`${tableName}\` (${columns}) VALUES (${values});\n`;
        }
        backupContent += '\n';
      }
    }
    
    connection.release();
    
    // Write backup file with proper MySQL syntax
    fs.writeFileSync(backupFile, backupContent);
    
    console.log(`✅ Database backup completed: ${backupFile}`);
    return backupFile;
    
  } catch (error) {
    console.error('❌ Database backup failed:', error);
    throw error;
  }
}

// Restore database from backup
export async function restoreDatabaseFromBackup(backupFile: string): Promise<void> {
  try {
    if (!fs.existsSync(backupFile)) {
      throw new Error(`Backup file not found: ${backupFile}`);
    }
    
    console.log('🔄 Starting database restore...');
    
    const backupContent = fs.readFileSync(backupFile, 'utf8');
    const statements = splitSqlStatements(backupContent);
    
    const connection = await pool.getConnection();
    
    // Ensure MySQL-compatible SQL mode and disable foreign key checks for restore
    await connection.execute("SET SESSION sql_mode='REAL_AS_FLOAT,PIPES_AS_CONCAT,IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_ALL_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION'");
    await connection.execute('SET FOREIGN_KEY_CHECKS=0');
    
    try {
      for (const statement of statements) {
        const trimmedStmt = statement.trim();
        if (trimmedStmt && !trimmedStmt.startsWith('--')) {
          await connection.execute(trimmedStmt);
        }
      }
    } finally {
      // Re-enable foreign key checks
      await connection.execute('SET FOREIGN_KEY_CHECKS=1');
      connection.release();
    }
    
    console.log('✅ Database restore completed');
    
  } catch (error) {
    console.error('❌ Database restore failed:', error);
    throw error;
  }
}

// Safely split SQL statements - handles semicolons inside string literals
function splitSqlStatements(sql: string): string[] {
  const statements: string[] = [];
  let current = '';
  let inString = false;
  let stringChar = '';
  let escaped = false;
  
  for (let i = 0; i < sql.length; i++) {
    const char = sql[i];
    
    if (escaped) {
      escaped = false;
      current += char;
      continue;
    }
    
    if (char === '\\') {
      escaped = true;
      current += char;
      continue;
    }
    
    if (!inString && (char === '"' || char === "'" || char === '`')) {
      inString = true;
      stringChar = char;
      current += char;
    } else if (inString && char === stringChar) {
      inString = false;
      stringChar = '';
      current += char;
    } else if (!inString && char === ';') {
      const stmt = current.trim();
      if (stmt && !stmt.startsWith('--')) {
        statements.push(stmt);
      }
      current = '';
    } else {
      current += char;
    }
  }
  
  // Add final statement if exists
  const finalStmt = current.trim();
  if (finalStmt && !finalStmt.startsWith('--')) {
    statements.push(finalStmt);
  }
  
  return statements;
}

// Auto-backup scheduler (daily)
export function startAutoBackup(): void {
  console.log('📅 Starting automatic daily backup scheduler...');
  
  // Run backup every 24 hours
  setInterval(async () => {
    try {
      await createDatabaseBackup();
    } catch (error) {
      console.error('❌ Automatic backup failed:', error);
    }
  }, 24 * 60 * 60 * 1000);
  
  // Run initial backup after 30 seconds
  setTimeout(async () => {
    try {
      await createDatabaseBackup();
    } catch (error) {
      console.error('❌ Initial backup failed:', error);
    }
  }, 30000);
}