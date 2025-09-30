import { useState, useEffect } from "react";
import { useParams, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeftIcon, 
  ChevronLeftIcon, 
  ChevronRightIcon, 
  SaveIcon, 
  FileDownIcon,
  CalendarIcon,
  ClockIcon,
  UserIcon 
} from "lucide-react";
import { calculateLateness, calculateOvertime, calculateEarlyArrival, SHIFT_SCHEDULES, getStoreShifts } from "@shared/attendance-utils";

interface AttendanceRecord {
  id?: string;
  date: string;
  day: string;
  checkIn: string;
  checkOut: string;
  shift: string;
  latenessMinutes: number;
  overtimeMinutes: number;
  earlyArrivalMinutes: number;
  attendanceStatus: string;
  notes: string;
}

interface EmployeeData {
  id: string;
  name: string;
  stores: Array<{ 
    id: number; 
    name: string; 
    entryTimeStart?: string;
    entryTimeEnd?: string;
    exitTimeStart?: string;
    exitTimeEnd?: string;
  }>;
}

interface MonthlyAttendanceData {
  employee: EmployeeData;
  attendanceData: AttendanceRecord[];
}

const ATTENDANCE_STATUS_OPTIONS = [
  { value: "belum_diatur", label: "Belum Diatur", color: "bg-gray-100 text-gray-600" },
  { value: "hadir", label: "Hadir", color: "bg-green-100 text-green-800" },
  { value: "cuti", label: "Cuti", color: "bg-blue-100 text-blue-800" },
  { value: "alpha", label: "Alpha", color: "bg-red-100 text-red-800" },
];

// Dynamic shift options will be generated based on store settings

interface AttendanceDetailPageProps {
  employeeIdProp?: string;
  yearProp?: number;
  monthProp?: number;
  readOnly?: boolean;
  compact?: boolean;
}

