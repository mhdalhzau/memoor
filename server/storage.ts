import { 
  type User, 
  type InsertUser, 
  type Store, 
  type InsertStore,
  type UserStore,
  type InsertUserStore,
  type Attendance,
  type InsertAttendance,
  type AttendanceWithEmployee,
  type Sales,
  type InsertSales,
  type Cashflow,
  type InsertCashflow,
  type Payroll,
  type InsertPayroll,
  type Proposal,
  type InsertProposal,
  type Overtime,
  type InsertOvertime,
  type Setoran,
  type InsertSetoran,
  type Customer,
  type InsertCustomer,
  type Piutang,
  type InsertPiutang,
  type Wallet,
  type InsertWallet,
  type PayrollConfig,
  type InsertPayrollConfig,
  type Supplier,
  type InsertSupplier,
  type Product,
  type InsertProduct,
  type ProductWithSupplier,
  type Inventory,
  type InsertInventory,
  type InventoryWithProduct,
  type InventoryTransaction,
  type InsertInventoryTransaction,
  type InventoryTransactionWithProduct,
  TRANSACTION_TYPES
} from "@shared/schema";
import { randomUUID } from "crypto";
import session from "express-session";
import { Store as SessionStore } from "express-session";
import { hashPassword } from "./auth";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  updateUser(id: string, data: Partial<Omit<InsertUser, 'storeIds'>>): Promise<User | undefined>;
  deleteUser(id: string): Promise<void>;
  getUsersByStore(storeId: number): Promise<User[]>;
  
  // User-Store assignment methods
  assignUserToStores(userId: string, storeIds: number[]): Promise<void>;
  getUserStores(userId: string): Promise<Store[]>;
  removeUserFromStores(userId: string): Promise<void>;
  
  // Store methods
  getStore(id: number): Promise<Store | undefined>;
  getStores(): Promise<Store[]>;
  createStore(store: InsertStore): Promise<Store>;
  getAllStores(): Promise<Store[]>;
  updateStore(id: number, data: Partial<InsertStore>): Promise<Store | undefined>;
  
  // Attendance methods
  getAttendance(id: string): Promise<Attendance | undefined>;
  getAttendanceByStore(storeId: number, date?: string): Promise<Attendance[]>;
  getAttendanceByStoreWithEmployees(storeId: number, date?: string): Promise<AttendanceWithEmployee[]>;
  getAttendanceByUser(userId: string): Promise<Attendance[]>;
  getAttendanceByUserAndDateRange(userId: string, startDate: string, endDate: string): Promise<Attendance[]>;
  createAttendance(attendance: InsertAttendance): Promise<Attendance>;
  updateAttendance(id: string, data: Partial<InsertAttendance>): Promise<Attendance | undefined>;
  updateAttendanceStatus(id: string, status: string): Promise<Attendance | undefined>;
  
  // Sales methods
  getSales(id: string): Promise<Sales | undefined>;
  getSalesByStore(storeId: number, startDate?: string, endDate?: string): Promise<Sales[]>;
  createSales(sales: InsertSales): Promise<Sales>;
  deleteSales(id: string): Promise<void>;
  checkDailySubmission(userId: string, storeId: number, date: string): Promise<boolean>;
  
  // Cashflow methods
  getCashflow(id: string): Promise<Cashflow | undefined>;
  getCashflowByStore(storeId: number): Promise<Cashflow[]>;
  createCashflow(cashflow: InsertCashflow): Promise<Cashflow>;
  deleteCashflowBySalesId(salesId: string): Promise<void>;
  
  // Payroll methods
  getPayroll(id: string): Promise<Payroll | undefined>;
  getPayrollByUser(userId: string): Promise<Payroll[]>;
  getPayrollByUserStoreMonth(userId: string, storeId: number, month: string): Promise<Payroll | undefined>;
  getPayrollByStoresAndMonth(storeIds: number[], month: string): Promise<Payroll[]>;
  getAllPayroll(): Promise<Payroll[]>;
  createPayroll(payroll: InsertPayroll): Promise<Payroll>;
  updatePayrollStatus(id: string, status: string): Promise<Payroll | undefined>;
  updatePayrollCalculation(id: string, data: { baseSalary?: string, overtimePay?: string, totalAmount?: string }): Promise<Payroll | undefined>;
  updatePayrollBonusDeduction(id: string, data: { bonuses?: string, deductions?: string }): Promise<Payroll | undefined>;
  
  // Proposal methods
  getProposal(id: string): Promise<Proposal | undefined>;
  getProposalsByStore(storeId: number): Promise<Proposal[]>;
  getAllProposals(): Promise<Proposal[]>;
  createProposal(proposal: InsertProposal): Promise<Proposal>;
  updateProposalStatus(id: string, status: string, reviewedBy: string): Promise<Proposal | undefined>;
  
  // Overtime methods
  getOvertime(id: string): Promise<Overtime | undefined>;
  getOvertimeByStore(storeId: number): Promise<Overtime[]>;
  getOvertimeByStoresAndMonth(storeIds: number[], month: string): Promise<Overtime[]>;
  getAllOvertime(): Promise<Overtime[]>;
  createOvertime(overtime: InsertOvertime): Promise<Overtime>;
  updateOvertimeStatus(id: string, status: string, approvedBy: string): Promise<Overtime | undefined>;
  updateOvertimeHours(id: string, hours: string, reason: string): Promise<Overtime | undefined>;
  
  // Setoran methods
  getSetoran(id: string): Promise<Setoran | undefined>;
  getAllSetoran(): Promise<Setoran[]>;
  createSetoran(setoran: InsertSetoran): Promise<Setoran>;
  
  // Customer methods
  getCustomer(id: string): Promise<Customer | undefined>;
  getCustomersByStore(storeId: number): Promise<Customer[]>;
  getAllCustomers(): Promise<Customer[]>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomer(id: string, data: Partial<InsertCustomer>): Promise<Customer | undefined>;
  deleteCustomer(id: string): Promise<void>;
  searchCustomers(storeId: number, query: string): Promise<Customer[]>;
  
  // Helper methods for QRIS management
  findOrCreateCustomerForManagerUser(storeId: number): Promise<Customer | undefined>;
  createQrisPiutangForManager(salesRecord: Sales): Promise<void>;
  createQrisPiutangForImport(storeId: number, qrisAmount: number, description: string, userId?: string, date?: Date): Promise<void>;
  
  // Comprehensive user-as-customer methods
  createCustomerRecordForUser(userId: string, storeId: number): Promise<Customer | undefined>;
  findOrCreateCustomerForUser(userId: string, storeId: number): Promise<Customer | undefined>;
  createCustomerRecordsForAllUsers(): Promise<void>;
  syncUserToCustomerRecords(): Promise<void>;
  getCustomersIncludingUsers(storeId?: number): Promise<Customer[]>;
  findCustomerByUserId(userId: string, storeId: number): Promise<Customer | undefined>;
  
  // Piutang methods
  getPiutang(id: string): Promise<Piutang | undefined>;
  getPiutangByStore(storeId: number, page?: number, limit?: number): Promise<{ data: Piutang[], total: number, hasMore: boolean }>;
  getPiutangByCustomer(customerId: string): Promise<Piutang[]>;
  getAllPiutang(): Promise<Piutang[]>;
  createPiutang(piutang: InsertPiutang): Promise<Piutang>;
  updatePiutangStatus(id: string, status: string, paidAmount?: string): Promise<Piutang | undefined>;
  deletePiutang(id: string): Promise<void>;
  addPiutangPayment(piutangId: string, amount: string, description: string, userId: string): Promise<{piutang: Piutang, cashflow: Cashflow}>;
  
  // Wallet methods
  getWallet(id: string): Promise<Wallet | undefined>;
  getWalletsByStore(storeId: number): Promise<Wallet[]>;
  getAllWallets(): Promise<Wallet[]>;
  createWallet(wallet: InsertWallet): Promise<Wallet>;
  updateWallet(id: string, data: Partial<InsertWallet>): Promise<Wallet | undefined>;
  updateWalletBalance(id: string, balance: string): Promise<Wallet | undefined>;
  deleteWallet(id: string): Promise<void>;
  
  // Payroll Configuration methods
  getPayrollConfig(): Promise<PayrollConfig | undefined>;
  createOrUpdatePayrollConfig(config: InsertPayrollConfig): Promise<PayrollConfig>;
  
  // Supplier methods
  getSupplier(id: string): Promise<Supplier | undefined>;
  getSuppliersByStore(storeId: number): Promise<Supplier[]>;
  getAllSuppliers(): Promise<Supplier[]>;
  createSupplier(supplier: InsertSupplier): Promise<Supplier>;
  updateSupplier(id: string, data: Partial<InsertSupplier>): Promise<Supplier | undefined>;
  deleteSupplier(id: string): Promise<void>;
  searchSuppliers(storeId: number, query: string): Promise<Supplier[]>;
  
  // Product methods
  getProduct(id: string): Promise<Product | undefined>;
  getProductsByStore(storeId: number): Promise<ProductWithSupplier[]>;
  getProductsBySupplier(supplierId: string): Promise<Product[]>;
  getAllProducts(): Promise<ProductWithSupplier[]>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: string, data: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: string): Promise<void>;
  searchProducts(storeId: number, query: string): Promise<ProductWithSupplier[]>;
  
  // Inventory methods
  getInventory(id: string): Promise<Inventory | undefined>;
  getInventoryByStore(storeId: number): Promise<InventoryWithProduct[]>;
  getInventoryByProduct(productId: string): Promise<Inventory | undefined>;
  createInventory(inventory: InsertInventory): Promise<Inventory>;
  updateInventory(id: string, data: Partial<InsertInventory>): Promise<Inventory | undefined>;
  updateInventoryStock(productId: string, newStock: string): Promise<Inventory | undefined>;
  
  // Inventory Transaction methods
  getInventoryTransaction(id: string): Promise<InventoryTransaction | undefined>;
  getInventoryTransactionsByStore(storeId: number): Promise<InventoryTransactionWithProduct[]>;
  getInventoryTransactionsByProduct(productId: string): Promise<InventoryTransactionWithProduct[]>;
  createInventoryTransaction(transaction: InsertInventoryTransaction): Promise<InventoryTransaction>;
  
  // Migration methods
  migrateSalesData(storeId: number): Promise<{
    salesProcessed: number;
    cashflowRecordsCreated: number;
    piutangRecordsCreated: number;
    errors: string[];
  }>;
  
  sessionStore: SessionStore;
}

