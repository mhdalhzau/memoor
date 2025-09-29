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
        {/* Single Page: Complete Salary Slip with Attendance */}
        <div className="salary-page bg-white text-black p-6 max-w-[210mm] mx-auto">
          {/* Header */}
          <div className="text-center mb-3 border-b-2 border-black pb-2">
            <h1 className="text-lg font-bold mb-1">SETORAN HARIAN - SLIP GAJI KARYAWAN</h1>
            {payroll.store && (
              <div className="text-xs space-y-0.5">
                <p className="font-semibold">{payroll.store.name}</p>
                {payroll.store.address && <p>{payroll.store.address}</p>}
                {payroll.store.phone && <p>Telp: {payroll.store.phone}</p>}
              </div>
            )}
          </div>

          {/* Employee Information - 3 Column Grid */}
          <div className="grid grid-cols-3 gap-2 mb-3">
            <div className="border-2 border-black rounded p-2">
              <h3 className="font-bold mb-1 text-xs border-b border-black pb-0.5">KARYAWAN</h3>
              <div className="space-y-0.5 text-xs">
                <div><span className="font-medium">Nama:</span> {payroll.user?.name || '-'}</div>
                <div><span className="font-medium">Jabatan:</span> {payroll.user?.role || 'staff'}</div>
              </div>
            </div>
            
            <div className="border-2 border-black rounded p-2">
              <h3 className="font-bold mb-1 text-xs border-b border-black pb-0.5">PERIODE</h3>
              <div className="space-y-0.5 text-xs">
                <div><span className="font-medium">Bulan:</span> {formatIndonesianMonth(payroll.month)}</div>
                <div><span className="font-medium">Status:</span> <span className={`px-1.5 py-0.5 rounded text-xs font-semibold ${
                  payroll.status === 'paid' ? 'bg-green-200 text-green-900' : 'bg-yellow-200 text-yellow-900'
                }`}>{payroll.status === 'paid' ? 'Lunas' : 'Pending'}</span></div>
              </div>
            </div>

            <div className="border-2 border-black rounded p-2">
              <h3 className="font-bold mb-1 text-xs border-b border-black pb-0.5">RINGKASAN</h3>
              <div className="flex gap-2 justify-around text-xs">
                <div className="text-center">
                  <div className="text-sm font-bold text-green-700">{attendanceSummary.totalHadir}</div>
                  <div className="text-xs">Hadir</div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-bold text-yellow-700">{attendanceSummary.totalTerlambat}</div>
                  <div className="text-xs">Telat</div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-bold text-red-700">{attendanceSummary.totalAlpha}</div>
                  <div className="text-xs">Alpha</div>
                </div>
              </div>
            </div>
          </div>

          {/* DETAIL ABSENSI - No Card */}
          <div className="mb-3">
            <h3 className="font-bold text-sm mb-1 pb-1 border-b-2 border-black">DETAIL ABSENSI</h3>
            <table className="w-full text-xs border-collapse">
              <thead className="bg-gray-200">
                <tr>
                  <th className="border border-gray-400 py-1 px-2 text-center font-bold">Tgl</th>
                  <th className="border border-gray-400 py-1 px-2 text-center font-bold">Masuk</th>
                  <th className="border border-gray-400 py-1 px-2 text-center font-bold">Keluar</th>
                  <th className="border border-gray-400 py-1 px-2 text-center font-bold">Status</th>
                </tr>
              </thead>
              <tbody>
                {attendanceData?.attendanceData?.length ? (
                  attendanceData.attendanceData.map((record, index) => {
                    const date = new Date(record.date);
                    const day = date.getDate();
                    return (
                      <tr key={index}>
                        <td className="border border-gray-300 py-0.5 px-2 text-center font-medium">{day}</td>
                        <td className="border border-gray-300 py-0.5 px-2 text-center">
                          {record.checkIn ? formatTime(record.checkIn) : '-'}
                        </td>
                        <td className="border border-gray-300 py-0.5 px-2 text-center">
                          {record.checkOut ? formatTime(record.checkOut) : '-'}
                        </td>
                        <td className="border border-gray-300 py-0.5 px-2 text-center">
                          <span className={cn(
                            "px-1.5 py-0.5 rounded text-xs font-semibold inline-block",
                            getStatusBadgeColor(record.attendanceStatus || record.status || '')
                          )}>
                            {formatAttendanceStatus(record.attendanceStatus || record.status || '')}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={4} className="border border-gray-300 py-3 text-center text-gray-500">
                      <div className="text-xs font-medium">Belum ada data</div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            <div className="mt-1.5 text-xs flex gap-3">
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 bg-green-200 border border-green-400 rounded"></span>
                <span className="font-medium">Hadir</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 bg-red-200 border border-red-400 rounded"></span>
                <span className="font-medium">Alpha</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 bg-blue-200 border border-blue-400 rounded"></span>
                <span className="font-medium">Cuti</span>
              </span>
            </div>
          </div>

          {/* RINCIAN GAJI */}
          <div className="border-2 border-black rounded p-2 mb-3">
            <h3 className="font-bold text-sm mb-1.5 pb-1 border-b border-black">RINCIAN GAJI</h3>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="font-medium">Gaji Pokok</span>
                <span className="font-bold">{formatRupiah(baseSalary)}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Lembur</span>
                <span className="font-bold">{formatRupiah(overtimePay)}</span>
              </div>
              
              {/* Bonus Items */}
              {payroll.bonusList && payroll.bonusList.length > 0 && (
                <>
                  <div className="border-t pt-1 mt-1">
                    <div className="font-bold text-green-700 mb-0.5">BONUS:</div>
                    {payroll.bonusList.map((bonus, index) => (
                      <div key={index} className="flex justify-between text-green-700 pl-2">
                        <span>{index + 1}. {bonus.name}</span>
                        <span className="font-bold">{formatRupiah(bonus.amount)}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* Deduction Items */}
              {payroll.deductionList && payroll.deductionList.length > 0 && (
                <>
                  <div className="border-t pt-1 mt-1">
                    <div className="font-bold text-red-700 mb-0.5">POTONGAN:</div>
                    {payroll.deductionList.map((deduction, index) => (
                      <div key={index} className="flex justify-between text-red-700 pl-2">
                        <span>{index + 1}. {deduction.name}</span>
                        <span className="font-bold">{formatRupiah(deduction.amount)}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* Total */}
              <div className="border-t-2 border-black pt-1.5 mt-1.5">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-sm">TOTAL BERSIH</span>
                  <span className="text-base font-bold">{formatRupiah(netSalary)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Signatures */}
          <div className="mt-4 pt-2 border-t-2 border-gray-300">
            <div className="grid grid-cols-2 gap-10 text-center text-xs">
              <div>
                <p className="mb-10 font-medium">Karyawan</p>
                <div className="border-t-2 border-black pt-1">
                  <p className="font-bold">{payroll.user?.name}</p>
                </div>
              </div>
              <div>
                <p className="mb-10 font-medium">HRD / Manager</p>
                <div className="border-t-2 border-black pt-1">
                  <p className="font-bold">{payroll.store?.manager || '________________'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-2 text-center text-xs text-gray-600">
            <p>Dicetak: {formatIndonesianDate(new Date())} - Setoran Harian</p>
          </div>
        </div>

      </div>
    );
  }
);

SalarySlip.displayName = "SalarySlip";
