import { Request, Response, NextFunction } from 'express';
import { getRealtimeService } from '../websocket';

interface RealtimeContext {
  table?: string;
  operation?: 'create' | 'update' | 'delete';
  storeId?: number;
  id?: string | number;
  skipRealtime?: boolean;
}

// Extend Request to include realtime context
declare global {
  namespace Express {
    interface Request {
      realtime?: RealtimeContext;
    }
  }
}

// Extract table name and operation from API route
function parseRouteInfo(method: string, path: string): { table?: string; operation?: 'create' | 'update' | 'delete' } {
  if (!path.startsWith('/api/')) return {};
  
  const segments = path.split('/');
  if (segments.length < 3) return {};
  
  const table = segments[2]; // /api/users -> 'users'
  let operation: 'create' | 'update' | 'delete' | undefined;
  
  // Map HTTP methods to CRUD operations
  switch (method.toUpperCase()) {
    case 'POST':
      operation = 'create';
      break;
    case 'PUT':
    case 'PATCH':
      operation = 'update';
      break;
    case 'DELETE':
      operation = 'delete';
      break;
  }
  
  return { table, operation };
}

// Extract resource ID from URL path
function extractResourceId(path: string): string | number | undefined {
  const segments = path.split('/');
  
  // Pattern: /api/table/id
  if (segments.length >= 4 && segments[3] !== '') {
    const id = segments[3];
    // Try to parse as number, fallback to string
    const numId = parseInt(id, 10);
    return isNaN(numId) ? id : numId;
  }
  
  return undefined;
}

// Extract store ID from request body or response data
function extractStoreId(req: Request, responseData: any): number | undefined {
  // Try request body first
  if (req.body?.storeId && typeof req.body.storeId === 'number') {
    return req.body.storeId;
  }
  
  // Try response data
  if (responseData?.storeId && typeof responseData.storeId === 'number') {
    return responseData.storeId;
  }
  
  // For array responses, try first item
  if (Array.isArray(responseData) && responseData.length > 0 && responseData[0]?.storeId) {
    return responseData[0].storeId;
  }
  
  return undefined;
}

// Main realtime middleware
export function realtimeMiddleware(req: Request, res: Response, next: NextFunction) {
  // Skip non-API routes
  if (!req.path.startsWith('/api/')) {
    return next();
  }
  
  // Parse route information
  const { table, operation } = parseRouteInfo(req.method, req.path);
  
  // Skip if not a CRUD operation we care about
  if (!table || !operation) {
    return next();
  }
  
  // Initialize realtime context
  req.realtime = {
    table,
    operation,
    id: extractResourceId(req.path),
    skipRealtime: false
  };
  
  // Intercept response to broadcast changes
  const originalJson = res.json;
  res.json = function(data: any) {
    // Call original json method first
    const result = originalJson.call(this, data);
    
    // Broadcast real-time event if response was successful
    if (res.statusCode >= 200 && res.statusCode < 300 && req.realtime && !req.realtime.skipRealtime) {
      broadcastOperation(req, data);
    }
    
    return result;
  };
  
  next();
}

// Broadcast operation to WebSocket clients
function broadcastOperation(req: Request, responseData: any) {
  const realtimeService = getRealtimeService();
  if (!realtimeService || !req.realtime) return;
  
  const { table, operation, id } = req.realtime;
  const storeId = extractStoreId(req, responseData);
  
  try {
    switch (operation) {
      case 'create':
        realtimeService.broadcastCreate(table!, responseData, storeId);
        break;
        
      case 'update':
        realtimeService.broadcastUpdate(table!, id!, responseData, storeId);
        break;
        
      case 'delete':
        realtimeService.broadcastDelete(table!, id!, storeId);
        break;
    }
    
    console.log(`📡 Real-time ${operation.toUpperCase()} broadcasted for ${table}${id ? `:${id}` : ''}${storeId ? ` (store:${storeId})` : ''}`);
  } catch (error) {
    console.error('❌ Real-time broadcast error:', error);
  }
}

// Helper function to skip real-time for specific operations
export function skipRealtime(req: Request) {
  if (req.realtime) {
    req.realtime.skipRealtime = true;
  }
}

// Helper function to set custom realtime context
export function setRealtimeContext(req: Request, context: Partial<RealtimeContext>) {
  req.realtime = { ...req.realtime, ...context };
}

// Helper function to check if route should emit real-time events
export function shouldEmitRealtime(table: string, operation: string): boolean {
  // Define which tables/operations should emit real-time events
  const realtimeTables = [
    'users', 'stores', 'customers', 'products', 'sales', 
    'attendance', 'cashflow', 'inventory', 'payroll',
    'proposals', 'suppliers', 'wallets'
  ];
  
  const realtimeOperations = ['create', 'update', 'delete'];
  
  return realtimeTables.includes(table) && realtimeOperations.includes(operation);
}