import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Cloud, Download, Upload, Table, RefreshCw, Plus, FileSpreadsheet, Layers, Zap } from "lucide-react";

interface SyncButtonProps {
  dataType: 'sales' | 'attendance' | 'cashflow' | 'piutang' | 'dashboard' | 'payroll';
  storeIds?: number[];
  className?: string;
  variant?: "default" | "outline" | "secondary";
}

const dataTypeLabels = {
  sales: "Penjualan",
  attendance: "Absensi", 
  cashflow: "Cashflow",
  piutang: "Piutang",
  dashboard: "Dashboard",
  payroll: "Payroll"
};

const worksheetNames = {
  sales: "Sales Per Toko",
  attendance: "Absensi Per User",
  cashflow: "Cashflow Per Toko", 
  piutang: "Piutang Per User",
  dashboard: "Dashboard Summary",
  payroll: "Payroll"
};

// Enhanced sync endpoints as requested
const enhancedSyncEndpoints = {
  sales: "/api/google-sheets/sync-sales-per-store",
  cashflow: "/api/google-sheets/sync-cashflow-per-store",
  attendance: "/api/google-sheets/sync-attendance-side-by-side",
  piutang: "/api/google-sheets/sync-piutang-single-worksheet",
  payroll: "/api/google-sheets/sync-payroll-auto-generate"
};

