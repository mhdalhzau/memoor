import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useMemo, useCallback } from "react";
import { useAuth } from "@/hooks/use-auth";
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
import { Checkbox } from "@/components/ui/checkbox";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  formatRupiah, 
  formatIndonesianMonth, 
  formatIndonesianDate,
  formatTime,
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
  Clock,
  CheckSquare,
  AlertTriangle,
  UserCheck,
} from "lucide-react";
import { useReactToPrint } from "react-to-print";
import { useRef } from "react";
import { format, startOfMonth, endOfMonth, addDays, subDays, isWithinInterval, addMonths, subMonths } from "date-fns";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { SalarySlip } from "./salary-slip";

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

interface AttendanceRecord {
  id: string;
  date: string;
  checkIn?: string;
  checkOut?: string;
  shift?: string;
  latenessMinutes?: number;
  overtimeMinutes?: number;
  workingHours?: number;
  attendanceStatus?: string;
  status?: string;
  notes?: string;
}

type SortField = 'date' | 'checkIn' | 'checkOut' | 'workingHours' | 'overtimeMinutes' | 'attendanceStatus';
type SortDirection = 'asc' | 'desc';

interface DateRangePreset {
  label: string;
  range: DateRange;
  value: string;
}

type DateFilterMode = 'month' | 'range';

// Simple Attendance Table Component
interface AttendanceTableProps {
  employeeId?: string;
  month?: string;
}

