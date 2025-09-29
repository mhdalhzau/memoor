import { google } from "googleapis";
import {
  type Sales,
  type Attendance,
  type Cashflow,
  type Piutang,
  type User,
  type Store,
  type Customer,
} from "@shared/schema";

export interface GoogleSheetsConfig {
  spreadsheetId: string;
  worksheetName: string;
  credentialsJson: string;
}

export class GoogleSheetsService {
  private sheets: any;
  private config: GoogleSheetsConfig;
  private sheetId: number | null = null;

  constructor(config: GoogleSheetsConfig) {
    this.config = config;
    this.initializeSheets();
  }

  // Helper functions for proper Indonesian formatting
  private formatCurrency(value: string | number | null | undefined): string {
    if (!value) return "Rp 0";
    const numValue = typeof value === "string" ? parseFloat(value) : value;
    if (isNaN(numValue)) return "Rp 0";
    
    // Format as Indonesian Rupiah with proper thousands separator
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(numValue);
  }

  private formatNumber(value: string | number | null | undefined, decimals: number = 2): string {
    if (!value) return "0";
    const numValue = typeof value === "string" ? parseFloat(value) : value;
    if (isNaN(numValue)) return "0";
    
    // Format as Indonesian locale with proper decimal separator
    return new Intl.NumberFormat("id-ID", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(numValue);
  }

  private formatDate(date: string | Date | null | undefined): string {
    if (!date) return "";
    
    try {
      const dateObj = new Date(date);
      if (isNaN(dateObj.getTime())) return "";
      
      // Format as Indonesian business date: DD/MM/YYYY
      return new Intl.DateTimeFormat("id-ID", {
        day: "2-digit",
        month: "2-digit", 
        year: "numeric",
      }).format(dateObj);
    } catch (error) {
      console.error("Error formatting date:", error);
      return "";
    }
  }

  private formatDateTime(date: string | Date | null | undefined): string {
    if (!date) return "";
    
    try {
      const dateObj = new Date(date);
      if (isNaN(dateObj.getTime())) return "";
      
      // Format as Indonesian business datetime: DD/MM/YYYY HH:mm
      return new Intl.DateTimeFormat("id-ID", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }).format(dateObj);
    } catch (error) {
      console.error("Error formatting datetime:", error);
      return "";
    }
  }

