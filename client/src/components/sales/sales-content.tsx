import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FileDown, FileSpreadsheet, TrendingUp, Upload, Loader2, Eye, Clock, Gauge, CreditCard, Calculator, Trash2, User, Calendar, Filter, Settings2, ArrowUpDown, ArrowUp, ArrowDown, MoreHorizontal, ChevronDown, Columns3, BarChart3, TrendingDown, CheckSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { formatRupiah, formatLiters, formatIndonesianDate, formatTime, formatPercentage, formatProfitLoss, formatCompactRupiah, formatDetailsSummary, parseDetailsJson } from "@/lib/utils";
import { type Sales } from "@shared/schema";
import { SyncButton } from "@/components/ui/sync-button";
import { z } from "zod";

// Function to get user name from userId
function getUserNameFromId(userId: string | null, allUsers: any[] = []): string {
  if (!userId) return 'Staff Tidak Diketahui';
  const user = allUsers.find(u => u.id === userId);
  return user?.name || 'Staff Tidak Diketahui';
}

// Table density type
type TableDensity = 'compact' | 'comfortable' | 'expanded';

// Column visibility state interface
interface ColumnVisibility {
  date: boolean;
  staff: boolean;
  shift: boolean;
  times: boolean;
  meterReadings: boolean;
  liters: boolean;
  transactions: boolean;
  totalSales: boolean;
  paymentBreakdown: boolean;
  incomeExpenses: boolean;
  profitLoss: boolean;
  averageTicket: boolean;
  details: boolean;
  performance: boolean;
  actions: boolean;
}

// Default column visibility
const DEFAULT_COLUMNS: ColumnVisibility = {
  date: true,
  staff: true,
  shift: true,
  times: false,
  meterReadings: true,
  liters: true,
  transactions: true,
  totalSales: true,
  paymentBreakdown: true,
  incomeExpenses: true,
  profitLoss: true,
  averageTicket: false,
  details: false,
  performance: false,
  actions: true,
};

// Sorting state interface
interface SortState {
  column: keyof Sales | null;
  direction: 'asc' | 'desc' | null;
}

// Sort sales records
function sortSalesRecords(records: Sales[], sortState: SortState): Sales[] {
  if (!sortState.column || !sortState.direction) {
    return records;
  }

  return [...records].sort((a, b) => {
    let aValue: any = a[sortState.column!];
    let bValue: any = b[sortState.column!];

    // Handle special cases
    if (sortState.column === 'date' || sortState.column === 'createdAt') {
      aValue = new Date(aValue || 0).getTime();
      bValue = new Date(bValue || 0).getTime();
    } else if (typeof aValue === 'string' && typeof bValue === 'string') {
      aValue = aValue.toLowerCase();
      bValue = bValue.toLowerCase();
    } else if (aValue === null || aValue === undefined) {
      aValue = 0;
    } else if (bValue === null || bValue === undefined) {
      bValue = 0;
    }

    if (aValue < bValue) {
      return sortState.direction === 'asc' ? -1 : 1;
    }
    if (aValue > bValue) {
      return sortState.direction === 'asc' ? 1 : -1;
    }
    return 0;
  });
}

