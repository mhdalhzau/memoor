import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatRupiah, formatNumber } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import {
  type Cashflow,
  type Customer,
  type Sales,
  insertCustomerSchema,
} from "@shared/schema";
import { SyncButton } from "@/components/ui/sync-button";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Eye,
  Calendar,
  Hash,
  FileText,
  Plus,
  User,
  Trash2,
  Save,
  Loader2,
} from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";

// Define transaction types by category
const incomeTypes = [
  "Penjualan (Transfer rekening)",
  "Pendapatan Jasa/Komisi",
  "Penambahan Modal",
  "Penagihan Utang/Cicilan",
  "Pembayaran Piutang",
  "Pemberian Utang",
  "Terima Pinjaman",
  "Transaksi Agen Pembayaran (Income)",
  "Pendapatan Di Luar Usaha",
  "Pendapatan Lain-lain",
] as const;

const expenseTypes = [
  "Pembelian stok (Pembelian Minyak)",
  "Pembelian bahan baku",
  "Biaya operasional",
  "Gaji/Bonus Karyawan",
  "Transaksi Agen Pembayaran (Expense)",
  "Pembayaran Utang/Cicilan",
  "Pengeluaran usaha untuk membayar utang/cicilan",
  "Pengeluaran Di Luar Usaha",
  "Pengeluaran Lain-lain",
] as const;

const investmentTypes = ["Investasi Lain-lain"] as const;

const allTypes = [...incomeTypes, ...expenseTypes, ...investmentTypes] as const;

const cashflowSchema = z
  .object({
    category: z.enum(["Income", "Expense", "Investment"], {
      errorMap: () => ({ message: "Please select a category" }),
    }),
    type: z.enum(allTypes, {
      errorMap: () => ({ message: "Please select a type" }),
    }),
    amount: z.coerce.number().positive("Amount must be positive").transform(String),
    description: z.string().optional().transform(val => val === "" ? undefined : val),
    storeId: z.coerce.number(),
    date: z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: "Please select a valid date",
    }),
    paymentStatus: z.enum(["lunas", "belum_lunas"]).optional(),
    customerId: z.string().optional().transform(val => val === "" ? undefined : val),
    piutangId: z.string().optional().transform(val => val === "" ? undefined : val),

    // Additional fields for Pembelian Minyak - transform numbers to strings and handle empty values
    jumlahGalon: z.coerce.number().min(0).optional().transform(val => val === 0 ? undefined : val?.toString()),
    pajakOngkos: z.coerce.number().min(0).optional().transform(val => val === 0 ? undefined : val?.toString()),
    pajakTransfer: z.coerce.number().min(0).optional().transform(val => val === 0 ? undefined : val?.toString()),
    totalPengeluaran: z.coerce.number().min(0).optional().transform(val => val === 0 ? undefined : val?.toString()),

    // Additional fields for Transfer Rekening - transform numbers to strings and handle empty values  
    konter: z.enum(["Dia store", "manual"]).optional(),
    pajakTransferRekening: z.coerce.number().min(0).optional().transform(val => val === 0 ? undefined : val?.toString()),
    hasil: z.coerce.number().min(0).optional().transform(val => val === 0 ? undefined : val?.toString()),
  })
  .superRefine((data, ctx) => {
    // Validate customer for unpaid debt
    if (
      data.type === "Pemberian Utang" &&
      data.paymentStatus === "belum_lunas"
    ) {
      if (!data.customerId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Customer selection is required for unpaid debt transactions",
          path: ["customerId"],
        });
      }
    }

    // Validate jumlahGalon for Pembelian Minyak only
    if (
      (data.type === "Pembelian stok (Pembelian Minyak)" ||
        data.type === "Pembelian Minyak") &&
      (!data.jumlahGalon || parseFloat(data.jumlahGalon) <= 0)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Jumlah galon must be positive for Pembelian Minyak",
        path: ["jumlahGalon"],
      });
    }
  });

type CashflowData = z.infer<typeof cashflowSchema>;

