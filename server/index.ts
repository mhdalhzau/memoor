import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { setupDatabaseMiddleware } from "./middleware/integration";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
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

  // Global error handler - ensure all errors return JSON for API routes
  app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    let message = err.message || "Internal Server Error";
    
    // For API routes, ensure we always return JSON
    if (req.path.startsWith('/api')) {
      res.set('Content-Type', 'application/json');
      
      // Enhanced error information for development
      const errorResponse: any = { message };
      if (app.get("env") === "development") {
        errorResponse.error = err.name;
        errorResponse.details = err.code || err.errno;
      }
      
      res.status(status).json(errorResponse);
    } else {
      // For non-API routes, fall back to default error handling
      res.status(status).send(message);
    }
    
    // Log error for debugging (don't throw as it breaks the response)
    console.error(`Error ${status} on ${req.method} ${req.path}:`, err.message);
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
