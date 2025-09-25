import { Router } from 'express';
import { 
  validateInput, 
  requireAuth, 
  requireRole,
  validateStoreAccess,
  createDatabaseRoute,
  logDatabaseOperation
} from './database';
import { 
  insertStoreSchema,
  insertUserSchema,
  insertSalesSchema,
  insertAttendanceSchema,
  insertCashflowSchema,
  insertCustomerSchema
} from '@shared/schema';

const router = Router();

/**
 * CONTOH 1: Route dengan middleware lengkap untuk STORES
 */

// CREATE Store dengan middleware validation
router.post('/api/stores', 
  ...createDatabaseRoute({
    operation: 'create',
    tableName: 'stores',
    storageFunction: 'createStore',
    schema: insertStoreSchema,
    requireAuth: true,
    requireRole: ['manager', 'administrasi'],
    storeAccessRequired: false, // Tidak perlu cek store access untuk create store baru
    transformOutput: (data) => ({
      ...data,
      message: `Store ${data.name} berhasil dibuat`,
      timestamp: new Date().toISOString()
    })
  })
);

// READ Stores dengan middleware
router.get('/api/stores',
  ...createDatabaseRoute({
    operation: 'read',
    tableName: 'stores',
    storageFunction: 'getAllStores',
    requireAuth: true,
    storeAccessRequired: true,
    transformOutput: (stores) => ({
      stores,
      count: stores.length,
      message: `Retrieved ${stores.length} stores`
    })
  })
);

/**
 * CONTOH 2: Route dengan middleware lengkap untuk SALES
 */

// CREATE Sales dengan validasi komprehensif
router.post('/api/sales',
  ...createDatabaseRoute({
    operation: 'create',
    tableName: 'sales',
    storageFunction: 'createSales',
    schema: insertSalesSchema.extend({
      storeId: insertSalesSchema.shape.storeId.refine(
        (val) => val > 0,
        { message: "Store ID harus lebih besar dari 0" }
      ),
      totalSales: insertSalesSchema.shape.totalSales.refine(
        (val) => val > 0,
        { message: "Total sales harus lebih besar dari 0" }
      )
    }),
    requireAuth: true,
    requireRole: ['staff', 'manager', 'administrasi'],
    storeAccessRequired: true,
    transformOutput: (sales) => ({
      ...sales,
      message: `Sales record created successfully for store ${sales.storeId}`,
      calculatedMetrics: {
        averageTicket: sales.totalSales / sales.transactions,
        cashRatio: sales.totalCash / sales.totalSales,
        qrisRatio: sales.totalQris / sales.totalSales
      }
    })
  })
);

/**
 * CONTOH 3: Route dengan middleware untuk ATTENDANCE
 */

// CREATE Attendance dengan validasi shift dan waktu
router.post('/api/attendance',
  ...createDatabaseRoute({
    operation: 'create',
    tableName: 'attendance',
    storageFunction: 'createAttendance',
    schema: insertAttendanceSchema.extend({
      checkIn: insertAttendanceSchema.shape.checkIn.optional().refine(
        (val) => !val || /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(val),
        { message: "Format check-in harus HH:MM" }
      ),
      checkOut: insertAttendanceSchema.shape.checkOut.optional().refine(
        (val) => !val || /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(val),
        { message: "Format check-out harus HH:MM" }
      )
    }),
    requireAuth: true,
    storeAccessRequired: true,
    transformOutput: (attendance) => {
      // Hitung overtime jika ada check-in dan check-out
      let overtimeCalculation = null;
      if (attendance.checkIn && attendance.checkOut) {
        const checkInTime = new Date(`2000-01-01T${attendance.checkIn}`);
        const checkOutTime = new Date(`2000-01-01T${attendance.checkOut}`);
        const workedMinutes = (checkOutTime.getTime() - checkInTime.getTime()) / (1000 * 60);
        const standardWorkMinutes = 8 * 60; // 8 jam kerja standard
        
        if (workedMinutes > standardWorkMinutes) {
          overtimeCalculation = {
            totalWorkedMinutes: workedMinutes,
            standardMinutes: standardWorkMinutes,
            overtimeMinutes: workedMinutes - standardWorkMinutes,
            overtimeHours: Math.round((workedMinutes - standardWorkMinutes) / 60 * 100) / 100
          };
        }
      }
      
      return {
        ...attendance,
        message: `Attendance record created for ${new Date(attendance.date).toLocaleDateString('id-ID')}`,
        overtimeCalculation
      };
    }
  })
);

