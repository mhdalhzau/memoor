import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  Users,
  DollarSign,
  ChevronDown,
  ChevronRight,
  Receipt,
  Calendar,
  AlertCircle,
  CheckCircle,
  Search,
  AlertTriangle,
  UserCheck,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Customer,
  Piutang,
  insertPiutangSchema,
  type InsertPiutang,
  type User,
  type Store,
} from "@shared/schema";
import { SyncButton } from "@/components/ui/sync-button";
import { formatRupiah } from "@/lib/utils";

// Unified interface for customers (now includes user-based customers from backend)
interface UnifiedCustomer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  type: "customer" | "employee" | "user_based";
  storeId?: number;
}

interface CustomerWithPiutang {
  customer: UnifiedCustomer;
  piutangRecords: Piutang[];
  totalDebt: number;
  totalPaid: number;
  remainingDebt: number;
}

export default function PiutangPage() {
  console.log("🏦 PiutangPage: Component rendered");
  
  const { user } = useAuth();
  const { toast } = useToast();
  
  console.log("👤 PiutangPage: Current user:", user);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [paymentModalData, setPaymentModalData] = useState<Piutang | null>(
    null,
  );
  const [expandedCustomers, setExpandedCustomers] = useState<Set<string>>(
    new Set(),
  );
  // Fetch stores data for category display
  const { data: stores = [] } = useQuery<Store[]>({
    queryKey: ["/api/stores"],
    enabled: !!user,
  });
  
  console.log("🏪 PiutangPage: Stores data:", stores);

  // Fetch all customers from all stores
  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/customers");
      return await res.json();
    },
    enabled: !!user,
  });
  
  console.log("👥 PiutangPage: Customers data:", customers);

  // Fetch all piutang records from all stores
  const { data: piutangResponse, isLoading } = useQuery<{
    data: Piutang[];
    total: number;
    hasMore: boolean;
    page: number;
    limit: number;
  }>({
    queryKey: ["/api/piutang"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/piutang");
      return await res.json();
    },
    enabled: !!user,
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  // Extract the piutang records from the pagination response with proper safety checks
  const piutangRecords = Array.isArray(piutangResponse?.data)
    ? piutangResponse.data
    : [];
    
  console.log("💰 PiutangPage: Piutang records:", piutangRecords);
  console.log("📊 PiutangPage: Loading state:", isLoading);


  // Piutang form for adding new debt
  const piutangForm = useForm<InsertPiutang>({
    resolver: zodResolver(insertPiutangSchema),
    defaultValues: {
      customerId: "",
      storeId: stores.length > 0 ? stores[0].id : 1,
      amount: "0",
      description: "",
      dueDate: undefined,
      status: "belum_lunas",
      paidAmount: "0",
      paidAt: undefined,
      createdBy: user?.id || "",
    },
  });

  // Update form storeId when stores load
  useEffect(() => {
    if (stores.length > 0) {
      piutangForm.setValue("storeId", stores[0].id);
    }
  }, [stores, piutangForm]);

  // Payment form for installment payments
  const paymentForm = useForm<{ amount: string }>({
    defaultValues: { amount: "" },
  });

  // Create piutang mutation
  const createPiutangMutation = useMutation({
    mutationFn: async (data: InsertPiutang) => {
      const res = await apiRequest("POST", "/api/piutang", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Piutang record created successfully!",
      });
      piutangForm.reset();
      setIsAddModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/piutang"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create piutang record",
        variant: "destructive",
      });
    },
  });

  // Payment mutation using atomic endpoint
  const paymentMutation = useMutation({
    mutationFn: async ({
      piutangId,
      amount,
    }: {
      piutangId: string;
      amount: string;
    }) => {
      const res = await apiRequest("POST", `/api/piutang/${piutangId}/pay`, {
        amount,
        description: "Installment payment", // Add required description field
      });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Payment recorded successfully!",
      });
      paymentForm.reset();
      setPaymentModalData(null);
      queryClient.invalidateQueries({ queryKey: ["/api/piutang"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cashflow"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to record payment",
        variant: "destructive",
      });
    },
  });

  // Unified customers from backend (includes external customers, employees, and user-based customers)
  const safeCustomers = Array.isArray(customers) ? customers : [];

  const unifiedCustomers: UnifiedCustomer[] = safeCustomers
    .filter((c) => c && c.id)
    .map((c) => ({
      id: c.id,
      name: c.name,
      email: c.email,
      phone: c.phone,
      type: c.type as "customer" | "employee" | "user_based",
      storeId: c.storeId,
    }));

  // Group piutang by store and customer with safety checks
  const storeGroupedData = React.useMemo(() => {
    // Don't calculate if we're still loading or if data is not ready
    if (
      isLoading ||
      !Array.isArray(piutangRecords) ||
      !Array.isArray(unifiedCustomers) ||
      !Array.isArray(stores)
    ) {
      return {};
    }

    const grouped: Record<number, CustomerWithPiutang[]> = {};

    stores.forEach((store) => {
      const storeCustomers = unifiedCustomers.filter(
        (customer) => customer.storeId === store.id
      );

      const customersWithPiutang = storeCustomers
        .filter((customer) => customer && customer.id)
        .map((customer) => {
          const safePiutangRecords = Array.isArray(piutangRecords)
            ? piutangRecords
            : [];
          const customerPiutang = safePiutangRecords.filter(
            (p) => p && p.customerId === customer.id && p.storeId === store.id,
          );

          const totalDebt = customerPiutang.reduce(
            (sum, p) => sum + (p && p.amount ? parseFloat(p.amount) : 0),
            0,
          );
          const totalPaid = customerPiutang.reduce(
            (sum, p) => sum + (p && p.paidAmount ? parseFloat(p.paidAmount) : 0),
            0,
          );
          const remainingDebt = totalDebt - totalPaid;

          return {
            customer,
            piutangRecords: customerPiutang,
            totalDebt,
            totalPaid,
            remainingDebt,
          };
        })
        .filter(
          (item) =>
            item &&
            Array.isArray(item.piutangRecords) &&
            item.piutangRecords.length > 0,
        );

      if (customersWithPiutang.length > 0) {
        grouped[store.id] = customersWithPiutang;
      }
    });

    return grouped;
  }, [unifiedCustomers, piutangRecords, stores, isLoading]);

  // Filter all customers based on search term
  const filteredStoreGroupedData = React.useMemo(() => {
    if (!searchTerm.trim()) {
      return storeGroupedData;
    }

    const filtered: Record<number, CustomerWithPiutang[]> = {};
    const searchLower = searchTerm.toLowerCase();

    Object.entries(storeGroupedData).forEach(([storeId, customers]) => {
      const filteredCustomers = customers.filter((item) => {
        if (!item || !item.customer) return false;
        return (
          (item.customer.name || "").toLowerCase().includes(searchLower) ||
          (item.customer.email || "").toLowerCase().includes(searchLower) ||
          (item.customer.phone || "").toLowerCase().includes(searchLower)
        );
      });

      if (filteredCustomers.length > 0) {
        filtered[parseInt(storeId)] = filteredCustomers;
      }
    });

    return filtered;
  }, [storeGroupedData, searchTerm]);

  const toggleCustomerExpansion = (customerId: string) => {
    const newExpanded = new Set(expandedCustomers);
    if (newExpanded.has(customerId)) {
      newExpanded.delete(customerId);
    } else {
      newExpanded.add(customerId);
    }
    setExpandedCustomers(newExpanded);
  };

  const onSubmitPiutang = (data: InsertPiutang) => {
    // Validate that store data is loaded
    if (stores.length === 0) {
      toast({
        title: "Error",
        description: "Please wait for store data to load before submitting.",
        variant: "destructive",
      });
      return;
    }

    // Validate that the selected customer belongs to the selected store
    const selectedCustomer = unifiedCustomers.find(
      (c) => c.id === data.customerId,
    );
    if (selectedCustomer && selectedCustomer.storeId !== data.storeId) {
      toast({
        title: "Error",
        description: "Selected customer does not belong to the selected store.",
        variant: "destructive",
      });
      return;
    }

    createPiutangMutation.mutate({
      ...data,
      createdBy: user?.id || "",
    });
  };

  const onSubmitPayment = (data: { amount: string }) => {
    if (paymentModalData) {
      paymentMutation.mutate({
        piutangId: paymentModalData.id,
        amount: data.amount,
      });
    }
  };

  const openPaymentModal = (piutang: Piutang) => {
    setPaymentModalData(piutang);
    const remaining =
      parseFloat(piutang.amount) - parseFloat(piutang.paidAmount || "0");
    paymentForm.reset({ amount: remaining.toString() });
  };

  const calculateRemainingDebt = (piutang: Piutang) => {
    return parseFloat(piutang.amount) - parseFloat(piutang.paidAmount || "0");
  };

  const isInternalEmployee = (customer: UnifiedCustomer) => {
    return customer.type === "employee";
  };

  const isUserBasedCustomer = (customer: UnifiedCustomer) => {
    return customer.type === "user_based";
  };

  const getInternalWarningBadge = (
    customer: UnifiedCustomer,
    remainingDebt: number,
  ) => {
    if (
      (!isInternalEmployee(customer) && !isUserBasedCustomer(customer)) ||
      remainingDebt <= 0
    )
      return null;

    return (
      <Badge
        variant="destructive"
        className="bg-orange-100 text-orange-800 border-orange-300"
      >
        <AlertTriangle className="h-3 w-3 mr-1" />
        {isUserBasedCustomer(customer)
          ? "User Account Debt"
          : "Internal Employee Debt"}
      </Badge>
    );
  };

  const getCustomerTypeBadge = (customer: UnifiedCustomer) => {
    if (isUserBasedCustomer(customer)) {
      return (
        <Badge
          variant="outline"
          className="bg-blue-50 text-blue-700 border-blue-300"
        >
          <UserCheck className="h-3 w-3 mr-1" />
          User Account
        </Badge>
      );
    }
    if (isInternalEmployee(customer)) {
      return (
        <Badge
          variant="outline"
          className="bg-orange-50 text-orange-700 border-orange-300"
        >
          <UserCheck className="h-3 w-3 mr-1" />
          Employee
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="bg-gray-50 text-gray-700">
        <Users className="h-3 w-3 mr-1" />
        Customer
      </Badge>
    );
  };

  const getStatusBadge = (piutang: Piutang) => {
    const isFullyPaid =
      piutang.status === "lunas" || calculateRemainingDebt(piutang) <= 0;
    return isFullyPaid ? (
      <Badge variant="secondary" className="bg-green-100 text-green-800">
        <CheckCircle className="h-3 w-3 mr-1" />
        Lunas
      </Badge>
    ) : (
      <Badge variant="secondary" className="bg-red-100 text-red-800">
        <AlertCircle className="h-3 w-3 mr-1" />
        Belum Lunas
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="space-y-6">
          <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
          <div className="grid gap-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-32 bg-gray-200 rounded animate-pulse"
              ></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div>
            <h1
              className="text-3xl font-bold text-gray-900 dark:text-gray-100"
              data-testid="title-piutang-management"
            >
              Accounts Receivable (Piutang)
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Manage customer debts and installment payments
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <SyncButton
            dataType="piutang"
            variant="outline"
            className="text-orange-600 border-orange-200 hover:bg-orange-50"
          />
          <Dialog
            open={isAddModalOpen}
            onOpenChange={(open) =>
              open ? setIsAddModalOpen(true) : setIsAddModalOpen(false)
            }
          >
            <DialogTrigger asChild>
              <Button
                className="flex items-center gap-2"
                data-testid="button-add-piutang"
              >
                <Plus className="h-4 w-4" />
                Add Debt Record
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Receipt className="h-5 w-5" />
                  Add New Debt Record
                </DialogTitle>
                <DialogDescription>
                  Create a new debt record for a customer
                </DialogDescription>
              </DialogHeader>

              <Form {...piutangForm}>
                <form
                  onSubmit={piutangForm.handleSubmit(onSubmitPiutang)}
                  className="space-y-4"
                >
                  <FormField
                    control={piutangForm.control}
                    name="storeId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Store *</FormLabel>
                        <FormControl>
                          <Select
                            onValueChange={(value) => field.onChange(parseInt(value))}
                            value={field.value?.toString()}
                          >
                            <SelectTrigger data-testid="select-store">
                              <SelectValue placeholder="Select store" />
                            </SelectTrigger>
                            <SelectContent>
                              {stores.map((store) => (
                                <SelectItem
                                  key={store.id}
                                  value={store.id.toString()}
                                >
                                  {store.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={piutangForm.control}
                    name="customerId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Customer *</FormLabel>
                        <FormControl>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <SelectTrigger data-testid="select-customer">
                              <SelectValue placeholder="Select customer" />
                            </SelectTrigger>
                            <SelectContent>
                              {unifiedCustomers
                                .filter((customer) => 
                                  piutangForm.watch("storeId") 
                                    ? customer.storeId === piutangForm.watch("storeId")
                                    : true
                                )
                                .map((customer) => (
                                <SelectItem
                                  key={customer.id}
                                  value={customer.id}
                                >
                                  <div className="flex items-center gap-2">
                                    <span>{customer.name}</span>
                                    <Badge
                                      variant="outline"
                                      className={
                                        customer.type === "staff_member"
                                          ? "bg-blue-50 text-blue-700 border-blue-300"
                                          : customer.type ===
                                              "internal_employee"
                                            ? "bg-orange-50 text-orange-700 border-orange-300"
                                            : "bg-gray-50 text-gray-700"
                                      }
                                    >
                                      {customer.type === "staff_member"
                                        ? "Staff"
                                        : customer.type === "internal_employee"
                                          ? "Employee"
                                          : "Customer"}
                                    </Badge>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={piutangForm.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Debt Amount *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="Enter debt amount"
                            data-testid="input-amount"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={piutangForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description *</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter description of the debt"
                            data-testid="input-description"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={piutangForm.control}
                    name="dueDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Due Date</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            data-testid="input-due-date"
                            value={
                              field.value
                                ? new Date(field.value)
                                    .toISOString()
                                    .split("T")[0]
                                : ""
                            }
                            onChange={(e) =>
                              field.onChange(
                                e.target.value
                                  ? new Date(e.target.value)
                                  : undefined,
                              )
                            }
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
                      onClick={() => setIsAddModalOpen(false)}
                      data-testid="button-cancel"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1"
                      disabled={createPiutangMutation.isPending}
                      data-testid="button-save"
                    >
                      {createPiutangMutation.isPending
                        ? "Saving..."
                        : "Save Debt Record"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search customers by name, email, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
            data-testid="input-search-customers"
          />
        </div>
      </div>

      {/* Store Categories and Customer Debt List */}
      <div className="space-y-8">
        {Object.keys(filteredStoreGroupedData).length > 0 ? (
          Object.entries(filteredStoreGroupedData).map(([storeId, customers]) => {
            const store = stores.find(s => s.id === parseInt(storeId));
            if (!store) return null;

            return (
              <div key={storeId} className="space-y-4">
                {/* Store Category Button */}
                <div className="flex items-center gap-4 mb-4">
                  <Button
                    variant="outline"
                    disabled
                    className="cursor-not-allowed opacity-60"
                    data-testid={`button-store-${store.id}`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 bg-blue-600 rounded-full"></div>
                      <span className="font-medium">{store.name}</span>
                      <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-300">
                        {customers.length} Customer{customers.length !== 1 ? 's' : ''} 
                      </Badge>
                    </div>
                  </Button>
                </div>

                {/* Customer List for this Store */}
                <div className="space-y-4 pl-6 border-l-2 border-blue-100">
                  {customers.map((item) => (
                    <Card
                      key={item.customer.id}
                      className="overflow-hidden"
                      data-testid={`card-customer-${item.customer.id}`}
                    >
                      <Collapsible
                        open={expandedCustomers.has(item.customer.id)}
                        onOpenChange={() =>
                          toggleCustomerExpansion(item.customer.id)
                        }
                      >
                        <CollapsibleTrigger asChild>
                          <CardHeader className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                                  <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                  <div className="flex items-center gap-2 mb-1">
                                    <h3
                                      className="text-lg font-semibold text-gray-900 dark:text-gray-100"
                                      data-testid={`text-customer-name-${item.customer.id}`}
                                    >
                                      {item.customer.name}
                                    </h3>
                                    {getCustomerTypeBadge(item.customer)}
                                    {getInternalWarningBadge(
                                      item.customer,
                                      item.remainingDebt,
                                    )}
                                  </div>
                                  <div className="flex gap-4 text-sm text-gray-600 dark:text-gray-400">
                                    <span
                                      data-testid={`text-total-debt-${item.customer.id}`}
                                    >
                                      Total Debt: {formatRupiah(item.totalDebt)}
                                    </span>
                                    <span
                                      data-testid={`text-remaining-debt-${item.customer.id}`}
                                    >
                                      Remaining:{" "}
                                      {formatRupiah(item.remainingDebt)}
                                    </span>
                                  </div>
                                  {(isInternalEmployee(item.customer) ||
                                    isUserBasedCustomer(item.customer)) &&
                                    item.remainingDebt > 0 && (
                                      <div className="mt-2 p-2 bg-orange-50 border border-orange-200 rounded-md">
                                        <p className="text-sm text-orange-800 flex items-center gap-1">
                                          <AlertTriangle className="h-4 w-4" />
                                          <strong>Warning:</strong> This is{" "}
                                          {isUserBasedCustomer(item.customer)
                                            ? "a user account"
                                            : "an internal employee"}{" "}
                                          with outstanding debt. Please follow
                                          company policy for{" "}
                                          {isUserBasedCustomer(item.customer)
                                            ? "user account"
                                            : "employee"}{" "}
                                          receivables.
                                        </p>
                                      </div>
                                    )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge
                                  variant={
                                    item.remainingDebt > 0
                                      ? "destructive"
                                      : "secondary"
                                  }
                                >
                                  {item.piutangRecords.length} Record
                                  {item.piutangRecords.length !== 1 ? "s" : ""}
                                </Badge>
                                {expandedCustomers.has(item.customer.id) ? (
                                  <ChevronDown className="h-4 w-4" />
                                ) : (
                                  <ChevronRight className="h-4 w-4" />
                                )}
                              </div>
                            </div>
                          </CardHeader>
                        </CollapsibleTrigger>

                        <CollapsibleContent>
                          <CardContent className="pt-0">
                            <div className="space-y-3">
                              {item.piutangRecords.map((piutang) => {
                                const remainingAmount =
                                  calculateRemainingDebt(piutang);
                                return (
                                  <div
                                    key={piutang.id}
                                    className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800"
                                    data-testid={`card-piutang-${piutang.id}`}
                                  >
                                    <div className="flex items-center justify-between mb-2">
                                      <div className="flex items-center gap-2">
                                        <Receipt className="h-4 w-4 text-gray-500" />
                                        <span
                                          className="font-medium"
                                          data-testid={`text-description-${piutang.id}`}
                                        >
                                          {piutang.description}
                                        </span>
                                        {getStatusBadge(piutang)}
                                      </div>
                                      {remainingAmount > 0 && (
                                        <Button
                                          size="sm"
                                          onClick={() =>
                                            openPaymentModal(piutang)
                                          }
                                          data-testid={`button-pay-${piutang.id}`}
                                        >
                                          Make Payment
                                        </Button>
                                      )}
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-400">
                                      <div>
                                        <p>
                                          Total Amount:{" "}
                                          <span
                                            className="font-medium text-gray-900 dark:text-gray-100"
                                            data-testid={`text-total-amount-${piutang.id}`}
                                          >
                                            {formatRupiah(
                                              parseFloat(piutang.amount),
                                            )}
                                          </span>
                                        </p>
                                        <p>
                                          Paid Amount:{" "}
                                          <span
                                            className="font-medium text-green-600"
                                            data-testid={`text-paid-amount-${piutang.id}`}
                                          >
                                            {formatRupiah(
                                              parseFloat(
                                                piutang.paidAmount || "0",
                                              ),
                                            )}
                                          </span>
                                        </p>
                                      </div>
                                      <div>
                                        <p>
                                          Remaining:{" "}
                                          <span
                                            className="font-medium text-red-600"
                                            data-testid={`text-remaining-amount-${piutang.id}`}
                                          >
                                            {formatRupiah(remainingAmount)}
                                          </span>
                                        </p>
                                        {piutang.dueDate && (
                                          <p className="flex items-center gap-1">
                                            <Calendar className="h-3 w-3" />
                                            Due:{" "}
                                            {new Date(
                                              piutang.dueDate,
                                            ).toLocaleDateString()}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </CardContent>
                        </CollapsibleContent>
                      </Collapsible>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <DollarSign className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p
                className="text-gray-600 dark:text-gray-400"
                data-testid="text-no-piutang"
              >
                {searchTerm
                  ? "No customers found matching your search."
                  : "No outstanding debts. All customers have paid their debts."}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Payment Modal */}
      <Dialog
        open={!!paymentModalData}
        onOpenChange={(open) => !open && setPaymentModalData(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Record Payment
            </DialogTitle>
            <DialogDescription>
              Record an installment payment for this debt
            </DialogDescription>
          </DialogHeader>

          {paymentModalData && (
            <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Debt Details:
              </p>
              <p className="font-medium">{paymentModalData.description}</p>
              <p className="text-sm">
                Remaining:{" "}
                {formatRupiah(calculateRemainingDebt(paymentModalData))}
              </p>
            </div>
          )}

          <Form {...paymentForm}>
            <form
              onSubmit={paymentForm.handleSubmit(onSubmitPayment)}
              className="space-y-4"
            >
              <FormField
                control={paymentForm.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Amount *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="Enter payment amount"
                        data-testid="input-payment-amount"
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
                  onClick={() => setPaymentModalData(null)}
                  data-testid="button-cancel-payment"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={paymentMutation.isPending}
                  data-testid="button-record-payment"
                >
                  {paymentMutation.isPending
                    ? "Recording..."
                    : "Record Payment"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
