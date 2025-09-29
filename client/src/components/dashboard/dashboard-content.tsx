import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DollarSign,
  TrendingDown,
  FileText,
  TrendingUp,
  Clock,
  Wallet,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { SyncButton } from "@/components/ui/sync-button";
import MobileBankingWallet from "@/components/wallet/mobile-banking-wallet";

interface DashboardStats {
  totalIncome: string;
  totalExpenses: string;
  profit: string;
  totalWalletBalance: string;
  pendingProposals: number;
  monthlyCashflow: string;
}

interface StoreWallet {
  storeId: number;
  storeName: string;
  totalBalance: string;
  walletCount: number;
  wallets: {
    id: string;
    name: string;
    type: string;
    balance: string;
  }[];
}

export default function DashboardContent() {
  console.log("📊 DASHBOARD COMPONENT INITIALIZED");

  const {
    data: stats,
    isLoading,
    isError: isStatsError,
  } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
    onSuccess: (data) => {
      console.log("✅ DASHBOARD STATS LOADED SUCCESSFULLY");
      console.log("📊 Stats Data:", data);
    },
    onError: (error) => {
      console.error("❌ DASHBOARD STATS LOADING FAILED:", error);
    },
  });

  const {
    data: storeWallets,
    isLoading: isLoadingStoreWallets,
    isError: isStoreWalletsError,
  } = useQuery<StoreWallet[]>({
    queryKey: ["/api/dashboard/store-wallets"],
    onSuccess: (data) => {
      console.log("✅ STORE WALLETS LOADED SUCCESSFULLY");
      console.log("🏪 Store Wallets Data:", data);
    },
    onError: (error) => {
      console.error("❌ STORE WALLETS LOADING FAILED:", error);
    },
  });

  console.log("🔄 DASHBOARD STATE:", {
    statsLoading: isLoading,
    walletsLoading: isLoadingStoreWallets,
    statsError: isStatsError,
    walletsError: isStoreWalletsError,
    hasStats: !!stats,
    hasWallets: !!storeWallets,
  });

  if (isLoading || isLoadingStoreWallets) {
    console.log("⏳ DASHBOARD LOADING STATE - Showing skeleton UI");
    console.log("🔄 Loading Details:", {
      statsLoading: isLoading,
      walletsLoading: isLoadingStoreWallets,
    });

    return (
      <div className="space-y-8 slide-up">
        {/* Main Stats Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="shadow-card overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="skeleton w-14 h-14 rounded-xl" />
                  <div className="space-y-3 flex-1">
                    <div className="skeleton-text w-28" />
                    <div className="skeleton-text h-7 w-32" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Store Wallets Skeleton */}
        <div>
          <div className="skeleton-text h-6 w-48 mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="shadow-card overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="skeleton w-14 h-14 rounded-xl" />
                    <div className="space-y-3 flex-1">
                      <div className="skeleton-text w-32" />
                      <div className="skeleton-text h-6 w-24" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  console.log("✅ DASHBOARD RENDERING WITH DATA");
  console.log("📊 Final Stats:", stats);
  console.log("🏪 Final Store Wallets:", storeWallets);

  return (
    <div className="space-y-8 page-enter">
      {/* Dashboard Header */}
      <div className="flex items-center justify-between slide-up">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Overview of your business performance
          </p>
        </div>
        <SyncButton
          dataType="dashboard"
          variant="outline"
          className="text-indigo-600 border-indigo-200 hover:bg-indigo-50 dark:hover:bg-indigo-950 transition-all"
        />
      </div>
      
      {/* Bank Balance (Wallet Simulator) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="stat-card shadow-card border-l-4 border-l-green-500 overflow-hidden stagger-item">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="stat-icon bg-gradient-to-br from-green-400 to-green-600 p-3 rounded-xl shadow-md">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground mb-1">Total Pemasukan</p>
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

        <Card className="stat-card shadow-card border-l-4 border-l-red-500 overflow-hidden stagger-item">
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

        <Card className={`stat-card shadow-card border-l-4 ${stats?.profit && stats.profit.includes("-") ? "border-l-red-500" : "border-l-green-500"} overflow-hidden stagger-item`}>
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
                <p className="text-sm font-medium text-muted-foreground mb-1">Keuntungan</p>
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

        <Card className="stat-card shadow-card border-l-4 border-l-blue-500 overflow-hidden stagger-item">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="stat-icon bg-gradient-to-br from-blue-400 to-blue-600 p-3 rounded-xl shadow-md">
                <Wallet className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  Saldo Total Semua Store
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

      {/* Mobile Banking Style Wallet */}
      <div className="slide-up">
        <MobileBankingWallet />
      </div>
    </div>
  );
}
