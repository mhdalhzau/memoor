import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  formatRupiah, 
  formatIndonesianMonth, 
  getCurrentMonth, 
  getSelectableMonths,
  cn,
} from "@/lib/utils";
import { type Payroll, type User } from "@shared/schema";
import {
  Wallet,
  DollarSign,
  CheckCircle2,
  FileText,
  Calendar as CalendarIcon,
  Printer,
  Plus,
  Trash2,
  Filter,
  X,
  Users,
  Building2,
  Download,
  TrendingUp,
  Edit2,
  Save,
  XCircle,
  Search,
  FileSpreadsheet,
} from "lucide-react";
import { useReactToPrint } from "react-to-print";
import { useRef } from "react";
import { format, startOfMonth, endOfMonth } from "date-fns";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface PayrollWithUser extends Payroll {
  user?: User;
  store?: { id: number; name: string };
  bonusList?: Array<{ name: string; amount: number }>;
  deductionList?: Array<{ name: string; amount: number }>;
}

interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

export default function PayrollContent() {
  const { toast } = useToast();
  const printRef = useRef<HTMLDivElement>(null);
  const [selectedPayrollId, setSelectedPayrollId] = useState<string | null>(null);
  const [attendanceDialogOpen, setAttendanceDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ type: 'bonus' | 'deduction', recordId: string, index: number } | null>(null);
  
  // Date range filter state
  const [dateRange, setDateRange] = useState<DateRange>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });
  
  // Filtering state
  const [selectedMonth, setSelectedMonth] = useState<string>(getCurrentMonth());
  const [selectedStore, setSelectedStore] = useState<string>("");
  const [selectedEmployee, setSelectedEmployee] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [generateForMonth, setGenerateForMonth] = useState<string>(getCurrentMonth());
  
  // Inline editing state
  const [editingField, setEditingField] = useState<{ recordId: string; field: string } | null>(null);
  const [editValue, setEditValue] = useState<string>("");
  const [newBonus, setNewBonus] = useState({ name: "", amount: 0 });
  const [newDeduction, setNewDeduction] = useState({ name: "", amount: 0 });
  
  const selectableMonths = useMemo(() => getSelectableMonths(), []);

  const { data: payrollRecords, isLoading, error } = useQuery<PayrollWithUser[]>({
    queryKey: ["/api/payroll"],
  });

  const { data: users } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const { data: stores } = useQuery<Array<{ id: number; name: string }>>({
    queryKey: ["/api/stores"],
  });

  const processedRecords = useMemo(() => 
    payrollRecords?.map((record) => {
      const user = users?.find((u) => u.id === record.userId);
      const store = stores?.find((s) => s.id === record.storeId);
      let bonusList = [];
      let deductionList = [];

      try {
        bonusList = record.bonuses ? JSON.parse(record.bonuses) : [];
      } catch (e) {
        console.warn("Failed to parse bonuses:", e);
      }

      try {
        deductionList = record.deductions ? JSON.parse(record.deductions) : [];
      } catch (e) {
        console.warn("Failed to parse deductions:", e);
      }

      return {
        ...record,
        user,
        store,
        bonusList,
        deductionList,
      };
    }) || [], [payrollRecords, users, stores]);

  const filteredRecords = useMemo(() => {
    let filtered = processedRecords;
    
    if (selectedMonth) {
      filtered = filtered.filter(record => record.month === selectedMonth);
    }
    
    if (selectedStore) {
      filtered = filtered.filter(record => record.storeId.toString() === selectedStore);
    }
    
    if (selectedEmployee) {
      filtered = filtered.filter(record => record.userId === selectedEmployee);
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(record => 
        record.user?.name?.toLowerCase().includes(query) ||
        record.store?.name?.toLowerCase().includes(query)
      );
    }
    
    if (dateRange.from && dateRange.to) {
      filtered = filtered.filter(record => {
        const recordDate = new Date(record.month + "-01");
        return recordDate >= dateRange.from! && recordDate <= dateRange.to!;
      });
    }
    
    return filtered;
  }, [processedRecords, selectedMonth, selectedStore, selectedEmployee, searchQuery, dateRange]);

  const summaryStats = useMemo(() => {
    const total = filteredRecords.reduce((sum, record) => sum + Number(record.totalAmount), 0);
    const average = filteredRecords.length > 0 ? total / filteredRecords.length : 0;
    const paid = filteredRecords.filter(r => r.status === 'paid').length;
    const pending = filteredRecords.filter(r => r.status === 'pending').length;
    
    return { total, average, paid, pending, count: filteredRecords.length };
  }, [filteredRecords]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (selectedMonth && selectedMonth !== getCurrentMonth()) count++;
    if (selectedStore) count++;
    if (selectedEmployee) count++;
    if (searchQuery) count++;
    return count;
  }, [selectedMonth, selectedStore, selectedEmployee, searchQuery]);

  const clearFilters = () => {
    setSelectedMonth(getCurrentMonth());
    setSelectedStore("");
    setSelectedEmployee("");
    setSearchQuery("");
    setDateRange({
      from: startOfMonth(new Date()),
      to: endOfMonth(new Date()),
    });
  };

  const selectedPayroll = useMemo(() => {
    return selectedPayrollId
      ? processedRecords.find((record) => record.id === selectedPayrollId) || null
      : null;
  }, [processedRecords, selectedPayrollId]);

  const { data: allAttendanceRecords } = useQuery<Array<any>>({
    queryKey: [`/api/attendance/user/${selectedPayroll?.userId}`],
    enabled: !!selectedPayroll && (attendanceDialogOpen || detailDialogOpen),
  });

  const attendanceRecords = useMemo(() =>
    allAttendanceRecords?.filter((record) => {
      if (!record?.date && !record?.createdAt) return false;
      if (!selectedPayroll?.month) return false;
      
      try {
        const recordDate = new Date(record.date || record.createdAt);
        if (isNaN(recordDate.getTime())) return false;
        const recordMonth = recordDate.toISOString().slice(0, 7);
        return recordMonth === selectedPayroll.month;
      } catch (error) {
        console.warn('Error processing attendance record date:', error);
        return false;
      }
    }) || [], [allAttendanceRecords, selectedPayroll]);

  const generatePayrollMutation = useMutation({
    mutationFn: async (month?: string) => {
      const targetMonth = month || generateForMonth;
      const res = await apiRequest("POST", "/api/payroll/generate", { month: targetMonth });
      return await res.json();
    },
    onSuccess: (data, month) => {
      const targetMonth = month || generateForMonth;
      const existingRecords = payrollRecords?.filter((record) => record.month === targetMonth) || [];
      const isUpdate = existingRecords.length > 0;

      toast({
        title: "Berhasil",
        description: isUpdate
          ? `Payroll berhasil diperbarui untuk ${data.length} karyawan untuk ${formatIndonesianMonth(targetMonth)}!`
          : `Payroll berhasil dibuat untuk ${data.length} karyawan untuk ${formatIndonesianMonth(targetMonth)}!`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/payroll"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Gagal",
        description: `Terjadi kesalahan: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const markAsPaidMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("PATCH", `/api/payroll/${id}/pay`);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Berhasil",
        description: "Payroll telah ditandai sebagai dibayar!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/payroll"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Gagal",
        description: `Terjadi kesalahan: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const updatePayrollMutation = useMutation({
    mutationFn: async ({
      id,
      bonuses,
      deductions,
      baseSalary,
      overtimePay,
    }: {
      id: string;
      bonuses?: string;
      deductions?: string;
      baseSalary?: string;
      overtimePay?: string;
    }) => {
      const res = await apiRequest("PATCH", `/api/payroll/${id}`, {
        bonuses,
        deductions,
        baseSalary,
        overtimePay,
      });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Berhasil",
        description: "Payroll berhasil diperbarui!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/payroll"] });
      setEditingField(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Gagal",
        description: `Terjadi kesalahan: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: selectedPayroll
      ? `Payroll-${selectedPayroll.month}-${selectedPayroll.user?.name}`
      : "Payroll",
  });

  const exportToPDF = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text("Laporan Payroll", 14, 22);
    doc.setFontSize(11);
    doc.text(`Periode: ${formatIndonesianMonth(selectedMonth)}`, 14, 30);
    doc.text(`Total: ${formatRupiah(summaryStats.total)}`, 14, 37);
    
    const tableData = filteredRecords.map(record => {
      const totalBonus = record.bonusList?.reduce((sum, b) => sum + b.amount, 0) || 0;
      const totalDeduction = record.deductionList?.reduce((sum, d) => sum + d.amount, 0) || 0;
      
      return [
        record.user?.name || record.userId,
        record.store?.name || '',
        formatRupiah(record.baseSalary),
        formatRupiah(record.overtimePay || "0"),
        formatRupiah(totalBonus),
        formatRupiah(totalDeduction),
        formatRupiah(record.totalAmount),
        record.status === 'paid' ? 'Dibayar' : 'Pending',
      ];
    });

    autoTable(doc, {
      head: [['Karyawan', 'Toko', 'Gaji Pokok', 'Lembur', 'Bonus', 'Potongan', 'Total', 'Status']],
      body: tableData,
      startY: 45,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [59, 130, 246] },
    });

    doc.save(`payroll-${selectedMonth}.pdf`);
    
    toast({
      title: "Berhasil",
      description: "Laporan payroll berhasil diekspor ke PDF!",
    });
  };

  const exportToExcel = () => {
    const headers = ['Karyawan', 'Toko', 'Gaji Pokok', 'Lembur', 'Bonus', 'Potongan', 'Total', 'Status'];
    const data = filteredRecords.map(record => {
      const totalBonus = record.bonusList?.reduce((sum, b) => sum + b.amount, 0) || 0;
      const totalDeduction = record.deductionList?.reduce((sum, d) => sum + d.amount, 0) || 0;
      
      return {
        'Karyawan': record.user?.name || record.userId,
        'Toko': record.store?.name || '',
        'Gaji Pokok': Number(record.baseSalary),
        'Lembur': Number(record.overtimePay || 0),
        'Bonus': totalBonus,
        'Potongan': totalDeduction,
        'Total': Number(record.totalAmount),
        'Status': record.status === 'paid' ? 'Dibayar' : 'Pending',
      };
    });

    const csv = [
      headers.join(','),
      ...data.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `payroll-${selectedMonth}.csv`;
    link.click();
    
    toast({
      title: "Berhasil",
      description: "Laporan payroll berhasil diekspor ke Excel/CSV!",
    });
  };

  const startInlineEdit = (recordId: string, field: string, currentValue: string) => {
    setEditingField({ recordId, field });
    setEditValue(currentValue);
  };

  const cancelInlineEdit = () => {
    setEditingField(null);
    setEditValue("");
  };

  const saveInlineEdit = (record: PayrollWithUser) => {
    if (!editingField) return;
    
    const numericValue = editValue.replace(/[^0-9]/g, '');
    
    if (editingField.field === 'baseSalary') {
      updatePayrollMutation.mutate({
        id: record.id,
        baseSalary: numericValue,
      });
    } else if (editingField.field === 'overtimePay') {
      updatePayrollMutation.mutate({
        id: record.id,
        overtimePay: numericValue,
      });
    }
  };

  const addBonus = (record: PayrollWithUser) => {
    if (!newBonus.name || newBonus.amount <= 0) {
      toast({
        title: "Perhatian",
        description: "Nama bonus dan jumlah harus diisi dengan benar",
        variant: "destructive",
      });
      return;
    }
    const bonuses = record.bonusList || [];
    const updatedBonuses = [...bonuses, newBonus];
    updatePayrollMutation.mutate({
      id: record.id,
      bonuses: JSON.stringify(updatedBonuses),
    });
    setNewBonus({ name: "", amount: 0 });
  };

  const addDeduction = (record: PayrollWithUser) => {
    if (!newDeduction.name || newDeduction.amount <= 0) {
      toast({
        title: "Perhatian",
        description: "Nama potongan dan jumlah harus diisi dengan benar",
        variant: "destructive",
      });
      return;
    }
    const deductions = record.deductionList || [];
    const updatedDeductions = [...deductions, newDeduction];
    updatePayrollMutation.mutate({
      id: record.id,
      deductions: JSON.stringify(updatedDeductions),
    });
    setNewDeduction({ name: "", amount: 0 });
  };

  const confirmDelete = (type: 'bonus' | 'deduction', recordId: string, index: number) => {
    setItemToDelete({ type, recordId, index });
    setDeleteDialogOpen(true);
  };

  const executeDelete = () => {
    if (!itemToDelete) return;
    
    const record = processedRecords.find(r => r.id === itemToDelete.recordId);
    if (!record) return;

    if (itemToDelete.type === 'bonus') {
      const bonuses = record.bonusList || [];
      const updatedBonuses = bonuses.filter((_, index) => index !== itemToDelete.index);
      updatePayrollMutation.mutate({
        id: record.id,
        bonuses: JSON.stringify(updatedBonuses),
      });
    } else {
      const deductions = record.deductionList || [];
      const updatedDeductions = deductions.filter((_, index) => index !== itemToDelete.index);
      updatePayrollMutation.mutate({
        id: record.id,
        deductions: JSON.stringify(updatedDeductions),
      });
    }
    
    setDeleteDialogOpen(false);
    setItemToDelete(null);
    
    toast({
      title: "Berhasil",
      description: `${itemToDelete.type === 'bonus' ? 'Bonus' : 'Potongan'} berhasil dihapus!`,
    });
  };

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8 text-destructive">
            <p className="text-lg font-semibold">Terjadi Kesalahan</p>
            <p className="text-sm mt-2">Gagal memuat data payroll. Silakan coba lagi.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Manajemen Payroll
            </CardTitle>
            <div className="flex items-center gap-2 flex-wrap">
              <Select
                value={generateForMonth}
                onValueChange={setGenerateForMonth}
                data-testid="select-generate-month"
              >
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Pilih bulan" />
                </SelectTrigger>
                <SelectContent>
                  {selectableMonths.map(({ value, label }) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                onClick={() => generatePayrollMutation.mutate(generateForMonth)}
                disabled={generatePayrollMutation.isPending}
                data-testid="button-generate-payroll"
              >
                <DollarSign className="h-4 w-4 mr-2" />
                {generatePayrollMutation.isPending ? "Memproses..." : "Generate Payroll"}
              </Button>
            </div>
          </div>
          
          {/* Summary Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Payroll</p>
                    <p className="text-2xl font-bold" data-testid="text-total-payroll">
                      {formatRupiah(summaryStats.total)}
                    </p>
                  </div>
                  <DollarSign className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Rata-rata Gaji</p>
                    <p className="text-2xl font-bold" data-testid="text-average-salary">
                      {formatRupiah(summaryStats.average)}
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Sudah Dibayar</p>
                    <p className="text-2xl font-bold text-green-600" data-testid="text-paid-count">
                      {summaryStats.paid}
                    </p>
                  </div>
                  <CheckCircle2 className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Pending</p>
                    <p className="text-2xl font-bold text-orange-600" data-testid="text-pending-count">
                      {summaryStats.pending}
                    </p>
                  </div>
                  <FileText className="h-8 w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Date Range Filter */}
          <div className="mt-6 p-4 bg-muted/50 rounded-lg space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4 flex-wrap">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Dari Tanggal</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-[240px] justify-start text-left font-normal",
                          !dateRange.from && "text-muted-foreground"
                        )}
                        data-testid="button-date-from"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateRange.from ? format(dateRange.from, "PPP") : "Pilih tanggal"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={dateRange.from}
                        onSelect={(date) => setDateRange(prev => ({ ...prev, from: date }))}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Sampai Tanggal</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-[240px] justify-start text-left font-normal",
                          !dateRange.to && "text-muted-foreground"
                        )}
                        data-testid="button-date-to"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateRange.to ? format(dateRange.to, "PPP") : "Pilih tanggal"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={dateRange.to}
                        onSelect={(date) => setDateRange(prev => ({ ...prev, to: date }))}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={exportToPDF}
                  data-testid="button-export-pdf"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export PDF
                </Button>
                <Button
                  variant="outline"
                  onClick={exportToExcel}
                  data-testid="button-export-excel"
                >
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Export Excel
                </Button>
              </div>
            </div>
            
            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  Periode
                </Label>
                <Select
                  value={selectedMonth}
                  onValueChange={setSelectedMonth}
                  data-testid="select-filter-month"
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Semua periode" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectableMonths.map(({ value, label }) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Toko
                </Label>
                <Select
                  value={selectedStore}
                  onValueChange={setSelectedStore}
                  data-testid="select-filter-store"
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Semua toko" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Semua toko</SelectItem>
                    {stores?.map((store) => (
                      <SelectItem key={store.id} value={store.id.toString()}>
                        {store.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Karyawan
                </Label>
                <Select
                  value={selectedEmployee}
                  onValueChange={setSelectedEmployee}
                  data-testid="select-filter-employee"
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Semua karyawan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Semua karyawan</SelectItem>
                    {users?.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Search className="h-4 w-4" />
                  Cari Nama
                </Label>
                <Input
                  placeholder="Cari karyawan..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  data-testid="input-search"
                />
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground" data-testid="text-results-count">
                Menampilkan {filteredRecords.length} dari {processedRecords.length} data payroll
              </span>
              <div className="flex items-center gap-2">
                {activeFilterCount > 0 && (
                  <Badge variant="secondary" data-testid="badge-filter-count">
                    {activeFilterCount} filter aktif
                  </Badge>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearFilters}
                  disabled={activeFilterCount === 0}
                  data-testid="button-clear-filters"
                >
                  <X className="h-4 w-4 mr-1" />
                  Hapus Filter
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : filteredRecords && filteredRecords.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Karyawan</TableHead>
                    <TableHead>Bulan</TableHead>
                    <TableHead>Gaji Pokok</TableHead>
                    <TableHead>Lembur</TableHead>
                    <TableHead>Bonus</TableHead>
                    <TableHead>Potongan</TableHead>
                    <TableHead>Total Gaji</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecords.map((record) => {
                    const totalBonus = record.bonusList?.reduce((sum, b) => sum + b.amount, 0) || 0;
                    const totalDeduction = record.deductionList?.reduce((sum, d) => sum + d.amount, 0) || 0;
                    const isEditingBaseSalary = editingField?.recordId === record.id && editingField?.field === 'baseSalary';
                    const isEditingOvertime = editingField?.recordId === record.id && editingField?.field === 'overtimePay';

                    return (
                      <TableRow key={record.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                              <span className="text-sm font-medium text-primary">
                                {(record.user?.name && record.user.name.slice(0, 2).toUpperCase()) || "??"}
                              </span>
                            </div>
                            <div>
                              <div className="font-medium">{record.user?.name || record.userId}</div>
                              <div className="text-sm text-muted-foreground">{record.store?.name}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell data-testid={`text-month-${record.id}`}>
                          {formatIndonesianMonth(record.month)}
                        </TableCell>
                        <TableCell data-testid={`text-base-salary-${record.id}`}>
                          {isEditingBaseSalary ? (
                            <div className="flex items-center gap-2">
                              <Input
                                type="text"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                className="w-32"
                                data-testid={`input-base-salary-${record.id}`}
                              />
                              <Button
                                size="sm"
                                onClick={() => saveInlineEdit(record)}
                                data-testid={`button-save-base-salary-${record.id}`}
                              >
                                <Save className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={cancelInlineEdit}
                                data-testid={`button-cancel-base-salary-${record.id}`}
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span>{formatRupiah(record.baseSalary)}</span>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => startInlineEdit(record.id, 'baseSalary', record.baseSalary)}
                                data-testid={`button-edit-base-salary-${record.id}`}
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </TableCell>
                        <TableCell data-testid={`text-overtime-pay-${record.id}`}>
                          {isEditingOvertime ? (
                            <div className="flex items-center gap-2">
                              <Input
                                type="text"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                className="w-32"
                                data-testid={`input-overtime-pay-${record.id}`}
                              />
                              <Button
                                size="sm"
                                onClick={() => saveInlineEdit(record)}
                                data-testid={`button-save-overtime-${record.id}`}
                              >
                                <Save className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={cancelInlineEdit}
                                data-testid={`button-cancel-overtime-${record.id}`}
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span>{formatRupiah(record.overtimePay || "0")}</span>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => startInlineEdit(record.id, 'overtimePay', record.overtimePay || "0")}
                                data-testid={`button-edit-overtime-${record.id}`}
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </TableCell>
                        <TableCell data-testid={`text-total-bonus-${record.id}`}>
                          <div className="flex items-center gap-2">
                            <span>{formatRupiah(totalBonus)}</span>
                            {record.bonusList && record.bonusList.length > 0 && (
                              <Badge variant="outline" className="text-xs">
                                {record.bonusList.length}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell data-testid={`text-total-deduction-${record.id}`}>
                          <div className="flex items-center gap-2">
                            <span>{formatRupiah(totalDeduction)}</span>
                            {record.deductionList && record.deductionList.length > 0 && (
                              <Badge variant="outline" className="text-xs">
                                {record.deductionList.length}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="font-semibold" data-testid={`text-total-amount-${record.id}`}>
                          {formatRupiah(record.totalAmount)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={record.status === "paid" ? "default" : "secondary"}
                            className={record.status === "paid" ? "bg-green-600" : "bg-orange-500"}
                          >
                            {record.status === "paid" ? "Dibayar" : "Pending"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {record.status === "pending" && (
                              <Button
                                size="sm"
                                onClick={() => markAsPaidMutation.mutate(record.id)}
                                disabled={markAsPaidMutation.isPending}
                                data-testid={`button-mark-paid-${record.id}`}
                              >
                                <CheckCircle2 className="h-4 w-4 mr-1" />
                                Bayar
                              </Button>
                            )}
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setSelectedPayrollId(record.id)}
                                  data-testid={`button-view-details-${record.id}`}
                                >
                                  <FileText className="h-4 w-4 mr-1" />
                                  Detail
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-4xl max-h-[90vh]">
                                <DialogHeader>
                                  <DialogTitle>Detail Payroll - {record.user?.name}</DialogTitle>
                                  <DialogDescription>
                                    Periode: {formatIndonesianMonth(record.month)}
                                  </DialogDescription>
                                </DialogHeader>
                                <ScrollArea className="h-[600px] pr-4">
                                  <div className="space-y-6">
                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <Label>Gaji Pokok</Label>
                                        <p className="text-lg font-semibold">{formatRupiah(record.baseSalary)}</p>
                                      </div>
                                      <div>
                                        <Label>Lembur</Label>
                                        <p className="text-lg font-semibold">{formatRupiah(record.overtimePay || "0")}</p>
                                      </div>
                                    </div>

                                    <div>
                                      <div className="flex items-center justify-between mb-2">
                                        <Label>Bonus</Label>
                                      </div>
                                      <div className="space-y-2">
                                        {record.bonusList?.map((bonus, index) => (
                                          <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                                            <div>
                                              <p className="font-medium">{bonus.name}</p>
                                              <p className="text-sm text-muted-foreground">{formatRupiah(bonus.amount)}</p>
                                            </div>
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              onClick={() => confirmDelete('bonus', record.id, index)}
                                              data-testid={`button-delete-bonus-${record.id}-${index}`}
                                            >
                                              <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                          </div>
                                        ))}
                                        <div className="flex gap-2">
                                          <Input
                                            placeholder="Nama bonus"
                                            value={newBonus.name}
                                            onChange={(e) => setNewBonus({ ...newBonus, name: e.target.value })}
                                            data-testid={`input-bonus-name-${record.id}`}
                                          />
                                          <Input
                                            type="number"
                                            placeholder="Jumlah"
                                            value={newBonus.amount || ""}
                                            onChange={(e) => setNewBonus({ ...newBonus, amount: Number(e.target.value) })}
                                            data-testid={`input-bonus-amount-${record.id}`}
                                          />
                                          <Button onClick={() => addBonus(record)} data-testid={`button-add-bonus-${record.id}`}>
                                            <Plus className="h-4 w-4" />
                                          </Button>
                                        </div>
                                      </div>
                                    </div>

                                    <div>
                                      <div className="flex items-center justify-between mb-2">
                                        <Label>Potongan</Label>
                                      </div>
                                      <div className="space-y-2">
                                        {record.deductionList?.map((deduction, index) => (
                                          <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                                            <div>
                                              <p className="font-medium">{deduction.name}</p>
                                              <p className="text-sm text-muted-foreground">{formatRupiah(deduction.amount)}</p>
                                            </div>
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              onClick={() => confirmDelete('deduction', record.id, index)}
                                              data-testid={`button-delete-deduction-${record.id}-${index}`}
                                            >
                                              <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                          </div>
                                        ))}
                                        <div className="flex gap-2">
                                          <Input
                                            placeholder="Nama potongan"
                                            value={newDeduction.name}
                                            onChange={(e) => setNewDeduction({ ...newDeduction, name: e.target.value })}
                                            data-testid={`input-deduction-name-${record.id}`}
                                          />
                                          <Input
                                            type="number"
                                            placeholder="Jumlah"
                                            value={newDeduction.amount || ""}
                                            onChange={(e) => setNewDeduction({ ...newDeduction, amount: Number(e.target.value) })}
                                            data-testid={`input-deduction-amount-${record.id}`}
                                          />
                                          <Button onClick={() => addDeduction(record)} data-testid={`button-add-deduction-${record.id}`}>
                                            <Plus className="h-4 w-4" />
                                          </Button>
                                        </div>
                                      </div>
                                    </div>

                                    <div className="pt-4 border-t">
                                      <div className="flex items-center justify-between">
                                        <Label className="text-lg">Total Gaji</Label>
                                        <p className="text-2xl font-bold">{formatRupiah(record.totalAmount)}</p>
                                      </div>
                                    </div>
                                  </div>
                                </ScrollArea>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-semibold">Belum Ada Data Payroll</p>
              <p className="text-sm text-muted-foreground mt-2">
                Klik "Generate Payroll" untuk membuat data payroll baru
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Hapus</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus {itemToDelete?.type === 'bonus' ? 'bonus' : 'potongan'} ini?
              Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={executeDelete} className="bg-destructive text-destructive-foreground">
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