export default function CashflowContent() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [selectedEntry, setSelectedEntry] = useState<Cashflow | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isAddCustomerModalOpen, setIsAddCustomerModalOpen] = useState(false);
  const [customerSearchTerm, setCustomerSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [deleteConfirmEntry, setDeleteConfirmEntry] = useState<Cashflow | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedSalesIds, setSelectedSalesIds] = useState<string[]>([]);
  const [selectedCashflowIds, setSelectedCashflowIds] = useState<string[]>([]);
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);

  // Fetch stores to get actual store names and data
  const { data: stores = [] } = useQuery({
    queryKey: ["/api/stores"],
  });

  const form = useForm<CashflowData>({
    resolver: zodResolver(cashflowSchema),
    defaultValues: {
      category: "Income",
      type: "Penjualan (Transfer rekening)",
      amount: 0,
      description: "",
      date: new Date().toISOString().split('T')[0], // Today's date in YYYY-MM-DD format
      paymentStatus: "lunas",
      customerId: "",
      piutangId: "",
      jumlahGalon: 0,
      pajakOngkos: 0,
      pajakTransfer: 2500,
      totalPengeluaran: 0,
      konter: "Dia store",
      pajakTransferRekening: 0,
      hasil: 0,
      storeId: 1,
    },
  });

  // Set default tab to first available store when stores are loaded
  useEffect(() => {
    console.log("🏪 STORES EFFECT TRIGGERED");
    console.log("📊 Stores:", stores);
    console.log("🔖 Current Active Tab:", activeTab);
    
    if (stores.length > 0 && !activeTab) {
      const firstStoreTab = `store-${stores[0].id}`;
      console.log("🎯 Setting default tab:", firstStoreTab);
      setActiveTab(firstStoreTab);
      form.setValue("storeId", stores[0].id);
      console.log("✅ Default store ID set:", stores[0].id);
    }
  }, [stores, activeTab, form]);

  // Keep form storeId in sync with activeTab
  useEffect(() => {
    if (activeTab) {
      const storeId = parseInt(activeTab.replace("store-", ""));
      if (!isNaN(storeId)) {
        form.setValue("storeId", storeId);
      }
    }
  }, [activeTab, form]);

  // Update form storeId when tab changes
  const handleTabChange = (value: string) => {
    console.log("🔄 TAB CHANGE TRIGGERED");
    console.log("📋 Previous Tab:", activeTab);
    console.log("🎯 New Tab:", value);
    
    setActiveTab(value);
    const storeId = parseInt(value.replace("store-", ""));
    console.log("🏪 Extracted Store ID:", storeId);
    
    form.setValue("storeId", storeId);
    console.log("✅ Form Store ID updated to:", storeId);
    console.log("📊 Current form values:", form.getValues());
  };

  const watchType = form.watch("type");
  const watchCategory = form.watch("category");
  const watchJumlahGalon = form.watch("jumlahGalon");
  const watchKonter = form.watch("konter");
  const watchAmount = form.watch("amount");
  const watchPaymentStatus = form.watch("paymentStatus");
  const watchDate = form.watch("date");

  // Check if current user can delete cashflow records
  const canDeleteCashflow = user && (user.role === 'manager' || user.role === 'administrasi');

  // Helper functions to identify special transaction types (with legacy compatibility)
  const isPembelianMinyak = (type: string) => {
    return (
      type === "Pembelian stok (Pembelian Minyak)" ||
      type === "Pembelian Minyak"
    );
  };

  const isTransferRekening = (type: string) => {
    return (
      type === "Penjualan (Transfer rekening)" || type === "Transfer Rekening"
    );
  };

  const requiresCustomer = (type: string) => {
    return type === "Pemberian Utang";
  };

  // Helper function to round up pajak ongkos using Excel formula: ROUNDUP(amount/5000)*5000
  const roundUpPajakOngkos = (amount: number): number => {
    // Formula: ROUNDUP(amount/5000)*5000
    return Math.ceil(amount / 5000) * 5000;
  };

  // Helper function to calculate transfer account tax based on amount
  const calculateTransferTax = (amount: number): number => {
    if (amount >= 5000 && amount <= 149000) return 2000;
    if (amount >= 150000 && amount <= 499000) return 3000;
    if (amount >= 500000 && amount <= 999000) return 5000;
    if (amount >= 1000000 && amount <= 4999000) return 7000;
    if (amount >= 5000000 && amount <= 9999000) return 10000;
    if (amount >= 10000000 && amount <= 24999000) return 15000;
    if (amount >= 25000000 && amount <= 49999000) return 20000;
    if (amount >= 50000000) return 25000;
    return 0; // Default for amounts below 5000
  };

  // Helper function to round result with special logic
  const roundResult = (amount: number): number => {
    const lastThreeDigits = amount % 1000;
    const baseAmount = Math.floor(amount / 1000) * 1000;

    if (lastThreeDigits <= 500) {
      // Round down
      return baseAmount;
    } else {
      // Round up
      return baseAmount + 100;
    }
  };

  // Watch for changes in jumlahGalon when type is "Pembelian stok (Pembelian Minyak)"
  useEffect(() => {
    if (
      isPembelianMinyak(watchType) &&
      watchJumlahGalon &&
      watchJumlahGalon > 0
    ) {
      const baseAmount = watchJumlahGalon * 340000;
      const rawPajakOngkos = watchJumlahGalon * 12000;
      const pajakOngkos = roundUpPajakOngkos(rawPajakOngkos);
      const pajakTransfer = 2500;
      const totalPengeluaran = baseAmount + pajakOngkos + pajakTransfer;

      form.setValue("amount", baseAmount);
      form.setValue("pajakOngkos", pajakOngkos);
      form.setValue("pajakTransfer", pajakTransfer);
      form.setValue("totalPengeluaran", totalPengeluaran);
    } else if (!isPembelianMinyak(watchType)) {
      // Reset fields when type is not "Pembelian stok (Pembelian Minyak)"
      form.setValue("jumlahGalon", 0);
      form.setValue("pajakOngkos", 0);
      form.setValue("pajakTransfer", 2500);
      form.setValue("totalPengeluaran", 0);
    }
  }, [watchType, watchJumlahGalon, form]);

  // Watch for changes in Transfer Rekening calculations
  useEffect(() => {
    if (isTransferRekening(watchType) && watchAmount && watchAmount > 0) {
      if (watchKonter === "Dia store") {
        const pajakTransferRekening = calculateTransferTax(watchAmount);
        const rawResult = watchAmount - pajakTransferRekening;
        const hasil = roundResult(rawResult);

        form.setValue("pajakTransferRekening", pajakTransferRekening);
        form.setValue("hasil", hasil);
      }
      // For manual, user will input pajakTransferRekening manually
      // Calculate hasil when pajakTransferRekening changes
      const currentPajak = form.getValues("pajakTransferRekening") || 0;
      if (watchKonter === "manual" && currentPajak >= 0) {
        const rawResult = watchAmount - currentPajak;
        const hasil = roundResult(rawResult);
        form.setValue("hasil", hasil);
      }
    } else if (!isTransferRekening(watchType)) {
      // Reset fields when type is not "Penjualan (Transfer rekening)"
      form.setValue("konter", "Dia store");
      form.setValue("pajakTransferRekening", 0);
      form.setValue("hasil", 0);
    }
  }, [watchType, watchAmount, watchKonter, form]);

  // Watch for category changes to reset type and related fields
  useEffect(() => {
    if (watchCategory === "Income") {
      form.setValue("type", "Penjualan (Transfer rekening)");
    } else if (watchCategory === "Expense") {
      form.setValue("type", "Pembelian stok (Pembelian Minyak)");
    } else if (watchCategory === "Investment") {
      form.setValue("type", "Investasi Lain-lain");
    }
    // Reset special fields
    form.setValue("jumlahGalon", 0);
    form.setValue("pajakOngkos", 0);
    form.setValue("pajakTransfer", 2500);
    form.setValue("totalPengeluaran", 0);
    form.setValue("konter", "Dia store");
    form.setValue("pajakTransferRekening", 0);
    form.setValue("hasil", 0);
  }, [watchCategory, form]);

  // Get current store ID from active tab
  const currentStoreId = activeTab
    ? parseInt(activeTab.replace("store-", ""))
    : undefined;

  // Fetch sales records with status "diterima" for Transfer Rekening (1 month)
  const { data: receivedSales = [] } = useQuery<Sales[]>({
    queryKey: ["/api/sales/received", { storeId: currentStoreId }],
    queryFn: async () => {
      if (!currentStoreId) return [];
      // Get sales from last 30 days with status "diterima"
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
      
      const res = await apiRequest(
        "GET",
        `/api/sales?storeId=${currentStoreId}`
      );
      const allSales = await res.json();
      
      // Filter for last 30 days and status "diterima" only (exclude "none")
      return allSales.filter((sale: Sales) => {
        const saleDate = new Date(sale.date);
        const isWithinMonth = saleDate >= startDate && saleDate <= endDate;
        const isReceived = sale.status === 'diterima';
        return isWithinMonth && isReceived;
      });
    },
    enabled: !!currentStoreId && isTransferRekening(watchType),
  });

  // Calculate total transfer amount from selected sales records
  useEffect(() => {
    if (isTransferRekening(watchType) && selectedSalesIds.length > 0 && receivedSales.length > 0) {
      const totalAmount = selectedSalesIds.reduce((sum, salesId) => {
        const sales = receivedSales.find(s => s.id === salesId);
        if (sales && sales.totalCash) {
          return sum + parseFloat(sales.totalCash.toString());
        }
        return sum;
      }, 0);
      form.setValue("amount", totalAmount);
    } else if (isTransferRekening(watchType) && selectedSalesIds.length === 0) {
      form.setValue("amount", 0);
    }
  }, [selectedSalesIds, receivedSales, watchType, form]);

  // Reset selected sales when type changes
  useEffect(() => {
    setSelectedSalesIds([]);
  }, [watchType]);

  const { data: cashflowRecords, isLoading } = useQuery<Cashflow[]>({
    queryKey: ["/api/cashflow", { storeId: currentStoreId }],
    queryFn: async () => {
      const res = await apiRequest(
        "GET",
        `/api/cashflow?storeId=${currentStoreId}`,
      );
      return await res.json();
    },
    enabled: !!currentStoreId, // Only run query when we have a store ID
  });

  // Customer queries
  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
  });

  // Customer search query
  const { data: searchResults = [] } = useQuery<Customer[]>({
    queryKey: ["/api/customers/search", customerSearchTerm],
    queryFn: async ({ queryKey }) => {
      const [url, searchTerm] = queryKey;
      if (!searchTerm) return [];
      const res = await apiRequest("GET", `${url}?q=${encodeURIComponent(searchTerm)}`);
      return await res.json();
    },
    enabled: customerSearchTerm.length > 0,
  });

  // Filtered customers based on search
  const filteredCustomers = customerSearchTerm.length > 0 ? searchResults : customers;

  // Calculate store totals for dashboard
  const storeTotals = useMemo(() => {
    if (!cashflowRecords) return {};

    const totals: Record<number, { totalIncome: number; totalExpense: number; totalInvestment: number; netFlow: number }> = {};

    // Group by store and calculate totals
    stores.forEach(store => {
      const storeRecords = cashflowRecords.filter(record => record.storeId === store.id);
      
      const income = storeRecords
        .filter(record => record.category === "Income")
        .reduce((sum, record) => sum + parseFloat(record.amount), 0);
      
      const expense = storeRecords
        .filter(record => record.category === "Expense")
        .reduce((sum, record) => sum + parseFloat(record.amount), 0);
      
      const investment = storeRecords
        .filter(record => record.category === "Investment")
        .reduce((sum, record) => sum + parseFloat(record.amount), 0);

      totals[store.id] = {
        totalIncome: income,
        totalExpense: expense,
        totalInvestment: investment,
        netFlow: income - expense - investment,
      };
    });

    return totals;
  }, [cashflowRecords, stores]);

  // Submit cashflow mutation
  const submitCashflowMutation = useMutation({
    mutationFn: async (data: CashflowData & { salesIds?: string[] }) => {
      console.log("🚀 CASHFLOW SUBMISSION STARTED");
      console.log("📝 Form Data:", data);
      console.log("🏪 Target Store ID:", data.storeId);
      
      const res = await apiRequest("POST", "/api/cashflow", data);
      const result = await res.json();
      console.log("✅ CASHFLOW SUBMISSION SUCCESS");
      console.log("📄 Server Response:", result);
      
      // If Transfer Rekening with selected sales, update sales status to "disetor"
      if (data.salesIds && data.salesIds.length > 0) {
        await Promise.all(
          data.salesIds.map(async (salesId) => {
            await apiRequest("PATCH", `/api/sales/${salesId}`, { status: "disetor" });
          })
        );
      }
      
      return result;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Cashflow entry added successfully!",
      });
      form.reset();
      setSelectedSalesIds([]);
      queryClient.invalidateQueries({ queryKey: ["/api/cashflow"] });
      queryClient.invalidateQueries({ queryKey: ["/api/sales"] });
    },
    onError: (error: Error) => {
      console.error("❌ CASHFLOW SUBMISSION ERROR:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to add cashflow entry",
        variant: "destructive",
      });
    },
  });

  // Customer form
  const customerForm = useForm({
    resolver: zodResolver(insertCustomerSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      address: "",
      storeId: currentStoreId || 1,
    },
  });

  // Create customer mutation
  const createCustomerMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/customers", {
        ...data,
        storeId: currentStoreId || 1,
      });
      return await res.json();
    },
    onSuccess: (newCustomer) => {
      toast({
        title: "Success",
        description: "Customer created successfully!",
      });
      customerForm.reset();
      setIsAddCustomerModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      
      // Set the newly created customer as selected
      form.setValue("customerId", newCustomer.id);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create customer",
        variant: "destructive",
      });
    },
  });

  // Delete cashflow mutation
  const deleteCashflowMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/cashflow/${id}`);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Cashflow record deleted successfully!",
      });
      setIsDeleteDialogOpen(false);
      setDeleteConfirmEntry(null);
      queryClient.invalidateQueries({ queryKey: ["/api/cashflow"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete cashflow record",
        variant: "destructive",
      });
    },
  });

  // Bulk delete mutation
  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const res = await apiRequest("POST", "/api/cashflows/bulk-delete", { ids });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: `Successfully deleted ${selectedCashflowIds.length} cashflow record${selectedCashflowIds.length > 1 ? 's' : ''}`,
      });
      setSelectedCashflowIds([]);
      setShowBulkDeleteDialog(false);
      queryClient.invalidateQueries({ queryKey: ["/api/cashflow"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete cashflow records",
        variant: "destructive",
      });
    },
  });

  // Delete confirmation handlers
  const handleDeleteClick = (entry: Cashflow, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent triggering the row click
    setDeleteConfirmEntry(entry);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (deleteConfirmEntry) {
      deleteCashflowMutation.mutate(deleteConfirmEntry.id);
    }
  };

  const handleDeleteCancel = () => {
    setIsDeleteDialogOpen(false);
    setDeleteConfirmEntry(null);
  };

  // Bulk delete handlers
  const toggleCashflowSelection = (id: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setSelectedCashflowIds(prev => 
      prev.includes(id) ? prev.filter(cashflowId => cashflowId !== id) : [...prev, id]
    );
  };

  const toggleAllCashflowsForStore = (storeId: number) => {
    const storeCashflows = cashflowRecords?.filter(record => record.storeId === storeId) || [];
    const storeCashflowIds = storeCashflows.map(record => record.id);
    
    const allSelected = storeCashflowIds.every(id => selectedCashflowIds.includes(id));
    
    if (allSelected) {
      // Deselect all from this store
      setSelectedCashflowIds(prev => prev.filter(id => !storeCashflowIds.includes(id)));
    } else {
      // Select all from this store
      setSelectedCashflowIds(prev => {
        const newSelection = [...prev];
        storeCashflowIds.forEach(id => {
          if (!newSelection.includes(id)) {
            newSelection.push(id);
          }
        });
        return newSelection;
      });
    }
  };

  const handleBulkDelete = () => {
    bulkDeleteMutation.mutate(selectedCashflowIds);
  };

  // Get selected count for current store
  const getSelectedCountForStore = (storeId: number) => {
    const storeCashflows = cashflowRecords?.filter(record => record.storeId === storeId) || [];
    const storeCashflowIds = storeCashflows.map(record => record.id);
    return selectedCashflowIds.filter(id => storeCashflowIds.includes(id)).length;
  };

  const onSubmit = (data: CashflowData) => {
    console.log("🎯 FORM SUBMISSION TRIGGERED");
    console.log("📊 Active Tab Check:", activeTab);
    console.log("🏬 Current Store ID:", currentStoreId);
    console.log("🔄 Mutation Status:", {
      isLoading: submitCashflowMutation.isPending,
      isError: submitCashflowMutation.isError,
      error: submitCashflowMutation.error
    });
    
    // Validate that currentStoreId is set
    if (!currentStoreId) {
      console.error("❌ SUBMISSION BLOCKED: No current store ID");
      toast({
        title: "Error",
        description: "Please select a store first",
        variant: "destructive",
      });
      return;
    }

    // Force store ID to current store
    const submissionData: any = { 
      ...data, 
      storeId: currentStoreId 
    };
    
    // Add selected sales IDs for Transfer Rekening
    if (isTransferRekening(data.type) && selectedSalesIds.length > 0) {
      submissionData.salesIds = selectedSalesIds;
    }
    
    console.log("📤 Final Submission Data:", submissionData);
    submitCashflowMutation.mutate(submissionData);
  };

  const onCreateCustomer = (data: any) => {
    createCustomerMutation.mutate(data);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Cashflow Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Track income, expenses, and investments across all stores
          </p>
        </div>
        <SyncButton 
          dataType="cashflow"
          variant="outline"
          className="text-indigo-600 border-indigo-200 hover:bg-indigo-50"
        />
      </div>

      {/* Tabs for different stores */}
      {stores.length > 0 ? (
        <Tabs value={activeTab || `store-${stores[0]?.id}`} onValueChange={handleTabChange}>
          <TabsList className="grid w-full grid-cols-2">
            {stores.map((store) => (
              <TabsTrigger 
                key={store.id} 
                value={`store-${store.id}`}
                data-testid={`tab-store-${store.id}`}
              >
                {store.name}
              </TabsTrigger>
            ))}
          </TabsList>

          {stores.map((store) => (
            <TabsContent key={store.id} value={`store-${store.id}`} className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Store Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <DollarSign className="h-4 w-4" />
                      {store.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between items-center p-2 bg-green-50 dark:bg-green-900/20 rounded">
                      <span className="text-sm font-medium text-green-700 dark:text-green-300">
                        Pemasukan
                      </span>
                      <span
                        className="font-bold text-green-600"
                        data-testid={`text-store${store.id}-income`}
                      >
                        {formatRupiah(
                          (storeTotals[store.id] || { totalIncome: 0 })
                            .totalIncome,
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-red-50 dark:bg-red-900/20 rounded">
                      <span className="text-sm font-medium text-red-700 dark:text-red-300">
                        Pengeluaran
                      </span>
                      <span
                        className="font-bold text-red-600"
                        data-testid={`text-store${store.id}-expense`}
                      >
                        {formatRupiah(
                          (storeTotals[store.id] || { totalExpense: 0 })
                            .totalExpense,
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                      <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                        Investasi
                      </span>
                      <span
                        className="font-bold text-blue-600"
                        data-testid={`text-store${store.id}-investment`}
                      >
                        {formatRupiah(
                          (storeTotals[store.id] || { totalInvestment: 0 })
                            .totalInvestment,
                        )}
                      </span>
                    </div>
                    <div
                      className={`flex justify-between items-center p-2 rounded font-semibold ${
                        (storeTotals[store.id] || { netFlow: 0 }).netFlow >= 0
                          ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600"
                          : "bg-orange-50 dark:bg-orange-900/20 text-orange-600"
                      }`}
                    >
                      <span className="text-sm font-medium">Net Cashflow</span>
                      <span data-testid={`text-store${store.id}-net`}>
                        {formatRupiah(
                          (storeTotals[store.id] || { netFlow: 0 }).netFlow,
                        )}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {/* Add Cashflow Entry */}
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5" />
                      Add Cashflow Entry
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Form {...form}>
                      <form
                        onSubmit={form.handleSubmit(onSubmit)}
                        className="space-y-4"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="category"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Category</FormLabel>
                                <Select
                                  onValueChange={field.onChange}
                                  defaultValue={field.value}
                                >
                                  <FormControl>
                                    <SelectTrigger data-testid="select-category">
                                      <SelectValue placeholder="Select category" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="Income">Income</SelectItem>
                                    <SelectItem value="Expense">Expense</SelectItem>
                                    <SelectItem value="Investment">
                                      Investment
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="type"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Type</FormLabel>
                                <Select
                                  onValueChange={field.onChange}
                                  value={field.value}
                                >
                                  <FormControl>
                                    <SelectTrigger data-testid="select-type">
                                      <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {watchCategory === "Income" &&
                                      incomeTypes.map((type) => (
                                        <SelectItem key={type} value={type}>
                                          {type}
                                        </SelectItem>
                                      ))}
                                    {watchCategory === "Expense" &&
                                      expenseTypes.map((type) => (
                                        <SelectItem key={type} value={type}>
                                          {type}
                                        </SelectItem>
                                      ))}
                                    {watchCategory === "Investment" &&
                                      investmentTypes.map((type) => (
                                        <SelectItem key={type} value={type}>
                                          {type}
                                        </SelectItem>
                                      ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        {/* Date field */}
                        <FormField
                          control={form.control}
                          name="date"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Tanggal</FormLabel>
                              <FormControl>
                                <Input
                                  type="date"
                                  data-testid="input-date"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Special fields for Pembelian Minyak */}
                        {isPembelianMinyak(watchType) && (
                          <div className="p-4 border border-blue-200 rounded-lg bg-blue-50/50 space-y-4">
                            <h4 className="font-medium text-blue-800">
                              Pembelian Minyak Details
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <FormField
                                control={form.control}
                                name="jumlahGalon"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Jumlah Galon *</FormLabel>
                                    <FormControl>
                                      <Input
                                        type="number"
                                        step="0.001"
                                        placeholder="Enter gallons"
                                        data-testid="input-jumlah-galon"
                                        {...field}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={form.control}
                                name="amount"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Base Amount (Auto-calculated)</FormLabel>
                                    <FormControl>
                                      <Input
                                        type="number"
                                        placeholder="Base amount"
                                        readOnly
                                        className="bg-gray-100"
                                        data-testid="input-base-amount"
                                        {...field}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={form.control}
                                name="pajakOngkos"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Pajak Ongkos</FormLabel>
                                    <div className="flex gap-2">
                                      <FormControl>
                                        <Input
                                          type="number"
                                          placeholder="Pajak ongkos"
                                          data-testid="input-pajak-ongkos"
                                          {...field}
                                          onChange={(e) => {
                                            const value = parseFloat(e.target.value) || 0;
                                            field.onChange(value);
                                            // Update total when pajak changes
                                            const baseAmount = form.getValues("amount") || 0;
                                            const pajakTransfer = form.getValues("pajakTransfer") || 2500;
                                            form.setValue("totalPengeluaran", baseAmount + value + pajakTransfer);
                                          }}
                                        />
                                      </FormControl>
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                          form.setValue("pajakOngkos", 0);
                                          const baseAmount = form.getValues("amount") || 0;
                                          const pajakTransfer = form.getValues("pajakTransfer") || 2500;
                                          form.setValue("totalPengeluaran", baseAmount + pajakTransfer);
                                        }}
                                        data-testid="button-reset-pajak"
                                      >
                                        <Save className="h-4 w-4" />
                                      </Button>
                                    </div>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={form.control}
                                name="totalPengeluaran"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Total Pengeluaran (Auto-calculated)</FormLabel>
                                    <FormControl>
                                      <Input
                                        type="number"
                                        placeholder="Total pengeluaran"
                                        readOnly
                                        className="bg-gray-100"
                                        data-testid="input-total-pengeluaran"
                                        {...field}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                          </div>
                        )}

                        {/* Special fields for Transfer Rekening */}
                        {isTransferRekening(watchType) && (
                          <div className="p-4 border border-purple-200 rounded-lg bg-purple-50/50 space-y-4">
                            <h4 className="font-medium text-purple-800">
                              Transfer Rekening Details
                            </h4>

                            {/* Sales Selection Checkboxes */}
                            {receivedSales.length > 0 && (
                              <div className="p-3 border border-blue-200 rounded-lg bg-blue-50/50 space-y-3">
                                <h5 className="font-medium text-blue-800 text-sm">
                                  Pilih Sales Record yang Diterima (1 Bulan Terakhir - {receivedSales.length} record)
                                </h5>
                                <div className="space-y-2 max-h-60 overflow-y-auto">
                                  {receivedSales
                                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                                    .map((sales) => (
                                    <div
                                      key={sales.id}
                                      className="flex items-center justify-between p-2 bg-white rounded border border-blue-100"
                                    >
                                      <div className="flex items-center space-x-3 flex-1">
                                        <Checkbox
                                          id={`sales-${sales.id}`}
                                          checked={selectedSalesIds.includes(sales.id)}
                                          onCheckedChange={(checked) => {
                                            if (checked) {
                                              setSelectedSalesIds([...selectedSalesIds, sales.id]);
                                            } else {
                                              setSelectedSalesIds(selectedSalesIds.filter(id => id !== sales.id));
                                            }
                                          }}
                                          data-testid={`checkbox-sales-${sales.id}`}
                                        />
                                        <label
                                          htmlFor={`sales-${sales.id}`}
                                          className="text-sm font-medium cursor-pointer"
                                        >
                                          {sales.shift || 'N/A'} - {formatRupiah(sales.totalCash || 0)}
                                        </label>
                                      </div>
                                      <span className="text-xs text-gray-500 ml-2">
                                        {new Date(sales.date).toLocaleDateString('id-ID', { 
                                          day: '2-digit', 
                                          month: 'short',
                                          year: 'numeric'
                                        })}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                                <div className="pt-2 border-t border-blue-200">
                                  <p className="text-sm font-semibold text-blue-900">
                                    Total Terpilih: {formatRupiah(
                                      selectedSalesIds.reduce((sum, salesId) => {
                                        const sales = receivedSales.find(s => s.id === salesId);
                                        return sum + (sales?.totalCash ? parseFloat(sales.totalCash.toString()) : 0);
                                      }, 0)
                                    )}
                                  </p>
                                </div>
                              </div>
                            )}

                            {receivedSales.length === 0 && (
                              <div className="p-3 border border-gray-200 rounded-lg bg-gray-50 text-center">
                                <p className="text-sm text-gray-600">
                                  Tidak ada sales record dengan status "diterima" dalam 1 bulan terakhir
                                </p>
                              </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <FormField
                                control={form.control}
                                name="konter"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Konter Type</FormLabel>
                                    <FormControl>
                                      <RadioGroup
                                        onValueChange={field.onChange}
                                        value={field.value}
                                        className="flex flex-row space-x-4"
                                      >
                                        <div className="flex items-center space-x-2">
                                          <RadioGroupItem value="Dia store" id="dia-store" />
                                          <Label htmlFor="dia-store">Dia store</Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                          <RadioGroupItem value="manual" id="manual" />
                                          <Label htmlFor="manual">Manual</Label>
                                        </div>
                                      </RadioGroup>
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={form.control}
                                name="amount"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Transfer Amount {selectedSalesIds.length > 0 && "(Auto-calculated)"}</FormLabel>
                                    <FormControl>
                                      <Input
                                        type="number"
                                        step="0.01"
                                        placeholder="Enter amount"
                                        readOnly={selectedSalesIds.length > 0}
                                        className={selectedSalesIds.length > 0 ? "bg-gray-100" : ""}
                                        data-testid="input-transfer-amount"
                                        {...field}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={form.control}
                                name="pajakTransferRekening"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Pajak Transfer</FormLabel>
                                    <FormControl>
                                      <Input
                                        type="number"
                                        placeholder="Tax amount"
                                        readOnly={watchKonter === "Dia store"}
                                        className={watchKonter === "Dia store" ? "bg-gray-100" : ""}
                                        data-testid="input-pajak-transfer-rekening"
                                        {...field}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={form.control}
                                name="hasil"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Hasil (Auto-calculated)</FormLabel>
                                    <FormControl>
                                      <Input
                                        type="number"
                                        placeholder="Result"
                                        readOnly
                                        className="bg-gray-100"
                                        data-testid="input-hasil"
                                        {...field}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                          </div>
                        )}

                        {/* Regular amount field for non-special transaction types */}
                        {!isPembelianMinyak(watchType) && !isTransferRekening(watchType) && (
                          <FormField
                            control={form.control}
                            name="amount"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Amount</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    placeholder="Enter amount"
                                    data-testid="input-amount"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}

                        <FormField
                          control={form.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Description (Optional)</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Enter description"
                                  data-testid="input-description"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Customer selection for debt transactions */}
                        {requiresCustomer(watchType) && (
                          <div className="space-y-4 p-4 border border-orange-200 rounded-lg bg-orange-50/50">
                            <h4 className="font-medium text-orange-800">
                              Customer Details
                            </h4>
                            
                            <FormField
                              control={form.control}
                              name="paymentStatus"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Payment Status</FormLabel>
                                  <Select
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                  >
                                    <FormControl>
                                      <SelectTrigger data-testid="select-payment-status">
                                        <SelectValue placeholder="Select payment status" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="lunas">Lunas (Paid)</SelectItem>
                                      <SelectItem value="belum_lunas">Belum Lunas (Unpaid)</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            {watchPaymentStatus === "belum_lunas" && (
                              <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                  <FormField
                                    control={form.control}
                                    name="customerId"
                                    render={({ field }) => (
                                      <FormItem className="flex-1">
                                        <FormLabel>Select Customer</FormLabel>
                                        <Select
                                          onValueChange={field.onChange}
                                          value={field.value}
                                        >
                                          <FormControl>
                                            <SelectTrigger data-testid="select-customer">
                                              <SelectValue placeholder="Select customer" />
                                            </SelectTrigger>
                                          </FormControl>
                                          <SelectContent>
                                            {/* Search box */}
                                            <div className="p-2">
                                              <Input
                                                placeholder="Search customers..."
                                                value={customerSearchTerm}
                                                onChange={(e) => setCustomerSearchTerm(e.target.value)}
                                                data-testid="input-customer-search"
                                              />
                                            </div>
                                            {filteredCustomers.map((customer) => (
                                              <SelectItem key={customer.id} value={customer.id}>
                                                {customer.name} {customer.email && `(${customer.email})`}
                                              </SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                  
                                  <Dialog open={isAddCustomerModalOpen} onOpenChange={setIsAddCustomerModalOpen}>
                                    <DialogTrigger asChild>
                                      <Button 
                                        type="button" 
                                        variant="outline" 
                                        size="icon"
                                        className="mt-8"
                                        data-testid="button-add-customer"
                                      >
                                        <Plus className="h-4 w-4" />
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                      <DialogHeader>
                                        <DialogTitle>Add New Customer</DialogTitle>
                                        <DialogDescription>
                                          Create a new customer for debt tracking
                                        </DialogDescription>
                                      </DialogHeader>
                                      <Form {...customerForm}>
                                        <form onSubmit={customerForm.handleSubmit(onCreateCustomer)} className="space-y-4">
                                          <FormField
                                            control={customerForm.control}
                                            name="name"
                                            render={({ field }) => (
                                              <FormItem>
                                                <FormLabel>Name *</FormLabel>
                                                <FormControl>
                                                  <Input
                                                    placeholder="Enter customer name"
                                                    data-testid="input-customer-name"
                                                    {...field}
                                                  />
                                                </FormControl>
                                                <FormMessage />
                                              </FormItem>
                                            )}
                                          />

                                          <FormField
                                            control={customerForm.control}
                                            name="email"
                                            render={({ field }) => (
                                              <FormItem>
                                                <FormLabel>Email (Optional)</FormLabel>
                                                <FormControl>
                                                  <Input
                                                    type="email"
                                                    placeholder="Enter email address"
                                                    data-testid="input-customer-email"
                                                    {...field}
                                                  />
                                                </FormControl>
                                                <FormMessage />
                                              </FormItem>
                                            )}
                                          />

                                          <FormField
                                            control={customerForm.control}
                                            name="phone"
                                            render={({ field }) => (
                                              <FormItem>
                                                <FormLabel>Phone (Optional)</FormLabel>
                                                <FormControl>
                                                  <Input
                                                    placeholder="Enter phone number"
                                                    data-testid="input-customer-phone"
                                                    {...field}
                                                  />
                                                </FormControl>
                                                <FormMessage />
                                              </FormItem>
                                            )}
                                          />

                                          <FormField
                                            control={customerForm.control}
                                            name="address"
                                            render={({ field }) => (
                                              <FormItem>
                                                <FormLabel>Address</FormLabel>
                                                <FormControl>
                                                  <Textarea
                                                    placeholder="Enter customer address"
                                                    data-testid="input-customer-address"
                                                    {...field}
                                                  />
                                                </FormControl>
                                                <FormMessage />
                                              </FormItem>
                                            )}
                                          />

                                          <div className="flex gap-2 pt-4">
                                            <Button
                                              type="button"
                                              variant="outline"
                                              className="flex-1"
                                              onClick={() => setIsAddCustomerModalOpen(false)}
                                              data-testid="button-cancel-customer"
                                            >
                                              Cancel
                                            </Button>
                                            <Button
                                              type="submit"
                                              className="flex-1"
                                              disabled={createCustomerMutation.isPending}
                                              data-testid="button-save-customer"
                                            >
                                              {createCustomerMutation.isPending
                                                ? "Saving..."
                                                : "Save Customer"}
                                            </Button>
                                          </div>
                                        </form>
                                      </Form>
                                    </DialogContent>
                                  </Dialog>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        <Button
                          type="submit"
                          className="w-full"
                          disabled={submitCashflowMutation.isPending}
                          data-testid="button-submit-cashflow"
                          onClick={(e) => {
                            console.log("🔄 Button Event:", e);
                            console.log("⚡ Is Disabled:", submitCashflowMutation.isPending);
                            console.log("📋 Current Form Values:", form.getValues());
                            console.log("❌ Form Errors:", form.formState.errors);
                            console.log("✅ Form Valid:", form.formState.isValid);
                            
                            if (submitCashflowMutation.isPending) {
                              alert("🚨 BUTTON DISABLED: Mutation is pending!");
                              e.preventDefault();
                            }
                          }}
                        >
                          {submitCashflowMutation.isPending
                            ? "Adding..."
                            : "Add Entry"}
                        </Button>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              </div>

              {/* Cashflow Records - FIXED: Using dynamic store.id instead of hardcoded */}
              <Card>
                <CardHeader>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Recent Cashflow Records
                    </CardTitle>
                    
                    {canDeleteCashflow && cashflowRecords && cashflowRecords.filter((record) => record.storeId === store.id).length > 0 && (
                      <div className="flex items-center gap-2">
                        {getSelectedCountForStore(store.id) > 0 && (
                          <>
                            <Badge variant="secondary" className="mr-2" data-testid={`badge-selected-count-store-${store.id}`}>
                              {getSelectedCountForStore(store.id)} selected
                            </Badge>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => setShowBulkDeleteDialog(true)}
                              disabled={bulkDeleteMutation.isPending}
                              data-testid={`button-bulk-delete-cashflow-store-${store.id}`}
                            >
                              {bulkDeleteMutation.isPending ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  Deleting...
                                </>
                              ) : (
                                <>
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete {getSelectedCountForStore(store.id)} item{getSelectedCountForStore(store.id) > 1 ? 's' : ''}
                                </>
                              )}
                            </Button>
                          </>
                        )}
                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={
                              cashflowRecords.filter((record) => record.storeId === store.id).length > 0 &&
                              cashflowRecords.filter((record) => record.storeId === store.id).every(record => selectedCashflowIds.includes(record.id))
                            }
                            onCheckedChange={() => toggleAllCashflowsForStore(store.id)}
                            data-testid={`checkbox-select-all-store-${store.id}`}
                          />
                          <Label className="text-sm cursor-pointer" onClick={() => toggleAllCashflowsForStore(store.id)}>
                            Select All
                          </Label>
                        </div>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="space-y-4 py-8 slide-up">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center gap-4 p-4 border border-border rounded-lg stagger-item">
                          <div className="skeleton w-12 h-12 rounded-full" />
                          <div className="flex-1 space-y-2">
                            <div className="skeleton-text w-2/3" />
                            <div className="skeleton-text h-3 w-1/3" />
                          </div>
                          <div className="skeleton w-20 h-6 rounded-md" />
                        </div>
                      ))}
                    </div>
                  ) : cashflowRecords &&
                    cashflowRecords.filter((record) => record.storeId === store.id)
                      .length > 0 ? (
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                      {cashflowRecords
                        .filter((record) => record.storeId === store.id)
                        .map((entry) => (
                          <div
                            key={entry.id}
                            className={`flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer ${
                              selectedCashflowIds.includes(entry.id) ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300' : ''
                            }`}
                            onClick={() => {
                              setSelectedEntry(entry);
                              setIsDetailModalOpen(true);
                            }}
                            data-testid={`cashflow-entry-${entry.id}`}
                          >
                            <div className="flex items-center gap-3">
                              {canDeleteCashflow && (
                                <Checkbox
                                  checked={selectedCashflowIds.includes(entry.id)}
                                  onCheckedChange={(e) => toggleCashflowSelection(entry.id, e as any)}
                                  onClick={(e) => e.stopPropagation()}
                                  data-testid={`checkbox-cashflow-${entry.id}`}
                                />
                              )}
                              <div
                                className={`p-2 rounded-full ${
                                  entry.category === "Income"
                                    ? "bg-green-100 text-green-600"
                                    : entry.category === "Expense"
                                      ? "bg-red-100 text-red-600"
                                      : "bg-blue-100 text-blue-600"
                                }`}
                              >
                                {entry.category === "Income" ? (
                                  <TrendingUp className="h-4 w-4" />
                                ) : entry.category === "Expense" ? (
                                  <TrendingDown className="h-4 w-4" />
                                ) : (
                                  <DollarSign className="h-4 w-4" />
                                )}
                              </div>
                              <div>
                                <p className="font-medium text-foreground">
                                  {entry.description ||
                                    `${entry.category} - ${entry.type}`}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {entry.category} • {entry.type}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {new Date(entry.date).toLocaleDateString('id-ID', {
                                    day: '2-digit',
                                    month: '2-digit', 
                                    year: 'numeric'
                                  })}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span
                                className={`font-semibold ${
                                  entry.category === "Income"
                                    ? "text-green-600"
                                    : "text-red-600"
                                }`}
                              >
                                {entry.category === "Income" ? "+" : "-"}
                                {formatRupiah(
                                  entry.category === "Expense" &&
                                    entry.totalPengeluaran
                                    ? entry.totalPengeluaran
                                    : entry.amount,
                                )}
                              </span>
                              <div className="flex items-center gap-1">
                                <Eye className="h-4 w-4 text-muted-foreground" />
                                {canDeleteCashflow && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => handleDeleteClick(entry, e)}
                                    disabled={deleteCashflowMutation.isPending}
                                    className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600"
                                    data-testid={`button-delete-cashflow-${entry.id}`}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground py-8">
                      <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No cashflow records found for {store.name}</p>
                      <p className="text-sm">
                        Add your first entry using the form
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      ) : (
        // Fallback for when stores haven't loaded yet
        <div className="text-center py-8">Loading store data...</div>
      )}

      {/* Detail Modal for viewing cashflow entries */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Cashflow Entry Details</DialogTitle>
          </DialogHeader>
          {selectedEntry && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Category</label>
                  <p className="text-sm text-muted-foreground">
                    {selectedEntry.category}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">Type</label>
                  <p className="text-sm text-muted-foreground">
                    {selectedEntry.type}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">Amount</label>
                  <p className="text-sm text-muted-foreground">
                    {formatRupiah(selectedEntry.amount)}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">Date</label>
                  <p className="text-sm text-muted-foreground">
                    {new Date(selectedEntry.date).toLocaleDateString('id-ID', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric'
                    })}
                  </p>
                </div>
              </div>
              {selectedEntry.description && (
                <div>
                  <label className="text-sm font-medium">Description</label>
                  <p className="text-sm text-muted-foreground">
                    {selectedEntry.description}
                  </p>
                </div>
              )}
              {selectedEntry.jumlahGalon && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Jumlah Galon</label>
                    <p className="text-sm text-muted-foreground">
                      {formatNumber(selectedEntry.jumlahGalon)}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Total Pengeluaran</label>
                    <p className="text-sm text-muted-foreground">
                      {formatRupiah(selectedEntry.totalPengeluaran || "0")}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="h-5 w-5" />
              Delete Cashflow Record
            </DialogTitle>
            <DialogDescription>
              This action cannot be undone. Are you sure you want to delete this cashflow record?
            </DialogDescription>
          </DialogHeader>
          
          {deleteConfirmEntry && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <label className="font-medium text-gray-700 dark:text-gray-300">Date</label>
                    <p className="text-gray-900 dark:text-gray-100">
                      {new Date(deleteConfirmEntry.date).toLocaleDateString('id-ID', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                  <div>
                    <label className="font-medium text-gray-700 dark:text-gray-300">Category</label>
                    <p className="text-gray-900 dark:text-gray-100">{deleteConfirmEntry.category}</p>
                  </div>
                  <div>
                    <label className="font-medium text-gray-700 dark:text-gray-300">Type</label>
                    <p className="text-gray-900 dark:text-gray-100">{deleteConfirmEntry.type}</p>
                  </div>
                  <div>
                    <label className="font-medium text-gray-700 dark:text-gray-300">Amount</label>
                    <p className="text-gray-900 dark:text-gray-100 font-semibold">
                      {formatRupiah(
                        deleteConfirmEntry.category === "Expense" && deleteConfirmEntry.totalPengeluaran
                          ? deleteConfirmEntry.totalPengeluaran
                          : deleteConfirmEntry.amount
                      )}
                    </p>
                  </div>
                </div>
                
                {deleteConfirmEntry.description && (
                  <div className="mt-3">
                    <label className="font-medium text-gray-700 dark:text-gray-300">Description</label>
                    <p className="text-gray-900 dark:text-gray-100">{deleteConfirmEntry.description}</p>
                  </div>
                )}
              </div>
              
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                <p className="text-sm text-red-800 dark:text-red-200">
                  <strong>Warning:</strong> Deleting this record will permanently remove it from your cashflow history 
                  and may affect your financial reports and calculations.
                </p>
              </div>

              <div className="flex gap-3 justify-end">
                <Button
                  variant="outline"
                  onClick={handleDeleteCancel}
                  disabled={deleteCashflowMutation.isPending}
                  data-testid="button-cancel-delete"
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeleteConfirm}
                  disabled={deleteCashflowMutation.isPending}
                  data-testid="button-confirm-delete"
                >
                  {deleteCashflowMutation.isPending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Record
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Bulk Delete Confirmation Dialog */}
      <AlertDialog open={showBulkDeleteDialog} onOpenChange={setShowBulkDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Selected Cashflow Records?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedCashflowIds.length} cashflow record{selectedCashflowIds.length > 1 ? 's' : ''}? 
              This action cannot be undone and will permanently delete the following records:
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          {/* List of selected cashflows */}
          <div className="max-h-60 overflow-y-auto border rounded-md p-3 space-y-2">
            {selectedCashflowIds.map((cashflowId) => {
              const record = cashflowRecords?.find(r => r.id === cashflowId);
              if (!record) return null;
              
              const store = stores?.find((s: any) => s.id === record.storeId);
              const storeName = store?.name || `Store ${record.storeId}`;
              
              return (
                <div key={cashflowId} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                  <div className="flex-1">
                    <div className="font-medium text-sm">
                      {new Date(record.date).toLocaleDateString('id-ID', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                      })}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      {storeName} • {record.category} • {record.type}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`font-semibold ${
                      record.category === "Income" ? "text-green-600" : "text-red-600"
                    }`}>
                      {formatRupiah(
                        record.category === "Expense" && record.totalPengeluaran
                          ? record.totalPengeluaran
                          : record.amount
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          <AlertDialogFooter>
            <AlertDialogCancel 
              disabled={bulkDeleteMutation.isPending}
              data-testid="button-cancel-bulk-delete-cashflow"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              disabled={bulkDeleteMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
              data-testid="button-confirm-bulk-delete-cashflow"
            >
              {bulkDeleteMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete {selectedCashflowIds.length} Record{selectedCashflowIds.length > 1 ? 's' : ''}
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}