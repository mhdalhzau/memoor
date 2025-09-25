import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { storage } from '../storage';
import type { User } from '@shared/schema';

// Extend Request interface untuk database middleware
declare global {
  namespace Express {
    interface Request {
      validatedData?: any;
      dbResult?: any;
      dbError?: Error;
      storeAccess?: {
        userStores: number[];
        hasAccess: (storeId: number) => boolean;
      };
    }
  }
}

// Interface untuk database middleware options
interface DatabaseMiddlewareOptions {
  schema?: z.ZodSchema;
  requireAuth?: boolean;
  requireRole?: string[];
  storeAccessRequired?: boolean;
  transformInput?: (data: any) => any;
  transformOutput?: (data: any) => any;
}

/**
 * Middleware untuk validasi input data menggunakan Zod schema
 */
export function validateInput(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      console.log(`🔍 Validating input for ${req.method} ${req.path}`);
      
      // Validasi data input menggunakan Zod schema
      const validatedData = schema.parse(req.body);
      
      // Simpan data yang sudah divalidasi
      req.validatedData = validatedData;
      
      console.log(`✅ Input validation successful for ${req.path}`);
      next();
    } catch (error) {
      console.error(`❌ Input validation failed for ${req.path}:`, error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: "Data validation error",
          errors: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
            code: err.code
          }))
        });
      }
      
      res.status(400).json({ 
        message: "Invalid input data",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };
}

/**
 * Middleware untuk otentikasi pengguna
 */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    console.log(`🚫 Authentication required for ${req.method} ${req.path}`);
    return res.status(401).json({ message: "Authentication required" });
  }
  
  console.log(`✅ User authenticated: ${req.user.email} (${req.user.role})`);
  next();
}

/**
 * Middleware untuk validasi role pengguna
 */
export function requireRole(roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    if (!roles.includes(req.user.role)) {
      console.log(`🚫 Access denied for ${req.user.email}: required roles [${roles.join(', ')}], has '${req.user.role}'`);
      return res.status(403).json({ 
        message: "Access denied", 
        requiredRoles: roles,
        userRole: req.user.role
      });
    }
    
    console.log(`✅ Role authorization successful: ${req.user.role}`);
    next();
  };
}

/**
 * Middleware untuk validasi akses store
 */
export function validateStoreAccess() {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      console.log(`🏪 Validating store access for user ${req.user.email}`);
      
      // Get user's accessible stores
      let userStores: number[] = [];
      
      if (req.user.role === 'administrasi') {
        // Admin dapat akses semua store
        const allStores = await storage.getAllStores();
        userStores = allStores.map(store => store.id);
      } else {
        // Get stores yang assigned ke user
        const assignedStores = await storage.getUserStores(req.user.id);
        userStores = assignedStores.map(store => store.id);
      }
      
      // Function untuk check akses ke specific store
      const hasAccess = (storeId: number) => {
        return userStores.includes(storeId);
      };
      
      // Simpan informasi akses store di request
      req.storeAccess = {
        userStores,
        hasAccess
      };
      
      console.log(`✅ Store access loaded: user has access to stores [${userStores.join(', ')}]`);
      next();
    } catch (error) {
      console.error(`❌ Store access validation failed:`, error);
      res.status(500).json({ 
        message: "Failed to validate store access",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };
}

/**
 * Middleware untuk operasi database CREATE
 */
export function createRecord(tableName: string, createFunction: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      console.log(`📝 Creating new ${tableName} record`);
      
      // Gunakan data yang sudah divalidasi atau body asli
      const data = req.validatedData || req.body;
      
      // Tambahkan user ID untuk tracking
      if (req.user && !data.userId && tableName !== 'users') {
        data.userId = req.user.id;
      }
      
      // Validasi store access jika diperlukan
      if (data.storeId && req.storeAccess && !req.storeAccess.hasAccess(data.storeId)) {
        return res.status(403).json({ 
          message: `You don't have access to store ${data.storeId}` 
        });
      }
      
      // Panggil storage function
      const result = await (storage as any)[createFunction](data);
      
      console.log(`✅ ${tableName} record created successfully:`, result.id);
      
      req.dbResult = result;
      next();
    } catch (error) {
      console.error(`❌ Failed to create ${tableName} record:`, error);
      req.dbError = error instanceof Error ? error : new Error('Database operation failed');
      next();
    }
  };
}

/**
 * Middleware untuk operasi database READ
 */
export function readRecords(tableName: string, readFunction: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      console.log(`📖 Reading ${tableName} records`);
      
      const { storeId, userId, ...params } = req.query;
      
      // Validasi store access
      if (storeId && req.storeAccess && !req.storeAccess.hasAccess(parseInt(storeId as string))) {
        return res.status(403).json({ 
          message: `You don't have access to store ${storeId}` 
        });
      }
      
      // Panggil storage function dengan parameter
      let result;
      if (storeId) {
        result = await (storage as any)[readFunction](parseInt(storeId as string), ...Object.values(params));
      } else if (userId) {
        result = await (storage as any)[readFunction](userId as string, ...Object.values(params));
      } else {
        result = await (storage as any)[readFunction](...Object.values(params));
      }
      
      console.log(`✅ ${tableName} records retrieved: ${Array.isArray(result) ? result.length : 1} records`);
      
      req.dbResult = result;
      next();
    } catch (error) {
      console.error(`❌ Failed to read ${tableName} records:`, error);
      req.dbError = error instanceof Error ? error : new Error('Database operation failed');
      next();
    }
  };
}