// Database Storage Implementation using Drizzle ORM
import { db } from "./db";
import { 
  users, 
  stores, 
  userStores, 
  attendance, 
  sales, 
  cashflow, 
  payroll, 
  proposals, 
  overtime, 
  setoran, 
  customers, 
  piutang, 
  wallets, 
  payrollConfig,
  suppliers,
  products,
  inventory,
  inventoryTransactions
} from "@shared/schema";
import { eq, and, gte, lte, like, or, desc, asc, inArray } from "drizzle-orm";
import { sql } from "drizzle-orm";
// import pgSession from "connect-pg-simple"; // PostgreSQL-specific, not compatible with MySQL
import MemoryStore from "memorystore";
import { pool } from "./db";

const MemSession = MemoryStore(session);

export class DatabaseStorage implements IStorage {
  public sessionStore: SessionStore;

  constructor() {
    // Use memory-based session storage (compatible with any database)
    this.sessionStore = new MemSession({
      checkPeriod: 86400000 // prune expired entries every 24h
    });
    
    // Initialize sample data if database is empty
    this.initializeIfEmpty();
  }

  private async initializeIfEmpty() {
    try {
      const userCount = await db.select().from(users).limit(1);
      if (userCount.length === 0) {
        await this.initializeSampleData();
      }
    } catch (error) {
      console.error('Error checking database initialization:', error);
    }
  }

  private async initializeSampleData() {
    try {
      // Create sample stores
      await db.insert(stores).values([
        {
          id: 1,
          name: "Main Store",
          address: "123 Main Street",
          phone: "021-1234567",
          manager: "SPBU Manager",
          description: "Main store location with full services",
          status: "active",
        },
        {
          id: 2,
          name: "Branch Store",
          address: "456 Branch Avenue",
          phone: "021-2345678",
          manager: null,
          description: "Branch store location",
          status: "active",
        }
      ]);

      // Create default accounts
      const managerId = randomUUID();
      const adminId = randomUUID();
      const putriId = randomUUID();
      const hafizId = randomUUID();
      const endangId = randomUUID();

      await db.insert(users).values([
        {
          id: managerId,
          email: "manager@spbu.com",
          password: await hashPassword("manager123"),
          name: "SPBU Manager",
          role: "manager",
          salary: "15000000",
        },
        {
          id: adminId,
          email: "admin@spbu.com",
          password: await hashPassword("admin123"),
          name: "SPBU Administrator",
          role: "administrasi",
          salary: "12000000",
        },
        {
          id: putriId,
          email: "putri@spbu.com",
          password: await hashPassword("putri123"),
          name: "Putri",
          role: "staff",
          salary: "8000000",
        },
        {
          id: hafizId,
          email: "hafiz@spbu.com",
          password: await hashPassword("hafiz123"),
          name: "Hafiz",
          role: "staff",
          salary: "8000000",
        },
        {
          id: endangId,
          email: "endang@spbu.com",
          password: await hashPassword("endang123"),
          name: "Endang",
          role: "staff",
          salary: "8000000",
        }
      ]);

      // Assign users to stores
      await db.insert(userStores).values([
        // Manager has access to all stores
        { id: randomUUID(), userId: managerId, storeId: 1 },
        { id: randomUUID(), userId: managerId, storeId: 2 },
        // Admin has access to all stores
        { id: randomUUID(), userId: adminId, storeId: 1 },
        { id: randomUUID(), userId: adminId, storeId: 2 },
        // Staff assigned to Main Store
        { id: randomUUID(), userId: putriId, storeId: 1 },
        { id: randomUUID(), userId: hafizId, storeId: 1 },
        { id: randomUUID(), userId: endangId, storeId: 1 },
      ]);

      console.log('Sample data initialized in database');
    } catch (error) {
      console.error('Error initializing sample data:', error);
    }
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    try {
      const result = await db.select().from(users).where(eq(users.id, id));
      return result[0];
    } catch (error) {
      console.error('Error getting user:', error);
      return undefined;
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      const result = await db.select().from(users).where(eq(users.email, email));
      return result[0];
    } catch (error) {
      console.error('Error getting user by email:', error);
      return undefined;
    }
  }

