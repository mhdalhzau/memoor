import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Cloud, Download, Upload, Table, RefreshCw } from "lucide-react";

interface SyncButtonProps {
  dataType: 'sales' | 'attendance' | 'cashflow' | 'piutang' | 'dashboard';
  storeIds?: number[];
  className?: string;
  variant?: "default" | "outline" | "secondary";
}

const dataTypeLabels = {
  sales: "Penjualan",
  attendance: "Absensi", 
  cashflow: "Cashflow",
  piutang: "Piutang",
  dashboard: "Dashboard"
};

const worksheetNames = {
  sales: "Sales Per Toko",
  attendance: "Absensi Per User",
  cashflow: "Cashflow Per Toko", 
  piutang: "Piutang Per User",
  dashboard: "Dashboard Summary"
};

export function SyncButton({ dataType, storeIds, className, variant = "outline" }: SyncButtonProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);

  // Setup organized worksheets
  const setupWorksheetsMutation = useMutation({
    mutationFn: () => apiRequest("/api/google-sheets/setup-organized", {
      method: "POST"
    }),
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
    mutationFn: (worksheetName: string) => apiRequest("/api/google-sheets/sync-data", {
      method: "POST",
      body: JSON.stringify({
        dataType,
        worksheetName,
        storeIds
      })
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

  // Read data mutation
  const readMutation = useMutation({
    mutationFn: (worksheetName: string) => apiRequest("/api/google-sheets/read-data", {
      method: "POST",
      body: JSON.stringify({
        worksheetName
      })
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

  const isPending = setupWorksheetsMutation.isPending || syncMutation.isPending || readMutation.isPending || isLoading;

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
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem 
          onClick={handleSetupWorksheets}
          disabled={isPending}
          data-testid={`setup-worksheets-${dataType}`}
        >
          <Table className="h-4 w-4 mr-2" />
          Siapkan Worksheet Otomatis
        </DropdownMenuItem>
        
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