/**
 * Middleware untuk operasi database UPDATE
 */
export function updateRecord(tableName: string, updateFunction: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      console.log(`✏️ Updating ${tableName} record: ${req.params.id}`);
      
      const data = req.validatedData || req.body;
      const recordId = req.params.id;
      
      // Validasi store access untuk record yang akan diupdate
      if (data.storeId && req.storeAccess && !req.storeAccess.hasAccess(data.storeId)) {
        return res.status(403).json({ 
          message: `You don't have access to store ${data.storeId}` 
        });
      }
      
      // Panggil storage function
      const result = await (storage as any)[updateFunction](recordId, data);
      
      if (!result) {
        return res.status(404).json({ message: `${tableName} record not found` });
      }
      
      console.log(`✅ ${tableName} record updated successfully:`, recordId);
      
      req.dbResult = result;
      next();
    } catch (error) {
      console.error(`❌ Failed to update ${tableName} record:`, error);
      req.dbError = error instanceof Error ? error : new Error('Database operation failed');
      next();
    }
  };
}

/**
 * Middleware untuk operasi database DELETE
 */
export function deleteRecord(tableName: string, deleteFunction: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      console.log(`🗑️ Deleting ${tableName} record: ${req.params.id}`);
      
      const recordId = req.params.id;
      
      // Panggil storage function
      await (storage as any)[deleteFunction](recordId);
      
      console.log(`✅ ${tableName} record deleted successfully:`, recordId);
      
      req.dbResult = { message: `${tableName} record deleted successfully`, id: recordId };
      next();
    } catch (error) {
      console.error(`❌ Failed to delete ${tableName} record:`, error);
      req.dbError = error instanceof Error ? error : new Error('Database operation failed');
      next();
    }
  };
}

/**
 * Middleware untuk transformasi data output
 */
export function transformOutput(transformer?: (data: any) => any) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.dbResult && transformer) {
      console.log(`🔄 Transforming output data for ${req.path}`);
      req.dbResult = transformer(req.dbResult);
    }
    next();
  };
}

/**
 * Middleware untuk mengirim response dari database operation
 */
export function sendResponse(req: Request, res: Response, next: NextFunction) {
  // Handle database errors
  if (req.dbError) {
    console.error(`❌ Database error in ${req.method} ${req.path}:`, req.dbError.message);
    
    return res.status(500).json({
      message: "Database operation failed",
      error: req.dbError.message,
      timestamp: new Date().toISOString()
    });
  }
  
  // Send successful response
  if (req.dbResult !== undefined) {
    const statusCode = req.method === 'POST' ? 201 : 200;
    
    console.log(`✅ Sending ${statusCode} response for ${req.method} ${req.path}`);
    
    return res.status(statusCode).json(req.dbResult);
  }
  
  // No result to send, continue to next middleware
  next();
}

/**
 * Middleware untuk logging database operations
 */
export function logDatabaseOperation(req: Request, res: Response, next: NextFunction) {
  const startTime = Date.now();
  
  // Log request
  console.log(`🏪 [${new Date().toISOString()}] ${req.method} ${req.path} - User: ${req.user?.email || 'Anonymous'}`);
  
  // Override res.json untuk log response time
  const originalJson = res.json;
  res.json = function(data: any) {
    const duration = Date.now() - startTime;
    console.log(`⏱️ [${new Date().toISOString()}] ${req.method} ${req.path} completed in ${duration}ms - Status: ${res.statusCode}`);
    
    return originalJson.call(this, data);
  };
  
  next();
}

/**
 * Helper function untuk membuat middleware pipeline
 */
export function createDatabaseRoute(options: DatabaseMiddlewareOptions & {
  operation: 'create' | 'read' | 'update' | 'delete';
  tableName: string;
  storageFunction: string;
}) {
  const middlewares: any[] = [];
  
  // Always log operations
  middlewares.push(logDatabaseOperation);
  
  // Authentication
  if (options.requireAuth !== false) {
    middlewares.push(requireAuth);
  }
  
  // Role validation
  if (options.requireRole) {
    middlewares.push(requireRole(options.requireRole));
  }
  
  // Store access validation
  if (options.storeAccessRequired) {
    middlewares.push(validateStoreAccess());
  }
  
  // Input validation
  if (options.schema) {
    middlewares.push(validateInput(options.schema));
  }
  
  // Database operation
  switch (options.operation) {
    case 'create':
      middlewares.push(createRecord(options.tableName, options.storageFunction));
      break;
    case 'read':
      middlewares.push(readRecords(options.tableName, options.storageFunction));
      break;
    case 'update':
      middlewares.push(updateRecord(options.tableName, options.storageFunction));
      break;
    case 'delete':
      middlewares.push(deleteRecord(options.tableName, options.storageFunction));
      break;
  }
  
  // Output transformation
  if (options.transformOutput) {
    middlewares.push(transformOutput(options.transformOutput));
  }
  
  // Send response
  middlewares.push(sendResponse);
  
  return middlewares;
}