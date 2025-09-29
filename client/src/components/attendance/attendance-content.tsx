import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { type User, type Attendance, type Store, type ShiftSchedule } from "@shared/schema";
import { 
  UserCheck, 
  ChevronLeft, 
  Save, 
  Download, 
  RotateCcw, 
  Edit2, 
  Search, 
  Filter, 
  Calendar as CalendarIcon,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  TrendingUp,
  Users,
  FileText
} from "lucide-react";
import { detectShift, calculateLateness, calculateOvertime, calculateEarlyArrival, SHIFT_SCHEDULES, getStoreShifts } from "@shared/attendance-utils";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, startOfDay, endOfDay, parseISO } from "date-fns";
import { id as localeId } from "date-fns/locale";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// Types untuk attendance record
interface AttendanceRecord {
  id?: string;
  date: string;
  day: string;
  shift: string;
  checkIn: string;
  checkOut: string;
  latenessMinutes: number;
  overtimeMinutes: number;
  earlyArrivalMinutes: number;
  attendanceStatus: string;
  notes: string;
  status: string;
}

// Date range preset type
type DateRangePreset = "today" | "week" | "month" | "custom";

export default function AttendanceContent() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [view, setView] = useState("list");
  const [currentEmp, setCurrentEmp] = useState<User | null>(null);
  
  // Date range state
  const [dateFrom, setDateFrom] = useState<Date>(startOfMonth(new Date()));
  const [dateTo, setDateTo] = useState<Date>(endOfMonth(new Date()));
  const [dateRangePreset, setDateRangePreset] = useState<DateRangePreset>("month");
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [shiftFilter, setShiftFilter] = useState<string>("semua_shift");
  const [statusFilter, setStatusFilter] = useState<string>("semua_status");
  const [storeFilter, setStoreFilter] = useState<string>("semua_toko");
  
  const [rows, setRows] = useState<AttendanceRecord[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);

  // Check user permissions - only finance and manager can edit
  const canEdit = user?.role === 'manager' || user?.role === 'administrasi';

  // Get all employees for the list
  const { data: employees, isLoading: isLoadingEmployees } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  // Get all stores for shift information
  const { data: stores } = useQuery<Store[]>({
    queryKey: ["/api/stores"],
  });

  // Get attendance data for selected employee and date range
  const { data: attendanceData, isLoading: isLoadingAttendance, refetch: refetchAttendance } = useQuery<Attendance[]>({
    queryKey: ["/api/attendance/user", currentEmp?.id, { 
      dateFrom: format(dateFrom, 'yyyy-MM-dd'),
      dateTo: format(dateTo, 'yyyy-MM-dd')
    }],
    enabled: !!currentEmp?.id,
  });

  // Save attendance mutation
  const saveAttendanceMutation = useMutation({
    mutationFn: async (data: { attendanceRecords: AttendanceRecord[] }) => {
      const promises = data.attendanceRecords.map(async (record) => {
        if (record.id) {
          return apiRequest("PUT", `/api/attendance/${record.id}`, {
            checkIn: record.checkIn,
            checkOut: record.checkOut,
            shift: record.shift,
            latenessMinutes: record.latenessMinutes,
            overtimeMinutes: record.overtimeMinutes,
            earlyArrivalMinutes: record.earlyArrivalMinutes,
            attendanceStatus: record.attendanceStatus,
            notes: record.notes,
          });
        } else {
          return apiRequest("POST", "/api/attendance", {
            userId: currentEmp?.id,
            storeId: currentEmp?.stores?.[0]?.id ?? currentEmp?.storeId ?? user?.storeId ?? 1,
            date: record.date,
            checkIn: record.checkIn,
            checkOut: record.checkOut,
            shift: record.shift,
            latenessMinutes: record.latenessMinutes,
            overtimeMinutes: record.overtimeMinutes,
            earlyArrivalMinutes: record.earlyArrivalMinutes,
            attendanceStatus: record.attendanceStatus,
            notes: record.notes,
          });
        }
      });
      await Promise.all(promises);
    },
    onSuccess: () => {
      toast({
        title: "✅ Berhasil",
        description: "Data absensi berhasil disimpan!",
      });
      setHasChanges(false);
      setSaveDialogOpen(false);
      refetchAttendance();
      queryClient.invalidateQueries({ queryKey: ["/api/attendance"] });
    },
    onError: (error: any) => {
      toast({
        title: "❌ Error",
        description: error.message || "Gagal menyimpan data absensi",
        variant: "destructive",
      });
    },
  });

  // Quick date range presets
  const setDateRangePresetHandler = (preset: DateRangePreset) => {
    const now = new Date();
    setDateRangePreset(preset);
    
    switch (preset) {
      case "today":
        setDateFrom(startOfDay(now));
        setDateTo(endOfDay(now));
        break;
      case "week":
        setDateFrom(startOfWeek(now, { weekStartsOn: 1 }));
        setDateTo(endOfWeek(now, { weekStartsOn: 1 }));
        break;
      case "month":
        setDateFrom(startOfMonth(now));
        setDateTo(endOfMonth(now));
        break;
      default:
        break;
    }
  };

  // Helper functions
  const daysInRange = (start: Date, end: Date): number => {
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  };
  
  const dayName = (date: Date) =>
    format(date, "EEEE", { locale: localeId });

  // Load attendance data for employee within date range
  const loadAttendanceData = (emp: User) => {
    if (!emp) return;
    
    const days = daysInRange(dateFrom, dateTo);
    const monthData: AttendanceRecord[] = [];
    
    for (let i = 0; i < days; i++) {
      const currentDate = new Date(dateFrom);
      currentDate.setDate(currentDate.getDate() + i);
      const dateStr = format(currentDate, 'yyyy-MM-dd');
      
      const existingAttendance = attendanceData?.find(att => {
        const attDate = new Date(att.date || "").toISOString().split('T')[0];
        return attDate === dateStr;
      });

      monthData.push({
        id: existingAttendance?.id,
        date: dateStr,
        day: dayName(currentDate),
        shift: existingAttendance?.shift || "pagi",
        checkIn: existingAttendance?.checkIn || "",
        checkOut: existingAttendance?.checkOut || "",
        latenessMinutes: existingAttendance?.latenessMinutes || 0,
        overtimeMinutes: existingAttendance?.overtimeMinutes || 0,
        earlyArrivalMinutes: existingAttendance?.earlyArrivalMinutes || 0,
        attendanceStatus: existingAttendance?.attendanceStatus || "",
        notes: existingAttendance?.notes || "",
        status: existingAttendance?.status || "pending",
      });
    }
    
    setRows(monthData);
    setHasChanges(false);
  };

  // Effect to load attendance data when it changes
  useEffect(() => {
    if (currentEmp && attendanceData !== undefined) {
      loadAttendanceData(currentEmp);
    }
  }, [currentEmp, attendanceData, dateFrom, dateTo]);

  // Get current employee's store shifts
  const getCurrentStoreShifts = (): Record<string, ShiftSchedule> => {
    if (!currentEmp || !stores) return SHIFT_SCHEDULES;
    
    const storeId = currentEmp.stores?.[0]?.id ?? currentEmp.storeId ?? user?.storeId ?? 1;
    const store = stores.find(s => s.id === storeId);
    
    if (store) {
      return getStoreShifts(store);
    }
    
    return SHIFT_SCHEDULES;
  };

  // Update row data with reactive calculations
  const updateRow = (i: number, field: keyof AttendanceRecord, value: string | number) => {
    if (!canEdit) {
      toast({
        title: "⛔ Akses Ditolak",
        description: "Hanya manager dan administrasi yang dapat mengedit data absensi",
        variant: "destructive",
      });
      return;
    }

    const newRows = [...rows];
    newRows[i] = { ...newRows[i], [field]: value };

    if (field === "checkIn" || field === "checkOut" || field === "shift") {
      const shift = field === "shift" ? value as string : newRows[i].shift;
      const checkIn = field === "checkIn" ? value as string : newRows[i].checkIn;
      const checkOut = field === "checkOut" ? value as string : newRows[i].checkOut;
      
      newRows[i].shift = shift;
      const storeShifts = getCurrentStoreShifts();
      
      if (checkIn) {
        newRows[i].latenessMinutes = calculateLateness(checkIn, shift, storeShifts);
        newRows[i].earlyArrivalMinutes = calculateEarlyArrival(checkIn, shift, storeShifts);
      } else {
        newRows[i].latenessMinutes = 0;
        newRows[i].earlyArrivalMinutes = 0;
      }
      
      if (checkOut) {
        newRows[i].overtimeMinutes = calculateOvertime(checkOut, shift, storeShifts);
      } else {
        newRows[i].overtimeMinutes = 0;
      }
    }

    setRows(newRows);
    setHasChanges(true);
  };

  // Save data
  const saveData = () => {
    if (!canEdit) {
      toast({
        title: "⛔ Akses Ditolak",
        description: "Hanya manager dan administrasi yang dapat menyimpan data absensi",
        variant: "destructive",
      });
      return;
    }

    const recordsToSave = rows.filter(row => 
      row.checkIn || row.checkOut || row.attendanceStatus
    );

    saveAttendanceMutation.mutate({ attendanceRecords: recordsToSave });
  };

  // Cancel edit
  const cancelEdit = () => {
    if (currentEmp) {
      loadAttendanceData(currentEmp);
    }
    setHasChanges(false);
    setCancelDialogOpen(false);
  };

  // Export to CSV
  const exportCSV = () => {
    if (!currentEmp) return;
    let csv = "Tanggal,Hari,Shift,Jam Masuk,Jam Keluar,Telat (menit),Datang Awal (menit),Lembur (menit),Status,Keterangan\n";
    rows.forEach((r) => {
      csv += `${r.date},${r.day},${r.shift},${r.checkIn},${r.checkOut},${r.latenessMinutes},${r.earlyArrivalMinutes},${r.overtimeMinutes},${r.attendanceStatus},${r.notes}\n`;
    });
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Absensi_${currentEmp.name}_${format(dateFrom, 'yyyy-MM-dd')}_${format(dateTo, 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: "✅ Berhasil",
      description: "Laporan CSV berhasil diunduh!",
    });
  };

  // Export to PDF
  const exportPDF = () => {
    if (!currentEmp) return;
    
    const doc = new jsPDF();
    
    doc.setFontSize(16);
    doc.text(`Laporan Absensi - ${currentEmp.name}`, 14, 15);
    doc.setFontSize(10);
    doc.text(`Periode: ${format(dateFrom, 'dd MMM yyyy', { locale: localeId })} - ${format(dateTo, 'dd MMM yyyy', { locale: localeId })}`, 14, 22);
    
    const tableData = rows.map(r => [
      r.date,
      r.day,
      r.shift,
      r.checkIn || '-',
      r.checkOut || '-',
      r.latenessMinutes.toString(),
      r.overtimeMinutes.toString(),
      r.attendanceStatus || '-'
    ]);
    
    autoTable(doc, {
      head: [['Tanggal', 'Hari', 'Shift', 'Masuk', 'Keluar', 'Telat (m)', 'Lembur (m)', 'Status']],
      body: tableData,
      startY: 28,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [59, 130, 246] },
    });
    
    const finalY = (doc as any).lastAutoTable.finalY || 28;
    const stats = summary();
    doc.setFontSize(10);
    doc.text(`Total Hadir: ${stats.hadir}`, 14, finalY + 10);
    doc.text(`Total Telat: ${(stats.totalTelat / 60).toFixed(2)} jam`, 14, finalY + 16);
    doc.text(`Total Lembur: ${(stats.totalLembur / 60).toFixed(2)} jam`, 14, finalY + 22);
    
    doc.save(`Absensi_${currentEmp.name}_${format(dateFrom, 'yyyy-MM-dd')}.pdf`);
    
    toast({
      title: "✅ Berhasil",
      description: "Laporan PDF berhasil diunduh!",
    });
  };

  // Calculate summary statistics
  const summary = () => {
    const hadir = rows.filter((r) => r.attendanceStatus === "hadir").length;
    const cuti = rows.filter((r) => r.attendanceStatus === "cuti").length;
    const alpha = rows.filter((r) => r.attendanceStatus === "alpha").length;
    const telat = rows.filter((r) => r.latenessMinutes > 0).length;
    const totalTelat = rows.reduce((a, b) => a + b.latenessMinutes, 0);
    const totalLembur = rows.reduce((a, b) => a + b.overtimeMinutes, 0);

    return { hadir, cuti, alpha, telat, totalTelat, totalLembur };
  };

  // Calculate total worked hours
  const calculateWorkedHours = (checkIn: string, checkOut: string): string => {
    if (!checkIn || !checkOut) return "-";
    
    const [inHour, inMin] = checkIn.split(':').map(Number);
    const [outHour, outMin] = checkOut.split(':').map(Number);
    
    let totalMinutes = (outHour * 60 + outMin) - (inHour * 60 + inMin);
    
    if (totalMinutes < 0) {
      totalMinutes += 24 * 60;
    }
    
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    return `${hours}j ${minutes}m`;
  };

  // Get status badge variant
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "hadir":
        return "default";
      case "cuti":
      case "izin":
        return "secondary";
      case "sakit":
        return "outline";
      case "alpha":
        return "destructive";
      default:
        return "outline";
    }
  };

  // Get status label in Indonesian
  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      hadir: "Hadir",
      cuti: "Cuti",
      izin: "Izin",
      sakit: "Sakit",
      alpha: "Alpha",
      belum_diatur: "Belum Diatur"
    };
    return labels[status] || status;
  };

  // Filtered employees based on search and filters
  const filteredEmployees = useMemo(() => {
    if (!employees) return [];
    
    return employees.filter(emp => {
      if (searchQuery && !emp.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      
      if (storeFilter !== "semua_toko") {
        const empStoreId = emp.stores?.[0]?.id ?? emp.storeId;
        if (empStoreId !== parseInt(storeFilter)) {
          return false;
        }
      }
      
      return true;
    });
  }, [employees, searchQuery, storeFilter]);

  // Filtered rows based on shift and status
  const filteredRows = useMemo(() => {
    return rows.filter(row => {
      if (shiftFilter !== "semua_shift" && row.shift !== shiftFilter) return false;
      if (statusFilter !== "semua_status") {
        if (statusFilter === "telat" && row.latenessMinutes <= 0) return false;
        if (statusFilter !== "telat" && row.attendanceStatus !== statusFilter) return false;
      }
      return true;
    });
  }, [rows, shiftFilter, statusFilter]);

  // Render list view
  if (view === "list") {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Manajemen Absensi</h2>
            <p className="text-muted-foreground">Kelola data kehadiran karyawan</p>
          </div>

          {!canEdit && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
              <p className="text-yellow-800 dark:text-yellow-200 text-sm flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Anda hanya dapat melihat data. Hanya manager dan administrasi yang dapat mengedit absensi.
              </p>
            </div>
          )}
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Cari nama karyawan..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                    data-testid="input-search-employee"
                  />
                </div>
              </div>
              
              {stores && stores.length > 1 && (
                <Select value={storeFilter} onValueChange={setStoreFilter}>
                  <SelectTrigger className="w-full md:w-[200px]" data-testid="select-store-filter">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filter Toko" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="semua_toko">Semua Toko</SelectItem>
                    {stores.map(store => (
                      <SelectItem key={store.id} value={store.id.toString()}>
                        {store.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Daftar Karyawan
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingEmployees ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-[200px]" />
                      <Skeleton className="h-3 w-[150px]" />
                    </div>
                    <Skeleton className="h-9 w-[120px]" />
                  </div>
                ))}
              </div>
            ) : filteredEmployees && filteredEmployees.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Karyawan</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Toko</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEmployees.map((employee) => (
                      <TableRow key={employee.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                              <span className="text-sm font-semibold text-white">
                                {employee.name.slice(0, 2).toUpperCase()}
                              </span>
                            </div>
                            <span className="font-medium">{employee.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{employee.email}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {employee.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {stores?.find(s => s.id === (employee.stores?.[0]?.id ?? employee.storeId))?.name || '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            onClick={() => {
                              setCurrentEmp(employee);
                              setView("detail");
                            }}
                            data-testid={`button-detail-${employee.id}`}
                          >
                            <Edit2 className="h-4 w-4 mr-1" />
                            {canEdit ? "Edit Absensi" : "Lihat Absensi"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-12">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">Tidak ada karyawan yang ditemukan</p>
                <p className="text-sm mt-1">Coba ubah filter pencarian Anda</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Render detail view
  const stats = summary();
  
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => {
            setView("list");
            setCurrentEmp(null);
            setHasChanges(false);
          }}
          data-testid="button-back-to-list"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Kembali
        </Button>
        <div>
          <h2 className="text-2xl font-bold">
            Absensi - {currentEmp?.name}
          </h2>
          <p className="text-sm text-muted-foreground">
            {canEdit ? "Edit data kehadiran karyawan" : "Lihat data kehadiran karyawan"}
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={dateRangePreset === "today" ? "default" : "outline"}
                size="sm"
                onClick={() => setDateRangePresetHandler("today")}
                data-testid="button-preset-today"
              >
                Hari Ini
              </Button>
              <Button
                variant={dateRangePreset === "week" ? "default" : "outline"}
                size="sm"
                onClick={() => setDateRangePresetHandler("week")}
                data-testid="button-preset-week"
              >
                Minggu Ini
              </Button>
              <Button
                variant={dateRangePreset === "month" ? "default" : "outline"}
                size="sm"
                onClick={() => setDateRangePresetHandler("month")}
                data-testid="button-preset-month"
              >
                Bulan Ini
              </Button>
            </div>

            <div className="flex flex-1 gap-2 items-center flex-wrap lg:flex-nowrap">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="justify-start text-left font-normal flex-1 min-w-[180px]"
                    data-testid="button-date-from"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(dateFrom, "dd MMM yyyy", { locale: localeId })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateFrom}
                    onSelect={(date) => {
                      if (date) {
                        setDateFrom(date);
                        setDateRangePreset("custom");
                      }
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              <span className="text-muted-foreground">-</span>

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="justify-start text-left font-normal flex-1 min-w-[180px]"
                    data-testid="button-date-to"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(dateTo, "dd MMM yyyy", { locale: localeId })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateTo}
                    onSelect={(date) => {
                      if (date) {
                        setDateTo(date);
                        setDateRangePreset("custom");
                      }
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Hadir</p>
                <p className="text-2xl font-bold" data-testid="text-total-hadir">{stats.hadir}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Telat</p>
                <p className="text-2xl font-bold" data-testid="text-total-telat">
                  {(stats.totalTelat / 60).toFixed(1)} jam
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
                <Clock className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Lembur</p>
                <p className="text-2xl font-bold" data-testid="text-total-lembur">
                  {(stats.totalLembur / 60).toFixed(1)} jam
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Alpha</p>
                <p className="text-2xl font-bold" data-testid="text-total-alpha">{stats.alpha}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                <XCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <Select value={shiftFilter} onValueChange={setShiftFilter}>
              <SelectTrigger className="w-full md:w-[200px]" data-testid="select-shift-filter">
                <SelectValue placeholder="Filter Shift" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="semua_shift">Semua Shift</SelectItem>
                {Object.keys(getCurrentStoreShifts()).map(shiftKey => (
                  <SelectItem key={shiftKey} value={shiftKey} className="capitalize">
                    {shiftKey.charAt(0).toUpperCase() + shiftKey.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[200px]" data-testid="select-status-filter">
                <SelectValue placeholder="Filter Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="semua_status">Semua Status</SelectItem>
                <SelectItem value="hadir">Hadir</SelectItem>
                <SelectItem value="telat">Telat</SelectItem>
                <SelectItem value="cuti">Cuti</SelectItem>
                <SelectItem value="izin">Izin</SelectItem>
                <SelectItem value="sakit">Sakit</SelectItem>
                <SelectItem value="alpha">Alpha</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2">
        {canEdit && (
          <>
            <Button
              onClick={() => setSaveDialogOpen(true)}
              disabled={!hasChanges || saveAttendanceMutation.isPending}
              data-testid="button-save"
            >
              <Save className="h-4 w-4 mr-2" />
              {saveAttendanceMutation.isPending ? "Menyimpan..." : "Simpan Perubahan"}
            </Button>
            <Button
              variant="outline"
              onClick={() => setCancelDialogOpen(true)}
              disabled={!hasChanges}
              data-testid="button-cancel"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Batal
            </Button>
          </>
        )}
        <Button
          variant="outline"
          onClick={exportCSV}
          data-testid="button-export-csv"
        >
          <FileText className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
        <Button
          variant="outline"
          onClick={exportPDF}
          data-testid="button-export-pdf"
        >
          <Download className="h-4 w-4 mr-2" />
          Export PDF
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          {isLoadingAttendance ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="flex gap-4">
                  <Skeleton className="h-12 flex-1" />
                </div>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Hari</TableHead>
                    <TableHead>Shift</TableHead>
                    <TableHead>Jam Masuk</TableHead>
                    <TableHead>Jam Keluar</TableHead>
                    <TableHead>Durasi</TableHead>
                    <TableHead>Telat</TableHead>
                    <TableHead>Lembur</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Keterangan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRows.map((row, i) => {
                    const originalIndex = rows.indexOf(row);
                    return (
                      <TableRow key={i} data-testid={`row-attendance-${i}`}>
                        <TableCell className="font-medium">
                          {format(parseISO(row.date), 'dd MMM yyyy', { locale: localeId })}
                        </TableCell>
                        <TableCell>{row.day}</TableCell>
                        <TableCell>
                          {canEdit ? (
                            <Select
                              value={row.shift}
                              onValueChange={(val) => updateRow(originalIndex, "shift", val)}
                            >
                              <SelectTrigger className="w-[120px]" data-testid={`select-shift-${i}`}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {Object.keys(getCurrentStoreShifts()).map(shiftKey => (
                                  <SelectItem key={shiftKey} value={shiftKey}>
                                    {shiftKey.charAt(0).toUpperCase() + shiftKey.slice(1)}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <Badge variant="outline" className="capitalize">
                              {row.shift}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {canEdit ? (
                            <Input
                              type="time"
                              value={row.checkIn}
                              onChange={(e) => updateRow(originalIndex, "checkIn", e.target.value)}
                              className="w-[130px]"
                              data-testid={`input-checkin-${i}`}
                            />
                          ) : (
                            <span className={row.latenessMinutes > 0 ? "text-orange-600 dark:text-orange-400 font-medium" : ""}>
                              {row.checkIn || "-"}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {canEdit ? (
                            <Input
                              type="time"
                              value={row.checkOut}
                              onChange={(e) => updateRow(originalIndex, "checkOut", e.target.value)}
                              className="w-[130px]"
                              data-testid={`input-checkout-${i}`}
                            />
                          ) : (
                            <span className={row.overtimeMinutes > 0 ? "text-green-600 dark:text-green-400 font-medium" : ""}>
                              {row.checkOut || "-"}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="text-sm" data-testid={`text-duration-${i}`}>
                            {calculateWorkedHours(row.checkIn, row.checkOut)}
                          </span>
                        </TableCell>
                        <TableCell>
                          {row.latenessMinutes > 0 ? (
                            <Badge variant="destructive" className="tabular-nums" data-testid={`badge-lateness-${i}`}>
                              {row.latenessMinutes}m
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {row.overtimeMinutes > 0 ? (
                            <Badge className="bg-green-600 hover:bg-green-700 tabular-nums" data-testid={`badge-overtime-${i}`}>
                              {row.overtimeMinutes}m
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {canEdit ? (
                            <Select
                              value={row.attendanceStatus}
                              onValueChange={(val) => updateRow(originalIndex, "attendanceStatus", val)}
                            >
                              <SelectTrigger className="w-[140px]" data-testid={`select-status-${i}`}>
                                <SelectValue placeholder="Pilih status" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="hadir">Hadir</SelectItem>
                                <SelectItem value="cuti">Cuti</SelectItem>
                                <SelectItem value="izin">Izin</SelectItem>
                                <SelectItem value="sakit">Sakit</SelectItem>
                                <SelectItem value="alpha">Alpha</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            <Badge variant={getStatusBadgeVariant(row.attendanceStatus)} data-testid={`badge-status-${i}`}>
                              {getStatusLabel(row.attendanceStatus)}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {canEdit ? (
                            <Input
                              value={row.notes}
                              onChange={(e) => updateRow(originalIndex, "notes", e.target.value)}
                              placeholder="Keterangan..."
                              className="w-[200px]"
                              data-testid={`input-notes-${i}`}
                            />
                          ) : (
                            <span className="text-sm text-muted-foreground">
                              {row.notes || "-"}
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Simpan Perubahan?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menyimpan perubahan data absensi? Tindakan ini akan memperbarui data kehadiran karyawan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-save-dialog">Batal</AlertDialogCancel>
            <AlertDialogAction onClick={saveData} data-testid="button-confirm-save-dialog">
              Simpan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Batalkan Perubahan?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin membatalkan perubahan? Semua perubahan yang belum disimpan akan hilang.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-cancel-dialog">Tidak</AlertDialogCancel>
            <AlertDialogAction onClick={cancelEdit} data-testid="button-confirm-cancel-dialog">
              Ya, Batalkan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