// Text Import Modal Component
function TextImportModal({ storeId, storeName }: { storeId: number; storeName: string }) {
  console.log("🚀 TEXT IMPORT MODAL INITIALIZED");
  console.log("🏪 Store ID:", storeId);
  console.log("🏬 Store Name:", storeName);
  
  const [isOpen, setIsOpen] = useState(false);
  const [textData, setTextData] = useState("");
  const [parsedData, setParsedData] = useState<any>(null);
  const [step, setStep] = useState<"input" | "preview">("input");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Text import mutation
  const importTextMutation = useMutation({
    mutationFn: async (data: { storeId: number; textData: string }) => {
      console.log("🚀 TEXT IMPORT MUTATION STARTED");
      console.log("📝 Import Data:", JSON.stringify(data, null, 2));
      console.log("🏪 Target Store ID:", data.storeId);
      console.log("📊 Text Data Length:", data.textData.length, "characters");
      
      const response = await apiRequest('POST', '/api/sales/import-text', data);
      console.log("✅ TEXT IMPORT API RESPONSE:", response);
      return response;
    },
    onSuccess: (response) => {
      console.log("🎉 TEXT IMPORT SUCCESS!");
      console.log("📤 Success Response:", response);
      
      const details = [];
      details.push("✅ Sales record created");
      
      if (response.attendanceCreated) {
        details.push("✅ Attendance record created");
      }
      
      if (response.cashflowEntriesCreated > 0) {
        details.push(`✅ ${response.cashflowEntriesCreated} cashflow entries created`);
      }
      
      if (response.employeeMatched) {
        details.push("✅ Employee name matched with user account");
      }

      toast({
        title: "Import Successful!",
        description: `Sales data imported for ${storeName}:\n${details.join('\n')}`,
      });
      
      // Invalidate all related queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/sales'] });
      queryClient.invalidateQueries({ queryKey: ['/api/attendance'] });
      queryClient.invalidateQueries({ queryKey: ['/api/cashflow'] });
      
      setTextData("");
      setParsedData(null);
      setStep("input");
      setIsOpen(false);
    },
    onError: (error: any) => {
      console.error("🔥 TEXT IMPORT FAILED:", error);
      console.error("📋 Error Details:", {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      
      toast({
        title: "Import Failed",
        description: error.message || "Failed to import sales data",
        variant: "destructive",
      });
    },
  });

  // Parse text locally for preview
  const parseTextForPreview = (text: string) => {
    console.log("🚀 PARSING TEXT FOR PREVIEW");
    console.log("📝 Text Length:", text.length, "characters");
    
    const lines = text.split('\n').map(line => line.trim());
    console.log("📋 Total Lines:", lines.length);
    console.log("📄 Sample Lines:", lines.slice(0, 5));
    
    const data: any = {
      employeeName: null,
      shift: null,
      checkIn: null,
      checkOut: null,
      meterStart: null,
      meterEnd: null,
      totalLiters: null,
      totalCash: null,
      totalQris: null,
      totalSales: null,
      totalIncome: null,
      totalExpenses: null,
      expenseDetails: [],
      incomeDetails: [],
    };

    // Parse employee name and time
    for (const line of lines) {
      if (line.includes('Nama:')) {
        const nameMatch = line.match(/Nama:\s*(.+)/);
        if (nameMatch) data.employeeName = nameMatch[1].trim();
      }

      if (line.includes('Jam:')) {
        const timeMatch = line.match(/Jam:\s*\((\d{2}:\d{2})\s*-\s*(\d{2}:\d{2})\)/);
        if (timeMatch) {
          data.checkIn = timeMatch[1];
          data.checkOut = timeMatch[2];
          
          const startHour = parseInt(timeMatch[1].split(':')[0]);
          if (startHour >= 6 && startHour < 14) {
            data.shift = 'pagi';
          } else if (startHour >= 14 && startHour < 22) {
            data.shift = 'siang';
          } else {
            data.shift = 'malam';
          }
        }
      }

      // Extract meter data
      if (line.includes('Nomor Awal')) {
        const match = line.match(/Nomor Awal\s*:\s*(\d+(?:\.\d+)?)/);
        if (match) data.meterStart = parseFloat(match[1]);
      }
      if (line.includes('Nomor Akhir')) {
        const match = line.match(/Nomor Akhir\s*:\s*(\d+(?:\.\d+)?)/);
        if (match) data.meterEnd = parseFloat(match[1]);
      }
      if (line.includes('Total Liter')) {
        const match = line.match(/Total Liter\s*:\s*(\d+(?:\.\d+)?)/);
        if (match) data.totalLiters = parseFloat(match[1]);
      }

      // Extract payment data
      if (line.includes('Cash') && line.includes('Rp')) {
        const match = line.match(/Cash\s*:\s*Rp\s*([\d,.]+)/);
        if (match) {
          data.totalCash = parseFloat(match[1].replace(/[,.]/g, ''));
        }
      }
      if (line.includes('QRIS') && line.includes('Rp')) {
        const match = line.match(/QRIS\s*:\s*Rp\s*([\d,.]+)/);
        if (match) {
          data.totalQris = parseFloat(match[1].replace(/[,.]/g, ''));
        }
      }

      // Extract totals
      if (line.includes('Total Pengeluaran')) {
        const match = line.match(/Total Pengeluaran\s*:\s*Rp\s*([\d,.]+)/);
        if (match) {
          data.totalExpenses = parseFloat(match[1].replace(/[,.]/g, ''));
        }
      }

      if (line.includes('Total Pemasukan')) {
        const match = line.match(/Total Pemasukan\s*:\s*Rp\s*([\d,.]+)/);
        if (match) {
          data.totalIncome = parseFloat(match[1].replace(/[,.]/g, ''));
        }
      }

      if (line.includes('Total Keseluruhan')) {
        const match = line.match(/Total Keseluruhan\s*:\s*Rp\s*([\d,.]+)/);
        if (match) {
          data.totalSales = parseFloat(match[1].replace(/[,.]/g, ''));
        }
      }
    }

    // Parse detailed expenses and income
    let inExpenseSection = false;
    let inIncomeSection = false;
    
    for (const line of lines) {
      if (line.includes('💸 Pengeluaran')) {
        inExpenseSection = true;
        inIncomeSection = false;
        continue;
      }
      if (line.includes('💵 Pemasukan')) {
        inIncomeSection = true;
        inExpenseSection = false;
        continue;
      }
      if (line.includes('💼 Total Keseluruhan')) {
        inExpenseSection = false;
        inIncomeSection = false;
        continue;
      }

      if (inExpenseSection && line.includes(':') && line.includes('Rp')) {
        const match = line.match(/\*\s*(.+):\s*Rp\s*([\d,.]+)/);
        if (match) {
          data.expenseDetails.push({
            description: match[1].trim(),
            amount: parseFloat(match[2].replace(/[,.]/g, ''))
          });
        }
      }

      if (inIncomeSection && line.includes(':') && line.includes('Rp')) {
        const match = line.match(/\*\s*(.+):\s*Rp\s*([\d,.]+)/);
        if (match) {
          data.incomeDetails.push({
            description: match[1].trim(),
            amount: parseFloat(match[2].replace(/[,.]/g, ''))
          });
        }
      }
    }

    return data;
  };

  const handleParseAndPreview = () => {
    console.log("🚀 HANDLE PARSE AND PREVIEW STARTED");
    console.log("📝 Text Data Length:", textData.trim().length);
    
    if (!textData.trim()) {
      console.log("❌ PARSE FAILED: No text data provided");
      toast({
        title: "Error",
        description: "Please enter text data to parse",
        variant: "destructive",
      });
      return;
    }

    console.log("🔍 Parsing text data...");
    const parsed = parseTextForPreview(textData.trim());
    console.log("📊 Parsed Data:", parsed);
    
    setParsedData(parsed);
    setStep("preview");
    console.log("✅ PARSE AND PREVIEW COMPLETED - Moving to preview step");
  };

  const handleConfirmImport = () => {
    console.log("🚀 CONFIRM IMPORT STARTED");
    console.log("🏪 Store ID:", storeId);
    console.log("📝 Text Data Length:", textData.trim().length);
    console.log("📊 Parsed Data:", parsedData);
    
    importTextMutation.mutate({
      storeId,
      textData: textData.trim()
    });
    
    console.log("✅ IMPORT MUTATION TRIGGERED");
  };

  const handleBackToInput = () => {
    console.log("🔙 BACK TO INPUT - Returning to input step");
    setStep("input");
    setParsedData(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          className="text-blue-600 border-blue-200 hover:bg-blue-50"
          data-testid={`button-import-text-store-${storeId}`}
        >
          <Upload className="h-4 w-4 mr-2" />
          Import Text ({storeName})
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Import Setoran Harian - {storeName}
            {step === "preview" && " - Data Preview"}
          </DialogTitle>
        </DialogHeader>
        
        {step === "input" ? (
          <div className="space-y-4">
            <div>
              <Label htmlFor="import-text">Paste Setoran Harian Text</Label>
              <Textarea
                id="import-text"
                placeholder={`Setoran Harian 📋
Sabtu, 20 September 2025
🤦‍♀️ Nama: Hafiz
🕐 Jam: (07:00 - 14:00)

⛽ Data Meter
* Nomor Awal : 10
* Nomor Akhir: 20
* Total Liter: 10.00 L

💰 Setoran
* Cash  : Rp 95.000
* QRIS  : Rp 20.000
* Total : Rp 115.000

💸 Pengeluaran (PU)
* makan: Rp 50.000
* minum: Rp 50.000
Total Pengeluaran: Rp 100.000

💵 Pemasukan (PU)
* bg dedi bayar: Rp 100.000
Total Pemasukan: Rp 100.000

💼 Total Keseluruhan: Rp 95.000
07:00 = Jam Masuk
14:00 = Jam Keluar`}
                value={textData}
                onChange={(e) => setTextData(e.target.value)}
                rows={15}
                className="w-full"
                data-testid="textarea-import-text"
              />
            </div>
            
            <Alert>
              <Upload className="h-4 w-4" />
              <AlertDescription>
                Paste the complete "Setoran Harian" text above. Click "Parse & Preview" to see how the data will be imported.
              </AlertDescription>
            </Alert>
          </div>
        ) : (
          <div className="space-y-6">
            <Alert>
              <Eye className="h-4 w-4" />
              <AlertDescription>
                Review the parsed data below. If it looks correct, click "Confirm Import" to save to the table.
              </AlertDescription>
            </Alert>

            {/* Parsed Data Preview */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Employee & Shift Info</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="font-medium">Employee:</span>
                    <span className={parsedData?.employeeName ? "text-green-600" : "text-red-500"}>
                      {parsedData?.employeeName || "Not detected"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Shift:</span>
                    <Badge variant="outline" className="capitalize">
                      {parsedData?.shift || "Not detected"}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Check In:</span>
                    <span className={parsedData?.checkIn ? "text-green-600" : "text-red-500"}>
                      {parsedData?.checkIn || "Not detected"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Check Out:</span>
                    <span className={parsedData?.checkOut ? "text-green-600" : "text-red-500"}>
                      {parsedData?.checkOut || "Not detected"}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Meter Data */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Meter Readings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="font-medium">Start:</span>
                    <span className={parsedData?.meterStart ? "text-green-600" : "text-red-500"}>
                      {parsedData?.meterStart || "Not detected"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">End:</span>
                    <span className={parsedData?.meterEnd ? "text-green-600" : "text-red-500"}>
                      {parsedData?.meterEnd || "Not detected"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Total Liters:</span>
                    <span className={parsedData?.totalLiters ? "text-green-600" : "text-red-500"}>
                      {parsedData?.totalLiters ? `${parsedData.totalLiters} L` : "Not detected"}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Data */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Payment Breakdown</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="font-medium">Cash:</span>
                    <span className={parsedData?.totalCash ? "text-green-600" : "text-red-500"}>
                      {parsedData?.totalCash ? formatRupiah(parsedData.totalCash) : "Not detected"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">QRIS:</span>
                    <span className={parsedData?.totalQris ? "text-green-600" : "text-red-500"}>
                      {parsedData?.totalQris ? formatRupiah(parsedData.totalQris) : "Not detected"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Total Sales:</span>
                    <span className={parsedData?.totalSales ? "text-green-600 font-bold" : "text-red-500"}>
                      {parsedData?.totalSales ? formatRupiah(parsedData.totalSales) : "Not detected"}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Income & Expenses */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Income & Expenses</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="font-medium">Total Income:</span>
                    <span className={parsedData?.totalIncome ? "text-green-600" : "text-gray-400"}>
                      {parsedData?.totalIncome ? formatRupiah(parsedData.totalIncome) : "Rp 0"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Total Expenses:</span>
                    <span className={parsedData?.totalExpenses ? "text-red-600" : "text-gray-400"}>
                      {parsedData?.totalExpenses ? formatRupiah(parsedData.totalExpenses) : "Rp 0"}
                    </span>
                  </div>
                  
                  {parsedData?.expenseDetails?.length > 0 && (
                    <div className="mt-3">
                      <span className="text-sm font-medium text-gray-600">Expense Details:</span>
                      {parsedData.expenseDetails.map((item: any, index: number) => (
                        <div key={index} className="text-sm flex justify-between ml-2">
                          <span>{item.description}:</span>
                          <span>{formatRupiah(item.amount)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {parsedData?.incomeDetails?.length > 0 && (
                    <div className="mt-3">
                      <span className="text-sm font-medium text-gray-600">Income Details:</span>
                      {parsedData.incomeDetails.map((item: any, index: number) => (
                        <div key={index} className="text-sm flex justify-between ml-2">
                          <span>{item.description}:</span>
                          <span>{formatRupiah(item.amount)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        <DialogFooter className="flex gap-2">
          {step === "input" ? (
            <>
              <Button 
                variant="outline" 
                onClick={() => setIsOpen(false)}
                data-testid="button-cancel-import"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleParseAndPreview}
                disabled={!textData.trim()}
                data-testid="button-parse-preview"
              >
                <Eye className="h-4 w-4 mr-2" />
                Parse & Preview
              </Button>
            </>
          ) : (
            <>
              <Button 
                variant="outline" 
                onClick={handleBackToInput}
                data-testid="button-back-to-input"
              >
                Back to Edit
              </Button>
              <Button 
                onClick={handleConfirmImport}
                disabled={importTextMutation.isPending || !parsedData?.totalSales}
                data-testid="button-confirm-import"
                className="bg-green-600 hover:bg-green-700"
              >
                {importTextMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Confirm Import
                  </>
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Sales Detail Modal Component for single record
function SalesDetailModal({ record }: { record: Sales }) {
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  // Get users data to show staff names
  const { data: allUsers } = useQuery<any[]>({ queryKey: ['/api/users'] });
  
  // Delete mutation for sales record
  const deleteSalesMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('DELETE', `/api/sales/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Sales record deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/sales'] });
      setIsOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete sales record",
        variant: "destructive",
      });
    },
  });
  
  const handleDeleteSales = (id: string) => {
    if (confirm("Are you sure you want to delete this sales record? This action cannot be undone.")) {
      deleteSalesMutation.mutate(id);
    }
  };
  
  // Parse JSON data if available
  const parseJsonData = (jsonString: string | null) => {
    if (!jsonString) return [];
    try {
      return JSON.parse(jsonString);
    } catch {
      return [];
    }
  };

  const incomeData = parseJsonData(record.incomeDetails || null);
  const expenseData = parseJsonData(record.expenseDetails || null);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          className="text-blue-600 border-blue-200 hover:bg-blue-50"
          data-testid={`button-detail-${record.id}`}
        >
          <Eye className="h-4 w-4 mr-1" />
          Detail
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Detail Penjualan Per Shift
            </div>
            {user && ['manager', 'administrasi'].includes(user.role) && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleDeleteSales(record.id)}
                disabled={deleteSalesMutation.isPending}
                className="text-red-600 border-red-200 hover:bg-red-50"
                data-testid={`button-delete-${record.id}`}
              >
                {deleteSalesMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4 mr-1" />
                )}
                {deleteSalesMutation.isPending ? "Menghapus..." : "Hapus"}
              </Button>
            )}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Shift Info */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-indigo-50 p-3 rounded-lg">
              <div className="flex items-center gap-2 text-indigo-700 mb-1">
                <User className="h-4 w-4" />
                <span className="font-medium">Nama Staff</span>
              </div>
              <p className="text-lg font-semibold">
                {getUserNameFromId(record.userId, allUsers)}
              </p>
            </div>
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="flex items-center gap-2 text-blue-700 mb-1">
                <Clock className="h-4 w-4" />
                <span className="font-medium">Shift</span>
              </div>
              <p className="text-lg font-semibold capitalize">
                {record.shift || "—"}
              </p>
            </div>
            <div className="bg-green-50 p-3 rounded-lg">
              <div className="flex items-center gap-2 text-green-700 mb-1">
                <Clock className="h-4 w-4" />
                <span className="font-medium">Jam Masuk</span>
              </div>
              <p className="text-lg font-semibold">
                {record.checkIn || "—"}
              </p>
            </div>
            <div className="bg-orange-50 p-3 rounded-lg">
              <div className="flex items-center gap-2 text-orange-700 mb-1">
                <Clock className="h-4 w-4" />
                <span className="font-medium">Jam Keluar</span>
              </div>
              <p className="text-lg font-semibold">
                {record.checkOut || "—"}
              </p>
            </div>
          </div>

          {/* Data Meter Table */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Gauge className="h-5 w-5 text-blue-600" />
                Data Meter
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nomor Awal</TableHead>
                    <TableHead>Nomor Akhir</TableHead>
                    <TableHead>Total Liter</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">
                      {record.meterStart || "0"}
                    </TableCell>
                    <TableCell className="font-medium">
                      {record.meterEnd || "0"}
                    </TableCell>
                    <TableCell className="font-semibold text-blue-600">
                      {record.totalLiters || "0"} L
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Tabel Setoran */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <CreditCard className="h-5 w-5 text-green-600" />
                Setoran
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cash</TableHead>
                    <TableHead>QRIS</TableHead>
                    <TableHead>Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-semibold text-orange-600">
                      {formatRupiah(record.totalCash || 0)}
                    </TableCell>
                    <TableCell className="font-semibold text-blue-600">
                      {formatRupiah(record.totalQris || 0)}
                    </TableCell>
                    <TableCell className="font-semibold text-green-700">
                      {formatRupiah((parseFloat(record.totalCash || "0") + parseFloat(record.totalQris || "0")))}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Tabel PU (Pemasukan/Pengeluaran) */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calculator className="h-5 w-5 text-purple-600" />
                PU (Pemasukan & Pengeluaran)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                {/* Pemasukan */}
                <div>
                  <h4 className="font-semibold text-green-700 mb-3 flex items-center gap-2">
                    <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                    Pemasukan
                  </h4>
                  {incomeData.length > 0 ? (
                    <div className="space-y-2">
                      {incomeData.map((item: any, index: number) => (
                        <div key={index} className="flex justify-between items-center p-2 bg-green-50 rounded">
                          <span className="text-sm">{item.description || item.name || `Item ${index + 1}`}</span>
                          <span className="font-medium text-green-700">{formatRupiah(item.amount || 0)}</span>
                        </div>
                      ))}
                      <div className="border-t pt-2 mt-3">
                        <div className="flex justify-between items-center font-semibold">
                          <span>Total Pemasukan:</span>
                          <span className="text-green-700">{formatRupiah(record.totalIncome || 0)}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground py-4">
                      <p className="text-sm">Tidak ada data pemasukan</p>
                      <p className="font-medium mt-1">{formatRupiah(record.totalIncome || 0)}</p>
                    </div>
                  )}
                </div>

                {/* Pengeluaran */}
                <div>
                  <h4 className="font-semibold text-red-700 mb-3 flex items-center gap-2">
                    <span className="w-3 h-3 bg-red-500 rounded-full"></span>
                    Pengeluaran
                  </h4>
                  {expenseData.length > 0 ? (
                    <div className="space-y-2">
                      {expenseData.map((item: any, index: number) => (
                        <div key={index} className="flex justify-between items-center p-2 bg-red-50 rounded">
                          <span className="text-sm">{item.description || item.name || `Item ${index + 1}`}</span>
                          <span className="font-medium text-red-700">{formatRupiah(item.amount || 0)}</span>
                        </div>
                      ))}
                      <div className="border-t pt-2 mt-3">
                        <div className="flex justify-between items-center font-semibold">
                          <span>Total Pengeluaran:</span>
                          <span className="text-red-700">{formatRupiah(record.totalExpenses || 0)}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground py-4">
                      <p className="text-sm">Tidak ada data pengeluaran</p>
                      <p className="font-medium mt-1">{formatRupiah(record.totalExpenses || 0)}</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total Keseluruhan */}
          <Card className="bg-gradient-to-r from-blue-50 to-green-50 border-2 border-blue-200">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-xl">
                <TrendingUp className="h-6 w-6 text-blue-600" />
                Total Keseluruhan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <p className="text-3xl font-bold text-green-700 mb-2">
                  {formatRupiah(record.totalSales)}
                </p>
                <p className="text-sm text-muted-foreground">
                  Total penjualan pada shift ini
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function SalesContent() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("store-1");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Handle tab change to update current store filter
  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  // Get current store ID based on active tab
  const currentStoreId = activeTab === "store-1" ? 1 : 2;

  // Query for sales data with store filtering
  const { data: salesRecords = [], isLoading } = useQuery<Sales[]>({
    queryKey: ["/api/sales", { storeId: currentStoreId }],
  });

  // Get users data to show staff names
  const { data: allUsers } = useQuery<any[]>({ queryKey: ['/api/users'] });

  // Fetch stores to get actual store names
  const { data: stores = [] } = useQuery({
    queryKey: ["/api/stores"],
    enabled: user?.role === "manager",
  });

  // Set default tab to first available store when stores are loaded
  useEffect(() => {
    if (stores.length > 0) {
      const firstStoreTab = `store-${stores[0].id}`;
      if (activeTab === "store-1" || !stores.find(s => `store-${s.id}` === activeTab)) {
        setActiveTab(firstStoreTab);
      }
    }
  }, [stores]);

  // Filter sales data by store and date range
  // Note: Data is already filtered by store via query key, but we add client-side filtering as fallback
  const filteredSalesRecords = salesRecords.filter(record => {
    // Store filtering (fallback - should already be filtered by query)
    const matchesStore = record.storeId === currentStoreId;
    
    // Date range filtering
    if (!startDate && !endDate) return matchesStore;
    
    const recordDate = new Date(record.date || record.createdAt || '');
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate + 'T23:59:59') : null;
    
    const matchesDateRange = 
      (!start || recordDate >= start) && 
      (!end || recordDate <= end);
    
    return matchesStore && matchesDateRange;
  });

  // Calculate totals for current store
  const totalSales = filteredSalesRecords.reduce((sum, record) => 
    sum + parseFloat(record.totalSales || "0"), 0
  );
  const totalCash = filteredSalesRecords.reduce((sum, record) => 
    sum + parseFloat(record.totalCash || "0"), 0
  );
  const totalQris = filteredSalesRecords.reduce((sum, record) => 
    sum + parseFloat(record.totalQris || "0"), 0
  );
  const totalLiters = filteredSalesRecords.reduce((sum, record) => 
    sum + parseFloat(record.totalLiters || "0"), 0
  );

  return (
    <div className="space-y-6">
      {/* Header Card with Store Tabs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-6 w-6" />
            Sales Reports
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Store Filter Tabs */}
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className={`grid w-full ${
              stores.length > 0 
                ? stores.length === 1 ? 'grid-cols-1' 
                  : stores.length === 2 ? 'grid-cols-2'
                  : stores.length === 3 ? 'grid-cols-3'
                  : 'grid-cols-4'
                : 'grid-cols-2'
            } mb-6`}>
              {stores.length > 0 ? (
                stores.map((store) => (
                  <TabsTrigger 
                    key={store.id} 
                    value={`store-${store.id}`} 
                    data-testid={`tab-sales-store-${store.id}`}
                  >
                    <TrendingUp className="h-4 w-4 mr-2" />
                    {store.name}
                  </TabsTrigger>
                ))
              ) : (
                <>
                  <TabsTrigger value="store-1" data-testid="tab-sales-store-1">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Store 1
                  </TabsTrigger>
                  <TabsTrigger value="store-2" data-testid="tab-sales-store-2">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Store 2
                  </TabsTrigger>
                </>
              )}
            </TabsList>

            {/* Date Range Filter */}
            <div className="flex gap-4 mb-6">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <Label htmlFor="start-date">Dari:</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-auto"
                  data-testid="input-start-date"
                />
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="end-date">Sampai:</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-auto"
                  data-testid="input-end-date"
                />
              </div>
              <Button
                variant="outline"
                onClick={() => {
                  setStartDate("");
                  setEndDate("");
                }}
                data-testid="button-reset-filter"
              >
                <Filter className="h-4 w-4 mr-2" />
                Reset Filter
              </Button>
              
              {/* Store-specific Import Button */}
              <TextImportModal 
                storeId={currentStoreId} 
                storeName={stores.find(s => `store-${s.id}` === activeTab)?.name || `Store ${activeTab.replace('store-', '')}`} 
              />
              
              {/* Google Sheets Sync Button */}
              <SyncButton 
                dataType="sales"
                storeIds={[currentStoreId]}
                variant="outline"
                className="text-green-600 border-green-200 hover:bg-green-50"
              />
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-green-600 mb-2">
                    <TrendingUp className="h-4 w-4" />
                    <span className="text-sm font-medium">Total Sales</span>
                  </div>
                  <p className="text-2xl font-bold text-green-700">
                    {formatRupiah(totalSales)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {filteredSalesRecords.length} records
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-orange-600 mb-2">
                    <CreditCard className="h-4 w-4" />
                    <span className="text-sm font-medium">Total Cash</span>
                  </div>
                  <p className="text-2xl font-bold text-orange-700">
                    {formatRupiah(totalCash)}
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-blue-600 mb-2">
                    <CreditCard className="h-4 w-4" />
                    <span className="text-sm font-medium">Total QRIS</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-700">
                    {formatRupiah(totalQris)}
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-purple-600 mb-2">
                    <Gauge className="h-4 w-4" />
                    <span className="text-sm font-medium">Total Liters</span>
                  </div>
                  <p className="text-2xl font-bold text-purple-700">
                    {formatLiters(totalLiters)} L
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Sales Records Table */}
            <TabsContent value="store-1" className="space-y-4">
              <SalesRecordsTable 
                records={filteredSalesRecords} 
                isLoading={isLoading}
                allUsers={allUsers}
                storeLabel={stores[0]?.name || "Store 1"}
              />
            </TabsContent>
            
            <TabsContent value="store-2" className="space-y-4">
              <SalesRecordsTable 
                records={filteredSalesRecords} 
                isLoading={isLoading}
                allUsers={allUsers}
                storeLabel={stores[1]?.name || "Store 2"}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

// Component to display sales records table
function SalesRecordsTable({ 
  records, 
  isLoading, 
  allUsers = [], 
  storeLabel 
}: { 
  records: Sales[]; 
  isLoading: boolean; 
  allUsers: any[]; 
  storeLabel: string;
}) {
  const [density, setDensity] = useState<TableDensity>('comfortable');
  const [columns, setColumns] = useState<ColumnVisibility>(DEFAULT_COLUMNS);
  const [sortState, setSortState] = useState<SortState>({ column: null, direction: null });
  const [selectedRecords, setSelectedRecords] = useState<Set<string>>(new Set());
  const [showControls, setShowControls] = useState(false);

  if (isLoading) {
    return (
      <Card className="shadow-card">
        <CardContent className="p-8">
          <div className="space-y-6 slide-up">
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="skeleton w-8 h-8 rounded-full animate-spin" />
              <p className="text-muted-foreground">Loading sales records...</p>
            </div>
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center gap-4 p-4 border border-border rounded-lg stagger-item">
                  <div className="skeleton w-16 h-16 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <div className="skeleton-text w-3/4" />
                    <div className="skeleton-text h-3 w-1/2" />
                  </div>
                  <div className="skeleton w-24 h-8 rounded-md" />
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (records.length === 0) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="text-center text-muted-foreground">
            <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No sales records found for {storeLabel}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Sort records
  const sortedRecords = sortSalesRecords(records, sortState);

  // Handle column sorting
  const handleSort = (column: keyof Sales) => {
    setSortState(current => {
      if (current.column === column) {
        if (current.direction === 'asc') {
          return { column, direction: 'desc' };
        } else if (current.direction === 'desc') {
          return { column: null, direction: null };
        }
      }
      return { column, direction: 'asc' };
    });
  };

  // Handle record selection
  const toggleRecord = (id: string) => {
    const newSelected = new Set(selectedRecords);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedRecords(newSelected);
  };

  const toggleAll = () => {
    if (selectedRecords.size === records.length) {
      setSelectedRecords(new Set());
    } else {
      setSelectedRecords(new Set(records.map(r => r.id)));
    }
  };

  // Get cell size classes based on density
  const getCellClasses = () => {
    switch (density) {
      case 'compact': return 'px-2 py-1 text-sm';
      case 'expanded': return 'px-4 py-4';
      default: return 'px-3 py-2';
    }
  };

  // Render sort icon
  const renderSortIcon = (column: keyof Sales) => {
    if (sortState.column !== column) {
      return <ArrowUpDown className="h-4 w-4 opacity-30" />;
    }
    return sortState.direction === 'asc' ? 
      <ArrowUp className="h-4 w-4" /> : 
      <ArrowDown className="h-4 w-4" />;
  };

  // Calculate business metrics for display
  const getBusinessMetrics = (record: Sales) => {
    const totalPayments = (Number(record.totalCash) || 0) + (Number(record.totalQris) || 0);
    const cashPercentage = totalPayments > 0 ? ((Number(record.totalCash) || 0) / totalPayments) * 100 : 0;
    const qrisPercentage = totalPayments > 0 ? ((Number(record.totalQris) || 0) / totalPayments) * 100 : 0;
    
    const income = Number(record.totalIncome) || 0;
    const expenses = Number(record.totalExpenses) || 0;
    const profitLoss = formatProfitLoss(income, expenses);
    
    const avgTicket = (Number(record.transactions) || 0) > 0 ? 
      (Number(record.totalSales) || 0) / (Number(record.transactions) || 1) : 0;
    
    return {
      cashPercentage,
      qrisPercentage,
      profitLoss,
      avgTicket,
      hasIncompleteData: !record.checkIn || !record.checkOut || !record.meterStart || !record.meterEnd
    };
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Sales Records - {storeLabel}
          </CardTitle>
          
          {/* Table Controls */}
          <div className="flex items-center gap-2">
            {selectedRecords.size > 0 && (
              <Badge variant="secondary" className="mr-2">
                {selectedRecords.size} selected
              </Badge>
            )}
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowControls(!showControls)}
              data-testid="button-table-controls"
            >
              <Settings2 className="h-4 w-4 mr-1" />
              {showControls ? 'Hide' : 'Show'} Controls
            </Button>
          </div>
        </div>
        
        {/* Table Controls Panel */}
        {showControls && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg mt-4">
            {/* Density Control */}
            <div className="flex items-center gap-2">
              <Label className="text-sm font-medium">Density:</Label>
              <Select value={density} onValueChange={(value: TableDensity) => setDensity(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="compact">Compact</SelectItem>
                  <SelectItem value="comfortable">Comfortable</SelectItem>
                  <SelectItem value="expanded">Expanded</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Column Visibility */}
            <div className="flex items-center gap-2">
              <Label className="text-sm font-medium">Columns:</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setColumns(DEFAULT_COLUMNS)}
                data-testid="button-reset-columns"
              >
                <Columns3 className="h-4 w-4 mr-1" />
                Reset
              </Button>
            </div>
          </div>
        )}
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                {/* Selection Column */}
                <TableHead className={getCellClasses()}>
                  <input
                    type="checkbox"
                    checked={selectedRecords.size === records.length && records.length > 0}
                    onChange={toggleAll}
                    className="rounded"
                    data-testid="checkbox-select-all"
                  />
                </TableHead>
                
                {/* Date Column */}
                {columns.date && (
                  <TableHead 
                    className={`${getCellClasses()} cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800`}
                    onClick={() => handleSort('date')}
                    data-testid="header-date"
                  >
                    <div className="flex items-center gap-1">
                      Date
                      {renderSortIcon('date')}
                    </div>
                  </TableHead>
                )}
                
                {/* Staff Column */}
                {columns.staff && (
                  <TableHead 
                    className={`${getCellClasses()} cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800`}
                    onClick={() => handleSort('userId')}
                    data-testid="header-staff"
                  >
                    <div className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      Staff
                      {renderSortIcon('userId')}
                    </div>
                  </TableHead>
                )}
                
                {/* Shift Column */}
                {columns.shift && (
                  <TableHead 
                    className={`${getCellClasses()} cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800`}
                    onClick={() => handleSort('shift')}
                    data-testid="header-shift"
                  >
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      Shift
                      {renderSortIcon('shift')}
                    </div>
                  </TableHead>
                )}
                
                {/* Check-in/Out Times */}
                {columns.times && (
                  <TableHead className={getCellClasses()} data-testid="header-times">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Times
                    </div>
                  </TableHead>
                )}
                
                {/* Meter Readings */}
                {columns.meterReadings && (
                  <TableHead className={getCellClasses()} data-testid="header-meter-readings">
                    <div className="flex items-center gap-1">
                      <Gauge className="h-4 w-4" />
                      Meter Readings
                    </div>
                  </TableHead>
                )}
                
                {/* Liters Column */}
                {columns.liters && (
                  <TableHead 
                    className={`${getCellClasses()} cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800`}
                    onClick={() => handleSort('totalLiters')}
                    data-testid="header-liters"
                  >
                    <div className="flex items-center gap-1">
                      Liters
                      {renderSortIcon('totalLiters')}
                    </div>
                  </TableHead>
                )}
                
                {/* Transactions Column */}
                {columns.transactions && (
                  <TableHead 
                    className={`${getCellClasses()} cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800`}
                    onClick={() => handleSort('transactions')}
                    data-testid="header-transactions"
                  >
                    <div className="flex items-center gap-1">
                      <BarChart3 className="h-4 w-4" />
                      Transactions
                      {renderSortIcon('transactions')}
                    </div>
                  </TableHead>
                )}
                
                {/* Total Sales Column */}
                {columns.totalSales && (
                  <TableHead 
                    className={`${getCellClasses()} cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800`}
                    onClick={() => handleSort('totalSales')}
                    data-testid="header-total-sales"
                  >
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-4 w-4" />
                      Total Sales
                      {renderSortIcon('totalSales')}
                    </div>
                  </TableHead>
                )}
                
                {/* Payment Breakdown */}
                {columns.paymentBreakdown && (
                  <TableHead className={getCellClasses()} data-testid="header-payment-breakdown">
                    <div className="flex items-center gap-1">
                      <CreditCard className="h-4 w-4" />
                      Payment Breakdown
                    </div>
                  </TableHead>
                )}
                
                {/* Income & Expenses */}
                {columns.incomeExpenses && (
                  <TableHead className={getCellClasses()} data-testid="header-income-expenses">
                    <div className="flex items-center gap-1">
                      <Calculator className="h-4 w-4" />
                      Income / Expenses
                    </div>
                  </TableHead>
                )}
                
                {/* Profit/Loss */}
                {columns.profitLoss && (
                  <TableHead className={getCellClasses()} data-testid="header-profit-loss">
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-4 w-4" />
                      Profit/Loss
                    </div>
                  </TableHead>
                )}
                
                {/* Average Ticket */}
                {columns.averageTicket && (
                  <TableHead 
                    className={`${getCellClasses()} cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800`}
                    onClick={() => handleSort('averageTicket')}
                    data-testid="header-average-ticket"
                  >
                    <div className="flex items-center gap-1">
                      Avg Ticket
                      {renderSortIcon('averageTicket')}
                    </div>
                  </TableHead>
                )}
                
                {/* Details Summary */}
                {columns.details && (
                  <TableHead className={getCellClasses()} data-testid="header-details">
                    Details Summary
                  </TableHead>
                )}
                
                {/* Performance Indicators */}
                {columns.performance && (
                  <TableHead className={getCellClasses()} data-testid="header-performance">
                    Performance
                  </TableHead>
                )}
                
                {/* Actions Column */}
                {columns.actions && (
                  <TableHead className={getCellClasses()} data-testid="header-actions">
                    Actions
                  </TableHead>
                )}
              </TableRow>
            </TableHeader>
            
            <TableBody>
              {sortedRecords.map((record) => {
                const metrics = getBusinessMetrics(record);
                const isSelected = selectedRecords.has(record.id);
                
                return (
                  <TableRow 
                    key={record.id} 
                    className={`
                      ${isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : ''}
                      ${metrics.hasIncompleteData ? 'border-l-4 border-yellow-400' : ''}
                      hover:bg-gray-50 dark:hover:bg-gray-800
                    `}
                    data-testid={`row-sales-${record.id}`}
                  >
                    {/* Selection Cell */}
                    <TableCell className={getCellClasses()}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleRecord(record.id)}
                        className="rounded"
                        data-testid={`checkbox-select-${record.id}`}
                      />
                    </TableCell>
                    
                    {/* Date Cell */}
                    {columns.date && (
                      <TableCell className={getCellClasses()} data-testid={`cell-date-${record.id}`}>
                        <div className="font-medium">
                          {formatIndonesianDate(record.date || record.createdAt)}
                        </div>
                        {density === 'expanded' && (
                          <div className="text-xs text-gray-500">
                            Created: {formatTime(new Date(record.createdAt || '').toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }))}
                          </div>
                        )}
                      </TableCell>
                    )}
                    
                    {/* Staff Cell */}
                    {columns.staff && (
                      <TableCell className={getCellClasses()} data-testid={`cell-staff-${record.id}`}>
                        <div className="font-medium">
                          {getUserNameFromId(record.userId, allUsers)}
                        </div>
                        {density === 'expanded' && record.userId && (
                          <div className="text-xs text-gray-500">
                            ID: {record.userId.slice(0, 8)}...
                          </div>
                        )}
                      </TableCell>
                    )}
                    
                    {/* Shift Cell */}
                    {columns.shift && (
                      <TableCell className={getCellClasses()} data-testid={`cell-shift-${record.id}`}>
                        <Badge 
                          variant="outline" 
                          className={`capitalize ${
                            record.shift === 'pagi' ? 'border-orange-300 text-orange-700 bg-orange-50' :
                            record.shift === 'siang' ? 'border-blue-300 text-blue-700 bg-blue-50' :
                            record.shift === 'malam' ? 'border-purple-300 text-purple-700 bg-purple-50' :
                            ''
                          }`}
                        >
                          {record.shift || "—"}
                        </Badge>
                      </TableCell>
                    )}
                    
                    {/* Times Cell */}
                    {columns.times && (
                      <TableCell className={getCellClasses()} data-testid={`cell-times-${record.id}`}>
                        <div className="text-sm space-y-1">
                          <div className="flex items-center gap-1">
                            <span className="text-green-600">▶</span>
                            {formatTime(record.checkIn)}
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-red-600">■</span>
                            {formatTime(record.checkOut)}
                          </div>
                        </div>
                      </TableCell>
                    )}
                    
                    {/* Meter Readings Cell */}
                    {columns.meterReadings && (
                      <TableCell className={getCellClasses()} data-testid={`cell-meter-readings-${record.id}`}>
                        <div className="text-sm space-y-1">
                          <div className="flex justify-between">
                            <span className="text-gray-500">Start:</span>
                            <span className="font-mono">{record.meterStart || "—"}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">End:</span>
                            <span className="font-mono">{record.meterEnd || "—"}</span>
                          </div>
                          {record.meterStart && record.meterEnd && density === 'expanded' && (
                            <div className="text-xs text-blue-600 border-t pt-1">
                              Diff: {(Number(record.meterEnd) - Number(record.meterStart)).toFixed(3)}
                            </div>
                          )}
                        </div>
                      </TableCell>
                    )}
                    
                    {/* Liters Cell */}
                    {columns.liters && (
                      <TableCell className={`${getCellClasses()} text-right`} data-testid={`cell-liters-${record.id}`}>
                        <div className="font-semibold text-purple-700">
                          {formatLiters(record.totalLiters)} L
                        </div>
                        {density === 'expanded' && record.totalLiters && (
                          <div className="text-xs text-gray-500">
                            ≈ {(Number(record.totalLiters) * 0.264172).toFixed(2)} gallons
                          </div>
                        )}
                      </TableCell>
                    )}
                    
                    {/* Transactions Cell */}
                    {columns.transactions && (
                      <TableCell className={`${getCellClasses()} text-center`} data-testid={`cell-transactions-${record.id}`}>
                        <div className="font-semibold text-indigo-700">
                          {record.transactions || 0}
                        </div>
                        {density === 'expanded' && (
                          <div className="text-xs text-gray-500">
                            transactions
                          </div>
                        )}
                      </TableCell>
                    )}
                    
                    {/* Total Sales Cell */}
                    {columns.totalSales && (
                      <TableCell className={`${getCellClasses()} text-right`} data-testid={`cell-total-sales-${record.id}`}>
                        <div className="font-bold text-green-700">
                          {density === 'compact' ? formatCompactRupiah(record.totalSales) : formatRupiah(record.totalSales)}
                        </div>
                      </TableCell>
                    )}
                    
                    {/* Payment Breakdown Cell */}
                    {columns.paymentBreakdown && (
                      <TableCell className={getCellClasses()} data-testid={`cell-payment-breakdown-${record.id}`}>
                        <div className="space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="text-orange-600 font-medium">
                              {density === 'compact' ? 'Cash' : 'Cash:'}
                            </span>
                            <span className="font-semibold">
                              {density === 'compact' ? formatCompactRupiah(record.totalCash || 0) : formatRupiah(record.totalCash || 0)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-blue-600 font-medium">
                              {density === 'compact' ? 'QRIS' : 'QRIS:'}
                            </span>
                            <span className="font-semibold">
                              {density === 'compact' ? formatCompactRupiah(record.totalQris || 0) : formatRupiah(record.totalQris || 0)}
                            </span>
                          </div>
                          {density !== 'compact' && (
                            <div className="text-xs text-gray-500 pt-1 border-t flex justify-between">
                              <span>Cash: {metrics.cashPercentage.toFixed(0)}%</span>
                              <span>QRIS: {metrics.qrisPercentage.toFixed(0)}%</span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                    )}
                    
                    {/* Income & Expenses Cell */}
                    {columns.incomeExpenses && (
                      <TableCell className={getCellClasses()} data-testid={`cell-income-expenses-${record.id}`}>
                        <div className="space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="text-green-600 text-sm">
                              Income:
                            </span>
                            <span className="font-medium text-green-700">
                              {density === 'compact' ? formatCompactRupiah(record.totalIncome || 0) : formatRupiah(record.totalIncome || 0)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-red-600 text-sm">
                              Expenses:
                            </span>
                            <span className="font-medium text-red-700">
                              {density === 'compact' ? formatCompactRupiah(record.totalExpenses || 0) : formatRupiah(record.totalExpenses || 0)}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                    )}
                    
                    {/* Profit/Loss Cell */}
                    {columns.profitLoss && (
                      <TableCell className={`${getCellClasses()} text-right`} data-testid={`cell-profit-loss-${record.id}`}>
                        <div className={`font-bold ${
                          metrics.profitLoss.isProfit ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {metrics.profitLoss.isProfit ? '+' : '-'}
                          {density === 'compact' ? formatCompactRupiah(metrics.profitLoss.value) : metrics.profitLoss.value}
                        </div>
                        {density === 'expanded' && (
                          <div className={`text-xs ${
                            metrics.profitLoss.isProfit ? 'text-green-500' : 'text-red-500'
                          }`}>
                            {metrics.profitLoss.isProfit ? 'Profit' : 'Loss'}
                          </div>
                        )}
                      </TableCell>
                    )}
                    
                    {/* Average Ticket Cell */}
                    {columns.averageTicket && (
                      <TableCell className={`${getCellClasses()} text-right`} data-testid={`cell-average-ticket-${record.id}`}>
                        <div className="font-medium text-indigo-700">
                          {density === 'compact' ? formatCompactRupiah(metrics.avgTicket) : formatRupiah(metrics.avgTicket)}
                        </div>
                        {density === 'expanded' && (
                          <div className="text-xs text-gray-500">
                            per transaction
                          </div>
                        )}
                      </TableCell>
                    )}
                    
                    {/* Details Summary Cell */}
                    {columns.details && (
                      <TableCell className={getCellClasses()} data-testid={`cell-details-${record.id}`}>
                        <div className="space-y-1 max-w-48">
                          {record.expenseDetails && (
                            <div className="text-xs">
                              <span className="text-red-600 font-medium">Expenses:</span>
                              <div className="text-gray-600 truncate">
                                {formatDetailsSummary(record.expenseDetails)}
                              </div>
                            </div>
                          )}
                          {record.incomeDetails && (
                            <div className="text-xs">
                              <span className="text-green-600 font-medium">Income:</span>
                              <div className="text-gray-600 truncate">
                                {formatDetailsSummary(record.incomeDetails)}
                              </div>
                            </div>
                          )}
                        </div>
                      </TableCell>
                    )}
                    
                    {/* Performance Indicators Cell */}
                    {columns.performance && (
                      <TableCell className={getCellClasses()} data-testid={`cell-performance-${record.id}`}>
                        <div className="flex flex-col gap-1">
                          {/* Completeness Indicator */}
                          <Badge 
                            variant={metrics.hasIncompleteData ? "destructive" : "secondary"}
                            className="text-xs"
                          >
                            {metrics.hasIncompleteData ? 'Incomplete' : 'Complete'}
                          </Badge>
                          
                          {/* Performance Score (simple calculation) */}
                          {density === 'expanded' && (
                            <div className="text-xs space-y-1">
                              <div className="flex items-center gap-1">
                                <TrendingUp className="h-3 w-3 text-green-600" />
                                <span className="text-green-600">Sales</span>
                              </div>
                              {metrics.profitLoss.isProfit && (
                                <div className="flex items-center gap-1">
                                  <TrendingUp className="h-3 w-3 text-blue-600" />
                                  <span className="text-blue-600">Profitable</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </TableCell>
                    )}
                    
                    {/* Actions Cell */}
                    {columns.actions && (
                      <TableCell className={getCellClasses()} data-testid={`cell-actions-${record.id}`}>
                        <div className="flex items-center gap-1">
                          <SalesDetailModal record={record} />
                          
                          {density !== 'compact' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              data-testid={`button-more-actions-${record.id}`}
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
        
        {/* Table Summary */}
        {density === 'expanded' && records.length > 0 && (
          <div className="border-t p-4 bg-gray-50 dark:bg-gray-800">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="font-medium text-gray-700 dark:text-gray-300">Total Records</div>
                <div className="text-lg font-bold">{records.length}</div>
              </div>
              <div>
                <div className="font-medium text-gray-700 dark:text-gray-300">Total Sales</div>
                <div className="text-lg font-bold text-green-600">
                  {formatRupiah(records.reduce((sum, r) => sum + (Number(r.totalSales) || 0), 0))}
                </div>
              </div>
              <div>
                <div className="font-medium text-gray-700 dark:text-gray-300">Total Liters</div>
                <div className="text-lg font-bold text-purple-600">
                  {formatLiters(records.reduce((sum, r) => sum + (Number(r.totalLiters) || 0), 0))} L
                </div>
              </div>
              <div>
                <div className="font-medium text-gray-700 dark:text-gray-300">Avg Ticket</div>
                <div className="text-lg font-bold text-indigo-600">
                  {formatRupiah(
                    records.reduce((sum, r) => sum + (Number(r.totalSales) || 0), 0) / 
                    Math.max(records.reduce((sum, r) => sum + (Number(r.transactions) || 0), 0), 1)
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}