function AttendanceTable({ employeeId, month }: AttendanceTableProps) {
  if (!employeeId || !month) {
    return (
      <div className="pt-6 border-t">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="h-5 w-5" />
          <Label className="text-lg">Rekap Absensi</Label>
        </div>
        <div className="text-center py-8 text-muted-foreground">
          <p className="text-sm">Data absensi tidak tersedia</p>
        </div>
      </div>
    );
  }

  // Parse month (e.g. "2025-09") into year and month
  // Add comprehensive null/undefined/invalid checks
  if (!month || 
      typeof month !== 'string' || 
      month.trim() === '' ||
      !month.includes('-') ||
      month === 'null' ||
      month === 'undefined') {
    console.warn('Invalid month format in AttendanceTable:', month);
    return (
      <div className="pt-6 border-t">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="h-5 w-5" />
          <Label className="text-lg">Rekap Absensi</Label>
        </div>
        <div className="text-center py-8 text-muted-foreground">
          <p className="text-sm">Format bulan tidak valid</p>
        </div>
      </div>
    );
  }

  let year: number;
  let monthNum: number;

  try {
    const parts = month.split('-');
    if (parts.length !== 2) {
      console.warn('AttendanceTable: Month split resulted in unexpected parts:', parts, 'Original:', month);
      return (
        <div className="pt-6 border-t">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="h-5 w-5" />
            <Label className="text-lg">Rekap Absensi</Label>
          </div>
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">Format bulan tidak valid</p>
          </div>
        </div>
      );
    }
    
    const [yearStr, monthStr] = parts;
    
    if (!yearStr || !monthStr) {
      console.warn('AttendanceTable: Empty year or month string after split:', { yearStr, monthStr, originalMonth: month });
      return (
        <div className="pt-6 border-t">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="h-5 w-5" />
            <Label className="text-lg">Rekap Absensi</Label>
          </div>
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">Data tanggal tidak valid</p>
          </div>
        </div>
      );
    }
    
    year = parseInt(yearStr);
    monthNum = parseInt(monthStr);
    
    // Validate parsed values
    if (isNaN(year) || isNaN(monthNum) || monthNum < 1 || monthNum > 12 || year < 2020 || year > 2030) {
      console.warn('AttendanceTable: Invalid year or month values:', { year, monthNum, originalMonth: month });
      return (
        <div className="pt-6 border-t">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="h-5 w-5" />
            <Label className="text-lg">Rekap Absensi</Label>
          </div>
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">Data tanggal tidak valid</p>
          </div>
        </div>
      );
    }
  } catch (error) {
    console.error('AttendanceTable: Error processing month:', error, 'Month:', month);
    return (
      <div className="pt-6 border-t">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="h-5 w-5" />
          <Label className="text-lg">Rekap Absensi</Label>
        </div>
        <div className="text-center py-8 text-muted-foreground">
          <p className="text-sm">Terjadi kesalahan saat memproses data bulan</p>
        </div>
      </div>
    );
  }

  const { data: attendanceData, isLoading } = useQuery<{
    employee: any;
    attendanceData: AttendanceRecord[];
  }>({
    queryKey: [`/api/employees/${employeeId}/attendance/${year}/${monthNum}`],
    enabled: !!employeeId && !!year && !!monthNum,
  });

  const formatAttendanceStatus = (status: string) => {
    switch (status) {
      case 'hadir': return 'Hadir';
      case 'cuti': return 'Cuti';
      case 'alpha': return 'Alpha';
      case 'belum_diatur': return 'Belum Diatur';
      default: return status || '-';
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'hadir': return 'bg-green-100 text-green-800';
      case 'cuti': return 'bg-blue-100 text-blue-800';
      case 'alpha': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <div className="pt-6 border-t">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="h-5 w-5" />
        <Label className="text-lg">Rekap Absensi</Label>
        <Badge variant="outline" className="text-xs">
          {formatIndonesianMonth(month)}
        </Badge>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Tanggal</TableHead>
                <TableHead className="w-[80px]">Masuk</TableHead>
                <TableHead className="w-[80px]">Keluar</TableHead>
                <TableHead className="w-[100px]">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {attendanceData?.attendanceData?.length ? (
                attendanceData.attendanceData.map((record, index) => (
                  <TableRow key={index} data-testid={`row-attendance-${index}`}>
                    <TableCell className="font-medium" data-testid={`text-date-${index}`}>
                      {formatIndonesianDate(record.date)}
                    </TableCell>
                    <TableCell data-testid={`text-checkin-${index}`}>
                      {record.checkIn ? formatTime(record.checkIn) : '-'}
                    </TableCell>
                    <TableCell data-testid={`text-checkout-${index}`}>
                      {record.checkOut ? formatTime(record.checkOut) : '-'}
                    </TableCell>
                    <TableCell data-testid={`text-status-${index}`}>
                      <Badge 
                        variant="outline" 
                        className={cn("text-xs", getStatusBadgeColor(record.attendanceStatus || record.status || ''))}
                      >
                        {formatAttendanceStatus(record.attendanceStatus || record.status || '')}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Belum ada data absensi untuk bulan ini</p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

export default function PayrollContent() {
  const { user } = useAuth();
  const { toast } = useToast();
  const printRef = useRef<HTMLDivElement>(null);
  const detailPrintRef = useRef<HTMLDivElement>(null);
  const salarySlipRef = useRef<HTMLDivElement>(null);
  const [selectedPayrollId, setSelectedPayrollId] = useState<string | null>(null);
  const [attendanceDialogOpen, setAttendanceDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ type: 'bonus' | 'deduction', recordId: string, index: number } | null>(null);
  
  // Date range filter state
  const [dateFilterMode, setDateFilterMode] = useState<DateFilterMode>('month');
  const [dateRange, setDateRange] = useState<DateRange>({
    from: undefined,
    to: undefined,
  });
  const [selectedPreset, setSelectedPreset] = useState<string>('this-month');
  const [showDateRangePicker, setShowDateRangePicker] = useState(false);
  
  // Filtering state
  const [selectedMonth, setSelectedMonth] = useState<string>(getCurrentMonth());
  const [selectedStore, setSelectedStore] = useState<string>("");
  const [selectedEmployee, setSelectedEmployee] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [generateForMonth, setGenerateForMonth] = useState<string>(getCurrentMonth());
  
  // Bulk editing state
  const [selectedRecords, setSelectedRecords] = useState<Set<string>>(new Set());
  const [bulkEditMode, setBulkEditMode] = useState(false);
  const [bulkEditValues, setBulkEditValues] = useState({
    baseSalary: '',
    overtimePay: '',
    bonus: { name: '', amount: 0 },
    deduction: { name: '', amount: 0 }
  });
  
  
  // Inline editing state
  const [editingField, setEditingField] = useState<{ recordId: string; field: string } | null>(null);
  const [editValue, setEditValue] = useState<string>("");
  const [newBonus, setNewBonus] = useState({ name: "", amount: 0 });
  const [newDeduction, setNewDeduction] = useState({ name: "", amount: 0 });
  
  const selectableMonths = useMemo(() => getSelectableMonths(), []);

  // Date range presets
  const dateRangePresets = useMemo((): DateRangePreset[] => {
    const now = new Date();
    const thisMonthStart = startOfMonth(now);
    const thisMonthEnd = endOfMonth(now);
    const lastMonthStart = startOfMonth(subMonths(now, 1));
    const lastMonthEnd = endOfMonth(subMonths(now, 1));
    const threeMonthsAgoStart = startOfMonth(subMonths(now, 2));
    
    return [
      {
        label: 'Bulan Ini',
        value: 'this-month',
        range: { from: thisMonthStart, to: thisMonthEnd }
      },
      {
        label: 'Bulan Lalu',
        value: 'last-month', 
        range: { from: lastMonthStart, to: lastMonthEnd }
      },
      {
        label: '3 Bulan Terakhir',
        value: 'last-3-months',
        range: { from: threeMonthsAgoStart, to: thisMonthEnd }
      },
      {
        label: 'Rentang Kustom',
        value: 'custom',
        range: { from: undefined, to: undefined }
      }
    ];
  }, []);

  // Helper function to validate date range
  const validateDateRange = useCallback((from: Date | undefined, to: Date | undefined): { isValid: boolean; error?: string } => {
    if (!from || !to) {
      return { isValid: false, error: 'Kedua tanggal harus dipilih' };
    }
    
    if (from > to) {
      return { isValid: false, error: 'Tanggal mulai tidak boleh lebih besar dari tanggal akhir' };
    }
    
    const diffInMonths = (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth());
    if (diffInMonths > 12) {
      return { isValid: false, error: 'Rentang tanggal tidak boleh lebih dari 12 bulan' };
    }
    
    const now = new Date();
    if (from > now) {
      return { isValid: false, error: 'Tanggal mulai tidak boleh di masa depan' };
    }
    
    return { isValid: true };
  }, []);

  // Helper function to apply date range preset
  const applyDateRangePreset = useCallback((presetValue: string) => {
    const preset = dateRangePresets.find(p => p.value === presetValue);
    if (preset) {
      setSelectedPreset(presetValue);
      if (presetValue === 'custom') {
        setShowDateRangePicker(true);
        // Keep existing custom range if valid
        if (dateRange.from && dateRange.to) {
          const validation = validateDateRange(dateRange.from, dateRange.to);
          if (!validation.isValid) {
            setDateRange({ from: undefined, to: undefined });
          }
        }
      } else {
        const validation = validateDateRange(preset.range.from, preset.range.to);
        if (validation.isValid) {
          setDateRange(preset.range);
          setShowDateRangePicker(false);
          // Switch to range mode when using presets
          setDateFilterMode('range');
          // Clear month filter when using date range
          setSelectedMonth('');
        } else {
          toast({
            title: "Error",
            description: validation.error || "Rentang tanggal tidak valid",
            variant: "destructive",
          });
        }
      }
    }
  }, [dateRangePresets, dateRange, validateDateRange, toast]);

  // Helper function to format date range display
  const formatDateRangeDisplay = useCallback(() => {
    if (dateFilterMode === 'month' && selectedMonth) {
      return formatIndonesianMonth(selectedMonth);
    }
    
    if (dateFilterMode === 'range' && dateRange.from && dateRange.to) {
      const preset = dateRangePresets.find(p => 
        p.range.from?.getTime() === dateRange.from?.getTime() && 
        p.range.to?.getTime() === dateRange.to?.getTime()
      );
      
      if (preset) {
        return preset.label;
      }
      
      return `${format(dateRange.from, 'dd MMM yyyy')} - ${format(dateRange.to, 'dd MMM yyyy')}`;
    }
    
    return 'Pilih periode';
  }, [dateFilterMode, selectedMonth, dateRange, dateRangePresets]);

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
      let bonusList: Array<{ name: string; amount: number }> = [];
      let deductionList: Array<{ name: string; amount: number }> = [];

      try {
        if (record.bonuses && typeof record.bonuses === 'string' && record.bonuses.trim()) {
          const parsed = JSON.parse(record.bonuses);
          bonusList = Array.isArray(parsed) ? parsed : [];
        }
      } catch (e) {
        console.warn("Failed to parse bonuses for record", record.id, ":", e);
        bonusList = [];
      }

      try {
        if (record.deductions && typeof record.deductions === 'string' && record.deductions.trim()) {
          const parsed = JSON.parse(record.deductions);
          deductionList = Array.isArray(parsed) ? parsed : [];
        }
      } catch (e) {
        console.warn("Failed to parse deductions for record", record.id, ":", e);
        deductionList = [];
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
    
    // Apply date filtering based on mode
    if (dateFilterMode === 'month' && selectedMonth) {
      filtered = filtered.filter(record => record.month === selectedMonth);
    } else if (dateFilterMode === 'range' && dateRange.from && dateRange.to) {
      filtered = filtered.filter(record => {
        // Parse the record month (e.g., "2025-09" -> September 2025)
        // Add comprehensive null/undefined/invalid checks
        if (!record?.month || 
            typeof record.month !== 'string' || 
            record.month.trim() === '' ||
            !record.month.includes('-') ||
            record.month === 'null' ||
            record.month === 'undefined') {
          console.warn('Invalid month format in payroll record:', record.month, 'Record ID:', record.id);
          return false; // Exclude records with invalid month data
        }
        
        try {
          const parts = record.month.split('-');
          if (parts.length !== 2) {
            console.warn('Month split resulted in unexpected parts:', parts, 'Original:', record.month);
            return false;
          }
          
          const [yearStr, monthStr] = parts;
          
          if (!yearStr || !monthStr) {
            console.warn('Empty year or month string after split:', { yearStr, monthStr, originalMonth: record.month });
            return false;
          }
          
          const year = parseInt(yearStr);
          const month = parseInt(monthStr) - 1; // JavaScript months are 0-indexed
          
          // Validate parsed values
          if (isNaN(year) || isNaN(month) || month < 0 || month > 11 || year < 2020 || year > 2030) {
            console.warn('Invalid year or month values in payroll record:', { year, month: month + 1, originalMonth: record.month, recordId: record.id });
            return false; // Exclude records with invalid date values
          }
          
          // Get the start and end of the record's month
          const recordMonthStart = startOfMonth(new Date(year, month));
          const recordMonthEnd = endOfMonth(new Date(year, month));
          
          // Check for overlap: startOfMonth(recordMonth) <= to && endOfMonth(recordMonth) >= from
          return recordMonthStart <= dateRange.to! && recordMonthEnd >= dateRange.from!;
        } catch (error) {
          console.error('Error processing record month:', error, 'Record:', record);
          return false; // Exclude records that cause errors
        }
      });
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
    
    return filtered;
  }, [processedRecords, dateFilterMode, selectedMonth, dateRange, selectedStore, selectedEmployee, searchQuery]);

  const summaryStats = useMemo(() => {
    const total = filteredRecords.reduce((sum, record) => {
      const amount = Number(record.totalAmount);
      return sum + (isNaN(amount) ? 0 : amount);
    }, 0);
    const average = filteredRecords.length > 0 ? total / filteredRecords.length : 0;
    const paid = filteredRecords.filter(r => r.status === 'paid').length;
    const pending = filteredRecords.filter(r => r.status === 'pending').length;
    
    return { total, average, paid, pending, count: filteredRecords.length };
  }, [filteredRecords]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    
    // Count date filter
    if (dateFilterMode === 'month' && selectedMonth && selectedMonth !== getCurrentMonth()) {
      count++;
    } else if (dateFilterMode === 'range' && dateRange.from && dateRange.to) {
      count++;
    }
    
    if (selectedStore) count++;
    if (selectedEmployee) count++;
    if (searchQuery) count++;
    return count;
  }, [dateFilterMode, selectedMonth, dateRange, selectedStore, selectedEmployee, searchQuery]);

  const clearFilters = () => {
    setDateFilterMode('month');
    setSelectedMonth(getCurrentMonth());
    setSelectedStore("");
    setSelectedEmployee("");
    setSearchQuery("");
    setDateRange({
      from: undefined,
      to: undefined,
    });
    setSelectedPreset('this-month');
    setShowDateRangePicker(false);
  };

  const selectedPayroll = useMemo(() => {
    return selectedPayrollId
      ? processedRecords.find((record) => record.id === selectedPayrollId) || null
      : null;
  }, [processedRecords, selectedPayrollId]);

  // Query attendance data for selected payroll
  const { data: attendanceData } = useQuery<{
    employee: any;
    attendanceData: AttendanceRecord[];
  }>({
    queryKey: [`/api/employees/${selectedPayroll?.userId}/attendance/${selectedPayroll?.month ? selectedPayroll.month.split('-')[0] : ''}/${selectedPayroll?.month ? selectedPayroll.month.split('-')[1] : ''}`],
    enabled: !!selectedPayroll?.userId && !!selectedPayroll?.month,
  });


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

  const handlePrintDetail = useReactToPrint({
    content: () => detailPrintRef.current,
    documentTitle: selectedPayroll
      ? `Detail-Payroll-${selectedPayroll.month}-${selectedPayroll.user?.name}`
      : "Detail-Payroll",
  });

  const handlePrintSalarySlip = useReactToPrint({
    content: () => salarySlipRef.current,
    documentTitle: selectedPayroll
      ? `Slip-Gaji-${selectedPayroll.month}-${selectedPayroll.user?.name}`
      : "Slip-Gaji",
  });

  const syncToGSheetsMutation = useMutation({
    mutationFn: async () => {
      if (!selectedPayroll) throw new Error('No payroll selected');
      const response = await apiRequest('POST', '/api/google-sheets/sync-payroll', {
        payrollId: selectedPayroll.id,
        employeeId: selectedPayroll.userId,
        employeeName: selectedPayroll.user?.name,
        month: selectedPayroll.month,
        baseSalary: selectedPayroll.baseSalary,
        overtimePay: selectedPayroll.overtimePay,
        bonuses: selectedPayroll.bonusList,
        deductions: selectedPayroll.deductionList,
        totalAmount: selectedPayroll.totalAmount,
        status: selectedPayroll.status,
      });
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Berhasil Sync ke Google Sheets",
        description: data.message || "Data payroll berhasil disinkronkan",
        variant: "default"
      });
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message || error?.message || "Gagal sync ke Google Sheets";
      toast({
        title: "Error Sync",
        description: errorMessage,
        variant: "destructive"
      });
    }
  });

  const exportToPDF = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text("Laporan Payroll", 14, 22);
    doc.setFontSize(11);
    doc.text(`Periode: ${formatDateRangeDisplay()}`, 14, 30);
    doc.text(`Total: ${formatRupiah(summaryStats.total)}`, 14, 37);
    
    const tableData = filteredRecords.map(record => {
      const totalBonus = Array.isArray(record.bonusList) 
        ? record.bonusList.reduce((sum, b) => sum + (Number(b.amount) || 0), 0) 
        : 0;
      const totalDeduction = Array.isArray(record.deductionList) 
        ? record.deductionList.reduce((sum, d) => sum + (Number(d.amount) || 0), 0) 
        : 0;
      
      return [
        record.user?.name || record.userId || '-',
        record.store?.name || '-',
        formatRupiah(record.baseSalary || "0"),
        formatRupiah(record.overtimePay || "0"),
        formatRupiah(totalBonus),
        formatRupiah(totalDeduction),
        formatRupiah(record.totalAmount || "0"),
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

    const fileName = dateFilterMode === 'month' && selectedMonth 
      ? `payroll-${selectedMonth}.pdf`
      : `payroll-${format(new Date(), 'yyyy-MM-dd')}.pdf`;
    doc.save(fileName);
    
    toast({
      title: "Berhasil",
      description: "Laporan payroll berhasil diekspor ke PDF!",
    });
  };

  const exportToExcel = () => {
    const headers = ['Karyawan', 'Toko', 'Gaji Pokok', 'Lembur', 'Bonus', 'Potongan', 'Total', 'Status'];
    const data = filteredRecords.map(record => {
      const totalBonus = Array.isArray(record.bonusList) 
        ? record.bonusList.reduce((sum, b) => sum + (Number(b.amount) || 0), 0) 
        : 0;
      const totalDeduction = Array.isArray(record.deductionList) 
        ? record.deductionList.reduce((sum, d) => sum + (Number(d.amount) || 0), 0) 
        : 0;
      
      return {
        'Karyawan': record.user?.name || record.userId || '-',
        'Toko': record.store?.name || '-',
        'Gaji Pokok': Number(record.baseSalary) || 0,
        'Lembur': Number(record.overtimePay) || 0,
        'Bonus': totalBonus,
        'Potongan': totalDeduction,
        'Total': Number(record.totalAmount) || 0,
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
    const fileName = dateFilterMode === 'month' && selectedMonth 
      ? `payroll-${selectedMonth}.csv`
      : `payroll-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.download = fileName;
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
    if (!newBonus.name?.trim() || newBonus.amount <= 0) {
      toast({
        title: "Perhatian",
        description: "Nama bonus dan jumlah harus diisi dengan benar",
        variant: "destructive",
      });
      return;
    }
    const bonuses = Array.isArray(record.bonusList) ? record.bonusList : [];
    const updatedBonuses = [...bonuses, { name: newBonus.name.trim(), amount: Number(newBonus.amount) }];
    updatePayrollMutation.mutate({
      id: record.id,
      bonuses: JSON.stringify(updatedBonuses),
    });
    setNewBonus({ name: "", amount: 0 });
  };

  const addDeduction = (record: PayrollWithUser) => {
    if (!newDeduction.name?.trim() || newDeduction.amount <= 0) {
      toast({
        title: "Perhatian",
        description: "Nama potongan dan jumlah harus diisi dengan benar",
        variant: "destructive",
      });
      return;
    }
    const deductions = Array.isArray(record.deductionList) ? record.deductionList : [];
    const updatedDeductions = [...deductions, { name: newDeduction.name.trim(), amount: Number(newDeduction.amount) }];
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
    if (!record) {
      toast({
        title: "Error",
        description: "Record tidak ditemukan",
        variant: "destructive",
      });
      return;
    }

    if (itemToDelete.type === 'bonus') {
      const bonuses = Array.isArray(record.bonusList) ? record.bonusList : [];
      const updatedBonuses = bonuses.filter((_, index) => index !== itemToDelete.index);
      updatePayrollMutation.mutate({
        id: record.id,
        bonuses: JSON.stringify(updatedBonuses),
      });
    } else {
      const deductions = Array.isArray(record.deductionList) ? record.deductionList : [];
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
            <Card className="stat-card shadow-card border-l-4 border-l-blue-500 overflow-hidden stagger-item">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-muted-foreground mb-1">Total Payroll</p>
                    <p className="text-2xl font-bold count-up" data-testid="text-total-payroll">
                      {formatRupiah(summaryStats.total)}
                    </p>
                  </div>
                  <div className="stat-icon bg-gradient-to-br from-blue-400 to-blue-600 p-3 rounded-xl shadow-md">
                    <DollarSign className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="stat-card shadow-card border-l-4 border-l-purple-500 overflow-hidden stagger-item">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-muted-foreground mb-1">Rata-rata Gaji</p>
                    <p className="text-2xl font-bold count-up" data-testid="text-average-salary">
                      {formatRupiah(summaryStats.average)}
                    </p>
                  </div>
                  <div className="stat-icon bg-gradient-to-br from-purple-400 to-purple-600 p-3 rounded-xl shadow-md">
                    <TrendingUp className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="stat-card shadow-card border-l-4 border-l-green-500 overflow-hidden stagger-item">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-muted-foreground mb-1">Sudah Dibayar</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400 count-up" data-testid="text-paid-count">
                      {summaryStats.paid}
                    </p>
                  </div>
                  <div className="stat-icon bg-gradient-to-br from-green-400 to-green-600 p-3 rounded-xl shadow-md">
                    <CheckCircle2 className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="stat-card shadow-card border-l-4 border-l-orange-500 overflow-hidden stagger-item">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-muted-foreground mb-1">Pending</p>
                    <p className="text-2xl font-bold text-orange-600 dark:text-orange-400 count-up" data-testid="text-pending-count">
                      {summaryStats.pending}
                    </p>
                  </div>
                  <div className="stat-icon bg-gradient-to-br from-orange-400 to-orange-600 p-3 rounded-xl shadow-md">
                    <FileText className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Advanced Date Range Filter */}
          <div className="mt-6 p-4 bg-muted/50 rounded-lg space-y-4">
            {/* Date Range Selection Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Filter & Export
                </h3>
                <Badge variant="outline" className="text-sm" data-testid="badge-current-period">
                  {formatDateRangeDisplay()}
                </Badge>
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

            {/* Date Range Mode Toggle */}
            <div className="flex items-center gap-4 p-3 bg-background rounded-lg border">
              <Label className="text-sm font-medium">Mode Filter:</Label>
              <div className="flex items-center gap-2">
                <Button
                  variant={dateFilterMode === 'month' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setDateFilterMode('month');
                    setSelectedMonth(getCurrentMonth());
                    setDateRange({ from: undefined, to: undefined });
                  }}
                  data-testid="button-mode-month"
                >
                  <CalendarIcon className="h-4 w-4 mr-1" />
                  Basic (Bulan)
                </Button>
                <Button
                  variant={dateFilterMode === 'range' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setDateFilterMode('range');
                    setSelectedMonth('');
                    applyDateRangePreset('this-month');
                  }}
                  data-testid="button-mode-range"
                >
                  <CalendarIcon className="h-4 w-4 mr-1" />
                  Advanced (Rentang)
                </Button>
              </div>
            </div>

            {/* Date Range Presets (visible in range mode) */}
            {dateFilterMode === 'range' && (
              <div className="p-3 bg-background rounded-lg border">
                <Label className="text-sm font-medium mb-3 block">Pilih Periode Cepat:</Label>
                <div className="flex flex-wrap gap-2">
                  {dateRangePresets.map((preset) => (
                    <Button
                      key={preset.value}
                      variant={selectedPreset === preset.value ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => applyDateRangePreset(preset.value)}
                      data-testid={`button-preset-${preset.value}`}
                    >
                      {preset.label}
                    </Button>
                  ))}
                </div>
                
                {/* Custom Date Range Picker */}
                {selectedPreset === 'custom' && (
                  <div className="mt-4 flex items-center gap-4 flex-wrap">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Dari Tanggal</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-[200px] justify-start text-left font-normal",
                              !dateRange.from && "text-muted-foreground"
                            )}
                            data-testid="button-custom-date-from"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {dateRange.from ? format(dateRange.from, "dd/MM/yyyy") : "Pilih tanggal"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={dateRange.from}
                            onSelect={(date) => {
                              setDateRange(prev => ({ ...prev, from: date }));
                              if (date && dateRange.to) {
                                const validation = validateDateRange(date, dateRange.to);
                                if (validation.isValid) {
                                  setDateFilterMode('range');
                                } else {
                                  toast({
                                    title: "Rentang Tanggal Tidak Valid",
                                    description: validation.error,
                                    variant: "destructive",
                                  });
                                }
                              }
                            }}
                            disabled={(date) => date > new Date() || date < new Date("2020-01-01")}
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
                              "w-[200px] justify-start text-left font-normal",
                              !dateRange.to && "text-muted-foreground"
                            )}
                            data-testid="button-custom-date-to"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {dateRange.to ? format(dateRange.to, "dd/MM/yyyy") : "Pilih tanggal"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={dateRange.to}
                            onSelect={(date) => {
                              setDateRange(prev => ({ ...prev, to: date }));
                              if (date && dateRange.from) {
                                const validation = validateDateRange(dateRange.from, date);
                                if (validation.isValid) {
                                  setDateFilterMode('range');
                                } else {
                                  toast({
                                    title: "Rentang Tanggal Tidak Valid",
                                    description: validation.error,
                                    variant: "destructive",
                                  });
                                }
                              }
                            }}
                            disabled={(date) => 
                              date > new Date() || 
                              date < new Date("2020-01-01") ||
                              (dateRange.from && date < dateRange.from)
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* Other Filters */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Month Selector (visible in basic mode) */}
              {dateFilterMode === 'month' && (
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
              )}
              
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
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <DialogTitle>Detail Payroll - {record.user?.name}</DialogTitle>
                                      <DialogDescription>
                                        Periode: {formatIndonesianMonth(record.month)}
                                      </DialogDescription>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handlePrintDetail}
                                        data-testid={`button-print-detail-${record.id}`}
                                      >
                                        <Printer className="h-4 w-4 mr-1" />
                                        Print Detail
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handlePrintSalarySlip}
                                        data-testid={`button-print-salary-slip-${record.id}`}
                                      >
                                        <FileText className="h-4 w-4 mr-1" />
                                        Slip Gaji
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => syncToGSheetsMutation.mutate()}
                                        disabled={syncToGSheetsMutation.isPending}
                                        data-testid={`button-sync-gsheets-${record.id}`}
                                      >
                                        <FileSpreadsheet className="h-4 w-4 mr-1" />
                                        {syncToGSheetsMutation.isPending ? 'Syncing...' : 'Sync GSheet'}
                                      </Button>
                                    </div>
                                  </div>
                                </DialogHeader>
                                <div className="h-[600px]" ref={detailPrintRef}>
                                  <ScrollArea className="h-[580px] pr-4">
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

                                          {/* Simple Attendance Table */}
                                          <AttendanceTable 
                                            employeeId={selectedPayroll?.userId}
                                            month={selectedPayroll?.month}
                                          />
                                        </div>
                                      </ScrollArea>
                                </div>
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