  private sanitizeText(text: string | null | undefined): string {
    if (!text) return "";
    
    // Remove or replace problematic characters that could break CSV/spreadsheet import
    return text
      .replace(/"/g, '""') // Escape double quotes
      .replace(/\n/g, " ") // Replace newlines with spaces
      .replace(/\r/g, " ") // Replace carriage returns with spaces
      .replace(/\t/g, " ") // Replace tabs with spaces
      .replace(/[^\x20-\x7E\u00A0-\u024F\u1E00-\u1EFF]/g, "") // Remove non-printable characters but keep accented chars
      .trim();
  }

  private formatJsonDetails(jsonString: string | null | undefined): string {
    if (!jsonString) return "";
    
    try {
      // Try to parse and reformat JSON to ensure it's valid
      const parsed = JSON.parse(jsonString);
      
      // Convert to a safe string format for spreadsheet display
      if (Array.isArray(parsed)) {
        return parsed
          .map(item => {
            if (typeof item === "object" && item !== null) {
              // Format object as key: value pairs
              return Object.entries(item)
                .map(([key, value]) => `${key}: ${value}`)
                .join("; ");
            }
            return String(item);
          })
          .join(" | ");
      } else if (typeof parsed === "object" && parsed !== null) {
        // Format object as key: value pairs
        return Object.entries(parsed)
          .map(([key, value]) => `${key}: ${value}`)
          .join("; ");
      } else {
        return String(parsed);
      }
    } catch (error) {
      // If JSON parsing fails, sanitize the string and return it
      return this.sanitizeText(jsonString);
    }
  }

  private async initializeSheets() {
    try {
      const credentials = JSON.parse(this.config.credentialsJson);

      const auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ["https://www.googleapis.com/auth/spreadsheets"],
      });

      this.sheets = google.sheets({ version: "v4", auth });

      // Resolve and cache the sheetId for the worksheet
      await this.resolveSheetId();
    } catch (error) {
      console.error("Failed to initialize Google Sheets:", error);
      this.sheets = undefined; // Reset sheets instance on failure
      throw new Error("Google Sheets initialization failed");
    }
  }

  private parseGoogleApiError(error: any): { code: number; message: string } {
    // Parse Google API errors more reliably
    const status = error.response?.status || error.code || 500;
    const message =
      error.response?.data?.error?.message || error.message || "Unknown error";

    return { code: status, message };
  }

  private async resolveSheetId(): Promise<void> {
    try {
      const response = await this.sheets.spreadsheets.get({
        spreadsheetId: this.config.spreadsheetId,
      });

      const sheet = response.data.sheets?.find(
        (s: any) => s.properties?.title === this.config.worksheetName,
      );

      if (sheet) {
        this.sheetId = sheet.properties.sheetId;
        console.log(
          `Found worksheet "${this.config.worksheetName}" with ID: ${this.sheetId}`,
        );
      } else {
        console.warn(
          `Worksheet "${this.config.worksheetName}" not found, using sheetId: 0`,
        );
        this.sheetId = 0;
      }
    } catch (error) {
      console.error("Failed to resolve sheet ID:", error);
      this.sheetId = 0; // Fallback to first sheet
    }
  }

  private getWorksheetHeaders(worksheetType: string): string[] {
    switch (worksheetType) {
      case "sales":
        return [
          "ID Sales",
          "Nama Toko",
          "Tanggal",
          "Nama Staff",
          "Shift",
          "Jam Masuk",
          "Jam Keluar",
          "Meter Awal",
          "Meter Akhir",
          "Total Liter",
          "Total Penjualan",
          "Total QRIS",
          "Total Tunai",
          "Total Pemasukan",
          "Total Pengeluaran",
          "Detail Pemasukan",
          "Detail Pengeluaran",
          "User ID",
          "Tanggal Dibuat",
        ];
      case "attendance":
        return [
          "",
          "",
          "Nama Karyawan",
          "",
          "Nama Toko",
          "Tanggal",
          "Jam Masuk",
          "Jam Keluar",
          "Shift",
          "Terlambat (Menit)",
          "Lembur (Menit)",
          "Istirahat (Menit)",
          "Catatan",
          "Status Kehadiran",
          "Status Persetujuan",
          "Tanggal Dibuat",
        ];
      case "cashflow":
        return [
          "ID Cashflow",
          "Nama Staff",
          "Nama Toko",
          "Kategori",
          "Jenis",
          "Jumlah",
          "Keterangan",
          "Customer ID",
          "Status Pembayaran",
          "Jumlah Galon",
          "Pajak Ongkos",
          "Pajak Transfer",
          "Total Pengeluaran",
          "Konter",
          "Hasil",
          "Tanggal",
          "Tanggal Dibuat",
        ];
      case "piutang":
        return [
          "",
          "",
          "Nama Pelanggan",
          "",
          "Nama Toko",
          "Jumlah Piutang",
          "Keterangan",
          "Jatuh Tempo",
          "Status",
          "Jumlah Terbayar",
          "Tanggal Bayar",
          "",
          "Tanggal Dibuat",
        ];
      case "dashboard":
        return [
          "",
          "Nama Toko",
          "Total Penjualan",
          "Total Pemasukan",
          "Total Pengeluaran",
          "Total Cashflow",
          "Total Piutang",
          "Piutang Terbayar",
          "Piutang Belum Terbayar",
          "Karyawan Aktif",
          "Hadir Hari Ini",
          "Terlambat Hari Ini",
          "Bulan",
          "Terakhir Update",
        ];
      case "payroll":
        return [
          "ID",
          "Nama Karyawan",
          "Nama Toko",
          "Gaji Pokok",
          "Lembur",
          "Bonus",
          "Potongan",
          "Gaji Bersih",
          "Periode",
          "Tanggal Bayar",
        ];
      default:
        return ["", "Data", "Tanggal Dibuat"];
    }
  }

  async ensureHeadersExist(worksheetType: string = "sales"): Promise<void> {
    try {
      const headers = this.getWorksheetHeaders(worksheetType);
      const range = `${this.config.worksheetName}!A1:${String.fromCharCode(64 + headers.length)}1`;

      // Check if headers exist
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.config.spreadsheetId,
        range: range,
      });

      if (!response.data.values || response.data.values.length === 0) {
        // Add headers if they don't exist
        await this.sheets.spreadsheets.values.update({
          spreadsheetId: this.config.spreadsheetId,
          range: range,
          valueInputOption: "RAW",
          resource: {
            values: [headers],
          },
        });
      }
    } catch (error) {
      console.error("Failed to ensure headers exist:", error);
      throw error;
    }
  }

  private formatSalesDataForSheets(
    sales: Sales & { storeName?: string; userName?: string },
  ): (string | number)[] {
    return [
      this.sanitizeText(sales.id || ""), // Show ID for tracking
      this.sanitizeText(sales.storeName || ""), // Store name
      this.formatDate(sales.date), // Consistent Indonesian date format
      this.sanitizeText(sales.userName || ""), // Staff name
      this.sanitizeText(sales.shift || ""),
      this.sanitizeText(sales.checkIn || ""),
      this.sanitizeText(sales.checkOut || ""),
      this.formatNumber(sales.meterStart, 2), // Meter readings with 2 decimal places
      this.formatNumber(sales.meterEnd, 2),
      this.formatNumber(sales.totalLiters, 2),
      this.formatCurrency(sales.totalSales), // Proper Rupiah formatting
      this.formatCurrency(sales.totalQris),
      this.formatCurrency(sales.totalCash),
      this.formatCurrency(sales.totalIncome),
      this.formatCurrency(sales.totalExpenses),
      this.formatJsonDetails(sales.incomeDetails), // Properly formatted JSON
      this.formatJsonDetails(sales.expenseDetails), // Properly formatted JSON
      this.sanitizeText(sales.userId || ""), // Show user ID for reference
      this.formatDate(sales.createdAt), // Consistent date formatting
    ];
  }

  private formatAttendanceDataForSheets(
    attendance: Attendance & { userName?: string; storeName?: string },
  ): (string | number)[] {
    return [
      "", // Hide ID for cleaner view
      "", // Hide User ID for cleaner view
      this.sanitizeText(attendance.userName || ""),
      "", // Hide Store ID for cleaner view
      this.sanitizeText(attendance.storeName || ""),
      this.formatDateTime(attendance.date), // Consistent Indonesian datetime format
      this.sanitizeText(attendance.checkIn || ""),
      this.sanitizeText(attendance.checkOut || ""),
      this.sanitizeText(attendance.shift || ""),
      attendance.latenessMinutes || 0, // Keep as number for calculations
      attendance.overtimeMinutes || 0, // Keep as number for calculations
      attendance.breakDuration || 0, // Keep as number for calculations
      this.sanitizeText(attendance.notes || ""), // Sanitize notes to prevent CSV issues
      this.sanitizeText(attendance.attendanceStatus || ""),
      this.sanitizeText(attendance.status || ""),
      this.formatDate(attendance.createdAt), // Consistent date formatting
    ];
  }

  private formatCashflowDataForSheets(
    cashflow: Cashflow & { storeName?: string; userName?: string },
  ): (string | number)[] {
    return [
      this.sanitizeText(cashflow.id || ""), // Show ID for tracking
      this.sanitizeText(cashflow.userName || ""), // Staff name
      this.sanitizeText(cashflow.storeName || ""), // Store name
      this.sanitizeText(cashflow.category || ""),
      this.sanitizeText(cashflow.type || ""),
      this.formatCurrency(cashflow.amount), // Proper Rupiah formatting
      this.sanitizeText(cashflow.description || ""),
      this.sanitizeText(cashflow.customerId || ""), // Show Customer ID for reference
      this.sanitizeText(cashflow.paymentStatus || ""),
      this.formatNumber(cashflow.jumlahGalon, 2), // Gallon count with 2 decimals
      this.formatCurrency(cashflow.pajakOngkos), // Proper Rupiah formatting
      this.formatCurrency(cashflow.pajakTransfer), // Proper Rupiah formatting
      this.formatCurrency(cashflow.totalPengeluaran), // Proper Rupiah formatting
      this.sanitizeText(cashflow.konter || ""),
      this.formatCurrency(cashflow.hasil), // Proper Rupiah formatting
      this.formatDate(cashflow.date), // Consistent Indonesian date format
      this.formatDate(cashflow.createdAt), // Consistent date formatting
    ];
  }

  private formatPiutangDataForSheets(
    piutang: Piutang & { customerName?: string; storeName?: string },
  ): (string | number)[] {
    return [
      "", // Hide ID for cleaner view
      "", // Hide Customer ID for cleaner view
      this.sanitizeText(piutang.customerName || ""),
      "", // Hide Store ID for cleaner view
      this.sanitizeText(piutang.storeName || ""),
      this.formatCurrency(piutang.amount), // Proper Rupiah formatting
      this.sanitizeText(piutang.description || ""),
      this.formatDate(piutang.dueDate), // Consistent Indonesian date format
      this.sanitizeText(piutang.status || ""),
      this.formatCurrency(piutang.paidAmount), // Proper Rupiah formatting
      this.formatDate(piutang.paidAt), // Consistent date formatting
      "", // Hide Created By ID for cleaner view
      this.formatDate(piutang.createdAt), // Consistent date formatting
    ];
  }

  private formatDashboardDataForSheets(dashboard: any): (string | number)[] {
    return [
      "", // Hide Store ID for cleaner view
      this.sanitizeText(dashboard.storeName || ""),
      this.formatCurrency(dashboard.totalSales), // Proper Rupiah formatting
      this.formatCurrency(dashboard.totalIncome), // Proper Rupiah formatting
      this.formatCurrency(dashboard.totalExpenses), // Proper Rupiah formatting
      this.formatCurrency(dashboard.totalCashflow), // Proper Rupiah formatting
      this.formatCurrency(dashboard.totalPiutang), // Proper Rupiah formatting
      this.formatCurrency(dashboard.paidPiutang), // Proper Rupiah formatting
      this.formatCurrency(dashboard.outstandingPiutang), // Proper Rupiah formatting
      dashboard.activeUsers || 0, // Keep as number for count
      dashboard.presentToday || 0, // Keep as number for count
      dashboard.lateToday || 0, // Keep as number for count
      this.sanitizeText(dashboard.month || ""),
      this.formatDate(new Date()), // Consistent Indonesian date format
    ];
  }

  async appendSalesData(sales: Sales): Promise<void> {
    try {
      await this.ensureHeadersExist("sales");

      const values = [this.formatSalesDataForSheets(sales)];

      await this.sheets.spreadsheets.values.append({
        spreadsheetId: this.config.spreadsheetId,
        range: `${this.config.worksheetName}!A:U`,
        valueInputOption: "RAW",
        insertDataOption: "INSERT_ROWS",
        resource: {
          values,
        },
      });

      console.log(`Sales data appended to Google Sheets: ${sales.id}`);
    } catch (error) {
      console.error("Failed to append sales data to Google Sheets:", error);
      throw error;
    }
  }

  async updateSalesData(sales: Sales): Promise<void> {
    try {
      const rowIndex = await this.findRowIndexBySalesId(sales.id || "");

      if (rowIndex !== null) {
        const values = [this.formatSalesDataForSheets(sales)];

        await this.sheets.spreadsheets.values.update({
          spreadsheetId: this.config.spreadsheetId,
          range: `${this.config.worksheetName}!A${rowIndex + 1}:U${rowIndex + 1}`, // +1 because sheet rows are 1-indexed
          valueInputOption: "RAW",
          resource: {
            values,
          },
        });

        console.log(
          `Sales data updated in Google Sheets: ${sales.id} at row ${rowIndex + 1}`,
        );
      } else {
        console.warn(
          `Sales ID ${sales.id} not found for update, appending new row instead`,
        );
        await this.appendSalesData(sales);
      }
    } catch (error) {
      console.error("Failed to update sales data in Google Sheets:", error);
      throw error;
    }
  }

  async findRowIndexBySalesId(salesId: string): Promise<number | null> {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.config.spreadsheetId,
        range: `${this.config.worksheetName}!A:A`,
      });

      if (response.data.values) {
        const rowIndex = response.data.values.findIndex(
          (row: string[]) => row[0] === salesId,
        );
        return rowIndex > 0 ? rowIndex : null; // Skip header row (index 0)
      }
      return null;
    } catch (error) {
      console.error("Failed to find row index by sales ID:", error);
      return null;
    }
  }

  async deleteSalesData(salesId: string): Promise<void> {
    try {
      const rowIndex = await this.findRowIndexBySalesId(salesId);

      if (rowIndex !== null) {
        await this.sheets.spreadsheets.batchUpdate({
          spreadsheetId: this.config.spreadsheetId,
          resource: {
            requests: [
              {
                deleteDimension: {
                  range: {
                    sheetId: this.sheetId || 0,
                    dimension: "ROWS",
                    startIndex: rowIndex,
                    endIndex: rowIndex + 1,
                  },
                },
              },
            ],
          },
        });

        console.log(`Sales data deleted from Google Sheets: ${salesId}`);
      } else {
        console.warn(
          `Sales ID ${salesId} not found in Google Sheets for deletion`,
        );
      }
    } catch (error) {
      console.error("Failed to delete sales data from Google Sheets:", error);
      throw error;
    }
  }

  async syncAllSalesData(
    salesData: (Sales & { storeName?: string; userName?: string })[],
  ): Promise<void> {
    try {
      await this.ensureHeadersExist("sales");

      // Clear existing data (except headers)
      await this.sheets.spreadsheets.values.clear({
        spreadsheetId: this.config.spreadsheetId,
        range: `${this.config.worksheetName}!A2:U`,
      });

      if (salesData.length > 0) {
        const values = salesData.map((sales) =>
          this.formatSalesDataForSheets(sales),
        );

        await this.sheets.spreadsheets.values.append({
          spreadsheetId: this.config.spreadsheetId,
          range: `${this.config.worksheetName}!A2:U`,
          valueInputOption: "RAW",
          insertDataOption: "INSERT_ROWS",
          resource: {
            values,
          },
        });
      }

      console.log(`Synced ${salesData.length} sales records to Google Sheets`);
    } catch (error) {
      console.error("Failed to sync all sales data to Google Sheets:", error);
      throw error;
    }
  }

  // Attendance sync methods
  async syncAllAttendanceData(
    attendanceData: (Attendance & { userName?: string; storeName?: string })[],
  ): Promise<void> {
    try {
      await this.ensureHeadersExist("attendance");

      const headers = this.getWorksheetHeaders("attendance");
      const range = `${this.config.worksheetName}!A2:${String.fromCharCode(64 + headers.length)}`;

      // Clear existing data (except headers)
      await this.sheets.spreadsheets.values.clear({
        spreadsheetId: this.config.spreadsheetId,
        range: range,
      });

      if (attendanceData.length > 0) {
        const values = attendanceData.map((attendance) =>
          this.formatAttendanceDataForSheets(attendance),
        );

        await this.sheets.spreadsheets.values.append({
          spreadsheetId: this.config.spreadsheetId,
          range: range,
          valueInputOption: "RAW",
          insertDataOption: "INSERT_ROWS",
          resource: {
            values,
          },
        });
      }

      console.log(
        `Synced ${attendanceData.length} attendance records to Google Sheets`,
      );
    } catch (error) {
      console.error("Failed to sync attendance data to Google Sheets:", error);
      throw error;
    }
  }

  // Cashflow sync methods
  async syncAllCashflowData(
    cashflowData: (Cashflow & { storeName?: string; userName?: string })[],
  ): Promise<void> {
    try {
      await this.ensureHeadersExist("cashflow");

      const headers = this.getWorksheetHeaders("cashflow");
      const range = `${this.config.worksheetName}!A2:${String.fromCharCode(64 + headers.length)}`;

      // Clear existing data (except headers)
      await this.sheets.spreadsheets.values.clear({
        spreadsheetId: this.config.spreadsheetId,
        range: range,
      });

      if (cashflowData.length > 0) {
        const values = cashflowData.map((cashflow) =>
          this.formatCashflowDataForSheets(cashflow),
        );

        await this.sheets.spreadsheets.values.append({
          spreadsheetId: this.config.spreadsheetId,
          range: range,
          valueInputOption: "RAW",
          insertDataOption: "INSERT_ROWS",
          resource: {
            values,
          },
        });
      }

      console.log(
        `Synced ${cashflowData.length} cashflow records to Google Sheets`,
      );
    } catch (error) {
      console.error("Failed to sync cashflow data to Google Sheets:", error);
      throw error;
    }
  }

  // Piutang sync methods
  async syncAllPiutangData(
    piutangData: (Piutang & { customerName?: string; storeName?: string })[],
  ): Promise<void> {
    try {
      await this.ensureHeadersExist("piutang");

      const headers = this.getWorksheetHeaders("piutang");
      const range = `${this.config.worksheetName}!A2:${String.fromCharCode(64 + headers.length)}`;

      // Clear existing data (except headers)
      await this.sheets.spreadsheets.values.clear({
        spreadsheetId: this.config.spreadsheetId,
        range: range,
      });

      if (piutangData.length > 0) {
        const values = piutangData.map((piutang) =>
          this.formatPiutangDataForSheets(piutang),
        );

        await this.sheets.spreadsheets.values.append({
          spreadsheetId: this.config.spreadsheetId,
          range: range,
          valueInputOption: "RAW",
          insertDataOption: "INSERT_ROWS",
          resource: {
            values,
          },
        });
      }

      console.log(
        `Synced ${piutangData.length} piutang records to Google Sheets`,
      );
    } catch (error) {
      console.error("Failed to sync piutang data to Google Sheets:", error);
      throw error;
    }
  }

  // Dashboard sync methods
  async syncDashboardData(dashboardData: any[]): Promise<void> {
    try {
      await this.ensureHeadersExist("dashboard");

      const headers = this.getWorksheetHeaders("dashboard");
      const range = `${this.config.worksheetName}!A2:${String.fromCharCode(64 + headers.length)}`;

      // Clear existing data (except headers)
      await this.sheets.spreadsheets.values.clear({
        spreadsheetId: this.config.spreadsheetId,
        range: range,
      });

      if (dashboardData.length > 0) {
        const values = dashboardData.map((dashboard) =>
          this.formatDashboardDataForSheets(dashboard),
        );

        await this.sheets.spreadsheets.values.append({
          spreadsheetId: this.config.spreadsheetId,
          range: range,
          valueInputOption: "RAW",
          insertDataOption: "INSERT_ROWS",
          resource: {
            values,
          },
        });
      }

      console.log(
        `Synced ${dashboardData.length} dashboard records to Google Sheets`,
      );
    } catch (error) {
      console.error("Failed to sync dashboard data to Google Sheets:", error);
      throw error;
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.sheets.spreadsheets.get({
        spreadsheetId: this.config.spreadsheetId,
      });
      return true;
    } catch (error) {
      console.error("Google Sheets connection test failed:", error);
      return false;
    }
  }

  async listWorksheets(): Promise<
    Array<{ name: string; id: number; rowCount: number; columnCount: number }>
  > {
    try {
      const response = await this.sheets.spreadsheets.get({
        spreadsheetId: this.config.spreadsheetId,
      });

      const sheets = response.data.sheets || [];
      return sheets.map((sheet) => ({
        name: sheet.properties?.title || "Untitled",
        id: sheet.properties?.sheetId || 0,
        rowCount: sheet.properties?.gridProperties?.rowCount || 0,
        columnCount: sheet.properties?.gridProperties?.columnCount || 0,
      }));
    } catch (error: any) {
      console.error("Failed to list worksheets:", error);

      if (error.code === 403) {
        throw new Error(
          "Permission denied. Make sure the service account has view access to this spreadsheet.",
        );
      } else if (error.code === 404) {
        throw new Error(
          "Spreadsheet not found. Please check the spreadsheet ID.",
        );
      } else if (error.code === 429) {
        throw new Error(
          "Rate limit exceeded. Please wait a moment and try again.",
        );
      } else if (error.code === "ENOTFOUND" || error.code === "ECONNREFUSED") {
        throw new Error(
          "Network error. Please check your internet connection.",
        );
      }

      throw new Error(`Failed to list worksheets: ${error.message}`);
    }
  }

  async createWorksheet(
    name: string,
  ): Promise<{ worksheetId: number; name: string }> {
    try {
      // Validate worksheet name
      if (!name || name.trim().length === 0) {
        throw new Error("Worksheet name cannot be empty");
      }

      if (name.length > 100) {
        throw new Error("Worksheet name cannot exceed 100 characters");
      }

      // Check for invalid characters (Google Sheets doesn't allow these)
      const invalidChars = /[:\/\\\?\*\[\]]/g;
      if (invalidChars.test(name)) {
        throw new Error(
          "Worksheet name contains invalid characters. Avoid: : / \\ ? * [ ]",
        );
      }

      // Check if worksheet already exists
      const existingSheets = await this.listWorksheets();
      const nameExists = existingSheets.some(
        (sheet) => sheet.name.toLowerCase() === name.toLowerCase(),
      );

      if (nameExists) {
        throw new Error(
          `Worksheet "${name}" already exists. Please choose a different name.`,
        );
      }

      const response = await this.sheets.spreadsheets.batchUpdate({
        spreadsheetId: this.config.spreadsheetId,
        resource: {
          requests: [
            {
              addSheet: {
                properties: {
                  title: name.trim(),
                  gridProperties: {
                    rowCount: 1000,
                    columnCount: 26,
                  },
                },
              },
            },
          ],
        },
      });

      const newSheet = response.data.replies?.[0]?.addSheet;
      if (!newSheet) {
        throw new Error(
          "Failed to create worksheet - no response from Google Sheets API",
        );
      }

      const worksheetId = newSheet.properties?.sheetId;
      if (worksheetId === undefined) {
        throw new Error("Failed to create worksheet - no sheet ID returned");
      }

      console.log(`Created worksheet "${name}" with ID: ${worksheetId}`);
      return { worksheetId, name: name.trim() };
    } catch (error: any) {
      console.error("Failed to create worksheet:", error);

      // Enhanced error handling with reliable error parsing
      const { code, message } = this.parseGoogleApiError(error);

      if (code === 400) {
        if (message?.includes("already exists")) {
          throw new Error(
            `Worksheet "${name}" already exists. Please choose a different name.`,
          );
        } else if (message?.includes("Invalid requests")) {
          throw new Error(
            `Invalid worksheet name "${name}". Please use only letters, numbers, and spaces.`,
          );
        }
      } else if (code === 403) {
        throw new Error(
          "Permission denied. Make sure the service account has edit access to this spreadsheet.",
        );
      } else if (code === 404) {
        throw new Error(
          "Spreadsheet not found. Please check the spreadsheet ID and permissions.",
        );
      } else if (code === 429) {
        throw new Error(
          "Rate limit exceeded. Please wait a moment and try again.",
        );
      } else if (error.code === "ENOTFOUND" || error.code === "ECONNREFUSED") {
        throw new Error(
          "Network error. Please check your internet connection.",
        );
      }

      throw error; // Re-throw if it's our custom error, otherwise create new error
    }
  }

  async switchWorksheet(worksheetName: string): Promise<void> {
    try {
      const worksheets = await this.listWorksheets();
      const targetWorksheet = worksheets.find(
        (ws) => ws.name.toLowerCase() === worksheetName.toLowerCase(),
      );

      if (!targetWorksheet) {
        const availableNames = worksheets.map((ws) => ws.name).join(", ");
        throw new Error(
          `Worksheet "${worksheetName}" not found. Available worksheets: ${availableNames || "None"}`,
        );
      }

      this.config.worksheetName = targetWorksheet.name;
      this.sheetId = targetWorksheet.id;

      console.log(
        `Switched to worksheet "${targetWorksheet.name}" (ID: ${targetWorksheet.id})`,
      );
    } catch (error: any) {
      console.error("Failed to switch worksheet:", error);
      throw error;
    }
  }

  async deleteWorksheet(worksheetName: string): Promise<void> {
    try {
      const worksheets = await this.listWorksheets();
      const targetWorksheet = worksheets.find(
        (ws) => ws.name.toLowerCase() === worksheetName.toLowerCase(),
      );

      if (!targetWorksheet) {
        throw new Error(`Worksheet "${worksheetName}" not found`);
      }

      // Prevent deletion of the last remaining worksheet
      if (worksheets.length <= 1) {
        throw new Error(
          "Cannot delete the last remaining worksheet in the spreadsheet",
        );
      }

      await this.sheets.spreadsheets.batchUpdate({
        spreadsheetId: this.config.spreadsheetId,
        resource: {
          requests: [
            {
              deleteSheet: {
                sheetId: targetWorksheet.id,
              },
            },
          ],
        },
      });

      console.log(
        `Deleted worksheet "${worksheetName}" (ID: ${targetWorksheet.id})`,
      );
    } catch (error: any) {
      console.error("Failed to delete worksheet:", error);

      if (error.code === 400) {
        if (error.message?.includes("Cannot delete")) {
          throw new Error(
            "Cannot delete this worksheet. It may be the only worksheet or is protected.",
          );
        }
      } else if (error.code === 403) {
        throw new Error(
          "Permission denied. Make sure the service account has edit access to this spreadsheet.",
        );
      } else if (error.code === 404) {
        throw new Error("Spreadsheet or worksheet not found.");
      }

      throw error;
    }
  }

  // Universal sync method that works with any data type
  async syncToWorksheet(
    worksheetName: string,
    data: any[],
    dataType: "sales" | "attendance" | "cashflow" | "piutang" | "dashboard",
  ): Promise<{ success: boolean; errorMessage?: string; recordCount: number }> {
    try {
      // Switch to the target worksheet
      const originalWorksheet = this.config.worksheetName;
      await this.switchWorksheet(worksheetName);

      try {
        // Sync data based on type
        switch (dataType) {
          case "sales":
            await this.syncAllSalesData(data);
            break;
          case "attendance":
            await this.syncAllAttendanceData(data);
            break;
          case "cashflow":
            await this.syncAllCashflowData(data);
            break;
          case "piutang":
            await this.syncAllPiutangData(data);
            break;
          case "dashboard":
            await this.syncDashboardData(data);
            break;
          default:
            throw new Error(`Unsupported data type: ${dataType}`);
        }

        console.log(
          `Successfully synced ${data.length} ${dataType} records to worksheet "${worksheetName}"`,
        );
        return {
          success: true,
          recordCount: data.length,
        };
      } finally {
        // Always switch back to original worksheet
        if (originalWorksheet !== worksheetName) {
          try {
            await this.switchWorksheet(originalWorksheet);
          } catch (switchBackError) {
            console.warn(
              `Failed to switch back to original worksheet "${originalWorksheet}":`,
              switchBackError,
            );
          }
        }
      }
    } catch (error: any) {
      console.error(`Failed to sync to worksheet "${worksheetName}":`, error);
      return {
        success: false,
        errorMessage: error.message,
        recordCount: 0,
      };
    }
  }

  // Read data from worksheet
  async readFromWorksheet(
    worksheetName: string,
  ): Promise<{ success: boolean; data: any[]; errorMessage?: string }> {
    try {
      const originalWorksheet = this.config.worksheetName;
      await this.switchWorksheet(worksheetName);

      try {
        const response = await this.sheets.spreadsheets.values.get({
          spreadsheetId: this.config.spreadsheetId,
          range: `${worksheetName}!A:ZZ`,
        });

        const values = response.data.values || [];
        if (values.length === 0) {
          return { success: true, data: [] };
        }

        // First row is headers, rest is data
        const headers = values[0];
        const rows = values.slice(1);

        const data = rows.map((row) => {
          const obj: any = {};
          headers.forEach((header: string, index: number) => {
            obj[header] = row[index] || "";
          });
          return obj;
        });

        console.log(
          `Successfully read ${data.length} records from worksheet "${worksheetName}"`,
        );
        return { success: true, data };
      } finally {
        if (originalWorksheet !== worksheetName) {
          try {
            await this.switchWorksheet(originalWorksheet);
          } catch (switchBackError) {
            console.warn(
              `Failed to switch back to original worksheet "${originalWorksheet}":`,
              switchBackError,
            );
          }
        }
      }
    } catch (error: any) {
      console.error(`Failed to read from worksheet "${worksheetName}":`, error);
      return {
        success: false,
        data: [],
        errorMessage: error.message,
      };
    }
  }

  // Enhanced sync methods as requested by user

  // Sales sync - separate worksheet per store
  async syncSalesDataPerStore(
    salesData: (Sales & { storeName?: string; userName?: string })[],
    stores: Array<{ id: number; name: string }>
  ): Promise<void> {
    try {
      console.log('🏪 Starting sales sync per store...');
      
      for (const store of stores) {
        const worksheetName = `Sales - ${store.name}`;
        
        // Create worksheet if it doesn't exist
        try {
          await this.createWorksheet(worksheetName);
        } catch (error: any) {
          if (!error.message.includes('already exists')) {
            console.error(`Failed to create worksheet "${worksheetName}":`, error);
          }
        }
        
        // Switch to this store's worksheet
        await this.switchWorksheet(worksheetName);
        
        // Filter data for this store
        const storeData = salesData.filter(s => 
          s.storeId === store.id || s.storeName === store.name
        );
        
        // Sync data to this worksheet
        await this.ensureHeadersExist('sales');
        
        if (storeData.length > 0) {
          // Clear existing data (except headers)
          await this.sheets.spreadsheets.values.clear({
            spreadsheetId: this.config.spreadsheetId,
            range: `${worksheetName}!A2:U`,
          });
          
          const values = storeData.map((sales) => this.formatSalesDataForSheets(sales));
          
          await this.sheets.spreadsheets.values.append({
            spreadsheetId: this.config.spreadsheetId,
            range: `${worksheetName}!A2:U`,
            valueInputOption: 'RAW',
            insertDataOption: 'INSERT_ROWS',
            resource: { values },
          });
        }
        
        console.log(`✅ Synced ${storeData.length} sales records for store: ${store.name}`);
      }
      
      console.log('🎉 Sales sync per store completed!');
    } catch (error) {
      console.error('Failed to sync sales data per store:', error);
      throw error;
    }
  }

  // Cashflow sync - separate worksheet per store
  async syncCashflowDataPerStore(
    cashflowData: (Cashflow & { storeName?: string; userName?: string })[],
    stores: Array<{ id: number; name: string }>
  ): Promise<void> {
    try {
      console.log('💰 Starting cashflow sync per store...');
      
      for (const store of stores) {
        const worksheetName = `Cashflow - ${store.name}`;
        
        // Create worksheet if it doesn't exist
        try {
          await this.createWorksheet(worksheetName);
        } catch (error: any) {
          if (!error.message.includes('already exists')) {
            console.error(`Failed to create worksheet "${worksheetName}":`, error);
          }
        }
        
        // Switch to this store's worksheet
        await this.switchWorksheet(worksheetName);
        
        // Filter data for this store
        const storeData = cashflowData.filter(c => 
          c.storeId === store.id || c.storeName === store.name
        );
        
        // Sync data to this worksheet
        await this.ensureHeadersExist('cashflow');
        
        if (storeData.length > 0) {
          // Clear existing data (except headers)
          const headers = this.getWorksheetHeaders('cashflow');
          const range = `${worksheetName}!A2:${String.fromCharCode(64 + headers.length)}`;
          
          await this.sheets.spreadsheets.values.clear({
            spreadsheetId: this.config.spreadsheetId,
            range: range,
          });
          
          const values = storeData.map((cashflow) => this.formatCashflowDataForSheets(cashflow));
          
          await this.sheets.spreadsheets.values.append({
            spreadsheetId: this.config.spreadsheetId,
            range: range,
            valueInputOption: 'RAW',
            insertDataOption: 'INSERT_ROWS',
            resource: { values },
          });
        }
        
        console.log(`✅ Synced ${storeData.length} cashflow records for store: ${store.name}`);
      }
      
      console.log('🎉 Cashflow sync per store completed!');
    } catch (error) {
      console.error('Failed to sync cashflow data per store:', error);
      throw error;
    }
  }

  // Attendance sync - 2 tables side by side with 5 column gap and 5 row offset
  async syncAttendanceSideBySide(
    attendanceData: (Attendance & { userName?: string; storeName?: string })[],
    stores: Array<{ id: number; name: string }>
  ): Promise<void> {
    try {
      console.log('👥 Starting attendance side-by-side sync...');
      const worksheetName = 'Absensi';
      
      // Create worksheet if it doesn't exist
      try {
        await this.createWorksheet(worksheetName);
      } catch (error: any) {
        if (!error.message.includes('already exists')) {
          console.error(`Failed to create worksheet "${worksheetName}":`, error);
        }
      }
      
      // Switch to attendance worksheet
      await this.switchWorksheet(worksheetName);
      
      // Clear entire worksheet first
      await this.sheets.spreadsheets.values.clear({
        spreadsheetId: this.config.spreadsheetId,
        range: `${worksheetName}!A:Z`,
      });
      
      const headers = this.getWorksheetHeaders('attendance');
      
      // Store 1 data - starts at A1
      const store1 = stores[0];
      if (store1) {
        const store1Data = attendanceData.filter(a => 
          a.storeId === store1.id || a.storeName === store1.name
        );
        
        // Add store 1 title and headers
        await this.sheets.spreadsheets.values.update({
          spreadsheetId: this.config.spreadsheetId,
          range: `${worksheetName}!A1:A1`,
          valueInputOption: 'RAW',
          resource: { values: [[`${store1.name} - Absensi`]] },
        });
        
        await this.sheets.spreadsheets.values.update({
          spreadsheetId: this.config.spreadsheetId,
          range: `${worksheetName}!A2:${String.fromCharCode(64 + headers.length)}2`,
          valueInputOption: 'RAW',
          resource: { values: [headers] },
        });
        
        if (store1Data.length > 0) {
          const values = store1Data.map(a => this.formatAttendanceDataForSheets(a));
          await this.sheets.spreadsheets.values.append({
            spreadsheetId: this.config.spreadsheetId,
            range: `${worksheetName}!A3:${String.fromCharCode(64 + headers.length)}`,
            valueInputOption: 'RAW',
            insertDataOption: 'INSERT_ROWS',
            resource: { values },
          });
        }
        
        console.log(`✅ Synced ${store1Data.length} attendance records for ${store1.name}`);
      }
      
      // Store 2 data - starts at column V (22nd column) with 5 column gap + 5 row offset
      const store2 = stores[1];
      if (store2) {
        const store2Data = attendanceData.filter(a => 
          a.storeId === store2.id || a.storeName === store2.name
        );
        
        const startCol = 'V'; // 5 column gap after previous table
        const titleRow = 6; // 5 rows down
        const headerRow = 7;
        const dataStartRow = 8;
        
        // Add store 2 title and headers
        await this.sheets.spreadsheets.values.update({
          spreadsheetId: this.config.spreadsheetId,
          range: `${worksheetName}!${startCol}${titleRow}:${startCol}${titleRow}`,
          valueInputOption: 'RAW',
          resource: { values: [[`${store2.name} - Absensi`]] },
        });
        
        const endCol = String.fromCharCode(startCol.charCodeAt(0) + headers.length - 1);
        await this.sheets.spreadsheets.values.update({
          spreadsheetId: this.config.spreadsheetId,
          range: `${worksheetName}!${startCol}${headerRow}:${endCol}${headerRow}`,
          valueInputOption: 'RAW',
          resource: { values: [headers] },
        });
        
        if (store2Data.length > 0) {
          const values = store2Data.map(a => this.formatAttendanceDataForSheets(a));
          await this.sheets.spreadsheets.values.append({
            spreadsheetId: this.config.spreadsheetId,
            range: `${worksheetName}!${startCol}${dataStartRow}:${endCol}`,
            valueInputOption: 'RAW',
            insertDataOption: 'INSERT_ROWS',
            resource: { values },
          });
        }
        
        console.log(`✅ Synced ${store2Data.length} attendance records for ${store2.name}`);
      }
      
      console.log('🎉 Attendance side-by-side sync completed!');
    } catch (error) {
      console.error('Failed to sync attendance side-by-side:', error);
      throw error;
    }
  }

  // Payroll sync - append without overwriting existing data
  async syncPayrollAutoGenerate(
    payrollData: any[],
    staff: Array<{ id: string; name: string }>
  ): Promise<void> {
    try {
      console.log('💼 Starting payroll auto-generate sync...');
      const worksheetName = 'Payroll';
      
      // Create worksheet if it doesn't exist
      try {
        await this.createWorksheet(worksheetName);
      } catch (error: any) {
        if (!error.message.includes('already exists')) {
          console.error(`Failed to create worksheet "${worksheetName}":`, error);
        }
      }
      
      // Switch to payroll worksheet
      await this.switchWorksheet(worksheetName);
      
      // Check if headers exist, if not create them
      const payrollHeaders = [
        'ID Payroll',
        'Nama Staff',
        'Bulan/Tahun',
        'Gaji Pokok',
        'Bonus',
        'Potongan',
        'Total Gaji',
        'Status Pembayaran',
        'Tanggal Bayar',
        'Catatan',
        'Tanggal Dibuat'
      ];
      
      // Check if there's any existing data
      const existingResponse = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.config.spreadsheetId,
        range: `${worksheetName}!A:A`,
      });
      
      const hasExistingData = existingResponse.data.values && existingResponse.data.values.length > 1;
      
      if (!hasExistingData) {
        // Add headers if no existing data
        await this.sheets.spreadsheets.values.update({
          spreadsheetId: this.config.spreadsheetId,
          range: `${worksheetName}!A1:${String.fromCharCode(64 + payrollHeaders.length)}1`,
          valueInputOption: 'RAW',
          resource: { values: [payrollHeaders] },
        });
      }
      
      // Format and append new payroll data (never overwrite)
      if (payrollData.length > 0) {
        const values = payrollData.map((payroll) => [
          payroll.id || '',
          payroll.staffName || payroll.userName || '',
          payroll.month || new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long' }),
          parseFloat(payroll.basicSalary || payroll.salary || '0'),
          parseFloat(payroll.bonus || '0'),
          parseFloat(payroll.deductions || '0'),
          parseFloat(payroll.totalSalary || '0'),
          payroll.paymentStatus || 'pending',
          payroll.paidAt ? new Date(payroll.paidAt).toLocaleDateString('id-ID') : '',
          payroll.notes || '',
          payroll.createdAt ? new Date(payroll.createdAt).toLocaleDateString('id-ID') : new Date().toLocaleDateString('id-ID')
        ]);
        
        // Always append to the end (never overwrite)
        await this.sheets.spreadsheets.values.append({
          spreadsheetId: this.config.spreadsheetId,
          range: `${worksheetName}!A:${String.fromCharCode(64 + payrollHeaders.length)}`,
          valueInputOption: 'RAW',
          insertDataOption: 'INSERT_ROWS',
          resource: { values },
        });
        
        console.log(`✅ Added ${payrollData.length} new payroll records`);
      }
      
      console.log('🎉 Payroll auto-generate sync completed!');
    } catch (error) {
      console.error('Failed to sync payroll auto-generate:', error);
      throw error;
    }
  }

  // Piutang sync - single worksheet
  async syncPiutangSingleWorksheet(
    piutangData: (Piutang & { customerName?: string; storeName?: string })[]
  ): Promise<void> {
    try {
      console.log('📋 Starting piutang single worksheet sync...');
      const worksheetName = 'Piutang';
      
      // Create worksheet if it doesn't exist
      try {
        await this.createWorksheet(worksheetName);
      } catch (error: any) {
        if (!error.message.includes('already exists')) {
          console.error(`Failed to create worksheet "${worksheetName}":`, error);
        }
      }
      
      // Switch to piutang worksheet
      await this.switchWorksheet(worksheetName);
      
      // Sync data to this worksheet
      await this.ensureHeadersExist('piutang');
      
      if (piutangData.length > 0) {
        // Clear existing data (except headers)
        const headers = this.getWorksheetHeaders('piutang');
        const range = `${worksheetName}!A2:${String.fromCharCode(64 + headers.length)}`;
        
        await this.sheets.spreadsheets.values.clear({
          spreadsheetId: this.config.spreadsheetId,
          range: range,
        });
        
        const values = piutangData.map((piutang) => this.formatPiutangDataForSheets(piutang));
        
        await this.sheets.spreadsheets.values.append({
          spreadsheetId: this.config.spreadsheetId,
          range: range,
          valueInputOption: 'RAW',
          insertDataOption: 'INSERT_ROWS',
          resource: { values },
        });
      }
      
      console.log(`✅ Synced ${piutangData.length} piutang records`);
      console.log('🎉 Piutang single worksheet sync completed!');
    } catch (error) {
      console.error('Failed to sync piutang single worksheet:', error);
      throw error;
    }
  }

  // Auto create organized worksheets
  async setupOrganizedWorksheets(): Promise<{
    success: boolean;
    worksheets: string[];
    errorMessage?: string;
  }> {
    try {
      const worksheetsToCreate = [
        "Absensi Per User",
        "Sales Per Toko",
        "Cashflow Per Toko",
        "Piutang Per User",
        "Dashboard Summary",
      ];

      const existingWorksheets = await this.listWorksheets();
      const existingNames = existingWorksheets.map((w) => w.name.toLowerCase());

      const createdWorksheets: string[] = [];

      for (const worksheetName of worksheetsToCreate) {
        if (!existingNames.includes(worksheetName.toLowerCase())) {
          try {
            await this.createWorksheet(worksheetName);
            createdWorksheets.push(worksheetName);
          } catch (error: any) {
            if (!error.message.includes("already exists")) {
              console.error(
                `Failed to create worksheet "${worksheetName}":`,
                error,
              );
            }
          }
        }
      }

      return {
        success: true,
        worksheets: createdWorksheets,
        errorMessage:
          createdWorksheets.length === 0
            ? "All worksheets already exist"
            : undefined,
      };
    } catch (error: any) {
      console.error("Failed to setup organized worksheets:", error);
      return {
        success: false,
        worksheets: [],
        errorMessage: error.message,
      };
    }
  }
  // Create new worksheet with timestamp and sync data
  async syncToNewWorksheet(
    pageType: string,
    data: any[],
    dataType: "sales" | "attendance" | "cashflow" | "piutang" | "dashboard" | "payroll",
    storeNames?: string[]
  ): Promise<{ success: boolean; worksheetName: string; recordCount: number; errorMessage?: string }> {
    try {
      // Generate unique worksheet name with timestamp
      const now = new Date();
      const timestamp = now.toISOString()
        .replace(/[:.]/g, '-')
        .replace('T', '_')
        .slice(0, -5); // Format: 2025-09-26_17-30-45
      const storeInfo = storeNames && storeNames.length > 0 ? ` (${storeNames.join(', ')})` : '';
      let worksheetName = `${pageType} ${timestamp}${storeInfo}`;
      
      // Ensure worksheet name doesn't exceed Google Sheets limit (100 chars)
      if (worksheetName.length > 95) {
        const baseLength = `${pageType} ${timestamp}`.length;
        const allowedStoreLength = 95 - baseLength - 4; // Reserve space for " (...)"
        if (allowedStoreLength > 0 && storeNames && storeNames.length > 0) {
          const truncatedStores = storeNames.join(', ').substring(0, allowedStoreLength);
          worksheetName = `${pageType} ${timestamp} (${truncatedStores}...)`;
        } else {
          worksheetName = `${pageType} ${timestamp}`;
        }
      }

      // Create the new worksheet
      console.log(`Creating new worksheet: ${worksheetName}`);
      await this.createWorksheet(worksheetName);

      // Switch to the new worksheet and sync data
      await this.switchWorksheet(worksheetName);
      
      // Ensure headers exist for the data type
      await this.ensureHeadersExist(dataType);

      // Sync data based on type
      switch (dataType) {
        case "sales":
          await this.syncAllSalesData(data);
          break;
        case "attendance":
          await this.syncAllAttendanceData(data);
          break;
        case "cashflow":
          await this.syncAllCashflowData(data);
          break;
        case "piutang":
          await this.syncAllPiutangData(data);
          break;
        case "dashboard":
          await this.syncDashboardData(data);
          break;
        case "payroll":
          // For payroll, use a generic sync method
          const payrollRows = data.map((item: any) => {
            return [
              item.id || "",
              item.employeeName || "",
              item.storeName || "",
              item.baseSalary || 0,
              item.overtime || 0,
              item.bonus || 0,
              item.deductions || 0,
              item.netPay || 0,
              item.payPeriod || "",
              item.payDate ? new Date(item.payDate).toLocaleDateString("id-ID") : "",
            ];
          });
          
          const payrollHeaders = [
            "ID", "Nama Karyawan", "Nama Toko", "Gaji Pokok", "Lembur", 
            "Bonus", "Potongan", "Gaji Bersih", "Periode", "Tanggal Bayar"
          ];
          
          // Clear existing data and add headers
          await this.clearWorksheetData();
          if (payrollRows.length > 0) {
            await this.sheets.spreadsheets.values.update({
              spreadsheetId: this.config.spreadsheetId,
              range: `${this.config.worksheetName}!A1:${String.fromCharCode(64 + payrollHeaders.length)}${payrollRows.length + 1}`,
              valueInputOption: "RAW",
              resource: {
                values: [payrollHeaders, ...payrollRows],
              },
            });
          }
          break;
        default:
          throw new Error(`Unsupported data type: ${dataType}`);
      }

      console.log(
        `Successfully synced ${data.length} ${dataType} records to new worksheet "${worksheetName}"`
      );
      
      return {
        success: true,
        worksheetName,
        recordCount: data.length,
      };
    } catch (error: any) {
      console.error("Failed to sync to new worksheet:", error);
      return {
        success: false,
        worksheetName: "",
        recordCount: 0,
        errorMessage: error.message,
      };
    }
  }
}

// Singleton instance
let googleSheetsService: GoogleSheetsService | null = null;

export function getGoogleSheetsService(): GoogleSheetsService | null {
  return googleSheetsService;
}

export function initializeGoogleSheetsService(
  config: GoogleSheetsConfig,
): GoogleSheetsService {
  googleSheetsService = new GoogleSheetsService(config);
  return googleSheetsService;
}

export function isGoogleSheetsConfigured(): boolean {
  return googleSheetsService !== null;
}