export default function AttendanceDetailPage({ 
  employeeIdProp, 
  yearProp, 
  monthProp, 
  readOnly = false, 
  compact = false 
}: AttendanceDetailPageProps = {}) {
  const params = useParams();
  const { toast } = useToast();
  
  // Use props when provided, otherwise fall back to useParams()
  const employeeId = employeeIdProp || (params.employeeId as string);
  
  // State for current month and year
  const currentDate = new Date();
  const [year, setYear] = useState(yearProp || currentDate.getFullYear());
  const [month, setMonth] = useState(monthProp || (currentDate.getMonth() + 1));
  
  // State for attendance data
  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [selectedStoreId, setSelectedStoreId] = useState<number | null>(null);

  // Fetch monthly attendance data - using the correct API endpoint
  const { data: monthlyData, isLoading, refetch, error } = useQuery<MonthlyAttendanceData>({
    queryKey: [`/api/employees/${employeeId}/attendance/${year}/${month}`],
    enabled: !!employeeId,
    retry: (failureCount, error: any) => {
      // Only retry on network errors, not 404 or 403 errors
      if (error?.status === 404 || error?.status === 403) {
        return false;
      }
      return failureCount < 2;
    }
  });

  // Get custom store shifts or default shifts
  const getCurrentStoreShifts = () => {
    if (!monthlyData?.employee?.stores?.[0]) {
      return SHIFT_SCHEDULES;
    }
    
    const store = monthlyData.employee.stores.find(s => s.id === selectedStoreId) || monthlyData.employee.stores[0];
    return getStoreShifts(store);
  };

  // Generate shift options from current store's custom shifts
  const generateShiftOptions = () => {
    const storeShifts = getCurrentStoreShifts();
    return Object.entries(storeShifts).map(([key, schedule]) => ({
      value: key,
      label: `${key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ')} (${schedule.start}-${schedule.end})`
    }));
  };

  // Sync state with props when they change
  useEffect(() => {
    if (yearProp !== undefined) setYear(yearProp);
    if (monthProp !== undefined) setMonth(monthProp);
  }, [yearProp, monthProp]);

  // Update local state when data loads
  useEffect(() => {
    if (monthlyData?.attendanceData) {
      setAttendanceData(monthlyData.attendanceData);
      setHasChanges(false);
    }
    
    // Initialize selectedStoreId to first store if not set
    if (monthlyData?.employee?.stores?.length && !selectedStoreId) {
      setSelectedStoreId(monthlyData.employee.stores[0].id);
    }
  }, [monthlyData]);

  // Recalculate time metrics when attendance data loads using shared utilities
  useEffect(() => {
    if (attendanceData.length > 0) {
      const storeShifts = getCurrentStoreShifts();
      const updatedData = attendanceData.map(record => {
        if (record.checkIn && record.shift) {
          const latenessMinutes = calculateLateness(record.checkIn, record.shift, storeShifts);
          const earlyArrivalMinutes = calculateEarlyArrival(record.checkIn, record.shift, storeShifts);
          const overtimeMinutes = record.checkOut ? calculateOvertime(record.checkOut, record.shift, storeShifts) : 0;
          
          return {
            ...record,
            latenessMinutes,
            overtimeMinutes,
            earlyArrivalMinutes
          };
        }
        return record;
      });
      
      setAttendanceData(updatedData);
    }
  }, [monthlyData?.attendanceData, selectedStoreId]);

  // Save changes mutation - using bulk update API
  const saveMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('PUT', `/api/employees/${employeeId}/attendance/${year}/${month}`, {
        attendanceData: attendanceData
      });
    },
    onSuccess: () => {
      toast({ 
        title: "Berhasil", 
        description: "Data absensi berhasil disimpan",
        variant: "default"
      });
      setHasChanges(false);
      // Invalidate and refetch the data
      queryClient.invalidateQueries({
        queryKey: [`/api/employees/${employeeId}/attendance/${year}/${month}`]
      });
      refetch();
    },
    onError: (error: any) => {
      console.error('Save error:', error);
      const errorMessage = error?.response?.data?.message || error?.message || "Gagal menyimpan data absensi";
      toast({ 
        title: "Error Menyimpan Data", 
        description: errorMessage,
        variant: "destructive" 
      });
    }
  });

  // Navigation functions
  const navigateMonth = (direction: 'prev' | 'next') => {
    let newMonth = month;
    let newYear = year;
    
    if (direction === 'prev') {
      newMonth = month === 1 ? 12 : month - 1;
      newYear = month === 1 ? year - 1 : year;
    } else {
      newMonth = month === 12 ? 1 : month + 1;
      newYear = month === 12 ? year + 1 : year;
    }
    
    setMonth(newMonth);
    setYear(newYear);
  };

  // Update attendance record with reactive calculations
  const updateAttendanceRecord = (index: number, field: keyof AttendanceRecord, value: string | number) => {
    const updatedData = [...attendanceData];
    updatedData[index] = { ...updatedData[index], [field]: value };
    
    // Clear data fields when status is changed to cuti or alpha
    if (field === 'attendanceStatus' && (value === 'cuti' || value === 'alpha')) {
      updatedData[index].checkIn = '';
      updatedData[index].checkOut = '';
      updatedData[index].shift = '';
      updatedData[index].latenessMinutes = 0;
      updatedData[index].overtimeMinutes = 0;
      updatedData[index].earlyArrivalMinutes = 0;
    }
    
    // Auto-calculate all time metrics when shift, check-in, or check-out changes
    if (field === 'checkIn' || field === 'checkOut' || field === 'shift') {
      const shift = field === 'shift' ? value as string : updatedData[index].shift;
      const checkIn = field === 'checkIn' ? value as string : updatedData[index].checkIn;
      const checkOut = field === 'checkOut' ? value as string : updatedData[index].checkOut;
      
      updatedData[index].shift = shift;
      
      // Get current store's custom shifts
      const storeShifts = getCurrentStoreShifts();
      
      // Calculate metrics using shared utilities with custom shifts
      if (checkIn) {
        updatedData[index].latenessMinutes = calculateLateness(checkIn, shift, storeShifts);
        updatedData[index].earlyArrivalMinutes = calculateEarlyArrival(checkIn, shift, storeShifts);
      } else {
        updatedData[index].latenessMinutes = 0;
        updatedData[index].earlyArrivalMinutes = 0;
      }
      
      if (checkOut) {
        updatedData[index].overtimeMinutes = calculateOvertime(checkOut, shift, storeShifts);
      } else {
        updatedData[index].overtimeMinutes = 0;
      }
    }
    
    setAttendanceData(updatedData);
    setHasChanges(true);
  };


  // Export to CSV
  const exportToCSV = () => {
    if (!monthlyData?.employee || !attendanceData.length) {
      toast({ 
        title: "Error Export", 
        description: "Tidak ada data untuk diekspor",
        variant: "destructive" 
      });
      return;
    }
    
    try {
      const headers = ['Tanggal', 'Hari', 'Jam Masuk', 'Jam Keluar', 'Shift', 'Status', 'Terlambat (menit)', 'Datang Awal (menit)', 'Lembur (menit)', 'Catatan'];
      const csvContent = [
        headers.join(','),
        ...attendanceData.map(record => [
          record.date,
          record.day,
          record.checkIn || '',
          record.checkOut || '',
          record.shift || '',
          record.attendanceStatus,
          record.latenessMinutes.toString(),
          record.earlyArrivalMinutes.toString(),
          record.overtimeMinutes.toString(),
          `"${record.notes || ''}"`
        ].join(','))
      ].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `absensi_${monthlyData.employee.name}_${year}_${month.toString().padStart(2, '0')}.csv`;
      link.click();
      
      toast({ 
        title: "Export Berhasil", 
        description: "File CSV berhasil diunduh"
      });
    } catch (err) {
      toast({ 
        title: "Error Export", 
        description: "Gagal mengekspor data ke CSV",
        variant: "destructive" 
      });
    }
  };

  // Calculate summary statistics
  const calculateSummary = () => {
    const hadirCount = attendanceData.filter(r => r.attendanceStatus === 'hadir').length;
    const cutiCount = attendanceData.filter(r => r.attendanceStatus === 'cuti').length;
    const alphaCount = attendanceData.filter(r => r.attendanceStatus === 'alpha').length;
    const belumDiaturCount = attendanceData.filter(r => r.attendanceStatus === 'belum_diatur' || !r.attendanceStatus).length;
    const totalLateness = attendanceData.reduce((sum, r) => sum + r.latenessMinutes, 0);
    
    return { hadirCount, cutiCount, alphaCount, belumDiaturCount, totalLateness };
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="space-y-6">
          <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-96 bg-gray-200 rounded animate-pulse"></div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    const errorMessage = (error as any)?.response?.data?.message || (error as any)?.message || "Terjadi kesalahan saat memuat data";
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <h3 className="text-lg font-medium text-red-600 mb-2">
              Error Memuat Data
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {errorMessage}
            </p>
            <div className="flex justify-center gap-4">
              <Button onClick={() => refetch()} variant="outline">
                Coba Lagi
              </Button>
              <Link href="/attendance" data-testid="button-back-to-list">
                <Button>Kembali ke Daftar</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!monthlyData) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              Data tidak ditemukan
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Tidak dapat menemukan data karyawan yang diminta.
            </p>
            <Button 
              onClick={() => window.location.href = '/attendance'}
              data-testid="button-back-to-list"
            >
              Kembali ke Daftar Karyawan
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const monthName = new Date(year, month - 1).toLocaleDateString('id-ID', { month: 'long' });
  const summary = calculateSummary();

  return (
    <div className={compact ? "" : "container mx-auto py-8"}>
      {/* Header */}
      {!compact && (
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.location.href = '/attendance'}
              data-testid="button-back-to-list"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Kembali ke Daftar
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100" data-testid="text-employee-name">
                {monthlyData.employee.name}
              </h1>
              <div className="space-y-2">
                <p className="text-gray-600 dark:text-gray-400" data-testid="text-store-info">
                  Toko: {monthlyData.employee.stores.map((s: any) => s.name).join(', ')}
                </p>
                {monthlyData.employee.stores.length > 1 && (
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Jadwal Shift:
                    </label>
                    <Select
                      value={selectedStoreId?.toString() || monthlyData.employee.stores[0]?.id?.toString()}
                      onValueChange={(value) => setSelectedStoreId(parseInt(value))}
                    >
                      <SelectTrigger className="w-48" data-testid="select-store-shift">
                        <SelectValue placeholder="Pilih toko untuk jadwal shift" />
                      </SelectTrigger>
                      <SelectContent>
                        {monthlyData.employee.stores.map((store: any) => (
                          <SelectItem key={store.id} value={store.id.toString()}>
                            {store.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </div>
          </div>
          {!readOnly && (
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                onClick={exportToCSV}
                data-testid="button-export-csv"
              >
                <FileDownIcon className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
              <Button 
                onClick={() => saveMutation.mutate()}
                disabled={!hasChanges || saveMutation.isPending}
                data-testid="button-save-changes"
              >
                <SaveIcon className="h-4 w-4 mr-2" />
                {saveMutation.isPending ? 'Menyimpan...' : 'Simpan Perubahan'}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Month Navigation */}
      {!readOnly && (
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Button 
                variant="outline" 
                onClick={() => navigateMonth('prev')}
                data-testid="button-prev-month"
              >
                <ChevronLeftIcon className="h-4 w-4 mr-2" />
                Bulan Sebelumnya
              </Button>
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5 text-gray-600" />
                <span className="text-lg font-semibold" data-testid="text-current-month">
                  {monthName} {year}
                </span>
              </div>
              <Button 
                variant="outline" 
                onClick={() => navigateMonth('next')}
                data-testid="button-next-month"
              >
                Bulan Selanjutnya
                <ChevronRightIcon className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Statistics */}
      <div className={`grid grid-cols-3 md:grid-cols-6 gap-4 ${compact ? 'mb-4' : 'mb-6'}`}>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600" data-testid="summary-hadir-count">{summary.hadirCount}</div>
            <div className="text-sm text-gray-600">Hadir</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600" data-testid="summary-cuti-count">{summary.cutiCount}</div>
            <div className="text-sm text-gray-600">Cuti</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600" data-testid="summary-alpha-count">{summary.alphaCount}</div>
            <div className="text-sm text-gray-600">Alpha</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-gray-600" data-testid="summary-belum-diatur-count">{summary.belumDiaturCount}</div>
            <div className="text-sm text-gray-600">Belum Diatur</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600" data-testid="summary-lateness-minutes">{summary.totalLateness}</div>
            <div className="text-sm text-gray-600">Menit Terlambat</div>
          </CardContent>
        </Card>
      </div>

      {/* Attendance Table */}
      <Card>
        <CardHeader>
          <CardTitle>Data Absensi Harian</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Hari</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Shift</TableHead>
                  <TableHead>Jam Masuk</TableHead>
                  <TableHead>Jam Keluar</TableHead>
                  <TableHead>Terlambat</TableHead>
                  <TableHead>Datang Awal</TableHead>
                  <TableHead>Lembur</TableHead>
                  <TableHead>Catatan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attendanceData.map((record, index) => {
                  const statusOption = ATTENDANCE_STATUS_OPTIONS.find(opt => opt.value === record.attendanceStatus);
                  const isLeaveOrAbsent = record.attendanceStatus === 'cuti' || record.attendanceStatus === 'alpha';
                  return (
                    <TableRow key={record.date} data-testid={`row-attendance-${record.date}`}>
                      <TableCell className="font-medium">
                        {new Date(record.date).getDate()}
                      </TableCell>
                      <TableCell>{record.day}</TableCell>
                      <TableCell>
                        {readOnly ? (
                          <Badge className={statusOption?.color || "bg-gray-100 text-gray-600"}>
                            {statusOption?.label || record.attendanceStatus}
                          </Badge>
                        ) : (
                          <Select
                            value={record.attendanceStatus}
                            onValueChange={(value) => updateAttendanceRecord(index, 'attendanceStatus', value)}
                          >
                            <SelectTrigger className="w-32" data-testid={`select-status-${record.date}`}>
                              <SelectValue placeholder="Pilih status" />
                            </SelectTrigger>
                            <SelectContent>
                              {ATTENDANCE_STATUS_OPTIONS.map(option => (
                                <SelectItem key={option.value} value={option.value}>
                                  <Badge className={option.color}>{option.label}</Badge>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </TableCell>
                      <TableCell>
                        {readOnly || isLeaveOrAbsent ? (
                          <span className="text-sm text-gray-400">
                            {isLeaveOrAbsent ? '-' : (generateShiftOptions().find(opt => opt.value === record.shift)?.label || record.shift || '-')}
                          </span>
                        ) : (
                          <Select
                            value={record.shift}
                            onValueChange={(value) => updateAttendanceRecord(index, 'shift', value)}
                          >
                            <SelectTrigger className="w-32" data-testid={`select-shift-${record.date}`}>
                              <SelectValue placeholder="Pilih shift" />
                            </SelectTrigger>
                            <SelectContent>
                              {generateShiftOptions().map(option => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </TableCell>
                      <TableCell>
                        {readOnly || isLeaveOrAbsent ? (
                          <span className="text-sm text-gray-400">
                            {isLeaveOrAbsent ? '-' : (record.checkIn || '-')}
                          </span>
                        ) : (
                          <Input
                            type="time"
                            value={record.checkIn}
                            onChange={(e) => updateAttendanceRecord(index, 'checkIn', e.target.value)}
                            className="w-24"
                            data-testid={`input-checkin-${record.date}`}
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        {readOnly || isLeaveOrAbsent ? (
                          <span className="text-sm text-gray-400">
                            {isLeaveOrAbsent ? '-' : (record.checkOut || '-')}
                          </span>
                        ) : (
                          <Input
                            type="time"
                            value={record.checkOut}
                            onChange={(e) => updateAttendanceRecord(index, 'checkOut', e.target.value)}
                            className="w-24"
                            data-testid={`input-checkout-${record.date}`}
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        <span 
                          className={`text-sm ${record.latenessMinutes > 0 ? 'text-red-600 font-medium' : 'text-gray-500'}`}
                          title={record.latenessMinutes > 0 ? `Terlambat ${record.latenessMinutes} menit dari shift ${record.shift}` : "Tepat waktu"}
                        >
                          {record.latenessMinutes} min
                        </span>
                      </TableCell>
                      <TableCell>
                        <span 
                          className={`text-sm ${record.earlyArrivalMinutes > 0 ? 'text-green-600 font-medium' : 'text-gray-500'}`}
                          title={record.earlyArrivalMinutes > 0 ? `Datang lebih awal ${record.earlyArrivalMinutes} menit sebelum shift ${record.shift}` : "Datang tepat waktu"}
                        >
                          {record.earlyArrivalMinutes} min
                        </span>
                      </TableCell>
                      <TableCell>
                        <span 
                          className={`text-sm ${record.overtimeMinutes > 0 ? 'text-blue-600 font-medium' : 'text-gray-500'}`}
                          title={record.overtimeMinutes > 0 ? `Lembur ${record.overtimeMinutes} menit setelah shift ${record.shift}` : "Selesai tepat waktu"}
                        >
                          {record.overtimeMinutes} min
                        </span>
                      </TableCell>
                      <TableCell>
                        {readOnly ? (
                          <span className="text-sm text-gray-600 max-w-48 break-words">
                            {record.notes || '-'}
                          </span>
                        ) : (
                          <Textarea
                            value={record.notes}
                            onChange={(e) => updateAttendanceRecord(index, 'notes', e.target.value)}
                            placeholder="Catatan..."
                            className="min-h-[60px] w-48"
                            data-testid={`textarea-notes-${record.date}`}
                          />
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Bottom Actions */}
      {!readOnly && hasChanges && (
        <div className="mt-6 flex justify-center">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-center gap-4">
              <span className="text-amber-800">Ada perubahan yang belum disimpan</span>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    // Reset to original data by refetching
                    refetch();
                    setHasChanges(false);
                  }}
                  data-testid="button-discard-changes"
                >
                  Batalkan Perubahan
                </Button>
                <Button 
                  onClick={() => saveMutation.mutate()}
                  disabled={saveMutation.isPending}
                  data-testid="button-save-changes-bottom"
                >
                  <SaveIcon className="h-4 w-4 mr-2" />
                  {saveMutation.isPending ? 'Menyimpan...' : 'Simpan Sekarang'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}