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
  createCashflow(cashflow: InsertCashflow, createdBy?: string): Promise<Cashflow>;
  
  // Payroll methods
  getPayroll(id: string): Promise<Payroll | undefined>;
  getPayrollByUser(userId: string): Promise<Payroll[]>;
  getPayrollByUserStoreMonth(userId: string, storeId: number, month: string): Promise<Payroll | undefined>;
  getAllPayroll(): Promise<Payroll[]>;
  createPayroll(payroll: InsertPayroll): Promise<Payroll>;
  updatePayrollStatus(id: string, status: string): Promise<Payroll | undefined>;
  
  // Proposal methods
  getProposal(id: string): Promise<Proposal | undefined>;
  getProposalsByStore(storeId: number): Promise<Proposal[]>;
  getAllProposals(): Promise<Proposal[]>;
  createProposal(proposal: InsertProposal): Promise<Proposal>;
  updateProposalStatus(id: string, status: string, reviewedBy: string): Promise<Proposal | undefined>;
  
  // Overtime methods
  getOvertime(id: string): Promise<Overtime | undefined>;
  getOvertimeByStore(storeId: number): Promise<Overtime[]>;
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
  findOrCreatePiutangManager(storeId: number): Promise<Customer>;
  createQrisExpenseForManager(salesRecord: Sales): Promise<void>;
  
  // Piutang methods
  getPiutang(id: string): Promise<Piutang | undefined>;
  getPiutangByStore(storeId: number): Promise<Piutang[]>;
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
import { eq, and, gte, lte, like, or, desc, asc } from "drizzle-orm";
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
      return await db.select().from(users);
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
          password: users.password,
          name: users.name,
          role: users.role,
          phone: users.phone,
          salary: users.salary,
          createdAt: users.createdAt,
        })
        .from(users)
        .innerJoin(userStores, eq(users.id, userStores.userId))
        .where(eq(userStores.storeId, storeId));
      return result;
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
      await db.insert(sales).values({
        id: salesId,
        ...salesData
      });
      // MySQL doesn't support .returning(), so fetch the created sales
      const result = await db.select().from(sales).where(eq(sales.id, salesId)).limit(1);
      return result[0];
    } catch (error) {
      console.error('Error creating sales:', error);
      throw error;
    }
  }

  async deleteSales(id: string): Promise<void> {
    try {
      await db.delete(sales).where(eq(sales.id, id));
    } catch (error) {
      console.error('Error deleting sales:', error);
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

  async createCashflow(cashflowData: InsertCashflow, createdBy?: string): Promise<Cashflow> {
    try {
      const cashflowId = randomUUID();
      await db.insert(cashflow).values({
        id: cashflowId,
        ...cashflowData,
        createdBy
      });
      // MySQL doesn't support .returning(), so fetch the created cashflow
      const result = await db.select().from(cashflow).where(eq(cashflow.id, cashflowId)).limit(1);
      return result[0];
    } catch (error) {
      console.error('Error creating cashflow:', error);
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
          eq(payroll.period, month)
        )
      ).limit(1);
      return result[0];
    } catch (error) {
      console.error('Error getting payroll by user, store and month:', error);
      return undefined;
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
      const result = await db.update(overtime).set({ 
        status, 
        approvedBy 
      }).where(eq(overtime.id, id)).returning();
      return result[0];
    } catch (error) {
      console.error('Error updating overtime status:', error);
      return undefined;
    }
  }

  async updateOvertimeHours(id: string, hours: string, reason: string): Promise<Overtime | undefined> {
    try {
      const result = await db.update(overtime).set({ 
        hours,
        reason 
      }).where(eq(overtime.id, id)).returning();
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

  // Helper methods for QRIS management
  async findOrCreatePiutangManager(storeId: number): Promise<Customer> {
    try {
      // Look for existing QRIS Manager
      const existing = await db.select().from(customers).where(
        and(
          eq(customers.storeId, storeId),
          eq(customers.name, "QRIS Manager")
        )
      );

      if (existing.length > 0) {
        return existing[0];
      }

      // Create new QRIS Manager
      const result = await db.insert(customers).values({
        id: randomUUID(),
        storeId,
        name: "QRIS Manager",
        phone: "",
        email: "",
        address: "",
        notes: "Auto-created for QRIS transaction management"
      }).returning();

      return result[0];
    } catch (error) {
      console.error('Error finding/creating QRIS manager:', error);
      throw error;
    }
  }

  async createQrisExpenseForManager(salesRecord: Sales): Promise<void> {
    try {
      if (!salesRecord.totalQris || Number(salesRecord.totalQris) <= 0) {
        return;
      }

      const manager = await this.findOrCreatePiutangManager(salesRecord.storeId);

      // Create piutang record for QRIS fee (2.7% of QRIS sales)
      const qrisAmount = Number(salesRecord.totalQris);
      const feeAmount = qrisAmount * 0.027; // 2.7% fee

      await db.insert(piutang).values({
        id: randomUUID(),
        customerId: manager.id,
        storeId: salesRecord.storeId,
        amount: feeAmount.toString(),
        description: `QRIS fee 2.7% from sales ${salesRecord.date}`,
        type: "pemberian_utang",
        status: "pending",
        userId: salesRecord.userId
      });
    } catch (error) {
      console.error('Error creating QRIS expense for manager:', error);
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

  async getPiutangByStore(storeId: number): Promise<Piutang[]> {
    try {
      return await db.select().from(piutang).where(eq(piutang.storeId, storeId)).orderBy(desc(piutang.createdAt));
    } catch (error) {
      console.error('Error getting piutang by store:', error);
      return [];
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
      const result = await db.insert(piutang).values({
        id: randomUUID(),
        ...piutangData
      }).returning();
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
      
      const result = await db.update(piutang).set(updateData).where(eq(piutang.id, id)).returning();
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
        amount: Number(amount),
        type: 'income',
        description: `Pembayaran piutang: ${description}`,
        date: new Date(),
        category: 'piutang_payment'
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
      const result = await db.insert(wallets).values({
        id: randomUUID(),
        ...walletData
      }).returning();
      return result[0];
    } catch (error) {
      console.error('Error creating wallet:', error);
      throw error;
    }
  }

  async updateWallet(id: string, data: Partial<InsertWallet>): Promise<Wallet | undefined> {
    try {
      const result = await db.update(wallets).set(data).where(eq(wallets.id, id)).returning();
      return result[0];
    } catch (error) {
      console.error('Error updating wallet:', error);
      return undefined;
    }
  }

  async updateWalletBalance(id: string, balance: string): Promise<Wallet | undefined> {
    try {
      const result = await db.update(wallets).set({ balance }).where(eq(wallets.id, id)).returning();
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
        const result = await db.update(payrollConfig).set(config).where(eq(payrollConfig.id, existing.id)).returning();
        return result[0];
      } else {
        // Create new config
        const result = await db.insert(payrollConfig).values({
          id: randomUUID(),
          ...config
        }).returning();
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
      const result = await db.insert(suppliers).values({
        id: randomUUID(),
        ...supplier
      }).returning();
      return result[0];
    } catch (error) {
      console.error('Error creating supplier:', error);
      throw error;
    }
  }

  async updateSupplier(id: string, data: Partial<InsertSupplier>): Promise<Supplier | undefined> { 
    try {
      const result = await db.update(suppliers).set(data).where(eq(suppliers.id, id)).returning();
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
          price: products.price,
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
          price: products.price,
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
        .leftJoin(suppliers, eq(products.supplierId, suppliers.id));
      return result;
    } catch (error) {
      console.error('Error getting all products:', error);
      return [];
    }
  }

  async createProduct(product: InsertProduct): Promise<Product> { 
    try {
      const result = await db.insert(products).values({
        id: randomUUID(),
        ...product
      }).returning();
      return result[0];
    } catch (error) {
      console.error('Error creating product:', error);
      throw error;
    }
  }

  async updateProduct(id: string, data: Partial<InsertProduct>): Promise<Product | undefined> { 
    try {
      const result = await db.update(products).set(data).where(eq(products.id, id)).returning();
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
          price: products.price,
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
          stock: inventory.stock,
          minStock: inventory.minStock,
          maxStock: inventory.maxStock,
          lastRestockDate: inventory.lastRestockDate,
          createdAt: inventory.createdAt,
          product: {
            id: products.id,
            name: products.name,
            description: products.description,
            price: products.price,
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
      const result = await db.insert(inventory).values({
        id: randomUUID(),
        ...inventoryData
      }).returning();
      return result[0];
    } catch (error) {
      console.error('Error creating inventory:', error);
      throw error;
    }
  }

  async updateInventory(id: string, data: Partial<InsertInventory>): Promise<Inventory | undefined> { 
    try {
      const result = await db.update(inventory).set(data).where(eq(inventory.id, id)).returning();
      return result[0];
    } catch (error) {
      console.error('Error updating inventory:', error);
      return undefined;
    }
  }

  async updateInventoryStock(productId: string, newStock: string): Promise<Inventory | undefined> { 
    try {
      const result = await db.update(inventory).set({ 
        stock: newStock,
        lastRestockDate: new Date()
      }).where(eq(inventory.productId, productId)).returning();
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
          reason: inventoryTransactions.reason,
          userId: inventoryTransactions.userId,
          createdAt: inventoryTransactions.createdAt,
          product: {
            id: products.id,
            name: products.name,
            description: products.description,
            price: products.price,
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
          reason: inventoryTransactions.reason,
          userId: inventoryTransactions.userId,
          createdAt: inventoryTransactions.createdAt,
          product: {
            id: products.id,
            name: products.name,
            description: products.description,
            price: products.price,
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
      const result = await db.insert(inventoryTransactions).values({
        id: randomUUID(),
        ...transaction
      }).returning();
      return result[0];
    } catch (error) {
      console.error('Error creating inventory transaction:', error);
      throw error;
    }
  }
}

// Export the DatabaseStorage instance
export const storage = new DatabaseStorage();