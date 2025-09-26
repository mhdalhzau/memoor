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
      
      // Get table structure
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
            if (typeof value === 'string') return `'${value.replace(/'/g, "''")}'`;
            if (value instanceof Date) return `'${value.toISOString().slice(0, 19).replace('T', ' ')}'`;
            return value;
          }).join(', ');
          
          const columns = Object.keys(row).map(col => `\`${col}\``).join(', ');
          backupContent += `INSERT INTO \`${tableName}\` (${columns}) VALUES (${values});\n`;
        }
        backupContent += '\n';
      }
    }
    
    connection.release();
    
    // Write backup file
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
    const statements = backupContent.split(';').filter(stmt => stmt.trim());
    
    const connection = await pool.getConnection();
    
    for (const statement of statements) {
      const trimmedStmt = statement.trim();
      if (trimmedStmt && !trimmedStmt.startsWith('--')) {
        await connection.execute(trimmedStmt);
      }
    }
    
    connection.release();
    
    console.log('✅ Database restore completed');
    
  } catch (error) {
    console.error('❌ Database restore failed:', error);
    throw error;
  }
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