/**
 * CONTOH 4: Route dengan middleware untuk CASHFLOW
 */

// CREATE Cashflow dengan validasi tipe transaksi
router.post('/api/cashflow',
  ...createDatabaseRoute({
    operation: 'create',
    tableName: 'cashflow',
    storageFunction: 'createCashflow',
    schema: insertCashflowSchema.extend({
      amount: insertCashflowSchema.shape.amount.refine(
        (val) => val !== 0,
        { message: "Amount tidak boleh 0" }
      ),
      type: insertCashflowSchema.shape.type.refine(
        (val) => [
          'Pemberian Utang',
          'Pembayaran Piutang',
          'Pembelian stok (Pembelian Minyak)',
          'Pembelian Minyak',
          'Transfer Rekening',
          'Penjualan (Transfer rekening)'
        ].includes(val),
        { message: "Tipe transaksi tidak valid" }
      )
    }),
    requireAuth: true,
    requireRole: ['staff', 'manager', 'administrasi'],
    storeAccessRequired: true,
    transformOutput: (cashflow) => ({
      ...cashflow,
      message: `Cashflow ${cashflow.type} berhasil dicatat`,
      formattedAmount: new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR'
      }).format(cashflow.amount),
      transactionDate: new Date(cashflow.date).toLocaleDateString('id-ID')
    })
  })
);

/**
 * CONTOH 5: Route dengan middleware untuk CUSTOMERS
 */

// CREATE Customer dengan validasi unik
router.post('/api/customers',
  ...createDatabaseRoute({
    operation: 'create',
    tableName: 'customers',
    storageFunction: 'createCustomer',
    schema: insertCustomerSchema.extend({
      phone: insertCustomerSchema.shape.phone.optional().refine(
        (val) => !val || /^(\+62|62|0)[0-9]{9,13}$/.test(val.replace(/[\s-]/g, '')),
        { message: "Format nomor telepon tidak valid (gunakan format Indonesia)" }
      ),
      email: insertCustomerSchema.shape.email.optional().refine(
        (val) => !val || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val),
        { message: "Format email tidak valid" }
      )
    }),
    requireAuth: true,
    storeAccessRequired: true,
    transformOutput: (customer) => ({
      ...customer,
      message: `Customer ${customer.name} berhasil ditambahkan`,
      customerCode: `CUST-${customer.id.slice(-8).toUpperCase()}`,
      registrationDate: new Date().toLocaleDateString('id-ID')
    })
  })
);

// READ Customers dengan filter dan pagination
router.get('/api/customers',
  logDatabaseOperation,
  requireAuth,
  validateStoreAccess(),
  async (req, res) => {
    try {
      const { storeId, search, page = 1, limit = 20 } = req.query;
      
      // Validasi store access
      const targetStoreId = storeId ? parseInt(storeId as string) : req.storeAccess?.userStores[0];
      if (!targetStoreId || !req.storeAccess?.hasAccess(targetStoreId)) {
        return res.status(403).json({ message: "You don't have access to this store" });
      }
      
      // Get customers dengan filter
      let customers = await storage.getCustomersByStore(targetStoreId);
      
      // Filter berdasarkan search
      if (search) {
        const searchTerm = (search as string).toLowerCase();
        customers = customers.filter(customer => 
          customer.name.toLowerCase().includes(searchTerm) ||
          customer.phone?.toLowerCase().includes(searchTerm) ||
          customer.email?.toLowerCase().includes(searchTerm)
        );
      }
      
      // Pagination
      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const startIndex = (pageNum - 1) * limitNum;
      const endIndex = startIndex + limitNum;
      
      const paginatedCustomers = customers.slice(startIndex, endIndex);
      
      res.json({
        customers: paginatedCustomers.map(customer => ({
          ...customer,
          customerCode: `CUST-${customer.id.slice(-8).toUpperCase()}`
        })),
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: customers.length,
          totalPages: Math.ceil(customers.length / limitNum),
          hasNext: endIndex < customers.length,
          hasPrev: pageNum > 1
        },
        filters: {
          storeId: targetStoreId,
          search: search || null
        }
      });
    } catch (error) {
      console.error('Error fetching customers:', error);
      res.status(500).json({ 
        message: "Failed to fetch customers",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

export { router as exampleRoutes };