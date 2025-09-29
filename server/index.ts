import express, { type Request, Response, NextFunction } from "express";
import compression from "compression";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { setupDatabaseMiddleware } from "./middleware/integration";
import { runStartupMigration } from "./startup-migration";
import { ensureShiftsColumn } from "./db";

const app = express();

// Enable gzip compression for better performance
app.use(compression({
  filter: (req, res) => {
    if (req.headers['x-no-compression']) return false;
    return compression.filter(req, res);
  },
  threshold: 1024 // Only compress responses larger than 1kb
}));

// API timeout middleware - prevent hanging requests
app.use('/api', (req, res, next) => {
  const timeout = req.method === 'GET' ? 15000 : 30000; // 15s for GET, 30s for POST/PUT/DELETE
  
  const timer = setTimeout(() => {
    if (!res.headersSent) {
      res.status(504).json({ 
        error: 'Request timeout', 
        message: 'The request took too long to complete' 
      });
    }
  }, timeout);
  
  res.on('finish', () => clearTimeout(timer));
  res.on('close', () => clearTimeout(timer));
  
  next();
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));
// Add text parser for database import endpoint
app.use('/api/backup/import', express.text({ 
  type: ['text/plain', 'application/sql', 'text/sql'], 
  limit: '50mb' 
}));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);
  
  // Setup database middleware untuk operasi CRUD yang dioptimalkan
  setupDatabaseMiddleware(app);
  
  // Ensure shifts column exists in stores table
  try {
    await ensureShiftsColumn();
  } catch (error) {
    console.error("Failed to ensure shifts column, continuing anyway:", error);
  }
  
  // Run startup migration for Patam Lestari store (store ID 2)
  await runStartupMigration();

  // Enhanced global error handler - ensure all errors return JSON for API routes
  app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    let message = err.message || "Internal Server Error";
    
    // For API routes, ALWAYS ensure we return JSON and never HTML
    if (req.path.startsWith('/api')) {
      // Prevent any HTML from being sent
      res.set('Content-Type', 'application/json; charset=utf-8');
      res.set('Cache-Control', 'no-cache');
      
      // Create structured error response
      const errorResponse: any = { 
        success: false,
        error: message,
        status: status,
        timestamp: new Date().toISOString()
      };
      
      // Add detailed error info in development
      if (app.get("env") === "development") {
        errorResponse.details = {
          name: err.name,
          code: err.code || err.errno,
          stack: err.stack?.split('\n').slice(0, 10) // Limit stack trace
        };
      }
      
      // Handle specific error types
      if (err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT') {
        errorResponse.error = 'Database connection failed';
        errorResponse.message = 'Unable to connect to database. Please try again later.';
      } else if (err.code === 'ER_ACCESS_DENIED_ERROR') {
        errorResponse.error = 'Database access denied';
        errorResponse.message = 'Database authentication failed.';
      }
      
      // Ensure response hasn't been sent already
      if (!res.headersSent) {
        res.status(status).json(errorResponse);
      }
    } else {
      // For non-API routes, return text/html error
      if (!res.headersSent) {
        res.status(status).send(message);
      }
    }
    
    // Enhanced error logging
    const userAgent = req.get('User-Agent') || 'Unknown';
    console.error(`[${new Date().toISOString()}] ERROR ${status} on ${req.method} ${req.path}:`);
    console.error(`  Message: ${err.message}`);
    console.error(`  User-Agent: ${userAgent}`);
    if (err.stack) console.error(`  Stack: ${err.stack.split('\n').slice(0, 3).join('\n')}`);
  });

  // Add API 404 handler before Vite catch-all to prevent HTML responses for missing API routes
  app.use('/api/*', (req, res) => {
    res.status(404).json({
      error: 'API endpoint not found',
      message: `The API endpoint ${req.originalUrl} does not exist`,
      status: 404,
      timestamp: new Date().toISOString()
    });
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
