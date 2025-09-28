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
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatRupiah, formatNumber } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
  type Cashflow,
  type Customer,
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
} from "lucide-react";

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
  const [selectedEntry, setSelectedEntry] = useState<Cashflow | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isAddCustomerModalOpen, setIsAddCustomerModalOpen] = useState(false);
  const [customerSearchTerm, setCustomerSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<string | null>(null);

  // Fetch stores to get actual store names and data
  const { data: stores = [] } = useQuery({
    queryKey: ["/api/stores"],
  });

  const form = useForm<CashflowData>({
    resolver: zodResolver(cashflowSchema),
    defaultValues: {
      category: "Income",
      type: "Pendapatan Lain-lain",
      amount: 0,
      description: "",
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
      form.setValue("type", "Pendapatan Lain-lain");
    } else if (watchCategory === "Expense") {
      form.setValue("type", "Pengeluaran Lain-lain");
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

  const { data: cashflowRecords, isLoading } = useQuery<Cashflow[]>({
    queryKey: ["/api/cashflow", { storeId: currentStoreId }],
    queryFn: async () => {
      const res = await apiRequest(
        "GET",
        `/api/cashflow?storeId=${currentStoreId}`,
      );
      return await res.json();
    },
    enabled: !!currentStoreId, // 👈 biar query jalan hanya kalau ada storeId
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
      const res = await apiRequest(
        "GET",
        `${url}?q=${encodeURIComponent(searchTerm as string)}`,
      );
      return await res.json();
    },
    enabled: customerSearchTerm.length > 0,
  });

  // Filter customers based on search term
  const filteredCustomers =
    customerSearchTerm.length > 0 ? searchResults : customers;

  // Query for all cashflow data to calculate grand totals
  const { data: allCashflowData = [] } = useQuery<Cashflow[]>({
    queryKey: ["/api/cashflow"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/cashflow");
      return await res.json();
    },
  });

  // Calculate totals for each store and overall
  const calculateStoreTotals = (records: Cashflow[]) => {
    let totalIncome = 0;
    let totalExpense = 0;
    let totalInvestment = 0;

    records.forEach((record) => {
      // Only use totalPengeluaran for Pembelian Minyak transactions or when totalPengeluaran > 0
      const useTotal =
        record.category === "Expense" &&
        (isPembelianMinyak(record.type) ||
          parseFloat(record.totalPengeluaran ?? "0") > 0);
      const amount = useTotal
        ? parseFloat(record.totalPengeluaran || "0")
        : parseFloat(record.amount || "0");

      // Guard against NaN
      const safeAmount = isNaN(amount) ? 0 : amount;

      switch (record.category) {
        case "Income":
          totalIncome += safeAmount;
          break;
        case "Expense":
          totalExpense += safeAmount;
          break;
        case "Investment":
          totalInvestment += safeAmount;
          break;
      }
    });

    return {
      totalIncome,
      totalExpense,
      totalInvestment,
      netFlow: totalIncome - totalExpense - totalInvestment,
    };
  };

  // Memoize calculations for performance by store
  const storeTotals = useMemo(() => {
    const totals: { [storeId: number]: any } = {};
    stores.forEach((store) => {
      const storeData = allCashflowData.filter(
        (record) => record.storeId === store.id,
      );
      totals[store.id] = calculateStoreTotals(storeData);
    });
    return totals;
  }, [allCashflowData, stores]);

  const grandTotals = useMemo(() => {
    let totalIncome = 0,
      totalExpense = 0,
      totalInvestment = 0;
    Object.values(storeTotals).forEach((storeTotal: any) => {
      totalIncome += storeTotal.totalIncome;
      totalExpense += storeTotal.totalExpense;
      totalInvestment += storeTotal.totalInvestment;
    });
    return {
      totalIncome,
      totalExpense,
      totalInvestment,
      netFlow: totalIncome - totalExpense - totalInvestment,
    };
  }, [storeTotals]);

  // Customer creation form
  const customerForm = useForm<z.infer<typeof insertCustomerSchema>>({
    resolver: zodResolver(insertCustomerSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      address: "",
      type: "customer",
    },
  });

  const submitCashflowMutation = useMutation({
    mutationFn: async (data: CashflowData) => {
      console.log("🚀 CASHFLOW MUTATION STARTED");
      console.log("📝 Data being sent:", JSON.stringify(data, null, 2));
      console.log("🏪 Current Store ID:", currentStoreId);
      console.log("📊 Active Tab:", activeTab);
      
      try {
        const res = await apiRequest("POST", "/api/cashflow", data);
        console.log("✅ API Response Status:", res.status);
        
        if (!res.ok) {
          const errorText = await res.text();
          console.error("❌ API Error Response:", errorText);
          throw new Error(`API Error ${res.status}: ${errorText}`);
        }
        
        const result = await res.json();
        console.log("📥 API Response Data:", result);
        return result;
      } catch (error) {
        console.error("💥 CASHFLOW MUTATION ERROR:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log("🎉 CASHFLOW MUTATION SUCCESS:", data);
      toast({
        title: "✅ Success",
        description: "Cashflow entry saved successfully!",
      });
      form.reset();
      queryClient.invalidateQueries({
        queryKey: ["/api/cashflow", { storeId: currentStoreId }],
      });
      queryClient.invalidateQueries({ queryKey: ["/api/cashflow"] });
    },
    onError: (error: Error) => {
      console.error("🔥 CASHFLOW MUTATION FAILED:", error);
      console.error("📋 Error Stack:", error.stack);
      toast({
        title: "❌ Error Cashflow",
        description: `GAGAL SIMPAN: ${error.message}`,
        variant: "destructive",
      });
      
      // Show aggressive debugging alert
      alert(`🚨 CASHFLOW ERROR ALERT 🚨\n\nError: ${error.message}\n\nCheck console for details!`);
    },
  });

  // Customer creation mutation
  const createCustomerMutation = useMutation({
    mutationFn: async (data: z.infer<typeof insertCustomerSchema>) => {
      const res = await apiRequest("POST", "/api/customers", data);
      return await res.json();
    },
    onSuccess: (newCustomer: Customer) => {
      toast({
        title: "Success",
        description: "Customer created successfully!",
      });
      customerForm.reset();
      setIsAddCustomerModalOpen(false);
      // Set the newly created customer as selected
      form.setValue("customerId", newCustomer.id);
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/customers/search"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CashflowData) => {
    console.log("🔥 CASHFLOW SUBMIT TRIGGERED!");
    console.log("📋 Form Data:", JSON.stringify(data, null, 2));
    console.log("🏪 Store ID Check:", data.storeId);
    console.log("📊 Active Tab Check:", activeTab);
    console.log("🏬 Current Store ID:", currentStoreId);
    console.log("🔄 Mutation Status:", {
      isLoading: submitCashflowMutation.isPending,
      isError: submitCashflowMutation.isError,
      error: submitCashflowMutation.error
    });
    
    // Aggressive validation checks
    if (!data.storeId) {
      alert("🚨 ERROR: Store ID is missing!");
      console.error("❌ Store ID validation failed:", data.storeId);
      return;
    }
    
    if (!data.amount || data.amount <= 0) {
      alert("🚨 ERROR: Amount must be greater than 0!");
      console.error("❌ Amount validation failed:", data.amount);
      return;
    }
    
    if (!data.category) {
      alert("🚨 ERROR: Category is required!");
      console.error("❌ Category validation failed:", data.category);
      return;
    }
    
    if (!data.type) {
      alert("🚨 ERROR: Type is required!");
      console.error("❌ Type validation failed:", data.type);
      return;
    }
    
    // Check form errors
    const formErrors = form.formState.errors;
    if (Object.keys(formErrors).length > 0) {
      console.error("❌ FORM VALIDATION ERRORS:", formErrors);
      alert(`🚨 FORM ERRORS:\n${JSON.stringify(formErrors, null, 2)}`);
      return;
    }
    
    console.log("✅ All validations passed, submitting...");
    submitCashflowMutation.mutate(data);
  };

  const onSubmitCustomer = (data: z.infer<typeof insertCustomerSchema>) => {
    createCustomerMutation.mutate(data);
  };

  return (
    <div className="space-y-6">
      {/* Store tabs for Cashflow filtering */}
      {!currentStoreId ? (
        <div>Loading store...</div>
      ) : (
        <Tabs value={activeTab ?? ""} onValueChange={handleTabChange}>
          <TabsList
          className={`grid w-full ${
            stores.length > 0
              ? stores.length === 1
                ? "grid-cols-1"
                : stores.length === 2
                  ? "grid-cols-2"
                  : stores.length === 3
                    ? "grid-cols-3"
                    : "grid-cols-4"
              : "grid-cols-2"
          }`}
        >
          {stores.length > 0 ? (
            stores.map((store) => (
              <TabsTrigger
                key={store.id}
                value={`store-${store.id}`}
                data-testid={`tab-cashflow-store-${store.id}`}
              >
                <DollarSign className="h-4 w-4 mr-2" />
                {store.name}
              </TabsTrigger>
            ))
          ) : (
            <>
              <TabsTrigger value="store-1" data-testid="tab-cashflow-store-1">
                <DollarSign className="h-4 w-4 mr-2" />
                Store 1
              </TabsTrigger>
              <TabsTrigger value="store-2" data-testid="tab-cashflow-store-2">
                <DollarSign className="h-4 w-4 mr-2" />
                Store 2
              </TabsTrigger>
            </>
          )}
        </TabsList>

        {/* Financial Summary Overview */}
        <div className="mb-6 space-y-4">
          {/* Grand Total Summary */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Total Semua Toko
                </CardTitle>
                <SyncButton
                  dataType="cashflow"
                  variant="outline"
                  className="text-blue-600 border-blue-200 hover:bg-blue-50"
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <p className="text-sm font-medium text-green-700 dark:text-green-300">
                      Total Pemasukan
                    </p>
                  </div>
                  <p
                    className="text-2xl font-bold text-green-600"
                    data-testid="text-grand-total-income"
                  >
                    {formatRupiah(grandTotals.totalIncome)}
                  </p>
                </div>
                <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <TrendingDown className="h-4 w-4 text-red-600" />
                    <p className="text-sm font-medium text-red-700 dark:text-red-300">
                      Total Pengeluaran
                    </p>
                  </div>
                  <p
                    className="text-2xl font-bold text-red-600"
                    data-testid="text-grand-total-expense"
                  >
                    {formatRupiah(grandTotals.totalExpense)}
                  </p>
                </div>
                <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <DollarSign className="h-4 w-4 text-blue-600" />
                    <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
                      Total Investasi
                    </p>
                  </div>
                  <p
                    className="text-2xl font-bold text-blue-600"
                    data-testid="text-grand-total-investment"
                  >
                    {formatRupiah(grandTotals.totalInvestment)}
                  </p>
                </div>
                <div
                  className={`text-center p-4 rounded-lg ${
                    grandTotals.netFlow >= 0
                      ? "bg-emerald-50 dark:bg-emerald-900/20"
                      : "bg-orange-50 dark:bg-orange-900/20"
                  }`}
                >
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <TrendingUp
                      className={`h-4 w-4 ${
                        grandTotals.netFlow >= 0
                          ? "text-emerald-600"
                          : "text-orange-600"
                      }`}
                    />
                    <p
                      className={`text-sm font-medium ${
                        grandTotals.netFlow >= 0
                          ? "text-emerald-700 dark:text-emerald-300"
                          : "text-orange-700 dark:text-orange-300"
                      }`}
                    >
                      Net Cashflow
                    </p>
                  </div>
                  <p
                    className={`text-2xl font-bold ${
                      grandTotals.netFlow >= 0
                        ? "text-emerald-600"
                        : "text-orange-600"
                    }`}
                    data-testid="text-grand-net-flow"
                  >
                    {formatRupiah(grandTotals.netFlow)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Dynamic Store Cashflow Content */}
        {stores.length > 0 ? (
          stores.map((store, index) => (
            <TabsContent
              key={store.id}
              value={`store-${store.id}`}
              className="space-y-4"
            >
              {/* Store 1 Summary */}
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
                      data-testid="text-store1-income"
                    >
                      {formatRupiah(
                        (storeTotals[stores[0]?.id] || { totalIncome: 0 })
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
                      data-testid="text-store1-expense"
                    >
                      {formatRupiah(
                        (storeTotals[stores[0]?.id] || { totalExpense: 0 })
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
                      data-testid="text-store1-investment"
                    >
                      {formatRupiah(
                        (storeTotals[stores[0]?.id] || { totalInvestment: 0 })
                          .totalInvestment,
                      )}
                    </span>
                  </div>
                  <div
                    className={`flex justify-between items-center p-2 rounded font-semibold ${
                      (storeTotals[stores[0]?.id] || { netFlow: 0 }).netFlow >=
                      0
                        ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600"
                        : "bg-orange-50 dark:bg-orange-900/20 text-orange-600"
                    }`}
                  >
                    <span className="text-sm font-medium">Net Cashflow</span>
                    <span data-testid="text-store1-net">
                      {formatRupiah(
                        (storeTotals[stores[0]?.id] || { netFlow: 0 }).netFlow,
                      )}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Add Cashflow Entry */}
                <Card>
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
                                  <SelectItem value="Expense">
                                    Expense
                                  </SelectItem>
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
                                defaultValue={field.value}
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

                        {/* Payment Status - only show for relevant transaction types */}
                        {requiresCustomer(watchType) && (
                          <FormField
                            control={form.control}
                            name="paymentStatus"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Payment Status</FormLabel>
                                <FormControl>
                                  <RadioGroup
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                    className="flex flex-row space-x-6"
                                    data-testid="radio-payment-status"
                                  >
                                    <div className="flex items-center space-x-2">
                                      <RadioGroupItem
                                        value="lunas"
                                        id="lunas"
                                      />
                                      <Label htmlFor="lunas">
                                        Lunas (Paid)
                                      </Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <RadioGroupItem
                                        value="belum_lunas"
                                        id="belum_lunas"
                                      />
                                      <Label htmlFor="belum_lunas">
                                        Belum Lunas (Unpaid)
                                      </Label>
                                    </div>
                                  </RadioGroup>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}

                        {/* Customer Selection - required for unpaid debt transactions */}
                        {requiresCustomer(watchType) &&
                          watchPaymentStatus === "belum_lunas" && (
                            <FormField
                              control={form.control}
                              name="customerId"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Customer *</FormLabel>
                                  <div className="flex gap-2">
                                    <div className="flex-1">
                                      <Select
                                        onValueChange={field.onChange}
                                        defaultValue={field.value}
                                      >
                                        <FormControl>
                                          <SelectTrigger data-testid="select-customer">
                                            <SelectValue placeholder="Select customer" />
                                          </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                          <div className="p-2">
                                            <Input
                                              placeholder="Search customers..."
                                              value={customerSearchTerm}
                                              onChange={(e) =>
                                                setCustomerSearchTerm(
                                                  e.target.value,
                                                )
                                              }
                                              className="mb-2"
                                              data-testid="input-customer-search"
                                            />
                                          </div>
                                          {filteredCustomers.length > 0 ? (
                                            filteredCustomers.map(
                                              (customer) => (
                                                <SelectItem
                                                  key={customer.id}
                                                  value={customer.id}
                                                >
                                                  <div className="flex items-center gap-2">
                                                    <User className="h-4 w-4" />
                                                    <div>
                                                      <div className="font-medium">
                                                        {customer.name}
                                                      </div>
                                                      <div className="text-sm text-muted-foreground">
                                                        {customer.email ||
                                                          customer.phone ||
                                                          "No contact info"}
                                                      </div>
                                                    </div>
                                                  </div>
                                                </SelectItem>
                                              ),
                                            )
                                          ) : (
                                            <div className="p-2 text-sm text-muted-foreground">
                                              No customers found
                                            </div>
                                          )}
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="icon"
                                      onClick={() =>
                                        setIsAddCustomerModalOpen(true)
                                      }
                                      data-testid="button-add-customer"
                                    >
                                      <Plus className="h-4 w-4" />
                                    </Button>
                                  </div>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          )}

                        {/* Conditional fields for Pembelian Minyak */}
                        {isPembelianMinyak(watchType) && (
                          <FormField
                            control={form.control}
                            name="jumlahGalon"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Jumlah Galon</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    placeholder="0"
                                    data-testid="input-jumlah-galon"
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
                          name="amount"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Amount</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="0.01"
                                  placeholder="0.00"
                                  data-testid="input-amount"
                                  readOnly={isPembelianMinyak(watchType)}
                                  className={
                                    isPembelianMinyak(watchType)
                                      ? "bg-gray-50"
                                      : ""
                                  }
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Additional readonly fields for Pembelian Minyak */}
                        {isPembelianMinyak(watchType) && (
                          <>
                            <FormField
                              control={form.control}
                              name="pajakOngkos"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Pajak Ongkos</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      step="0.01"
                                      placeholder="0.00"
                                      data-testid="input-pajak-ongkos"
                                      readOnly
                                      className="bg-gray-50"
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="pajakTransfer"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Pajak Transfer</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      step="0.01"
                                      placeholder="2500.00"
                                      data-testid="input-pajak-transfer"
                                      readOnly
                                      className="bg-gray-50"
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="totalPengeluaran"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Total Pengeluaran</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      step="0.01"
                                      placeholder="0.00"
                                      data-testid="input-total-pengeluaran"
                                      readOnly
                                      className="bg-gray-50"
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </>
                        )}

                        {/* Additional fields for Transfer Rekening */}
                        {isTransferRekening(watchType) && (
                          <>
                            <FormField
                              control={form.control}
                              name="konter"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Konter</FormLabel>
                                  <FormControl>
                                    <RadioGroup
                                      onValueChange={field.onChange}
                                      defaultValue={field.value}
                                      className="flex flex-row space-x-6"
                                      data-testid="radio-konter"
                                    >
                                      <div className="flex items-center space-x-2">
                                        <RadioGroupItem
                                          value="Dia store"
                                          id="dia-store"
                                        />
                                        <Label htmlFor="dia-store">
                                          Dia store
                                        </Label>
                                      </div>
                                      <div className="flex items-center space-x-2">
                                        <RadioGroupItem
                                          value="manual"
                                          id="manual"
                                        />
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
                              name="pajakTransferRekening"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Pajak Transfer Rekening</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      step="0.01"
                                      placeholder="0.00"
                                      data-testid="input-pajak-transfer-rekening"
                                      readOnly={watchKonter === "Dia store"}
                                      className={
                                        watchKonter === "Dia store"
                                          ? "bg-gray-50"
                                          : ""
                                      }
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
                                  <FormLabel>Hasil</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      step="0.01"
                                      placeholder="0.00"
                                      data-testid="input-hasil"
                                      readOnly
                                      className="bg-gray-50"
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </>
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
                                  data-testid="textarea-description"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <Button
                          type="submit"
                          className="w-full"
                          disabled={submitCashflowMutation.isPending}
                          data-testid="button-submit-cashflow"
                          onClick={(e) => {
                            console.log("🚨 SUBMIT BUTTON CLICKED (Store 1)");
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

                {/* Cashflow Records */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Recent Cashflow Records
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <div className="text-center py-8">
                        Loading cashflow records...
                      </div>
                    ) : cashflowRecords &&
                      cashflowRecords.filter((record) => record.storeId === 1)
                        .length > 0 ? (
                      <div className="space-y-4 max-h-96 overflow-y-auto">
                        {cashflowRecords
                          .filter((record) => record.storeId === 1)
                          .map((entry) => (
                            <div
                              key={entry.id}
                              className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                              onClick={() => {
                                setSelectedEntry(entry);
                                setIsDetailModalOpen(true);
                              }}
                              data-testid={`cashflow-entry-${entry.id}`}
                            >
                              <div className="flex items-center gap-3">
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
                                <Eye className="h-4 w-4 text-muted-foreground" />
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
              </div>
            </TabsContent>
          ))
        ) : (
          // Fallback for when stores haven't loaded yet
          <>
            <TabsContent value="store-1" className="space-y-4">
              <div className="text-center py-8">Loading store data...</div>
            </TabsContent>
            <TabsContent value="store-2" className="space-y-4">
              <div className="text-center py-8">Loading store data...</div>
            </TabsContent>
          </>
        )}

        {/* Legacy second store content - will be replaced by dynamic content above */}
        {stores.length > 1 && (
          <TabsContent
            value={`store-${stores[1]?.id}`}
            className="space-y-4"
            style={{ display: "none" }}
          >
            {/* Store 2 Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <DollarSign className="h-4 w-4" />
                  {stores[1]?.name || "Store 2"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center p-2 bg-green-50 dark:bg-green-900/20 rounded">
                  <span className="text-sm font-medium text-green-700 dark:text-green-300">
                    Pemasukan
                  </span>
                  <span
                    className="font-bold text-green-600"
                    data-testid="text-store2-income"
                  >
                    {formatRupiah(
                      (storeTotals[stores[1]?.id] || { totalIncome: 0 })
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
                    data-testid="text-store2-expense"
                  >
                    {formatRupiah(
                      (storeTotals[stores[1]?.id] || { totalExpense: 0 })
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
                    data-testid="text-store2-investment"
                  >
                    {formatRupiah(
                      (storeTotals[stores[1]?.id] || { totalInvestment: 0 })
                        .totalInvestment,
                    )}
                  </span>
                </div>
                <div
                  className={`flex justify-between items-center p-2 rounded font-semibold ${
                    (storeTotals[stores[1]?.id] || { netFlow: 0 }).netFlow >= 0
                      ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600"
                      : "bg-orange-50 dark:bg-orange-900/20 text-orange-600"
                  }`}
                >
                  <span className="text-sm font-medium">Net Cashflow</span>
                  <span data-testid="text-store2-net">
                    {formatRupiah(
                      (storeTotals[stores[1]?.id] || { netFlow: 0 }).netFlow,
                    )}
                  </span>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Add Cashflow Entry for {stores[1]?.name || 'Store 2'} */}
              <Card>
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
                              defaultValue={field.value}
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

                      {/* Payment Status - only show for relevant transaction types */}
                      {requiresCustomer(watchType) && (
                        <FormField
                          control={form.control}
                          name="paymentStatus"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Payment Status</FormLabel>
                              <FormControl>
                                <RadioGroup
                                  onValueChange={field.onChange}
                                  defaultValue={field.value}
                                  className="flex flex-row space-x-6"
                                  data-testid="radio-payment-status"
                                >
                                  <div className="flex items-center space-x-2">
                                    <RadioGroupItem
                                      value="lunas"
                                      id="lunas-2"
                                    />
                                    <Label htmlFor="lunas-2">
                                      Lunas (Paid)
                                    </Label>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <RadioGroupItem
                                      value="belum_lunas"
                                      id="belum_lunas-2"
                                    />
                                    <Label htmlFor="belum_lunas-2">
                                      Belum Lunas (Unpaid)
                                    </Label>
                                  </div>
                                </RadioGroup>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}

                      {/* Customer Selection - required for unpaid debt transactions */}
                      {requiresCustomer(watchType) &&
                        watchPaymentStatus === "belum_lunas" && (
                          <FormField
                            control={form.control}
                            name="customerId"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Customer *</FormLabel>
                                <div className="flex gap-2">
                                  <div className="flex-1">
                                    <Select
                                      onValueChange={field.onChange}
                                      defaultValue={field.value}
                                    >
                                      <FormControl>
                                        <SelectTrigger data-testid="select-customer">
                                          <SelectValue placeholder="Select customer" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        <div className="p-2">
                                          <Input
                                            placeholder="Search customers..."
                                            value={customerSearchTerm}
                                            onChange={(e) =>
                                              setCustomerSearchTerm(
                                                e.target.value,
                                              )
                                            }
                                            className="mb-2"
                                            data-testid="input-customer-search"
                                          />
                                        </div>
                                        {filteredCustomers.length > 0 ? (
                                          filteredCustomers.map((customer) => (
                                            <SelectItem
                                              key={customer.id}
                                              value={customer.id}
                                            >
                                              <div className="flex items-center gap-2">
                                                <User className="h-4 w-4" />
                                                <div>
                                                  <div className="font-medium">
                                                    {customer.name}
                                                  </div>
                                                  <div className="text-sm text-muted-foreground">
                                                    {customer.email ||
                                                      customer.phone ||
                                                      "No contact info"}
                                                  </div>
                                                </div>
                                              </div>
                                            </SelectItem>
                                          ))
                                        ) : (
                                          <div className="p-2 text-sm text-muted-foreground">
                                            No customers found
                                          </div>
                                        )}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    onClick={() =>
                                      setIsAddCustomerModalOpen(true)
                                    }
                                    data-testid="button-add-customer"
                                  >
                                    <Plus className="h-4 w-4" />
                                  </Button>
                                </div>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}

                      {/* Conditional fields for Pembelian Minyak */}
                      {isPembelianMinyak(watchType) && (
                        <FormField
                          control={form.control}
                          name="jumlahGalon"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Jumlah Galon</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="0.01"
                                  placeholder="0"
                                  data-testid="input-jumlah-galon"
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
                        name="amount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Amount</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                data-testid="input-amount"
                                readOnly={isPembelianMinyak(watchType)}
                                className={
                                  isPembelianMinyak(watchType)
                                    ? "bg-gray-50"
                                    : ""
                                }
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Additional readonly fields for Pembelian Minyak */}
                      {isPembelianMinyak(watchType) && (
                        <>
                          <FormField
                            control={form.control}
                            name="pajakOngkos"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Pajak Ongkos</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    placeholder="0.00"
                                    data-testid="input-pajak-ongkos"
                                    readOnly
                                    className="bg-gray-50"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="pajakTransfer"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Pajak Transfer</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    placeholder="2500.00"
                                    data-testid="input-pajak-transfer"
                                    readOnly
                                    className="bg-gray-50"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="totalPengeluaran"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Total Pengeluaran</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    placeholder="0.00"
                                    data-testid="input-total-pengeluaran"
                                    readOnly
                                    className="bg-gray-50"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </>
                      )}

                      {/* Additional fields for Transfer Rekening */}
                      {isTransferRekening(watchType) && (
                        <>
                          <FormField
                            control={form.control}
                            name="konter"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Konter</FormLabel>
                                <FormControl>
                                  <RadioGroup
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                    className="flex flex-row space-x-6"
                                    data-testid="radio-konter"
                                  >
                                    <div className="flex items-center space-x-2">
                                      <RadioGroupItem
                                        value="Dia store"
                                        id="dia-store-2"
                                      />
                                      <Label htmlFor="dia-store-2">
                                        Dia store
                                      </Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <RadioGroupItem
                                        value="manual"
                                        id="manual-2"
                                      />
                                      <Label htmlFor="manual-2">Manual</Label>
                                    </div>
                                  </RadioGroup>
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
                                <FormLabel>Pajak Transfer Rekening</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    placeholder="0.00"
                                    data-testid="input-pajak-transfer-rekening"
                                    readOnly={watchKonter === "Dia store"}
                                    className={
                                      watchKonter === "Dia store"
                                        ? "bg-gray-50"
                                        : ""
                                    }
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
                                <FormLabel>Hasil</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    placeholder="0.00"
                                    data-testid="input-hasil"
                                    readOnly
                                    className="bg-gray-50"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </>
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
                                data-testid="textarea-description"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Button
                        type="submit"
                        className="w-full"
                        disabled={submitCashflowMutation.isPending}
                        data-testid="button-submit-cashflow"
                        onClick={(e) => {
                          console.log("🚨 SUBMIT BUTTON CLICKED (Store 2)");
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

              {/* Cashflow Records for {stores[1]?.name || 'Store 2'} */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Recent Cashflow Records
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="text-center py-8">
                      Loading cashflow records...
                    </div>
                  ) : cashflowRecords &&
                    cashflowRecords.filter((record) => record.storeId === 2)
                      .length > 0 ? (
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                      {cashflowRecords
                        .filter((record) => record.storeId === 2)
                        .map((entry) => (
                          <div
                            key={entry.id}
                            className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                            onClick={() => {
                              setSelectedEntry(entry);
                              setIsDetailModalOpen(true);
                            }}
                            data-testid={`cashflow-entry-${entry.id}`}
                          >
                            <div className="flex items-center gap-3">
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
                              <Eye className="h-4 w-4 text-muted-foreground" />
                            </div>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground py-8">
                      <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>
                        No cashflow records found for{" "}
                        {stores[1]?.name || "Store 2"}
                      </p>
                      <p className="text-sm">
                        Add your first entry using the form
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        )}
        </Tabs>
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
                  <p className="text-sm font-medium text-muted-foreground">
                    Category
                  </p>
                  <p className="text-base">{selectedEntry.category}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Type
                  </p>
                  <p className="text-base">{selectedEntry.type}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Amount
                  </p>
                  <p
                    className={`text-lg font-semibold ${
                      selectedEntry.category === "Income"
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {selectedEntry.category === "Income" ? "+" : "-"}
                    {formatRupiah(
                      selectedEntry.category === "Expense" &&
                        selectedEntry.totalPengeluaran
                        ? selectedEntry.totalPengeluaran
                        : selectedEntry.amount,
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Date
                  </p>
                  <p className="text-base">
                    {new Date(
                      selectedEntry.createdAt || new Date(),
                    ).toLocaleDateString("id-ID")}
                  </p>
                </div>
              </div>

              {selectedEntry.description && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Description
                  </p>
                  <p className="text-base">{selectedEntry.description}</p>
                </div>
              )}

              {/* Show additional details for Pembelian Minyak */}
              {isPembelianMinyak(selectedEntry.type) && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">
                    Pembelian Minyak Details
                  </p>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">
                        Jumlah Galon:
                      </span>
                      <span className="ml-2">
                        {selectedEntry.jumlahGalon || 0}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">
                        Pajak Ongkos:
                      </span>
                      <span className="ml-2">
                        {formatRupiah(selectedEntry.pajakOngkos || "0")}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">
                        Pajak Transfer:
                      </span>
                      <span className="ml-2">
                        {formatRupiah(selectedEntry.pajakTransfer || "0")}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">
                        Total Pengeluaran:
                      </span>
                      <span className="ml-2 font-medium">
                        {formatRupiah(selectedEntry.totalPengeluaran || "0")}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Show additional details for Transfer Rekening */}
              {isTransferRekening(selectedEntry.type) && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">
                    Transfer Rekening Details
                  </p>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Konter:</span>
                      <span className="ml-2">
                        {selectedEntry.konter || "N/A"}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">
                        Pajak Transfer:
                      </span>
                      <span className="ml-2">
                        {formatRupiah(
                          selectedEntry.pajakTransferRekening || "0",
                        )}
                      </span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-muted-foreground">Hasil:</span>
                      <span className="ml-2 font-medium">
                        {formatRupiah(selectedEntry.hasil || "0")}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Show payment status and customer for debt transactions */}
              {requiresCustomer(selectedEntry.type) && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">
                    Payment Details
                  </p>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">
                        Payment Status:
                      </span>
                      <span
                        className={`ml-2 font-medium ${
                          selectedEntry.paymentStatus === "lunas"
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {selectedEntry.paymentStatus === "lunas"
                          ? "Lunas"
                          : "Belum Lunas"}
                      </span>
                    </div>
                    {selectedEntry.customerId && (
                      <div>
                        <span className="text-muted-foreground">Customer:</span>
                        <span className="ml-2">
                          {customers.find(
                            (c) => c.id === selectedEntry.customerId,
                          )?.name || "Unknown"}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Customer Modal */}
      <Dialog
        open={isAddCustomerModalOpen}
        onOpenChange={setIsAddCustomerModalOpen}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Customer</DialogTitle>
            <DialogDescription>
              Create a new customer profile for debt tracking
            </DialogDescription>
          </DialogHeader>
          <Form {...customerForm}>
            <form
              onSubmit={customerForm.handleSubmit(onSubmitCustomer)}
              className="space-y-4"
            >
              <FormField
                control={customerForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Customer Name *</FormLabel>
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
  );
}
