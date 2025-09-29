import { forwardRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  formatRupiah, 
  formatIndonesianMonth, 
  formatIndonesianDate,
  formatTime,
  cn,
} from "@/lib/utils";
import { type Payroll, type User, type Store } from "@shared/schema";

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

interface SalarySlipProps {
  payroll: Payroll & {
    user?: User;
    store?: { id: number; name: string; address?: string; phone?: string; manager?: string };
    bonusList?: Array<{ name: string; amount: number }>;
    deductionList?: Array<{ name: string; amount: number }>;
  };
  attendanceData?: {
    employee: any;
    attendanceData: AttendanceRecord[];
  };
  className?: string;
}

export const SalarySlip = forwardRef<HTMLDivElement, SalarySlipProps>(
  ({ payroll, attendanceData, className }, ref) => {
    // Calculate totals
    const baseSalary = parseFloat(payroll.baseSalary || "0");
    const overtimePay = parseFloat(payroll.overtimePay || "0");
    const totalBonus = payroll.bonusList?.reduce((sum, bonus) => sum + bonus.amount, 0) || 0;
    const totalDeduction = payroll.deductionList?.reduce((sum, deduction) => sum + deduction.amount, 0) || 0;
    const netSalary = baseSalary + overtimePay + totalBonus - totalDeduction;

    // Attendance summary
    const attendanceSummary = {
      totalHadir: 0,
      totalTerlambat: 0,
      totalAlpha: 0,
      totalCuti: 0,
    };

    if (attendanceData?.attendanceData) {
      attendanceData.attendanceData.forEach(record => {
        const status = record.attendanceStatus || record.status || '';
        switch (status) {
          case 'hadir':
            attendanceSummary.totalHadir++;
            if (record.latenessMinutes && record.latenessMinutes > 0) {
              attendanceSummary.totalTerlambat++;
            }
            break;
          case 'alpha':
            attendanceSummary.totalAlpha++;
            break;
          case 'cuti':
            attendanceSummary.totalCuti++;
            break;
        }
      });
    }

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
        case 'hadir': return 'bg-green-100 text-green-800 print:bg-green-200 print:text-green-900';
        case 'cuti': return 'bg-blue-100 text-blue-800 print:bg-blue-200 print:text-blue-900';
        case 'alpha': return 'bg-red-100 text-red-800 print:bg-red-200 print:text-red-900';
        default: return 'bg-gray-100 text-gray-600 print:bg-gray-200 print:text-gray-800';
      }
    };

    return (
      <div ref={ref} className={cn("print-content hidden", className)}>
        {/* Page 1: Salary Slip */}
        <div className="salary-page bg-white text-black p-6 min-h-screen">
          {/* Header */}
          <div className="text-center mb-6 border-b-2 border-black pb-4">
            <h1 className="text-xl font-bold mb-2">SETORAN HARIAN</h1>
            <h2 className="text-lg font-semibold mb-2">SLIP GAJI KARYAWAN</h2>
            {payroll.store && (
              <div className="text-sm space-y-1">
                <p className="font-medium">{payroll.store.name}</p>
                {payroll.store.address && <p>{payroll.store.address}</p>}
                {payroll.store.phone && <p>Telp: {payroll.store.phone}</p>}
              </div>
            )}
          </div>

          {/* Employee Information */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="font-semibold mb-3 text-sm border-b border-gray-300 pb-1">INFORMASI KARYAWAN</h3>
              <div className="space-y-2 text-sm">
                <div className="flex">
                  <span className="w-24 font-medium">Nama</span>
                  <span className="mr-2">:</span>
                  <span>{payroll.user?.name || '-'}</span>
                </div>
                <div className="flex">
                  <span className="w-24 font-medium">ID Karyawan</span>
                  <span className="mr-2">:</span>
                  <span className="font-mono text-xs">{payroll.userId}</span>
                </div>
                <div className="flex">
                  <span className="w-24 font-medium">Jabatan</span>
                  <span className="mr-2">:</span>
                  <span className="capitalize">{payroll.user?.role || '-'}</span>
                </div>
                <div className="flex">
                  <span className="w-24 font-medium">Toko</span>
                  <span className="mr-2">:</span>
                  <span>{payroll.store?.name || '-'}</span>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold mb-3 text-sm border-b border-gray-300 pb-1">PERIODE GAJI</h3>
              <div className="space-y-2 text-sm">
                <div className="flex">
                  <span className="w-24 font-medium">Bulan</span>
                  <span className="mr-2">:</span>
                  <span>{formatIndonesianMonth(payroll.month)}</span>
                </div>
                <div className="flex">
                  <span className="w-24 font-medium">Status</span>
                  <span className="mr-2">:</span>
                  <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                    payroll.status === 'paid' 
                      ? 'bg-green-100 text-green-800 print:bg-green-200' 
                      : 'bg-yellow-100 text-yellow-800 print:bg-yellow-200'
                  }`}>
                    {payroll.status === 'paid' ? 'Lunas' : 'Pending'}
                  </span>
                </div>
                <div className="flex">
                  <span className="w-24 font-medium">Tanggal Cetak</span>
                  <span className="mr-2">:</span>
                  <span>{formatIndonesianDate(new Date())}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Salary Details */}
          <div className="mb-6">
            <h3 className="font-semibold mb-3 text-sm border-b border-gray-300 pb-1">RINCIAN GAJI</h3>
            
            {/* Base Salary and Overtime */}
            <div className="grid grid-cols-2 gap-6 mb-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between border-b border-dotted border-gray-400 pb-1">
                  <span>Gaji Pokok</span>
                  <span className="font-medium">{formatRupiah(baseSalary)}</span>
                </div>
                <div className="flex justify-between border-b border-dotted border-gray-400 pb-1">
                  <span>Lembur</span>
                  <span className="font-medium">{formatRupiah(overtimePay)}</span>
                </div>
              </div>
            </div>

            {/* Bonus Section */}
            {payroll.bonusList && payroll.bonusList.length > 0 && (
              <div className="mb-4">
                <h4 className="font-medium mb-2 text-sm text-green-700">BONUS</h4>
                <div className="bg-green-50 p-3 rounded border">
                  <div className="space-y-1 text-sm">
                    {payroll.bonusList.map((bonus, index) => (
                      <div key={index} className="flex justify-between">
                        <span className="text-green-700">{bonus.name}</span>
                        <span className="font-medium text-green-800">{formatRupiah(bonus.amount)}</span>
                      </div>
                    ))}
                    <div className="border-t border-green-200 pt-1 mt-2">
                      <div className="flex justify-between font-semibold">
                        <span>Total Bonus</span>
                        <span className="text-green-800">{formatRupiah(totalBonus)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Deduction Section */}
            {payroll.deductionList && payroll.deductionList.length > 0 && (
              <div className="mb-4">
                <h4 className="font-medium mb-2 text-sm text-red-700">POTONGAN</h4>
                <div className="bg-red-50 p-3 rounded border">
                  <div className="space-y-1 text-sm">
                    {payroll.deductionList.map((deduction, index) => (
                      <div key={index} className="flex justify-between">
                        <span className="text-red-700">{deduction.name}</span>
                        <span className="font-medium text-red-800">{formatRupiah(deduction.amount)}</span>
                      </div>
                    ))}
                    <div className="border-t border-red-200 pt-1 mt-2">
                      <div className="flex justify-between font-semibold">
                        <span>Total Potongan</span>
                        <span className="text-red-800">{formatRupiah(totalDeduction)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Net Salary */}
            <div className="bg-blue-50 p-4 rounded border border-blue-200">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-blue-900">TOTAL GAJI BERSIH</span>
                <span className="text-xl font-bold text-blue-900">{formatRupiah(netSalary)}</span>
              </div>
            </div>
          </div>

          {/* Attendance Summary */}
          <div className="mb-6">
            <h3 className="font-semibold mb-3 text-sm border-b border-gray-300 pb-1">RINGKASAN ABSENSI</h3>
            <div className="grid grid-cols-4 gap-4 text-center text-sm">
              <div className="bg-green-50 p-2 rounded border">
                <div className="text-lg font-bold text-green-800">{attendanceSummary.totalHadir}</div>
                <div className="text-xs text-green-600">Hadir</div>
              </div>
              <div className="bg-yellow-50 p-2 rounded border">
                <div className="text-lg font-bold text-yellow-800">{attendanceSummary.totalTerlambat}</div>
                <div className="text-xs text-yellow-600">Terlambat</div>
              </div>
              <div className="bg-red-50 p-2 rounded border">
                <div className="text-lg font-bold text-red-800">{attendanceSummary.totalAlpha}</div>
                <div className="text-xs text-red-600">Alpha</div>
              </div>
              <div className="bg-blue-50 p-2 rounded border">
                <div className="text-lg font-bold text-blue-800">{attendanceSummary.totalCuti}</div>
                <div className="text-xs text-blue-600">Cuti</div>
              </div>
            </div>
          </div>

          {/* Signatures */}
          <div className="mt-8 pt-6 border-t border-gray-300">
            <div className="grid grid-cols-2 gap-8 text-center text-sm">
              <div>
                <p className="mb-16">Karyawan</p>
                <div className="border-t border-black pt-1">
                  <p className="font-medium">{payroll.user?.name}</p>
                </div>
              </div>
              <div>
                <p className="mb-16">HRD / Manager</p>
                <div className="border-t border-black pt-1">
                  <p className="font-medium">{payroll.store?.manager || '________________'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Page Break */}
        <div className="page-break"></div>

        {/* Page 2: Detailed Attendance */}
        <div className="attendance-page bg-white text-black p-6 min-h-screen">
          <div className="text-center mb-6 border-b-2 border-black pb-4">
            <h1 className="text-lg font-bold">RINCIAN ABSENSI KARYAWAN</h1>
            <p className="text-sm mt-2">{formatIndonesianMonth(payroll.month)} - {payroll.user?.name}</p>
          </div>

          {/* Attendance Table */}
          <div className="mb-6">
            <table className="w-full border-collapse border border-gray-400 text-xs">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-400 p-2 text-center w-16">No</th>
                  <th className="border border-gray-400 p-2 text-center w-20">Tanggal</th>
                  <th className="border border-gray-400 p-2 text-center w-16">Masuk</th>
                  <th className="border border-gray-400 p-2 text-center w-16">Keluar</th>
                  <th className="border border-gray-400 p-2 text-center w-20">Status</th>
                  <th className="border border-gray-400 p-2 text-center">Keterangan</th>
                </tr>
              </thead>
              <tbody>
                {attendanceData?.attendanceData?.length ? (
                  attendanceData.attendanceData.map((record, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="border border-gray-400 p-2 text-center">{index + 1}</td>
                      <td className="border border-gray-400 p-2 text-center">
                        {formatIndonesianDate(record.date)}
                      </td>
                      <td className="border border-gray-400 p-2 text-center">
                        {record.checkIn ? formatTime(record.checkIn) : '-'}
                      </td>
                      <td className="border border-gray-400 p-2 text-center">
                        {record.checkOut ? formatTime(record.checkOut) : '-'}
                      </td>
                      <td className="border border-gray-400 p-2 text-center">
                        <span className={cn(
                          "inline-block px-2 py-1 rounded text-xs font-medium",
                          getStatusBadgeColor(record.attendanceStatus || record.status || '')
                        )}>
                          {formatAttendanceStatus(record.attendanceStatus || record.status || '')}
                        </span>
                      </td>
                      <td className="border border-gray-400 p-2 text-center">
                        {record.latenessMinutes && record.latenessMinutes > 0 
                          ? `Terlambat ${record.latenessMinutes} menit` 
                          : record.notes || '-'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="border border-gray-400 p-4 text-center text-gray-500">
                      Belum ada data absensi untuk bulan ini
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Attendance Legend */}
          <div className="grid grid-cols-2 gap-6 mb-6 text-xs">
            <div>
              <h4 className="font-semibold mb-2">Keterangan Status:</h4>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-200 rounded border"></div>
                  <span>Hadir: Karyawan masuk kerja</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-blue-200 rounded border"></div>
                  <span>Cuti: Karyawan mengambil cuti</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-200 rounded border"></div>
                  <span>Alpha: Karyawan tidak masuk tanpa keterangan</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gray-200 rounded border"></div>
                  <span>Belum Diatur: Status belum ditentukan</span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">Ringkasan Bulan {formatIndonesianMonth(payroll.month)}:</h4>
              <div className="space-y-1">
                <div>Total Hari Hadir: <span className="font-semibold">{attendanceSummary.totalHadir} hari</span></div>
                <div>Total Hari Terlambat: <span className="font-semibold">{attendanceSummary.totalTerlambat} hari</span></div>
                <div>Total Hari Alpha: <span className="font-semibold">{attendanceSummary.totalAlpha} hari</span></div>
                <div>Total Hari Cuti: <span className="font-semibold">{attendanceSummary.totalCuti} hari</span></div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-4 border-t border-gray-300 text-center text-xs text-gray-600">
            <p>Dokumen ini dicetak secara otomatis pada {formatIndonesianDate(new Date())} pukul {formatTime(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }))}</p>
            <p className="mt-1">Setoran Harian - Sistem Manajemen Karyawan</p>
          </div>
        </div>
      </div>
    );
  }
);

SalarySlip.displayName = "SalarySlip";