  async createUser(user: InsertUser): Promise<User> {
    try {
      const userId = randomUUID();
      await db.insert(users).values({
        id: userId,
        ...user
      });
      
      // Assign user to stores if provided
      if (user.storeIds && user.storeIds.length > 0) {
        await this.assignUserToStores(userId, user.storeIds);
      }
      
      // MySQL doesn't support .returning(), so fetch the created user
      const result = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      return result[0];
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  async getAllUsers(): Promise<User[]> {
    try {
      const result = await db.select().from(users).orderBy(desc(users.createdAt));
      
      // Populate stores for each user
      const usersWithStores = await Promise.all(
        result.map(async (user) => {
          const stores = await this.getUserStores(user.id);
          return { ...user, stores };
        })
      );
      
      return usersWithStores;
    } catch (error) {
      console.error('Error getting all users:', error);
      return [];
    }
  }

  async updateUser(id: string, data: Partial<Omit<InsertUser, 'storeIds'>>): Promise<User | undefined> {
    try {
      await db.update(users).set(data).where(eq(users.id, id));
      // MySQL doesn't support .returning(), so fetch the updated user
      const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
      return result[0];
    } catch (error) {
      console.error('Error updating user:', error);
      return undefined;
    }
  }

  async deleteUser(id: string): Promise<void> {
    try {
      // Remove user store assignments first
      await this.removeUserFromStores(id);
      // Delete user
      await db.delete(users).where(eq(users.id, id));
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  async getUsersByStore(storeId: number): Promise<User[]> {
    try {
      const result = await db
        .select({
          id: users.id,
          email: users.email,
          name: users.name,
          role: users.role,
          phone: users.phone,
          salary: users.salary,
          joinDate: users.createdAt, // Map createdAt to joinDate for frontend compatibility
          createdAt: users.createdAt,
        })
        .from(users)
        .innerJoin(userStores, eq(users.id, userStores.userId))
        .where(eq(userStores.storeId, storeId));
      return result as User[];
    } catch (error) {
      console.error('Error getting users by store:', error);
      return [];
    }
  }

  // User-Store assignment methods
  async assignUserToStores(userId: string, storeIds: number[]): Promise<void> {
    try {
      // Remove existing assignments
      await db.delete(userStores).where(eq(userStores.userId, userId));
      
      // Add new assignments
      if (storeIds.length > 0) {
        const assignments = storeIds.map(storeId => ({
          id: randomUUID(),
          userId,
          storeId
        }));
        await db.insert(userStores).values(assignments);
      }
    } catch (error) {
      console.error('Error assigning user to stores:', error);
      throw error;
    }
  }

  async getUserStores(userId: string): Promise<Store[]> {
    try {
      const result = await db
        .select({
          id: stores.id,
          name: stores.name,
          address: stores.address,
          phone: stores.phone,
          manager: stores.manager,
          description: stores.description,
          status: stores.status,
          entryTimeStart: stores.entryTimeStart,
          entryTimeEnd: stores.entryTimeEnd,
          exitTimeStart: stores.exitTimeStart,
          exitTimeEnd: stores.exitTimeEnd,
          timezone: stores.timezone,
          createdAt: stores.createdAt,
        })
        .from(stores)
        .innerJoin(userStores, eq(stores.id, userStores.storeId))
        .where(eq(userStores.userId, userId));
      return result;
    } catch (error) {
      console.error('Error getting user stores:', error);
      return [];
    }
  }

  async removeUserFromStores(userId: string): Promise<void> {
    try {
      await db.delete(userStores).where(eq(userStores.userId, userId));
    } catch (error) {
      console.error('Error removing user from stores:', error);
      throw error;
    }
  }

  // Store methods
  async getStore(id: number): Promise<Store | undefined> {
    try {
      const result = await db.select().from(stores).where(eq(stores.id, id));
      return result[0];
    } catch (error) {
      console.error('Error getting store:', error);
      return undefined;
    }
  }

  async getStores(): Promise<Store[]> {
    return this.getAllStores();
  }

  async createStore(store: InsertStore): Promise<Store> {
    try {
      await db.insert(stores).values(store);
      // MySQL doesn't support .returning(), so fetch the created store
      const result = await db.select().from(stores).where(eq(stores.id, store.id)).limit(1);
      return result[0];
    } catch (error) {
      console.error('Error creating store:', error);
      throw error;
    }
  }

  async getAllStores(): Promise<Store[]> {
    try {
      return await db.select().from(stores);
    } catch (error) {
      console.error('Error getting all stores:', error);
      return [];
    }
  }

  async updateStore(id: number, data: Partial<InsertStore>): Promise<Store | undefined> {
    try {
      await db.update(stores).set(data).where(eq(stores.id, id));
      // MySQL doesn't support .returning(), so fetch the updated store
      const result = await db.select().from(stores).where(eq(stores.id, id)).limit(1);
      return result[0];
    } catch (error) {
      console.error('Error updating store:', error);
      return undefined;
    }
  }

  // Attendance methods
  async getAttendance(id: string): Promise<Attendance | undefined> {
    try {
      const result = await db.select().from(attendance).where(eq(attendance.id, id));
      return result[0];
    } catch (error) {
      console.error('Error getting attendance:', error);
      return undefined;
    }
  }

  async getAttendanceByStore(storeId: number, date?: string): Promise<Attendance[]> {
    try {
      let query = db.select().from(attendance).where(eq(attendance.storeId, storeId));
      
      if (date) {
        const startOfDay = new Date(date);
        const endOfDay = new Date(date);
        endOfDay.setDate(endOfDay.getDate() + 1);
        
        query = query.where(
          and(
            eq(attendance.storeId, storeId),
            gte(attendance.date, startOfDay),
            lte(attendance.date, endOfDay)
          )
        ) as any;
      }
      
      return await query;
    } catch (error) {
      console.error('Error getting attendance by store:', error);
      return [];
    }
  }

  async getAttendanceByStoreWithEmployees(storeId: number, date?: string): Promise<AttendanceWithEmployee[]> {
    try {
      let query = db
        .select({
          id: attendance.id,
          userId: attendance.userId,
          storeId: attendance.storeId,
          date: attendance.date,
          checkIn: attendance.checkIn,
          checkOut: attendance.checkOut,
          shift: attendance.shift,
          latenessMinutes: attendance.latenessMinutes,
          overtimeMinutes: attendance.overtimeMinutes,
          breakDuration: attendance.breakDuration,
          overtime: attendance.overtime,
          notes: attendance.notes,
          attendanceStatus: attendance.attendanceStatus,
          status: attendance.status,
          createdAt: attendance.createdAt,
          employee: {
            id: users.id,
            name: users.name,
            email: users.email,
            role: users.role,
          }
        })
        .from(attendance)
        .innerJoin(users, eq(attendance.userId, users.id))
        .where(eq(attendance.storeId, storeId));

      if (date) {
        const startOfDay = new Date(date);
        const endOfDay = new Date(date);
        endOfDay.setDate(endOfDay.getDate() + 1);
        
        query = query.where(
          and(
            eq(attendance.storeId, storeId),
            gte(attendance.date, startOfDay),
            lte(attendance.date, endOfDay)
          )
        ) as any;
      }

      return await query;
    } catch (error) {
      console.error('Error getting attendance by store with employees:', error);
      return [];
    }
  }

  async getAttendanceByUser(userId: string): Promise<Attendance[]> {
    try {
      return await db.select().from(attendance).where(eq(attendance.userId, userId));
    } catch (error) {
      console.error('Error getting attendance by user:', error);
      return [];
    }
  }

  async getAttendanceByUserAndDateRange(userId: string, startDate: string, endDate: string): Promise<Attendance[]> {
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setDate(end.getDate() + 1); // Include the end date
      
      return await db.select().from(attendance).where(
        and(
          eq(attendance.userId, userId),
          gte(attendance.date, start),
          lte(attendance.date, end)
        )
      );
    } catch (error) {
      console.error('Error getting attendance by user and date range:', error);
      return [];
    }
  }

  async createAttendance(attendanceData: InsertAttendance): Promise<Attendance> {
    try {
      const attendanceId = randomUUID();
      await db.insert(attendance).values({
        id: attendanceId,
        ...attendanceData
      });
      // MySQL doesn't support .returning(), so fetch the created attendance
      const result = await db.select().from(attendance).where(eq(attendance.id, attendanceId)).limit(1);
      return result[0];
    } catch (error) {
      console.error('Error creating attendance:', error);
      throw error;
    }
  }

  async updateAttendance(id: string, data: Partial<InsertAttendance>): Promise<Attendance | undefined> {
    try {
      await db.update(attendance).set(data).where(eq(attendance.id, id));
      // MySQL doesn't support .returning(), so fetch the updated attendance
      const result = await db.select().from(attendance).where(eq(attendance.id, id)).limit(1);
      return result[0];
    } catch (error) {
      console.error('Error updating attendance:', error);
      return undefined;
    }
  }

  async updateAttendanceStatus(id: string, status: string): Promise<Attendance | undefined> {
    try {
      await db.update(attendance).set({ status }).where(eq(attendance.id, id));
      // MySQL doesn't support .returning(), so fetch the updated attendance
      const result = await db.select().from(attendance).where(eq(attendance.id, id)).limit(1);
      return result[0];
    } catch (error) {
      console.error('Error updating attendance status:', error);
      return undefined;
    }
  }

  // Sales methods
  async getSales(id: string): Promise<Sales | undefined> {
    try {
      const result = await db.select().from(sales).where(eq(sales.id, id));
      return result[0];
    } catch (error) {
      console.error('Error getting sales:', error);
      return undefined;
    }
  }

  async getSalesByStore(storeId: number, startDate?: string, endDate?: string): Promise<Sales[]> {
    try {
      let query = db.select().from(sales).where(eq(sales.storeId, storeId));

      if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        query = query.where(
          and(
            eq(sales.storeId, storeId),
            gte(sales.date, start),
            lte(sales.date, end)
          )
        ) as any;
      }

      return await query.orderBy(desc(sales.date));
    } catch (error) {
      console.error('Error getting sales by store:', error);
      return [];
    }
  }

  async createSales(salesData: InsertSales): Promise<Sales> {
    try {
      const salesId = randomUUID();
      
      // Calculate average ticket with guard against division by zero
      const transactions = salesData.transactions || 0;
      let averageTicket = null;
      if (transactions > 0 && salesData.totalSales) {
        const avgTicket = parseFloat(salesData.totalSales.toString()) / transactions;
        // Ensure the value fits in DECIMAL(12,2)
        averageTicket = Math.min(avgTicket, 9999999999.99).toFixed(2);
      }

      // Prepare sales data with calculated fields
      const salesDataWithCalc = {
        ...salesData,
        averageTicket: averageTicket
      };

      await db.insert(sales).values({
        id: salesId,
        ...salesDataWithCalc
      });
      
      // MySQL doesn't support .returning(), so fetch the created sales
      const result = await db.select().from(sales).where(eq(sales.id, salesId)).limit(1);
      const createdSales = result[0];
      
      // REMOVED: Automatic cashflow creation - will be input manually
      // Note: Sales data is now recorded without automatic cashflow integration
      // Cashflow and QRIS piutang must be managed manually through the cashflow interface

      return createdSales;
    } catch (error) {
      console.error('Error creating sales:', error);
      throw error;
    }
  }

  async deleteSales(id: string): Promise<void> {
    try {
      // Use transaction to ensure atomic cascading delete
      await db.transaction(async (tx) => {
        // First delete related cashflow entries to implement cascading delete
        await tx.delete(cashflow).where(eq(cashflow.salesId, id));
        
        // Delete related piutang entries to implement cascading delete
        await tx.delete(piutang).where(eq(piutang.salesId, id));
        
        // Then delete the sales record
        await tx.delete(sales).where(eq(sales.id, id));
      });
      
      console.log(`✅ Successfully deleted sales record ${id} with cascading deletes for related cashflow and piutang records`);
    } catch (error) {
      console.error('Error deleting sales with cascading deletes:', error);
      throw error;
    }
  }

  async checkDailySubmission(userId: string, storeId: number, date: string): Promise<boolean> {
    try {
      const startOfDay = new Date(date);
      const endOfDay = new Date(date);
      endOfDay.setDate(endOfDay.getDate() + 1);

      const result = await db.select().from(sales).where(
        and(
          eq(sales.userId, userId),
          eq(sales.storeId, storeId),
          gte(sales.date, startOfDay),
          lte(sales.date, endOfDay)
        )
      );

      return result.length > 0;
    } catch (error) {
      console.error('Error checking daily submission:', error);
      return false;
    }
  }

  // Cashflow methods
  async getCashflow(id: string): Promise<Cashflow | undefined> {
    try {
      const result = await db.select().from(cashflow).where(eq(cashflow.id, id));
      return result[0];
    } catch (error) {
      console.error('Error getting cashflow:', error);
      return undefined;
    }
  }

  async getCashflowByStore(storeId: number): Promise<Cashflow[]> {
    try {
      return await db.select().from(cashflow).where(eq(cashflow.storeId, storeId)).orderBy(desc(cashflow.date));
    } catch (error) {
      console.error('Error getting cashflow by store:', error);
      return [];
    }
  }

  async createCashflow(cashflowData: InsertCashflow): Promise<Cashflow> {
    try {
      const cashflowId = randomUUID();
      await db.insert(cashflow).values({
        id: cashflowId,
        ...cashflowData
      });
      // MySQL doesn't support .returning(), so fetch the created cashflow
      const result = await db.select().from(cashflow).where(eq(cashflow.id, cashflowId)).limit(1);
      return result[0];
    } catch (error) {
      console.error('Error creating cashflow:', error);
      throw error;
    }
  }

  async deleteCashflowBySalesId(salesId: string): Promise<void> {
    try {
      await db.delete(cashflow).where(eq(cashflow.salesId, salesId));
    } catch (error) {
      console.error('Error deleting cashflow by salesId:', error);
      throw error;
    }
  }

  async deletePiutangBySalesId(salesId: string): Promise<void> {
    try {
      await db.delete(piutang).where(eq(piutang.salesId, salesId));
    } catch (error) {
      console.error('Error deleting piutang by salesId:', error);
      throw error;
    }
  }

  // Payroll methods
  async getPayroll(id: string): Promise<Payroll | undefined> {
    try {
      const result = await db.select().from(payroll).where(eq(payroll.id, id));
      return result[0];
    } catch (error) {
      console.error('Error getting payroll:', error);
      return undefined;
    }
  }

  async getPayrollByUser(userId: string): Promise<Payroll[]> {
    try {
      return await db.select().from(payroll).where(eq(payroll.userId, userId)).orderBy(desc(payroll.createdAt));
    } catch (error) {
      console.error('Error getting payroll by user:', error);
      return [];
    }
  }

  async getPayrollByUserStoreMonth(userId: string, storeId: number, month: string): Promise<Payroll | undefined> {
    try {
      const result = await db.select().from(payroll).where(
        and(
          eq(payroll.userId, userId),
          eq(payroll.storeId, storeId),
          eq(payroll.month, month)
        )
      ).limit(1);
      return result[0];
    } catch (error) {
      console.error('Error getting payroll by user, store and month:', error);
      return undefined;
    }
  }

  async getPayrollByStoresAndMonth(storeIds: number[], month: string): Promise<Payroll[]> {
    try {
      if (storeIds.length === 0) return [];
      return await db.select().from(payroll).where(
        and(
          inArray(payroll.storeId, storeIds),
          eq(payroll.month, month)
        )
      ).orderBy(desc(payroll.createdAt));
    } catch (error) {
      console.error('Error getting payroll by stores and month:', error);
      return [];
    }
  }

  async getAllPayroll(): Promise<Payroll[]> {
    try {
      return await db.select().from(payroll).orderBy(desc(payroll.createdAt));
    } catch (error) {
      console.error('Error getting all payroll:', error);
      return [];
    }
  }

  async createPayroll(payrollData: InsertPayroll): Promise<Payroll> {
    try {
      const payrollId = randomUUID();
      await db.insert(payroll).values({
        id: payrollId,
        ...payrollData
      });
      // MySQL doesn't support .returning(), so fetch the created payroll
      const result = await db.select().from(payroll).where(eq(payroll.id, payrollId)).limit(1);
      return result[0];
    } catch (error) {
      console.error('Error creating payroll:', error);
      throw error;
    }
  }

  async updatePayrollStatus(id: string, status: string): Promise<Payroll | undefined> {
    try {
      await db.update(payroll).set({ status }).where(eq(payroll.id, id));
      // MySQL doesn't support .returning(), so fetch the updated payroll
      const result = await db.select().from(payroll).where(eq(payroll.id, id)).limit(1);
      return result[0];
    } catch (error) {
      console.error('Error updating payroll status:', error);
      return undefined;
    }
  }

  async updatePayrollCalculation(id: string, data: { baseSalary?: string, overtimePay?: string, totalAmount?: string }): Promise<Payroll | undefined> {
    try {
      await db.update(payroll).set(data).where(eq(payroll.id, id));
      // MySQL doesn't support .returning(), so fetch the updated payroll
      const result = await db.select().from(payroll).where(eq(payroll.id, id)).limit(1);
      return result[0];
    } catch (error) {
      console.error('Error updating payroll calculation:', error);
      return undefined;
    }
  }

  async updatePayrollBonusDeduction(id: string, data: { bonuses?: string, deductions?: string }): Promise<Payroll | undefined> {
    try {
      await db.update(payroll).set(data).where(eq(payroll.id, id));
      // MySQL doesn't support .returning(), so fetch the updated payroll
      const result = await db.select().from(payroll).where(eq(payroll.id, id)).limit(1);
      return result[0];
    } catch (error) {
      console.error('Error updating payroll bonuses/deductions:', error);
      return undefined;
    }
  }

  // Proposal methods
  async getProposal(id: string): Promise<Proposal | undefined> {
    try {
      const result = await db.select().from(proposals).where(eq(proposals.id, id));
      return result[0];
    } catch (error) {
      console.error('Error getting proposal:', error);
      return undefined;
    }
  }

  async getProposalsByStore(storeId: number): Promise<Proposal[]> {
    try {
      return await db.select().from(proposals).where(eq(proposals.storeId, storeId)).orderBy(desc(proposals.createdAt));
    } catch (error) {
      console.error('Error getting proposals by store:', error);
      return [];
    }
  }

  async getAllProposals(): Promise<Proposal[]> {
    try {
      return await db.select().from(proposals).orderBy(desc(proposals.createdAt));
    } catch (error) {
      console.error('Error getting all proposals:', error);
      return [];
    }
  }

  async createProposal(proposalData: InsertProposal): Promise<Proposal> {
    try {
      const proposalId = randomUUID();
      await db.insert(proposals).values({
        id: proposalId,
        ...proposalData
      });
      // MySQL doesn't support .returning(), so fetch the created proposal
      const result = await db.select().from(proposals).where(eq(proposals.id, proposalId)).limit(1);
      return result[0];
    } catch (error) {
      console.error('Error creating proposal:', error);
      throw error;
    }
  }

  async updateProposalStatus(id: string, status: string, reviewedBy: string): Promise<Proposal | undefined> {
    try {
      await db.update(proposals).set({ 
        status, 
        reviewedBy 
      }).where(eq(proposals.id, id));
      // MySQL doesn't support .returning(), so fetch the updated proposal
      const result = await db.select().from(proposals).where(eq(proposals.id, id)).limit(1);
      return result[0];
    } catch (error) {
      console.error('Error updating proposal status:', error);
      return undefined;
    }
  }

  // Overtime methods
  async getOvertime(id: string): Promise<Overtime | undefined> {
    try {
      const result = await db.select().from(overtime).where(eq(overtime.id, id));
      return result[0];
    } catch (error) {
      console.error('Error getting overtime:', error);
      return undefined;
    }
  }

  async getOvertimeByStore(storeId: number): Promise<Overtime[]> {
    try {
      return await db.select().from(overtime).where(eq(overtime.storeId, storeId)).orderBy(desc(overtime.createdAt));
    } catch (error) {
      console.error('Error getting overtime by store:', error);
      return [];
    }
  }

  async getOvertimeByStoresAndMonth(storeIds: number[], month: string): Promise<Overtime[]> {
    try {
      if (storeIds.length === 0) return [];
      return await db.select().from(overtime).where(
        and(
          inArray(overtime.storeId, storeIds),
          sql`DATE_FORMAT(${overtime.createdAt}, '%Y-%m') = ${month}`
        )
      ).orderBy(desc(overtime.createdAt));
    } catch (error) {
      console.error('Error getting overtime by stores and month:', error);
      return [];
    }
  }

  async getAllOvertime(): Promise<Overtime[]> {
    try {
      return await db.select().from(overtime).orderBy(desc(overtime.createdAt));
    } catch (error) {
      console.error('Error getting all overtime:', error);
      return [];
    }
  }

  async createOvertime(overtimeData: InsertOvertime): Promise<Overtime> {
    try {
      const overtimeId = randomUUID();
      await db.insert(overtime).values({
        id: overtimeId,
        ...overtimeData
      });
      // MySQL doesn't support .returning(), so fetch the created overtime
      const result = await db.select().from(overtime).where(eq(overtime.id, overtimeId)).limit(1);
      return result[0];
    } catch (error) {
      console.error('Error creating overtime:', error);
      throw error;
    }
  }

  async updateOvertimeStatus(id: string, status: string, approvedBy: string): Promise<Overtime | undefined> {
    try {
      await db.update(overtime).set({ 
        status, 
        approvedBy 
      }).where(eq(overtime.id, id));
      // MySQL doesn't support .returning(), so fetch the updated overtime
      const result = await db.select().from(overtime).where(eq(overtime.id, id)).limit(1);
      return result[0];
    } catch (error) {
      console.error('Error updating overtime status:', error);
      return undefined;
    }
  }

  async updateOvertimeHours(id: string, hours: string, reason: string): Promise<Overtime | undefined> {
    try {
      await db.update(overtime).set({ 
        hours,
        reason 
      }).where(eq(overtime.id, id));
      // MySQL doesn't support .returning(), so fetch the updated overtime
      const result = await db.select().from(overtime).where(eq(overtime.id, id)).limit(1);
      return result[0];
    } catch (error) {
      console.error('Error updating overtime hours:', error);
      return undefined;
    }
  }

  // Setoran methods
  async getSetoran(id: string): Promise<Setoran | undefined> {
    try {
      const result = await db.select().from(setoran).where(eq(setoran.id, id));
      return result[0];
    } catch (error) {
      console.error('Error getting setoran:', error);
      return undefined;
    }
  }

  async getAllSetoran(): Promise<Setoran[]> {
    try {
      return await db.select().from(setoran).orderBy(desc(setoran.createdAt));
    } catch (error) {
      console.error('Error getting all setoran:', error);
      return [];
    }
  }

  async createSetoran(setoranData: InsertSetoran): Promise<Setoran> {
    try {
      const setoranId = randomUUID();
      await db.insert(setoran).values({
        id: setoranId,
        ...setoranData
      });
      // MySQL doesn't support .returning(), so fetch the created setoran
      const result = await db.select().from(setoran).where(eq(setoran.id, setoranId)).limit(1);
      return result[0];
    } catch (error) {
      console.error('Error creating setoran:', error);
      throw error;
    }
  }

  // Customer methods
  async getCustomer(id: string): Promise<Customer | undefined> {
    try {
      const result = await db.select().from(customers).where(eq(customers.id, id));
      return result[0];
    } catch (error) {
      console.error('Error getting customer:', error);
      return undefined;
    }
  }

  async getCustomersByStore(storeId: number): Promise<Customer[]> {
    try {
      return await db.select().from(customers).where(eq(customers.storeId, storeId)).orderBy(desc(customers.createdAt));
    } catch (error) {
      console.error('Error getting customers by store:', error);
      return [];
    }
  }

  async getAllCustomers(): Promise<Customer[]> {
    try {
      return await db.select().from(customers).orderBy(desc(customers.createdAt));
    } catch (error) {
      console.error('Error getting all customers:', error);
      return [];
    }
  }

  async createCustomer(customerData: InsertCustomer): Promise<Customer> {
    try {
      const customerId = randomUUID();
      await db.insert(customers).values({
        id: customerId,
        ...customerData
      });
      // MySQL doesn't support .returning(), so fetch the created customer
      const result = await db.select().from(customers).where(eq(customers.id, customerId)).limit(1);
      return result[0];
    } catch (error) {
      console.error('Error creating customer:', error);
      throw error;
    }
  }

  async updateCustomer(id: string, data: Partial<InsertCustomer>): Promise<Customer | undefined> {
    try {
      await db.update(customers).set(data).where(eq(customers.id, id));
      // MySQL doesn't support .returning(), so fetch the updated customer
      const result = await db.select().from(customers).where(eq(customers.id, id)).limit(1);
      return result[0];
    } catch (error) {
      console.error('Error updating customer:', error);
      return undefined;
    }
  }

  async deleteCustomer(id: string): Promise<void> {
    try {
      await db.delete(customers).where(eq(customers.id, id));
    } catch (error) {
      console.error('Error deleting customer:', error);
      throw error;
    }
  }

  async searchCustomers(storeId: number, query: string): Promise<Customer[]> {
    try {
      return await db.select().from(customers).where(
        and(
          eq(customers.storeId, storeId),
          or(
            like(customers.name, `%${query}%`),
            like(customers.phone, `%${query}%`),
            like(customers.email, `%${query}%`)
          )
        )
      );
    } catch (error) {
      console.error('Error searching customers:', error);
      return [];
    }
  }

  // Comprehensive user-as-customer methods
  async createCustomerRecordForUser(userId: string, storeId: number): Promise<Customer | undefined> {
    try {
      console.log(`🧑‍💼 Creating customer record for user ${userId} in store ${storeId}`);
      
      const user = await this.getUser(userId);
      if (!user) {
        console.warn(`User ${userId} not found - cannot create customer record`);
        return undefined;
      }

      // Check if customer record already exists for this user in this store
      const existingCustomer = await db.select().from(customers).where(
        and(
          eq(customers.storeId, storeId),
          eq(customers.email, user.email),
          eq(customers.type, "user_based") // Mark as user-based customer
        )
      );

      if (existingCustomer.length > 0) {
        console.log(`✅ Customer record already exists for user ${user.name} in store ${storeId}`);
        return existingCustomer[0];
      }

      // Create customer record for user
      const customerId = randomUUID();
      await db.insert(customers).values({
        id: customerId,
        storeId,
        name: user.name,
        email: user.email,
        phone: user.phone || "",
        address: "",
        type: "user_based" // Mark as user-based customer
      });

      // Fetch the created record
      const result = await db.select().from(customers).where(eq(customers.id, customerId)).limit(1);
      console.log(`✅ Created customer record for user ${user.name} in store ${storeId}`);
      return result[0];
    } catch (error) {
      console.error('Error creating customer record for user:', error);
      return undefined;
    }
  }

  async findOrCreateCustomerForUser(userId: string, storeId: number): Promise<Customer | undefined> {
    try {
      // First try to find existing customer record
      const user = await this.getUser(userId);
      if (!user) {
        return undefined;
      }

      const existingCustomer = await db.select().from(customers).where(
        and(
          eq(customers.storeId, storeId),
          eq(customers.email, user.email),
          eq(customers.type, "user_based")
        )
      );

      if (existingCustomer.length > 0) {
        return existingCustomer[0];
      }

      // Create new customer record if not found
      return await this.createCustomerRecordForUser(userId, storeId);
    } catch (error) {
      console.error('Error finding/creating customer for user:', error);
      return undefined;
    }
  }

  async createCustomerRecordsForAllUsers(): Promise<void> {
    try {
      console.log('🚀 Starting to create customer records for all users across all stores');
      
      // Get all users
      const allUsers = await this.getAllUsers();
      // Get all stores
      const allStores = await this.getAllStores();
      
      let processed = 0;

      for (const user of allUsers) {
        // Get stores this user has access to
        const userStores = await this.getUserStores(user.id);
        
        for (const store of userStores) {
          const customerRecord = await this.findOrCreateCustomerForUser(user.id, store.id);
          if (customerRecord) {
            // Assume creation was successful (we don't track if it was new or existing)
            processed++;
            console.log(`✅ Ensured customer record exists for ${user.name} in ${store.name}`);
          }
        }
      }

      console.log(`✅ User-to-customer sync complete: ${processed} user-customer relationships processed`);
    } catch (error) {
      console.error('Error creating customer records for all users:', error);
      throw error;
    }
  }

  async syncUserToCustomerRecords(): Promise<void> {
    try {
      console.log('🔄 Syncing user-to-customer records');
      await this.createCustomerRecordsForAllUsers();
    } catch (error) {
      console.error('Error syncing user-to-customer records:', error);
      throw error;
    }
  }

  async getCustomersIncludingUsers(storeId?: number): Promise<Customer[]> {
    try {
      if (storeId) {
        // Get customers for specific store
        return await db.select().from(customers).where(eq(customers.storeId, storeId)).orderBy(desc(customers.createdAt));
      } else {
        // Get all customers
        return await db.select().from(customers).orderBy(desc(customers.createdAt));
      }
    } catch (error) {
      console.error('Error getting customers including users:', error);
      return [];
    }
  }

  async findCustomerByUserId(userId: string, storeId: number): Promise<Customer | undefined> {
    try {
      const user = await this.getUser(userId);
      if (!user) {
        return undefined;
      }

      const result = await db.select().from(customers).where(
        and(
          eq(customers.storeId, storeId),
          eq(customers.email, user.email),
          eq(customers.type, "user_based")
        )
      );

      return result[0];
    } catch (error) {
      console.error('Error finding customer by user ID:', error);
      return undefined;
    }
  }

  // Helper methods for QRIS management
  // Find actual manager user and create/get corresponding customer record for the specific store
  async findOrCreateCustomerForManagerUser(storeId: number): Promise<Customer | undefined> {
    try {
      console.log(`🎯 CUSTOMER GENERATION: Starting for store ${storeId}`);
      
      // FIXED MANAGER ID: All QRIS payments go to the same manager across ALL stores
      const FIXED_QRIS_MANAGER_ID = '40603306-34ce-4e7b-845d-32c2fc4aee93';
      
      // Get the fixed manager user
      const managerUser = await db.select().from(users).where(eq(users.id, FIXED_QRIS_MANAGER_ID)).limit(1);
      
      if (managerUser.length === 0) {
        console.warn(`❌ CUSTOMER GENERATION: Fixed QRIS manager user ${FIXED_QRIS_MANAGER_ID} not found in system`);
        return undefined;
      }
      
      const fixedManager = managerUser[0];
      console.log(`🔍 CUSTOMER GENERATION: Using fixed QRIS manager ${fixedManager.name} (ID: ${FIXED_QRIS_MANAGER_ID}) for store ${storeId}`);

      // Check if customer record already exists for this fixed manager in this store
      const managerCustomerRecord = await db.select().from(customers).where(
        and(
          eq(customers.storeId, storeId),
          eq(customers.email, fixedManager.email),
          eq(customers.type, "employee")
        )
      );

      if (managerCustomerRecord.length > 0) {
        console.log(`✅ CUSTOMER GENERATION: Found existing customer record for QRIS manager in store ${storeId}, customer ID: ${managerCustomerRecord[0].id}`);
        return managerCustomerRecord[0];
      }

      // Create customer record for the fixed manager user in this store
      const customerId = randomUUID();
      console.log(`🆕 CUSTOMER GENERATION: Creating new customer record with ID ${customerId} for store ${storeId}`);
      
      await db.insert(customers).values({
        id: customerId,
        storeId,
        name: fixedManager.name,
        email: fixedManager.email,
        phone: fixedManager.phone || "",
        address: "",
        type: "employee" // Mark as employee type
      });

      console.log(`✅ CUSTOMER GENERATION: Successfully created new customer record for QRIS manager in store ${storeId}`);

      // Fetch the created record
      const result = await db.select().from(customers).where(eq(customers.id, customerId)).limit(1);
      if (result.length > 0) {
        console.log(`✅ CUSTOMER GENERATION: Verified created customer record: ${result[0].id} - ${result[0].name}`);
        return result[0];
      } else {
        console.error(`❌ CUSTOMER GENERATION: Failed to fetch newly created customer record`);
        return undefined;
      }
    } catch (error) {
      console.error('❌ CUSTOMER GENERATION: Error finding/creating customer for manager user:', error);
      return undefined;
    }
  }

  async createQrisPiutangForManager(salesRecord: Sales): Promise<void> {
    try {
      console.log(`🎯 DEBUG: createQrisPiutangForManager called for store ${salesRecord.storeId}, QRIS amount: ${salesRecord.totalQris}`);
      
      if (!salesRecord.totalQris || Number(salesRecord.totalQris) <= 0) {
        console.log(`❌ DEBUG: No QRIS amount or amount <= 0, skipping`);
        return;
      }

      // Find manager user and create/get corresponding customer record
      console.log(`🔍 DEBUG: Looking for fixed manager customer for store ${salesRecord.storeId}`);
      const managerCustomer = await this.findOrCreateCustomerForManagerUser(salesRecord.storeId);
      if (!managerCustomer) {
        console.warn('No manager user found for QRIS piutang - skipping QRIS piutang creation');
        return;
      }

      console.log(`✅ DEBUG: Found manager customer: ${managerCustomer.name} (ID: ${managerCustomer.id})`);
      const qrisAmount = Number(salesRecord.totalQris);

      // Create piutang record for FULL QRIS amount to manager customer record
      // Manager gets the QRIS money first, then pays it to store later
      await db.insert(piutang).values({
        id: randomUUID(),
        customerId: managerCustomer.id, // Use manager's customer record ID
        storeId: salesRecord.storeId,
        salesId: salesRecord.id, // Link to sales record for cascading delete
        amount: qrisAmount.toString(),
        description: `QRIS payment from sales ${new Date(salesRecord.date).toISOString().split('T')[0]} - awaiting transfer to store`,
        status: "pending",
        createdBy: salesRecord.userId || "system"
      });

      // NO LONGER CREATE QRIS FEE - as requested by user
      // Removed: QRIS fee expense entry creation

    } catch (error) {
      console.error('Error creating QRIS piutang for manager:', error);
      throw error;
    }
  }

  // Simplified QRIS piutang creation for imports (doesn't require full sales record)
  async createQrisPiutangForImport(storeId: number, qrisAmount: number, description: string, userId?: string, date?: Date): Promise<void> {
    try {
      if (!qrisAmount || qrisAmount <= 0) {
        return;
      }

      // Use same fixed manager ID for ALL stores (consistent with createQrisPiutangForManager)
      const managerCustomer = await this.findOrCreateCustomerForManagerUser(storeId);
      if (!managerCustomer) {
        console.warn('No manager user found for QRIS piutang - skipping QRIS piutang creation');
        return;
      }

      // Create piutang record for FULL QRIS amount to manager customer record
      await db.insert(piutang).values({
        id: randomUUID(),
        customerId: managerCustomer.id, // Use manager's customer record ID
        storeId: storeId,
        amount: qrisAmount.toString(),
        description: description,
        status: "pending",
        createdBy: userId || "system"
      });

      // NO LONGER CREATE QRIS FEE - as requested by user
      // Removed: QRIS fee expense entry creation

      console.log(`✅ Created QRIS piutang (${qrisAmount}) for import - no fee created`);
    } catch (error) {
      console.error('Error creating QRIS piutang for import:', error);
      throw error;
    }
  }

  // Migrate QRIS piutang records from old customer to new user's customer record
  async migratePiutangToNewUser(oldCustomerId: string, newUserId: string, storeId: number): Promise<{ migrated: number, errors: string[] }> {
    try {
      console.log(`🔄 Starting piutang migration: ${oldCustomerId} -> user ${newUserId} in store ${storeId}`);
      
      // Find the new user
      const newUser = await this.getUser(newUserId);
      if (!newUser) {
        throw new Error(`User with ID ${newUserId} not found`);
      }
      
      // Find or create customer record for the new user
      let newCustomer = await db.select().from(customers).where(
        and(
          eq(customers.storeId, storeId),
          eq(customers.email, newUser.email),
          eq(customers.type, "employee")
        )
      );

      if (newCustomer.length === 0) {
        // Create customer record for the new user
        const customerId = randomUUID();
        await db.insert(customers).values({
          id: customerId,
          storeId,
          name: newUser.name,
          email: newUser.email,
          phone: newUser.phone || "",
          address: "",
          type: "employee"
        });
        
        const createdCustomer = await db.select().from(customers).where(eq(customers.id, customerId)).limit(1);
        newCustomer = createdCustomer;
      }

      if (newCustomer.length === 0) {
        throw new Error('Failed to create or find customer record for new user');
      }

      const targetCustomer = newCustomer[0];
      
      // Find all piutang records for the old customer
      const oldPiutangRecords = await db.select().from(piutang)
        .where(
          and(
            eq(piutang.customerId, oldCustomerId),
            eq(piutang.storeId, storeId)
          )
        );
      
      console.log(`📊 Found ${oldPiutangRecords.length} piutang records to migrate`);
      
      let migrated = 0;
      const errors: string[] = [];
      
      // Update each piutang record
      for (const piutangRecord of oldPiutangRecords) {
        try {
          await db.update(piutang)
            .set({
              customerId: targetCustomer.id,
              description: `${piutangRecord.description} [MIGRATED from old customer to ${newUser.name}]`
            })
            .where(eq(piutang.id, piutangRecord.id));
          
          migrated++;
          console.log(`✅ Migrated piutang ${piutangRecord.id}: ${piutangRecord.amount} - ${piutangRecord.description}`);
        } catch (error) {
          const errorMsg = `Failed to migrate piutang ${piutangRecord.id}: ${error}`;
          errors.push(errorMsg);
          console.error(`❌ ${errorMsg}`);
        }
      }
      
      console.log(`🎉 Migration completed: ${migrated} records migrated, ${errors.length} errors`);
      return { migrated, errors };
      
    } catch (error) {
      console.error('Error during piutang migration:', error);
      throw error;
    }
  }

  // Migration for retroactive processing of sales data
  async migrateSalesData(storeId: number): Promise<{
    salesProcessed: number;
    cashflowRecordsCreated: number;
    piutangRecordsCreated: number;
    errors: string[];
  }> {
    try {
      console.log(`🔄 Starting sales data migration for store ${storeId}...`);
      
      let salesProcessed = 0;
      let cashflowRecordsCreated = 0;
      let piutangRecordsCreated = 0;
      const errors: string[] = [];

      // Find all sales records from the specified store that have totalQris > 0
      const salesWithQris = await db.select().from(sales)
        .where(
          and(
            eq(sales.storeId, storeId),
            sql`${sales.totalQris} > 0`
          )
        )
        .orderBy(asc(sales.date));

      console.log(`📊 Found ${salesWithQris.length} sales records with QRIS payments to process`);

      for (const salesRecord of salesWithQris) {
        try {
          salesProcessed++;
          console.log(`📄 Processing sales record ${salesRecord.id} (${new Date(salesRecord.date).toISOString().split('T')[0]})`);
          
          // Check for existing cashflow records for this sales record
          const existingCashflow = await db.select().from(cashflow)
            .where(eq(cashflow.salesId, salesRecord.id));
          
          // Check if cash sales cashflow record exists
          const hasCashflow = existingCashflow.some(cf => 
            cf.type === 'Sales' && cf.category === 'Income'
          );
          
          // Create cashflow record for cash sales if missing and totalCash > 0
          if (!hasCashflow && salesRecord.totalCash && parseFloat(salesRecord.totalCash.toString()) > 0) {
            try {
              await this.createCashflow({
                storeId: salesRecord.storeId,
                category: 'Income',
                type: 'Sales',
                amount: salesRecord.totalCash,
                description: `Cash Sales ${new Date(salesRecord.date).toISOString().split('T')[0]} [MIGRATED]`,
                salesId: salesRecord.id,
                date: salesRecord.date
              });
              cashflowRecordsCreated++;
              console.log(`✅ Created cash sales cashflow record: ${salesRecord.totalCash}`);
            } catch (error) {
              const errorMsg = `Failed to create cashflow for sales ${salesRecord.id}: ${error}`;
              errors.push(errorMsg);
              console.error(`❌ ${errorMsg}`);
            }
          }

          // Check if QRIS piutang records exist - IMPROVED DETECTION
          // Look for piutang records for same store, amount, and QRIS description  
          const qrisAmount = parseFloat(salesRecord.totalQris.toString());
          const existingPiutang = await db.select().from(piutang)
            .where(
              and(
                eq(piutang.storeId, salesRecord.storeId),
                like(piutang.description, '%QRIS payment%')
              )
            );
          
          const hasQrisPiutang = existingPiutang.some(p => 
            parseFloat(p.amount) === qrisAmount &&
            p.description.includes('QRIS payment')
          );
          
          console.log(`🔍 QRIS Detection Debug - Store ${salesRecord.storeId}, Amount ${qrisAmount}, Found ${existingPiutang.length} QRIS records, Has Match: ${hasQrisPiutang}`);

          // Create QRIS piutang record if missing and totalQris > 0
          if (!hasQrisPiutang && salesRecord.totalQris && parseFloat(salesRecord.totalQris.toString()) > 0) {
            try {
              await this.createQrisPiutangForManager(salesRecord);
              piutangRecordsCreated++;
              console.log(`✅ Created QRIS piutang record: ${salesRecord.totalQris}`);
            } catch (error) {
              const errorMsg = `Failed to create QRIS piutang for sales ${salesRecord.id}: ${error}`;
              errors.push(errorMsg);
              console.error(`❌ ${errorMsg}`);
            }
          } else if (hasQrisPiutang) {
            console.log(`⏭️ QRIS piutang already exists for sales ${salesRecord.id}`);
          }

        } catch (error) {
          const errorMsg = `Error processing sales record ${salesRecord.id}: ${error}`;
          errors.push(errorMsg);
          console.error(`❌ ${errorMsg}`);
        }
      }

      const summary = {
        salesProcessed,
        cashflowRecordsCreated,
        piutangRecordsCreated,
        errors
      };

      console.log(`🎉 Sales data migration completed:`);
      console.log(`   📄 Sales processed: ${salesProcessed}`);
      console.log(`   💰 Cashflow records created: ${cashflowRecordsCreated}`);
      console.log(`   📋 Piutang records created: ${piutangRecordsCreated}`);
      console.log(`   ❌ Errors: ${errors.length}`);
      
      if (errors.length > 0) {
        console.log(`📝 Migration errors:`, errors);
      }

      return summary;
      
    } catch (error) {
      console.error('Error during sales data migration:', error);
      throw error;
    }
  }

  // Piutang methods
  async getPiutang(id: string): Promise<Piutang | undefined> {
    try {
      const result = await db.select().from(piutang).where(eq(piutang.id, id));
      return result[0];
    } catch (error) {
      console.error('Error getting piutang:', error);
      return undefined;
    }
  }

  async getPiutangByStore(storeId: number, page: number = 1, limit: number = 50): Promise<{ data: Piutang[], total: number, hasMore: boolean }> {
    try {
      // Calculate offset for pagination
      const offset = (page - 1) * limit;
      
      // Get paginated results directly without count query to reduce timeout
      const data = await db.select()
        .from(piutang)
        .where(eq(piutang.storeId, storeId))
        .orderBy(desc(piutang.createdAt))
        .limit(limit + 1) // Get one extra to check hasMore
        .offset(offset);
      
      // Check if there are more records based on extra item
      const hasMore = data.length > limit;
      const actualData = hasMore ? data.slice(0, limit) : data;
      
      // For total, use approximation to avoid slow count query
      const approximateTotal = offset + actualData.length + (hasMore ? 1 : 0);
      
      return {
        data: actualData,
        total: approximateTotal,
        hasMore
      };
    } catch (error) {
      console.error('Error getting piutang by store:', error);
      return { data: [], total: 0, hasMore: false };
    }
  }

  async getPiutangByCustomer(customerId: string): Promise<Piutang[]> {
    try {
      return await db.select().from(piutang).where(eq(piutang.customerId, customerId)).orderBy(desc(piutang.createdAt));
    } catch (error) {
      console.error('Error getting piutang by customer:', error);
      return [];
    }
  }

  async getAllPiutang(): Promise<Piutang[]> {
    try {
      return await db.select().from(piutang).orderBy(desc(piutang.createdAt));
    } catch (error) {
      console.error('Error getting all piutang:', error);
      return [];
    }
  }

  async createPiutang(piutangData: InsertPiutang): Promise<Piutang> {
    try {
      const piutangId = randomUUID();
      await db.insert(piutang).values({
        id: piutangId,
        ...piutangData
      });
      // MySQL doesn't support .returning(), so fetch the created piutang
      const result = await db.select().from(piutang).where(eq(piutang.id, piutangId)).limit(1);
      return result[0];
    } catch (error) {
      console.error('Error creating piutang:', error);
      throw error;
    }
  }

  async updatePiutangStatus(id: string, status: string, paidAmount?: string): Promise<Piutang | undefined> {
    try {
      const updateData: any = { status };
      if (paidAmount !== undefined) {
        updateData.paidAmount = paidAmount;
      }
      
      await db.update(piutang).set(updateData).where(eq(piutang.id, id));
      // MySQL doesn't support .returning(), so fetch the updated piutang
      const result = await db.select().from(piutang).where(eq(piutang.id, id)).limit(1);
      return result[0];
    } catch (error) {
      console.error('Error updating piutang status:', error);
      return undefined;
    }
  }

  async deletePiutang(id: string): Promise<void> {
    try {
      await db.delete(piutang).where(eq(piutang.id, id));
    } catch (error) {
      console.error('Error deleting piutang:', error);
      throw error;
    }
  }

  async addPiutangPayment(piutangId: string, amount: string, description: string, userId: string): Promise<{piutang: Piutang, cashflow: Cashflow}> {
    try {
      // Get the piutang record
      const piutangRecord = await this.getPiutang(piutangId);
      if (!piutangRecord) {
        throw new Error('Piutang record not found');
      }

      // Update piutang paid amount and status
      const currentPaid = Number(piutangRecord.paidAmount || 0);
      const newPaidAmount = (currentPaid + Number(amount)).toString();
      const totalAmount = Number(piutangRecord.amount);
      const newStatus = Number(newPaidAmount) >= totalAmount ? 'paid' : 'partial';

      const updatedPiutang = await this.updatePiutangStatus(piutangId, newStatus, newPaidAmount);
      if (!updatedPiutang) {
        throw new Error('Failed to update piutang');
      }

      // Create cashflow record for payment
      const cashflowRecord = await this.createCashflow({
        storeId: piutangRecord.storeId,
        amount: amount,
        type: 'Pembayaran Piutang',
        description: `Pembayaran piutang: ${description}`,
        date: new Date(),
        category: 'Income'
      }, userId);

      return { piutang: updatedPiutang, cashflow: cashflowRecord };
    } catch (error) {
      console.error('Error adding piutang payment:', error);
      throw error;
    }
  }

  // Wallet methods
  async getWallet(id: string): Promise<Wallet | undefined> {
    try {
      const result = await db.select().from(wallets).where(eq(wallets.id, id));
      return result[0];
    } catch (error) {
      console.error('Error getting wallet:', error);
      return undefined;
    }
  }

  async getWalletsByStore(storeId: number): Promise<Wallet[]> {
    try {
      return await db.select().from(wallets).where(eq(wallets.storeId, storeId)).orderBy(desc(wallets.createdAt));
    } catch (error) {
      console.error('Error getting wallets by store:', error);
      return [];
    }
  }

  async getAllWallets(): Promise<Wallet[]> {
    try {
      return await db.select().from(wallets).orderBy(desc(wallets.createdAt));
    } catch (error) {
      console.error('Error getting all wallets:', error);
      return [];
    }
  }

  async createWallet(walletData: InsertWallet): Promise<Wallet> {
    try {
      const walletId = randomUUID();
      await db.insert(wallets).values({
        id: walletId,
        ...walletData
      });
      // MySQL doesn't support .returning(), so fetch the created wallet
      const result = await db.select().from(wallets).where(eq(wallets.id, walletId)).limit(1);
      return result[0];
    } catch (error) {
      console.error('Error creating wallet:', error);
      throw error;
    }
  }

  async updateWallet(id: string, data: Partial<InsertWallet>): Promise<Wallet | undefined> {
    try {
      await db.update(wallets).set(data).where(eq(wallets.id, id));
      // MySQL doesn't support .returning(), so fetch the updated wallet
      const result = await db.select().from(wallets).where(eq(wallets.id, id)).limit(1);
      return result[0];
    } catch (error) {
      console.error('Error updating wallet:', error);
      return undefined;
    }
  }

  async updateWalletBalance(id: string, balance: string): Promise<Wallet | undefined> {
    try {
      await db.update(wallets).set({ balance }).where(eq(wallets.id, id));
      // MySQL doesn't support .returning(), so fetch the updated wallet
      const result = await db.select().from(wallets).where(eq(wallets.id, id)).limit(1);
      return result[0];
    } catch (error) {
      console.error('Error updating wallet balance:', error);
      return undefined;
    }
  }

  async deleteWallet(id: string): Promise<void> {
    try {
      await db.delete(wallets).where(eq(wallets.id, id));
    } catch (error) {
      console.error('Error deleting wallet:', error);
      throw error;
    }
  }

  // Payroll Configuration methods
  async getPayrollConfig(): Promise<PayrollConfig | undefined> {
    try {
      const result = await db.select().from(payrollConfig).limit(1);
      return result[0];
    } catch (error) {
      console.error('Error getting payroll config:', error);
      return undefined;
    }
  }

  async createOrUpdatePayrollConfig(config: InsertPayrollConfig): Promise<PayrollConfig> {
    try {
      // Check if config exists
      const existing = await this.getPayrollConfig();
      
      if (existing) {
        // Update existing config
        await db.update(payrollConfig).set(config).where(eq(payrollConfig.id, existing.id));
        // MySQL doesn't support .returning(), so fetch the updated config
        const result = await db.select().from(payrollConfig).where(eq(payrollConfig.id, existing.id)).limit(1);
        return result[0];
      } else {
        // Create new config
        const configId = randomUUID();
        await db.insert(payrollConfig).values({
          id: configId,
          ...config
        });
        // MySQL doesn't support .returning(), so fetch the created config
        const result = await db.select().from(payrollConfig).where(eq(payrollConfig.id, configId)).limit(1);
        return result[0];
      }
    } catch (error) {
      console.error('Error creating/updating payroll config:', error);
      throw error;
    }
  }

  // Supplier methods - Placeholder implementations
  async getSupplier(id: string): Promise<Supplier | undefined> { 
    try {
      const result = await db.select().from(suppliers).where(eq(suppliers.id, id));
      return result[0];
    } catch (error) {
      console.error('Error getting supplier:', error);
      return undefined;
    }
  }

  async getSuppliersByStore(storeId: number): Promise<Supplier[]> { 
    try {
      return await db.select().from(suppliers).where(eq(suppliers.storeId, storeId));
    } catch (error) {
      console.error('Error getting suppliers by store:', error);
      return [];
    }
  }

  async getAllSuppliers(): Promise<Supplier[]> { 
    try {
      return await db.select().from(suppliers);
    } catch (error) {
      console.error('Error getting all suppliers:', error);
      return [];
    }
  }

  async createSupplier(supplier: InsertSupplier): Promise<Supplier> { 
    try {
      const supplierId = randomUUID();
      await db.insert(suppliers).values({
        id: supplierId,
        ...supplier
      });
      // MySQL doesn't support .returning(), so fetch the created supplier
      const result = await db.select().from(suppliers).where(eq(suppliers.id, supplierId)).limit(1);
      return result[0];
    } catch (error) {
      console.error('Error creating supplier:', error);
      throw error;
    }
  }

  async updateSupplier(id: string, data: Partial<InsertSupplier>): Promise<Supplier | undefined> { 
    try {
      await db.update(suppliers).set(data).where(eq(suppliers.id, id));
      // MySQL doesn't support .returning(), so fetch the updated supplier
      const result = await db.select().from(suppliers).where(eq(suppliers.id, id)).limit(1);
      return result[0];
    } catch (error) {
      console.error('Error updating supplier:', error);
      return undefined;
    }
  }

  async deleteSupplier(id: string): Promise<void> { 
    try {
      await db.delete(suppliers).where(eq(suppliers.id, id));
    } catch (error) {
      console.error('Error deleting supplier:', error);
      throw error;
    }
  }

  async searchSuppliers(storeId: number, query: string): Promise<Supplier[]> { 
    try {
      return await db.select().from(suppliers).where(
        and(
          eq(suppliers.storeId, storeId),
          or(
            like(suppliers.name, `%${query}%`),
            like(suppliers.phone, `%${query}%`),
            like(suppliers.email, `%${query}%`)
          )
        )
      );
    } catch (error) {
      console.error('Error searching suppliers:', error);
      return [];
    }
  }

  // Product methods - Placeholder implementations
  async getProduct(id: string): Promise<Product | undefined> { 
    try {
      const result = await db.select().from(products).where(eq(products.id, id));
      return result[0];
    } catch (error) {
      console.error('Error getting product:', error);
      return undefined;
    }
  }

  async getProductsByStore(storeId: number): Promise<ProductWithSupplier[]> { 
    try {
      const result = await db
        .select({
          id: products.id,
          name: products.name,
          description: products.description,
          sku: products.sku,
          category: products.category,
          unit: products.unit,
          buyingPrice: products.buyingPrice,
          sellingPrice: products.sellingPrice,
          supplierId: products.supplierId,
          status: products.status,
          storeId: products.storeId,
          createdAt: products.createdAt,
          supplier: {
            id: suppliers.id,
            name: suppliers.name,
            contactPerson: suppliers.contactPerson,
            phone: suppliers.phone,
            email: suppliers.email,
            address: suppliers.address,
            description: suppliers.description,
            status: suppliers.status,
            storeId: suppliers.storeId,
            createdAt: suppliers.createdAt,
          }
        })
        .from(products)
        .leftJoin(suppliers, eq(products.supplierId, suppliers.id))
        .where(eq(products.storeId, storeId));
      return result;
    } catch (error) {
      console.error('Error getting products by store:', error);
      return [];
    }
  }

  async getProductsBySupplier(supplierId: string): Promise<Product[]> { 
    try {
      return await db.select().from(products).where(eq(products.supplierId, supplierId));
    } catch (error) {
      console.error('Error getting products by supplier:', error);
      return [];
    }
  }

  async getAllProducts(): Promise<ProductWithSupplier[]> { 
    try {
      const result = await db
        .select({
          id: products.id,
          name: products.name,
          description: products.description,
          sku: products.sku,
          category: products.category,
          unit: products.unit,
          buyingPrice: products.buyingPrice,
          sellingPrice: products.sellingPrice,
          supplierId: products.supplierId,
          status: products.status,
          storeId: products.storeId,
          createdAt: products.createdAt,
          supplier: {
            id: suppliers.id,
            name: suppliers.name,
            contactPerson: suppliers.contactPerson,
            phone: suppliers.phone,
            email: suppliers.email,
            address: suppliers.address,
            description: suppliers.description,
            status: suppliers.status,
            storeId: suppliers.storeId,
            createdAt: suppliers.createdAt,
          }
        })
        .from(products)
        .leftJoin(suppliers, eq(products.supplierId, suppliers.id));
      return result;
    } catch (error) {
      console.error('Error getting all products:', error);
      return [];
    }
  }

  async createProduct(product: InsertProduct): Promise<Product> { 
    try {
      const productId = randomUUID();
      await db.insert(products).values({
        id: productId,
        ...product
      });
      // MySQL doesn't support .returning(), so fetch the created product
      const result = await db.select().from(products).where(eq(products.id, productId)).limit(1);
      return result[0];
    } catch (error) {
      console.error('Error creating product:', error);
      throw error;
    }
  }

  async updateProduct(id: string, data: Partial<InsertProduct>): Promise<Product | undefined> { 
    try {
      await db.update(products).set(data).where(eq(products.id, id));
      // MySQL doesn't support .returning(), so fetch the updated product
      const result = await db.select().from(products).where(eq(products.id, id)).limit(1);
      return result[0];
    } catch (error) {
      console.error('Error updating product:', error);
      return undefined;
    }
  }

  async deleteProduct(id: string): Promise<void> { 
    try {
      await db.delete(products).where(eq(products.id, id));
    } catch (error) {
      console.error('Error deleting product:', error);
      throw error;
    }
  }

  async searchProducts(storeId: number, query: string): Promise<ProductWithSupplier[]> { 
    try {
      const result = await db
        .select({
          id: products.id,
          name: products.name,
          description: products.description,
          sku: products.sku,
          buyingPrice: products.buyingPrice,
          sellingPrice: products.sellingPrice,
          status: products.status,
          unit: products.unit,
          category: products.category,
          supplierId: products.supplierId,
          storeId: products.storeId,
          createdAt: products.createdAt,
          supplier: {
            id: suppliers.id,
            name: suppliers.name,
            phone: suppliers.phone,
            email: suppliers.email,
            address: suppliers.address,
            storeId: suppliers.storeId,
            createdAt: suppliers.createdAt,
          }
        })
        .from(products)
        .leftJoin(suppliers, eq(products.supplierId, suppliers.id))
        .where(
          and(
            eq(products.storeId, storeId),
            or(
              like(products.name, `%${query}%`),
              like(products.description, `%${query}%`),
              like(products.category, `%${query}%`)
            )
          )
        );
      return result;
    } catch (error) {
      console.error('Error searching products:', error);
      return [];
    }
  }

  // Inventory methods - Placeholder implementations
  async getInventory(id: string): Promise<Inventory | undefined> { 
    try {
      const result = await db.select().from(inventory).where(eq(inventory.id, id));
      return result[0];
    } catch (error) {
      console.error('Error getting inventory:', error);
      return undefined;
    }
  }

  async getInventoryByStore(storeId: number): Promise<InventoryWithProduct[]> { 
    try {
      const result = await db
        .select({
          id: inventory.id,
          productId: inventory.productId,
          storeId: inventory.storeId,
          currentStock: inventory.currentStock,
          minimumStock: inventory.minimumStock,
          maximumStock: inventory.maximumStock,
          lastUpdated: inventory.lastUpdated,
          createdAt: inventory.createdAt,
          product: {
            id: products.id,
            name: products.name,
            description: products.description,
            sku: products.sku,
          buyingPrice: products.buyingPrice,
          sellingPrice: products.sellingPrice,
          status: products.status,
            unit: products.unit,
            category: products.category,
            supplierId: products.supplierId,
            storeId: products.storeId,
            createdAt: products.createdAt,
          }
        })
        .from(inventory)
        .leftJoin(products, eq(inventory.productId, products.id))
        .where(eq(inventory.storeId, storeId));
      return result;
    } catch (error) {
      console.error('Error getting inventory by store:', error);
      return [];
    }
  }

  async getInventoryByProduct(productId: string): Promise<Inventory | undefined> { 
    try {
      const result = await db.select().from(inventory).where(eq(inventory.productId, productId));
      return result[0];
    } catch (error) {
      console.error('Error getting inventory by product:', error);
      return undefined;
    }
  }

  async createInventory(inventoryData: InsertInventory): Promise<Inventory> { 
    try {
      const inventoryId = randomUUID();
      await db.insert(inventory).values({
        id: inventoryId,
        ...inventoryData
      });
      // MySQL doesn't support .returning(), so fetch the created inventory
      const result = await db.select().from(inventory).where(eq(inventory.id, inventoryId)).limit(1);
      return result[0];
    } catch (error) {
      console.error('Error creating inventory:', error);
      throw error;
    }
  }

  async updateInventory(id: string, data: Partial<InsertInventory>): Promise<Inventory | undefined> { 
    try {
      await db.update(inventory).set(data).where(eq(inventory.id, id));
      // MySQL doesn't support .returning(), so fetch the updated inventory
      const result = await db.select().from(inventory).where(eq(inventory.id, id)).limit(1);
      return result[0];
    } catch (error) {
      console.error('Error updating inventory:', error);
      return undefined;
    }
  }

  async updateInventoryStock(productId: string, newStock: string): Promise<Inventory | undefined> { 
    try {
      await db.update(inventory).set({ 
        currentStock: newStock,
        lastUpdated: new Date()
      }).where(eq(inventory.productId, productId));
      // MySQL doesn't support .returning(), so fetch the updated inventory
      const result = await db.select().from(inventory).where(eq(inventory.productId, productId)).limit(1);
      return result[0];
    } catch (error) {
      console.error('Error updating inventory stock:', error);
      return undefined;
    }
  }

  // Inventory Transaction methods - Placeholder implementations
  async getInventoryTransaction(id: string): Promise<InventoryTransaction | undefined> { 
    try {
      const result = await db.select().from(inventoryTransactions).where(eq(inventoryTransactions.id, id));
      return result[0];
    } catch (error) {
      console.error('Error getting inventory transaction:', error);
      return undefined;
    }
  }

  async getInventoryTransactionsByStore(storeId: number): Promise<InventoryTransactionWithProduct[]> { 
    try {
      const result = await db
        .select({
          id: inventoryTransactions.id,
          productId: inventoryTransactions.productId,
          storeId: inventoryTransactions.storeId,
          type: inventoryTransactions.type,
          quantity: inventoryTransactions.quantity,
          referenceType: inventoryTransactions.referenceType,
          referenceId: inventoryTransactions.referenceId,
          notes: inventoryTransactions.notes,
          userId: inventoryTransactions.userId,
          createdAt: inventoryTransactions.createdAt,
          product: {
            id: products.id,
            name: products.name,
            description: products.description,
            sku: products.sku,
          buyingPrice: products.buyingPrice,
          sellingPrice: products.sellingPrice,
          status: products.status,
            unit: products.unit,
            category: products.category,
            supplierId: products.supplierId,
            storeId: products.storeId,
            createdAt: products.createdAt,
          }
        })
        .from(inventoryTransactions)
        .innerJoin(products, eq(inventoryTransactions.productId, products.id))
        .where(eq(inventoryTransactions.storeId, storeId))
        .orderBy(desc(inventoryTransactions.createdAt));
      return result;
    } catch (error) {
      console.error('Error getting inventory transactions by store:', error);
      return [];
    }
  }

  async getInventoryTransactionsByProduct(productId: string): Promise<InventoryTransactionWithProduct[]> { 
    try {
      const result = await db
        .select({
          id: inventoryTransactions.id,
          productId: inventoryTransactions.productId,
          storeId: inventoryTransactions.storeId,
          type: inventoryTransactions.type,
          quantity: inventoryTransactions.quantity,
          referenceType: inventoryTransactions.referenceType,
          referenceId: inventoryTransactions.referenceId,
          notes: inventoryTransactions.notes,
          userId: inventoryTransactions.userId,
          createdAt: inventoryTransactions.createdAt,
          product: {
            id: products.id,
            name: products.name,
            description: products.description,
            sku: products.sku,
          buyingPrice: products.buyingPrice,
          sellingPrice: products.sellingPrice,
          status: products.status,
            unit: products.unit,
            category: products.category,
            supplierId: products.supplierId,
            storeId: products.storeId,
            createdAt: products.createdAt,
          }
        })
        .from(inventoryTransactions)
        .innerJoin(products, eq(inventoryTransactions.productId, products.id))
        .where(eq(inventoryTransactions.productId, productId))
        .orderBy(desc(inventoryTransactions.createdAt));
      return result;
    } catch (error) {
      console.error('Error getting inventory transactions by product:', error);
      return [];
    }
  }

  async createInventoryTransaction(transaction: InsertInventoryTransaction): Promise<InventoryTransaction> { 
    try {
      const transactionId = randomUUID();
      await db.insert(inventoryTransactions).values({
        id: transactionId,
        ...transaction
      });
      // MySQL doesn't support .returning(), so fetch the created transaction
      const result = await db.select().from(inventoryTransactions).where(eq(inventoryTransactions.id, transactionId)).limit(1);
      return result[0];
    } catch (error) {
      console.error('Error creating inventory transaction:', error);
      throw error;
    }
  }
}

// Export the DatabaseStorage instance
export const storage = new DatabaseStorage();