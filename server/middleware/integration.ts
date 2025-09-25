import { Express, Router } from 'express';
import { 
  validateInput, 
  requireAuth, 
  requireRole,
  validateStoreAccess,
  createDatabaseRoute,
  logDatabaseOperation,
  sendResponse
} from './database';
import { 
  insertStoreSchema,
  insertUserSchema,
  insertSalesSchema,
  insertAttendanceSchema,
  insertCashflowSchema,
  insertCustomerSchema,
  insertPiutangSchema,
  insertProductSchema
} from '@shared/schema';
import { storage } from '../storage';

/**
 * Middleware yang diintegrasikan dengan routes utama
 * Ini akan menggantikan beberapa routes yang ada dengan implementasi middleware
 */

export function setupDatabaseMiddleware(app: Express) {
  console.log('🔧 Setting up database middleware integration...');
  
  /**
   * STORES MANAGEMENT dengan middleware
   */
  
  // CREATE Store
  app.post('/api/stores/new', 
    logDatabaseOperation,
    requireAuth,
    requireRole(['manager', 'administrasi']),
    validateInput(insertStoreSchema),
    async (req, res, next) => {
      try {
        const store = await storage.createStore(req.validatedData);
        req.dbResult = {
          ...store,
          message: `Store ${store.name} berhasil dibuat`,
          timestamp: new Date().toISOString()
        };
        next();
      } catch (error) {
        req.dbError = error instanceof Error ? error : new Error('Failed to create store');
        next();
      }
    },
    sendResponse
  );
  
  /**
   * SALES MANAGEMENT dengan middleware 
   */
  
  // CREATE Sales dengan validasi lengkap
  app.post('/api/sales/new',
    logDatabaseOperation,
    requireAuth,
    requireRole(['staff', 'manager', 'administrasi']),
    validateStoreAccess(),
    validateInput(insertSalesSchema),
    async (req, res, next) => {
      try {
        // Validasi store access
        const storeId = req.validatedData.storeId;
        if (!req.storeAccess?.hasAccess(storeId)) {
          return res.status(403).json({ 
            message: `You don't have access to store ${storeId}` 
          });
        }
        
        // Validasi business logic
        if (req.validatedData.totalSales < 0) {
          return res.status(400).json({ 
            message: "Total sales tidak boleh negatif" 
          });
        }
        
        if (req.validatedData.transactions < 0) {
          return res.status(400).json({ 
            message: "Jumlah transaksi tidak boleh negatif" 
          });
        }
        
        // Tambahkan user ID
        req.validatedData.userId = req.user.id;
        
        // Hitung average ticket
        if (req.validatedData.totalSales && req.validatedData.transactions > 0) {
          req.validatedData.averageTicket = req.validatedData.totalSales / req.validatedData.transactions;
        }
        
        const sales = await storage.createSales(req.validatedData);
        
        req.dbResult = {
          ...sales,
          message: `Sales record berhasil dibuat untuk store ${sales.storeId}`,
          calculatedMetrics: {
            averageTicket: sales.averageTicket || 0,
            cashRatio: sales.totalCash / sales.totalSales,
            qrisRatio: sales.totalQris / sales.totalSales
          },
          formatted: {
            totalSales: new Intl.NumberFormat('id-ID', {
              style: 'currency',
              currency: 'IDR'
            }).format(sales.totalSales)
          }
        };
        
        next();
      } catch (error) {
        req.dbError = error instanceof Error ? error : new Error('Failed to create sales record');
        next();
      }
    },
    sendResponse
  );
  
  /**
   * ATTENDANCE MANAGEMENT dengan middleware
   */
  
  // CREATE Attendance dengan validasi waktu
  app.post('/api/attendance/new',
    logDatabaseOperation,
    requireAuth,
    validateStoreAccess(),
    validateInput(insertAttendanceSchema),
    async (req, res, next) => {
      try {
        // Validasi store access
        const storeId = req.validatedData.storeId;
        if (!req.storeAccess?.hasAccess(storeId)) {
          return res.status(403).json({ 
            message: `You don't have access to store ${storeId}` 
          });
        }
        
        // Tambahkan user ID jika tidak ada
        if (!req.validatedData.userId) {
          req.validatedData.userId = req.user.id;
        }
        
        // Validasi untuk staff hanya bisa create attendance untuk diri sendiri
        if (req.user.role === 'staff' && req.validatedData.userId !== req.user.id) {
          return res.status(403).json({ 
            message: "Staff can only create attendance for themselves" 
          });
        }
        
        const attendance = await storage.createAttendance(req.validatedData);
        
        req.dbResult = {
          ...attendance,
          message: `Attendance record berhasil dibuat`,
          attendanceDate: new Date(attendance.date).toLocaleDateString('id-ID'),
          shift: attendance.shift || 'Not specified'
        };
        
        next();
      } catch (error) {
        req.dbError = error instanceof Error ? error : new Error('Failed to create attendance record');
        next();
      }
    },
    sendResponse
  );
  
  /**
   * CASHFLOW MANAGEMENT dengan middleware
   */
  
  // CREATE Cashflow dengan validasi tipe transaksi
  app.post('/api/cashflow/new',
    logDatabaseOperation,
    requireAuth,
    requireRole(['staff', 'manager', 'administrasi']),
    validateStoreAccess(),
    validateInput(insertCashflowSchema),
    async (req, res, next) => {
      try {
        // Validasi store access
        const storeId = req.validatedData.storeId;
        if (!req.storeAccess?.hasAccess(storeId)) {
          return res.status(403).json({ 
            message: `You don't have access to store ${storeId}` 
          });
        }
        
        // Validasi amount tidak boleh 0
        if (req.validatedData.amount === 0) {
          return res.status(400).json({ 
            message: "Amount tidak boleh 0" 
          });
        }
        
        const cashflow = await storage.createCashflow(req.validatedData);
        
        req.dbResult = {
          ...cashflow,
          message: `Cashflow ${cashflow.type} berhasil dicatat`,
          formattedAmount: new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR'
          }).format(cashflow.amount),
          transactionDate: new Date(cashflow.date).toLocaleDateString('id-ID'),
          isIncome: cashflow.amount > 0,
          isExpense: cashflow.amount < 0
        };
        
        next();
      } catch (error) {
        req.dbError = error instanceof Error ? error : new Error('Failed to create cashflow record');
        next();
      }
    },
    sendResponse
  );
  
  /**
   * CUSTOMERS MANAGEMENT dengan middleware
   */
  
  // CREATE Customer dengan validasi
  app.post('/api/customers/new',
    logDatabaseOperation,
    requireAuth,
    validateStoreAccess(),
    validateInput(insertCustomerSchema),
    async (req, res, next) => {
      try {
        // Validasi store access
        const storeId = req.validatedData.storeId;
        if (!req.storeAccess?.hasAccess(storeId)) {
          return res.status(403).json({ 
            message: `You don't have access to store ${storeId}` 
          });
        }
        
        // Validasi phone format jika ada
        if (req.validatedData.phone) {
          const phoneRegex = /^(\+62|62|0)[0-9]{9,13}$/;
          if (!phoneRegex.test(req.validatedData.phone.replace(/[\s-]/g, ''))) {
            return res.status(400).json({ 
              message: "Format nomor telepon tidak valid" 
            });
          }
        }
        
        const customer = await storage.createCustomer(req.validatedData);
        
        req.dbResult = {
          ...customer,
          message: `Customer ${customer.name} berhasil ditambahkan`,
          customerCode: `CUST-${customer.id.slice(-8).toUpperCase()}`,
          registrationDate: new Date().toLocaleDateString('id-ID')
        };
        
        next();
      } catch (error) {
        req.dbError = error instanceof Error ? error : new Error('Failed to create customer');
        next();
      }
    },
    sendResponse
  );
  
  /**
   * PRODUCTS MANAGEMENT dengan middleware
   */
  
  // CREATE Product
  app.post('/api/products/new',
    logDatabaseOperation,
    requireAuth,
    requireRole(['manager', 'administrasi']),
    validateStoreAccess(),
    validateInput(insertProductSchema),
    async (req, res, next) => {
      try {
        // Validasi harga produk
        if (req.validatedData.price <= 0) {
          return res.status(400).json({ 
            message: "Harga produk harus lebih besar dari 0" 
          });
        }
        
        const product = await storage.createProduct(req.validatedData);
        
        req.dbResult = {
          ...product,
          message: `Product ${product.name} berhasil ditambahkan`,
          formattedPrice: new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR'
          }).format(product.price),
          productCode: `PROD-${product.id.slice(-8).toUpperCase()}`
        };
        
        next();
      } catch (error) {
        req.dbError = error instanceof Error ? error : new Error('Failed to create product');
        next();
      }
    },
    sendResponse
  );
  
  /**
   * ANALYTICS dan DASHBOARD dengan middleware
   */
  
  // GET Dashboard stats dengan middleware
  app.get('/api/dashboard/stats/enhanced',
    logDatabaseOperation,
    requireAuth,
    validateStoreAccess(),
    async (req, res, next) => {
      try {
        const { storeId } = req.query;
        const targetStoreId = storeId ? parseInt(storeId as string) : req.storeAccess?.userStores[0];
        
        if (!targetStoreId || !req.storeAccess?.hasAccess(targetStoreId)) {
          return res.status(403).json({ message: "You don't have access to this store" });
        }
        
        // Get comprehensive stats
        const [sales, cashflow, customers, attendance] = await Promise.all([
          storage.getSalesByStore(targetStoreId),
          storage.getCashflowByStore(targetStoreId),
          storage.getCustomersByStore(targetStoreId),
          storage.getAttendanceByStore(targetStoreId)
        ]);
        
        // Calculate metrics
        const totalSales = sales.reduce((sum, sale) => sum + sale.totalSales, 0);
        const totalCashflow = cashflow.reduce((sum, cf) => sum + cf.amount, 0);
        const totalIncome = cashflow.filter(cf => cf.amount > 0).reduce((sum, cf) => sum + cf.amount, 0);
        const totalExpenses = Math.abs(cashflow.filter(cf => cf.amount < 0).reduce((sum, cf) => sum + cf.amount, 0));
        
        req.dbResult = {
          storeId: targetStoreId,
          period: {
            from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toLocaleDateString('id-ID'),
            to: new Date().toLocaleDateString('id-ID')
          },
          metrics: {
            totalSales: {
              value: totalSales,
              formatted: new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(totalSales),
              count: sales.length
            },
            netCashflow: {
              value: totalCashflow,
              formatted: new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(totalCashflow)
            },
            totalIncome: {
              value: totalIncome,
              formatted: new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(totalIncome)
            },
            totalExpenses: {
              value: totalExpenses,
              formatted: new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(totalExpenses)
            },
            customers: {
              total: customers.length,
              new: customers.filter(c => new Date(c.createdAt || 0) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length
            },
            attendance: {
              records: attendance.length,
              uniqueUsers: new Set(attendance.map(a => a.userId)).size
            }
          },
          message: "Enhanced dashboard stats retrieved successfully"
        };
        
        next();
      } catch (error) {
        req.dbError = error instanceof Error ? error : new Error('Failed to fetch dashboard stats');
        next();
      }
    },
    sendResponse
  );
  
  console.log('✅ Database middleware integration completed');
}