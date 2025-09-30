import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DollarSign,
  TrendingDown,
  TrendingUp,
  Wallet,
  Calendar as CalendarIcon,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { SyncButton } from "@/components/ui/sync-button";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { DateRange } from "react-day-picker";
import { addDays, startOfWeek, startOfMonth, format } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

interface DashboardStats {
  totalIncome: string;
  totalExpenses: string;
  profit: string;
  totalWalletBalance: string;
  pendingProposals: number;
  monthlyCashflow: string;
}

interface Store {
  id: number;
  name: string;
  address?: string;
  status?: string;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function DashboardContent() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: addDays(new Date(), -30),
    to: new Date(),
  });
  const [selectedStore, setSelectedStore] = useState<string>("all");
  const [timeGrouping, setTimeGrouping] = useState<string>("daily");

  const dateRangeParams = useMemo(() => {
    if (!dateRange?.from || !dateRange?.to) return "";
    return `startDate=${dateRange.from.toISOString()}&endDate=${dateRange.to.toISOString()}`;
  }, [dateRange]);

  const storeParam = useMemo(() => {
    return selectedStore !== "all" ? `storeId=${selectedStore}` : "";
  }, [selectedStore]);

  // Fetch dashboard stats
  const { data: stats, isLoading: isLoadingStats } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
  });

  // Fetch stores for dropdown
  const { data: stores = [] } = useQuery<Store[]>({
    queryKey: ["/api/stores"],
  });

  // Fetch sales trends
  const { data: salesTrends = [], isLoading: isLoadingSalesTrends } = useQuery({
    queryKey: ["/api/dashboard/sales-trends", storeParam, dateRangeParams, timeGrouping],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedStore !== "all") params.append("storeId", selectedStore);
      if (dateRange?.from) params.append("startDate", dateRange.from.toISOString());
      if (dateRange?.to) params.append("endDate", dateRange.to.toISOString());
      params.append("groupBy", timeGrouping);
      
      const response = await fetch(`/api/dashboard/sales-trends?${params.toString()}`);
      if (!response.ok) throw new Error("Failed to fetch sales trends");
      return response.json();
    },
    enabled: !!dateRange?.from && !!dateRange?.to,
  });

  // Fetch sales comparison
  const { data: salesComparison = [], isLoading: isLoadingSalesComparison } = useQuery({
    queryKey: ["/api/dashboard/sales-comparison", dateRangeParams],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (dateRange?.from) params.append("startDate", dateRange.from.toISOString());
      if (dateRange?.to) params.append("endDate", dateRange.to.toISOString());
      
      const response = await fetch(`/api/dashboard/sales-comparison?${params.toString()}`);
      if (!response.ok) throw new Error("Failed to fetch sales comparison");
      return response.json();
    },
    enabled: !!dateRange?.from && !!dateRange?.to,
  });

  // Fetch payment distribution
  const { data: paymentDistribution = [], isLoading: isLoadingPayment } = useQuery({
    queryKey: ["/api/dashboard/payment-distribution", storeParam, dateRangeParams],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedStore !== "all") params.append("storeId", selectedStore);
      if (dateRange?.from) params.append("startDate", dateRange.from.toISOString());
      if (dateRange?.to) params.append("endDate", dateRange.to.toISOString());
      
      const response = await fetch(`/api/dashboard/payment-distribution?${params.toString()}`);
      if (!response.ok) throw new Error("Failed to fetch payment distribution");
      return response.json();
    },
    enabled: !!dateRange?.from && !!dateRange?.to,
  });

  // Fetch attendance summary
  const { data: attendanceSummary = [], isLoading: isLoadingAttendance } = useQuery({
    queryKey: ["/api/dashboard/attendance-summary", storeParam, dateRangeParams],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedStore !== "all") params.append("storeId", selectedStore);
      if (dateRange?.from) params.append("startDate", dateRange.from.toISOString());
      if (dateRange?.to) params.append("endDate", dateRange.to.toISOString());
      
      const response = await fetch(`/api/dashboard/attendance-summary?${params.toString()}`);
      if (!response.ok) throw new Error("Failed to fetch attendance summary");
      return response.json();
    },
    enabled: !!dateRange?.from && !!dateRange?.to,
  });

  // Fetch cashflow trends
  const { data: cashflowTrends = [], isLoading: isLoadingCashflow } = useQuery({
    queryKey: ["/api/dashboard/cashflow-trends", storeParam, dateRangeParams, timeGrouping],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedStore !== "all") params.append("storeId", selectedStore);
      if (dateRange?.from) params.append("startDate", dateRange.from.toISOString());
      if (dateRange?.to) params.append("endDate", dateRange.to.toISOString());
      params.append("groupBy", timeGrouping);
      
      const response = await fetch(`/api/dashboard/cashflow-trends?${params.toString()}`);
      if (!response.ok) throw new Error("Failed to fetch cashflow trends");
      return response.json();
    },
    enabled: !!dateRange?.from && !!dateRange?.to,
  });

  // Fetch product performance
  const { data: productPerformance = [], isLoading: isLoadingProducts } = useQuery({
    queryKey: ["/api/dashboard/product-performance", storeParam, dateRangeParams],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedStore !== "all") params.append("storeId", selectedStore);
      if (dateRange?.from) params.append("startDate", dateRange.from.toISOString());
      if (dateRange?.to) params.append("endDate", dateRange.to.toISOString());
      params.append("limit", "10");
      
      const response = await fetch(`/api/dashboard/product-performance?${params.toString()}`);
      if (!response.ok) throw new Error("Failed to fetch product performance");
      return response.json();
    },
    enabled: !!dateRange?.from && !!dateRange?.to,
  });

  // Fetch revenue per store
  const { data: revenuePerStore = [], isLoading: isLoadingRevenue } = useQuery({
    queryKey: ["/api/dashboard/revenue-per-store", dateRangeParams],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (dateRange?.from) params.append("startDate", dateRange.from.toISOString());
      if (dateRange?.to) params.append("endDate", dateRange.to.toISOString());
      
      const response = await fetch(`/api/dashboard/revenue-per-store?${params.toString()}`);
      if (!response.ok) throw new Error("Failed to fetch revenue per store");
      return response.json();
    },
    enabled: !!dateRange?.from && !!dateRange?.to,
  });

  // Calculate total revenue across all stores
  const totalRevenue = useMemo(() => {
    if (!revenuePerStore || revenuePerStore.length === 0) return 0;
    return revenuePerStore.reduce((sum: number, store: any) => sum + parseFloat(store.totalRevenue || 0), 0);
  }, [revenuePerStore]);

  const setDateRangePreset = (preset: string) => {
    const today = new Date();
    let from: Date;
    let to: Date = today;

    switch (preset) {
      case "today":
        from = today;
        break;
      case "week":
        from = startOfWeek(today, { weekStartsOn: 1 });
        break;
      case "month":
        from = startOfMonth(today);
        break;
      case "30days":
        from = addDays(today, -30);
        break;
      default:
        from = addDays(today, -30);
    }

    setDateRange({ from, to });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  if (isLoadingStats) {
    return (
      <div className="space-y-8 slide-up">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="shadow-card overflow-hidden">
              <CardContent className="p-6">
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 page-enter">
      {/* Dashboard Header */}
      <div className="flex items-center justify-between slide-up">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Dashboard Analytics
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Comprehensive business insights and performance metrics
          </p>
        </div>
        <SyncButton
          dataType="dashboard"
          variant="outline"
          className="text-indigo-600 border-indigo-200 hover:bg-indigo-50 dark:hover:bg-indigo-950 transition-all"
        />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 stagger-children">
        <Card className="stat-card shadow-card border-l-4 border-l-green-500 overflow-hidden hover:shadow-lg transition-shadow duration-300">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="stat-icon bg-gradient-to-br from-green-400 to-green-600 p-3 rounded-xl shadow-md">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  Total Pemasukan
                </p>
                <p
                  className="text-2xl font-bold text-foreground count-up"
                  data-testid="text-total-income"
                >
                  {stats?.totalIncome || "Rp 0"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="stat-card shadow-card border-l-4 border-l-red-500 overflow-hidden hover:shadow-lg transition-shadow duration-300">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="stat-icon bg-gradient-to-br from-red-400 to-red-600 p-3 rounded-xl shadow-md">
                <TrendingDown className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  Total Pengeluaran
                </p>
                <p
                  className="text-2xl font-bold text-foreground count-up"
                  data-testid="text-total-expenses"
                >
                  {stats?.totalExpenses || "Rp 0"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className={`stat-card shadow-card border-l-4 ${
            stats?.profit && stats.profit.includes("-")
              ? "border-l-red-500"
              : "border-l-green-500"
          } overflow-hidden hover:shadow-lg transition-shadow duration-300`}
        >
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div
                className={`stat-icon p-3 rounded-xl shadow-md ${
                  stats?.profit && stats.profit.includes("-")
                    ? "bg-gradient-to-br from-red-400 to-red-600"
                    : "bg-gradient-to-br from-green-400 to-green-600"
                }`}
              >
                <DollarSign className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  Keuntungan
                </p>
                <p
                  className={`text-2xl font-bold count-up ${
                    stats?.profit && stats.profit.includes("-")
                      ? "text-red-600 dark:text-red-400"
                      : "text-green-600 dark:text-green-400"
                  }`}
                  data-testid="text-profit"
                >
                  {stats?.profit || "Rp 0"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="stat-card shadow-card border-l-4 border-l-blue-500 overflow-hidden hover:shadow-lg transition-shadow duration-300">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="stat-icon bg-gradient-to-br from-blue-400 to-blue-600 p-3 rounded-xl shadow-md">
                <Wallet className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  Saldo Total
                </p>
                <p
                  className="text-2xl font-bold text-foreground count-up"
                  data-testid="text-wallet-balance"
                >
                  {stats?.totalWalletBalance || "Rp 0"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Total Revenue Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 stagger-children">
        {/* Total Revenue All Stores */}
        <Card className="stat-card shadow-card border-l-4 border-l-purple-500 overflow-hidden hover:shadow-lg transition-shadow duration-300">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="stat-icon bg-gradient-to-br from-purple-400 to-purple-600 p-3 rounded-xl shadow-md">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  Total Penghasilan Semua Toko
                </p>
                <p className="text-2xl font-bold text-foreground count-up" data-testid="text-total-revenue-all">
                  {formatCurrency(totalRevenue)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Revenue Per Store Cards */}
        {isLoadingRevenue ? (
          <>
            {Array.from({ length: 2 }).map((_, i) => (
              <Card key={i} className="shadow-card overflow-hidden">
                <CardContent className="p-6">
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))}
          </>
        ) : (
          revenuePerStore.map((store: any, index: number) => (
            <Card 
              key={store.storeId} 
              className="stat-card shadow-card border-l-4 border-l-indigo-500 overflow-hidden hover:shadow-lg transition-shadow duration-300"
            >
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="stat-icon bg-gradient-to-br from-indigo-400 to-indigo-600 p-3 rounded-xl shadow-md">
                    <DollarSign className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      {store.storeName}
                    </p>
                    <p className="text-2xl font-bold text-foreground count-up" data-testid={`text-revenue-store-${store.storeId}`}>
                      {formatCurrency(parseFloat(store.totalRevenue || 0))}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {store.salesCount} transaksi
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Filters */}
      <Card className="shadow-card slide-up">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Filter Data
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[250px]">
              <label className="text-sm font-medium mb-2 block" data-testid="label-date-range">
                Date Range
              </label>
              <DateRangePicker value={dateRange} onChange={setDateRange} />
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDateRangePreset("today")}
                data-testid="button-today"
              >
                Today
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDateRangePreset("week")}
                data-testid="button-week"
              >
                This Week
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDateRangePreset("month")}
                data-testid="button-month"
              >
                This Month
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDateRangePreset("30days")}
                data-testid="button-30days"
              >
                Last 30 Days
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium mb-2 block" data-testid="label-store-filter">
                Store Filter
              </label>
              <Select value={selectedStore} onValueChange={setSelectedStore}>
                <SelectTrigger data-testid="select-store-filter">
                  <SelectValue placeholder="Select store" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" data-testid="select-item-all-stores">All Stores</SelectItem>
                  {stores.map((store) => (
                    <SelectItem key={store.id} value={store.id.toString()} data-testid={`select-item-store-${store.id}`}>
                      {store.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium mb-2 block" data-testid="label-time-grouping">
                Time Grouping
              </label>
              <Select value={timeGrouping} onValueChange={setTimeGrouping}>
                <SelectTrigger data-testid="select-time-grouping">
                  <SelectValue placeholder="Select grouping" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily" data-testid="select-item-daily">Daily</SelectItem>
                  <SelectItem value="weekly" data-testid="select-item-weekly">Weekly</SelectItem>
                  <SelectItem value="monthly" data-testid="select-item-monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Trends Chart */}
        <Card className="shadow-card slide-up hover:shadow-lg transition-shadow duration-300">
          <CardHeader>
            <CardTitle data-testid="title-sales-trends">
              Sales Trends 
              <span className="text-sm font-normal text-muted-foreground ml-2">
                ({timeGrouping === 'daily' ? 'Harian' : timeGrouping === 'weekly' ? 'Mingguan' : 'Bulanan'})
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingSalesTrends ? (
              <Skeleton className="h-[350px] w-full" />
            ) : salesTrends.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={salesTrends}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11 }}
                      angle={timeGrouping === 'monthly' ? -45 : 0}
                      textAnchor={timeGrouping === 'monthly' ? 'end' : 'middle'}
                      height={timeGrouping === 'monthly' ? 60 : 30}
                      tickFormatter={(value) => {
                        const date = new Date(value);
                        if (timeGrouping === 'daily') return format(date, "dd MMM");
                        if (timeGrouping === 'weekly') return `Week ${format(date, "w, MMM")}`;
                        return format(date, "MMM yyyy");
                      }}
                    />
                    <YAxis tick={{ fontSize: 11 }} width={80} />
                    <Tooltip
                      formatter={(value: any, name: string) => {
                        if (name === 'totalSales') return [formatCurrency(value), 'Total Sales'];
                        if (name === 'transactionCount') return [value, 'Transactions'];
                        if (name === 'averageTicket') return [formatCurrency(value), 'Avg Ticket'];
                        return [value, name];
                      }}
                      labelFormatter={(label) => {
                        const date = new Date(label);
                        if (timeGrouping === 'daily') return format(date, "dd MMMM yyyy");
                        if (timeGrouping === 'weekly') return `Week ${format(date, "w")}, ${format(date, "MMMM yyyy")}`;
                        return format(date, "MMMM yyyy");
                      }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="totalSales"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                      name="Total Sales"
                    />
                    {timeGrouping !== 'daily' && (
                      <Line
                        type="monotone"
                        dataKey="averageTicket"
                        stroke="#10b981"
                        strokeWidth={2}
                        dot={{ r: 4 }}
                        name="Avg Ticket"
                      />
                    )}
                  </LineChart>
                </ResponsiveContainer>
                <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-xs text-muted-foreground">Total Sales</p>
                      <p className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                        {formatCurrency(salesTrends.reduce((sum: number, item: any) => sum + parseFloat(item.totalSales || 0), 0))}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Avg per {timeGrouping === 'daily' ? 'Day' : timeGrouping === 'weekly' ? 'Week' : 'Month'}</p>
                      <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                        {formatCurrency(salesTrends.reduce((sum: number, item: any) => sum + parseFloat(item.totalSales || 0), 0) / salesTrends.length)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Data Points</p>
                      <p className="text-lg font-semibold text-purple-600 dark:text-purple-400">
                        {salesTrends.length}
                      </p>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="h-[350px] flex items-center justify-center text-muted-foreground" data-testid="text-no-sales-data">
                No sales data available for the selected period
              </div>
            )}
          </CardContent>
        </Card>

        {/* Cashflow Trends Chart */}
        <Card className="shadow-card slide-up hover:shadow-lg transition-shadow duration-300">
          <CardHeader>
            <CardTitle data-testid="title-cashflow-trends">Cashflow Trends</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingCashflow ? (
              <Skeleton className="h-[300px] w-full" />
            ) : cashflowTrends.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={cashflowTrends}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => format(new Date(value), "MMM dd")}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    formatter={(value: any) => formatCurrency(value)}
                    labelFormatter={(label) => format(new Date(label), "MMM dd, yyyy")}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="income"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    name="Income"
                  />
                  <Line
                    type="monotone"
                    dataKey="expenses"
                    stroke="#ef4444"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    name="Expenses"
                  />
                  <Line
                    type="monotone"
                    dataKey="profit"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    name="Profit"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground" data-testid="text-no-cashflow-data">
                No cashflow data available for the selected period
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sales Comparison Chart */}
        <Card className="shadow-card slide-up hover:shadow-lg transition-shadow duration-300">
          <CardHeader>
            <CardTitle data-testid="title-sales-comparison">Store Sales Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingSalesComparison ? (
              <Skeleton className="h-[300px] w-full" />
            ) : salesComparison.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={salesComparison}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="storeName" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value: any) => formatCurrency(value)} />
                  <Legend />
                  <Bar dataKey="totalSales" fill="#3b82f6" name="Total Sales" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground" data-testid="text-no-comparison-data">
                No comparison data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment Distribution Chart */}
        <Card className="shadow-card slide-up hover:shadow-lg transition-shadow duration-300">
          <CardHeader>
            <CardTitle data-testid="title-payment-distribution">Payment Method Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingPayment ? (
              <Skeleton className="h-[300px] w-full" />
            ) : paymentDistribution.length > 0 && paymentDistribution.some((d: any) => d.value > 0) ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={paymentDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percentage }: any) => `${name}: ${percentage}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {paymentDistribution.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: any) => formatCurrency(value)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground" data-testid="text-no-payment-data">
                No payment data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Attendance Summary Chart */}
        <Card className="shadow-card slide-up hover:shadow-lg transition-shadow duration-300">
          <CardHeader>
            <CardTitle data-testid="title-attendance-summary">Attendance Summary</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingAttendance ? (
              <Skeleton className="h-[300px] w-full" />
            ) : attendanceSummary.length > 0 && attendanceSummary.some((d: any) => d.value > 0) ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={attendanceSummary}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percentage }: any) => `${name}: ${percentage}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {attendanceSummary.map((entry: any, index: number) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          entry.name === "Hadir"
                            ? "#10b981"
                            : entry.name === "Cuti"
                            ? "#f59e0b"
                            : "#ef4444"
                        }
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground" data-testid="text-no-attendance-data">
                No attendance data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Product Performance Chart */}
        <Card className="shadow-card slide-up hover:shadow-lg transition-shadow duration-300">
          <CardHeader>
            <CardTitle data-testid="title-product-performance">Top Selling Products</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingProducts ? (
              <Skeleton className="h-[300px] w-full" />
            ) : productPerformance.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={productPerformance} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis type="number" tick={{ fontSize: 12 }} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} width={100} />
                  <Tooltip formatter={(value: any) => formatCurrency(value)} />
                  <Legend />
                  <Bar dataKey="revenue" fill="#8b5cf6" name="Revenue" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground" data-testid="text-no-product-data">
                No product performance data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