export function SyncButton({ dataType, storeIds, className, variant = "outline" }: SyncButtonProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);

  // Setup organized worksheets
  const setupWorksheetsMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/google-sheets/setup-organized"),
    onSuccess: (data) => {
      if (data.worksheets && data.worksheets.length > 0) {
        toast({
          title: "✅ Worksheet Siap!",
          description: `Dibuat: ${data.worksheets.join(", ")}`,
          duration: 3000,
        });
      } else {
        toast({
          title: "📋 Worksheet Tersedia",
          description: "Semua worksheet sudah tersedia dan siap digunakan",
          duration: 3000,
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "❌ Gagal Setup Worksheet",
        description: error.message || "Terjadi kesalahan saat setup worksheet",
        variant: "destructive",
        duration: 4000,
      });
    }
  });

  // Sync data mutation
  const syncMutation = useMutation({
    mutationFn: (worksheetName: string) => apiRequest("POST", "/api/google-sheets/sync-data", {
      dataType,
      worksheetName,
      storeIds
    }),
    onSuccess: (data) => {
      toast({
        title: "🎉 Sync Berhasil!",
        description: `${data.recordCount} data ${dataTypeLabels[dataType]} berhasil disinkronkan ke Google Sheets`,
        duration: 5000,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/google-sheets"] });
    },
    onError: (error: any) => {
      toast({
        title: "❌ Sync Gagal",
        description: error.message || `Gagal sinkronkan data ${dataTypeLabels[dataType]}`,
        variant: "destructive",
        duration: 5000,
      });
    }
  });

  // Enhanced sync mutation
  const enhancedSyncMutation = useMutation({
    mutationFn: () => {
      const endpoint = enhancedSyncEndpoints[dataType as keyof typeof enhancedSyncEndpoints];
      return apiRequest("POST", endpoint, { storeIds });
    },
    onSuccess: (data) => {
      toast({
        title: "🚀 Enhanced Sync Berhasil!",
        description: data.message || `Data ${dataTypeLabels[dataType]} berhasil disinkronkan dengan format enhanced`,
        duration: 5000,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/google-sheets"] });
    },
    onError: (error: any) => {
      toast({
        title: "❌ Gagal Enhanced Sync",
        description: error.message || "Terjadi kesalahan saat enhanced sync",
        variant: "destructive",
        duration: 4000,
      });
    }
  });

  // Manual worksheet creation mutation
  const createManualWorksheetMutation = useMutation({
    mutationFn: (worksheetName: string) => apiRequest("POST", "/api/google-sheets/create-manual-worksheet", {
      worksheetName,
      dataType
    }),
    onSuccess: (data) => {
      toast({
        title: "📝 Worksheet Manual Dibuat!",
        description: `Worksheet '${data.worksheetName}' berhasil dibuat tanpa menimpa data yang ada`,
        duration: 4000,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/google-sheets"] });
    },
    onError: (error: any) => {
      toast({
        title: "❌ Gagal Buat Worksheet Manual",
        description: error.message || "Terjadi kesalahan saat membuat worksheet manual",
        variant: "destructive",
        duration: 4000,
      });
    }
  });

  // Auto create store worksheets mutation
  const autoCreateStoreWorksheetsMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/google-sheets/auto-create-store-worksheets", {
      dataType
    }),
    onSuccess: (data) => {
      toast({
        title: "🏪 Auto-Create Worksheets Berhasil!",
        description: `${data.totalWorksheets} worksheet per toko berhasil dibuat untuk ${dataTypeLabels[dataType]}`,
        duration: 4000,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/google-sheets"] });
    },
    onError: (error: any) => {
      toast({
        title: "❌ Gagal Auto-Create Worksheets",
        description: error.message || "Terjadi kesalahan saat auto-create worksheets",
        variant: "destructive",
        duration: 4000,
      });
    }
  });

  // Read data mutation
  const readMutation = useMutation({
    mutationFn: (worksheetName: string) => apiRequest("POST", "/api/google-sheets/read-data", {
      worksheetName
    }),
    onSuccess: (data) => {
      toast({
        title: "📥 Data Berhasil Dibaca",
        description: `Ditemukan ${data.recordCount} data dari worksheet ${data.worksheetName}`,
        duration: 4000,
      });
    },
    onError: (error: any) => {
      toast({
        title: "❌ Gagal Baca Data",
        description: error.message || "Gagal membaca data dari Google Sheets",
        variant: "destructive",
        duration: 4000,
      });
    }
  });

  const handleSetupWorksheets = async () => {
    setIsLoading(true);
    try {
      await setupWorksheetsMutation.mutateAsync();
    } finally {
      setIsLoading(false);
    }
  };

  const handleSyncData = async () => {
    setIsLoading(true);
    try {
      await syncMutation.mutateAsync(worksheetNames[dataType]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReadData = async () => {
    setIsLoading(true);
    try {
      await readMutation.mutateAsync(worksheetNames[dataType]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnhancedSync = async () => {
    setIsLoading(true);
    try {
      await enhancedSyncMutation.mutateAsync();
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateManualWorksheet = async () => {
    const worksheetName = `${dataTypeLabels[dataType]} Manual`;
    setIsLoading(true);
    try {
      await createManualWorksheetMutation.mutateAsync(worksheetName);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAutoCreateStoreWorksheets = async () => {
    setIsLoading(true);
    try {
      await autoCreateStoreWorksheetsMutation.mutateAsync();
    } finally {
      setIsLoading(false);
    }
  };

  const isPending = setupWorksheetsMutation.isPending || syncMutation.isPending || readMutation.isPending || 
                   enhancedSyncMutation.isPending || createManualWorksheetMutation.isPending || 
                   autoCreateStoreWorksheetsMutation.isPending || isLoading;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant={variant} 
          className={className}
          disabled={isPending}
          data-testid={`sync-${dataType}-button`}
        >
          {isPending ? (
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Cloud className="h-4 w-4 mr-2" />
          )}
          {isPending ? "Memproses..." : `Sync ${dataTypeLabels[dataType]}`}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        {/* Setup Section */}
        <DropdownMenuItem 
          onClick={handleSetupWorksheets}
          disabled={isPending}
          data-testid={`setup-worksheets-${dataType}`}
        >
          <Table className="h-4 w-4 mr-2" />
          Siapkan Worksheet Otomatis
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        {/* Enhanced Sync Section - Sesuai Request User */}
        <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">🚀 Enhanced Sync (Sesuai Request)</div>
        
        {enhancedSyncEndpoints[dataType as keyof typeof enhancedSyncEndpoints] && (
          <DropdownMenuItem 
            onClick={handleEnhancedSync}
            disabled={isPending}
            data-testid={`enhanced-sync-${dataType}`}
          >
            <Layers className="h-4 w-4 mr-2" />
            {dataType === 'sales' ? '📊 Sync Sales Per Toko (Terpisah)' : 
             dataType === 'cashflow' ? '💰 Sync Cashflow Per Toko (Terpisah)' :
             dataType === 'attendance' ? '👥 Sync Absensi (Side-by-Side + Gap 5)' :
             dataType === 'piutang' ? '📋 Sync Piutang (1 Worksheet)' :
             dataType === 'payroll' ? '💼 Sync Payroll (Auto-Generate)' :
             '🚀 Enhanced Sync'}
          </DropdownMenuItem>
        )}
        
        <DropdownMenuSeparator />
        
        {/* Manual Worksheet Creation Section - Anti Timpa */}
        <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">📝 Manual Creation (Anti Timpa)</div>
        
        <DropdownMenuItem 
          onClick={handleCreateManualWorksheet}
          disabled={isPending}
          data-testid={`manual-worksheet-${dataType}`}
        >
          <Plus className="h-4 w-4 mr-2" />
          🆕 Buat Worksheet Manual {dataTypeLabels[dataType]}
        </DropdownMenuItem>
        
        {(dataType === 'sales' || dataType === 'cashflow') && (
          <DropdownMenuItem 
            onClick={handleAutoCreateStoreWorksheets}
            disabled={isPending}
            data-testid={`auto-create-stores-${dataType}`}
          >
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            🏪 Auto-Create Per Toko ({dataTypeLabels[dataType]})
          </DropdownMenuItem>
        )}
        
        <DropdownMenuSeparator />
        
        {/* Standard Sync Section */}
        <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">⚡ Standard Sync</div>
        
        <DropdownMenuItem 
          onClick={handleSyncData}
          disabled={isPending}
          data-testid={`sync-data-${dataType}`}
        >
          <Upload className="h-4 w-4 mr-2" />
          Upload ke "{worksheetNames[dataType]}"
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          onClick={handleReadData}
          disabled={isPending}
          data-testid={`read-data-${dataType}`}
        >
          <Download className="h-4 w-4 mr-2" />
          Baca dari "{worksheetNames[dataType]}"
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}