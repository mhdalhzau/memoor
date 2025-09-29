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

    console.log('=== SALARY SLIP RENDER ===');
    console.log('Payroll:', payroll);
    console.log('Attendance Data:', attendanceData);
    console.log('Attendance Records:', attendanceData?.attendanceData);
    console.log('Attendance Records Length:', attendanceData?.attendanceData?.length);

    if (attendanceData?.attendanceData) {
      attendanceData.attendanceData.forEach(record => {
        const status = record.attendanceStatus || record.status || '';
        console.log(`Processing record - Date: ${record.date}, Status: ${status}, Lateness: ${record.latenessMinutes}`);
        
        switch (status) {
          case 'hadir':
            attendanceSummary.totalHadir++;
            if (record.latenessMinutes && record.latenessMinutes > 0) {
              attendanceSummary.totalTerlambat++;
              console.log(`  -> Marked as late (${record.latenessMinutes} minutes)`);
            }
            break;
          case 'alpha':
            attendanceSummary.totalAlpha++;
            console.log(`  -> Marked as alpha`);
            break;
          case 'cuti':
            attendanceSummary.totalCuti++;
            console.log(`  -> Marked as cuti`);
            break;
        }
      });
    } else {
      console.log('⚠️ NO ATTENDANCE DATA AVAILABLE');
    }

    console.log('=== ATTENDANCE SUMMARY ===');
    console.log('Total Hadir:', attendanceSummary.totalHadir);
    console.log('Total Terlambat:', attendanceSummary.totalTerlambat);
    console.log('Total Alpha:', attendanceSummary.totalAlpha);
    console.log('Total Cuti:', attendanceSummary.totalCuti);

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
        {/* Single Page: Complete Salary Slip - Extra Compact for A4 */}
        <div className="salary-page bg-white text-black p-4 max-w-[210mm] mx-auto text-xs">
          {/* Header - Compact */}
          <div className="text-center mb-2 border-b-2 border-black pb-1">
            <h1 className="text-base font-bold mb-0.5">SETORAN HARIAN - SLIP GAJI KARYAWAN</h1>
            {payroll.store && (
              <div className="text-xs space-y-0">
                <p className="font-semibold">{payroll.store.name}</p>
                {payroll.store.address && <p className="text-xs">{payroll.store.address}</p>}
                {payroll.store.phone && <p className="text-xs">Telp: {payroll.store.phone}</p>}
              </div>
            )}
          </div>

          {/* Employee Information - 3 Column Grid - Compact */}
          <div className="grid grid-cols-3 gap-1.5 mb-2">
            <div className="border-2 border-black rounded p-1.5">
              <h3 className="font-bold mb-0.5 text-xs border-b border-black">KARYAWAN</h3>
              <div className="space-y-0 text-xs">
                <div><span className="font-medium">Nama:</span> {payroll.user?.name || '-'}</div>
                <div><span className="font-medium">Jabatan:</span> {payroll.user?.role || 'staff'}</div>
              </div>
            </div>
            
            <div className="border-2 border-black rounded p-1.5">
              <h3 className="font-bold mb-0.5 text-xs border-b border-black">PERIODE</h3>
              <div className="space-y-0 text-xs">
                <div><span className="font-medium">Bulan:</span> {formatIndonesianMonth(payroll.month)}</div>
                <div><span className="font-medium">Status:</span> <span className={`px-1 py-0.5 rounded text-xs font-semibold ${
                  payroll.status === 'paid' ? 'bg-green-200 text-green-900' : 'bg-yellow-200 text-yellow-900'
                }`}>{payroll.status === 'paid' ? 'Lunas' : 'Pending'}</span></div>
              </div>
            </div>

            <div className="border-2 border-black rounded p-1.5 bg-gray-50">
              <h3 className="font-bold mb-1 text-xs border-b border-black pb-0.5">RINGKASAN ABSENSI</h3>
              <div className="grid grid-cols-3 gap-1 text-xs">
                <div className="text-center bg-green-100 border border-green-300 rounded py-1">
                  <div className="text-sm font-bold text-green-800">{attendanceSummary.totalHadir}</div>
                  <div className="text-xs font-medium text-green-700">Hadir</div>
                </div>
                <div className="text-center bg-yellow-100 border border-yellow-300 rounded py-1">
                  <div className="text-sm font-bold text-yellow-800">{attendanceSummary.totalTerlambat}</div>
                  <div className="text-xs font-medium text-yellow-700">Telat</div>
                </div>
                <div className="text-center bg-red-100 border border-red-300 rounded py-1">
                  <div className="text-sm font-bold text-red-800">{attendanceSummary.totalAlpha}</div>
                  <div className="text-xs font-medium text-red-700">Alpha</div>
                </div>
              </div>
            </div>
          </div>

          {/* DETAIL ABSENSI - Super Compact */}
          <div className="mb-2">
            <h3 className="font-bold text-xs mb-0.5 pb-0.5 border-b-2 border-black">DETAIL ABSENSI</h3>
            <table className="w-full text-xs border-collapse">
              <thead className="bg-gray-200">
                <tr>
                  <th className="border border-gray-400 py-0.5 px-1 text-center font-bold text-xs">Tgl</th>
                  <th className="border border-gray-400 py-0.5 px-1 text-center font-bold text-xs">Masuk</th>
                  <th className="border border-gray-400 py-0.5 px-1 text-center font-bold text-xs">Keluar</th>
                  <th className="border border-gray-400 py-0.5 px-1 text-center font-bold text-xs">Status</th>
                </tr>
              </thead>
              <tbody>
                {attendanceData?.attendanceData?.length ? (
                  attendanceData.attendanceData.map((record, index) => {
                    const date = new Date(record.date);
                    const day = date.getDate();
                    return (
                      <tr key={index}>
                        <td className="border border-gray-300 py-0 px-1 text-center font-medium text-xs">{day}</td>
                        <td className="border border-gray-300 py-0 px-1 text-center text-xs">
                          {record.checkIn ? formatTime(record.checkIn) : '-'}
                        </td>
                        <td className="border border-gray-300 py-0 px-1 text-center text-xs">
                          {record.checkOut ? formatTime(record.checkOut) : '-'}
                        </td>
                        <td className="border border-gray-300 py-0 px-1 text-center text-xs">
                          <span className={cn(
                            "px-1 py-0 rounded text-xs font-semibold inline-block",
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
                    <td colSpan={4} className="border border-gray-300 py-2 text-center text-gray-500 text-xs">
                      Belum ada data
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            <div className="mt-1 text-xs flex gap-2">
              <span className="flex items-center gap-0.5">
                <span className="w-2 h-2 bg-green-200 border border-green-400 rounded"></span>
                <span>Hadir</span>
              </span>
              <span className="flex items-center gap-0.5">
                <span className="w-2 h-2 bg-red-200 border border-red-400 rounded"></span>
                <span>Alpha</span>
              </span>
              <span className="flex items-center gap-0.5">
                <span className="w-2 h-2 bg-blue-200 border border-blue-400 rounded"></span>
                <span>Cuti</span>
              </span>
            </div>
          </div>

          {/* RINCIAN GAJI - Compact */}
          <div className="border-2 border-black rounded p-1.5 mb-2">
            <h3 className="font-bold text-xs mb-1 pb-0.5 border-b border-black">RINCIAN GAJI</h3>
            <div className="space-y-0.5 text-xs">
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
                  <div className="border-t pt-0.5 mt-0.5">
                    <div className="font-bold text-green-700 mb-0.5 text-xs">BONUS:</div>
                    {payroll.bonusList.map((bonus, index) => (
                      <div key={index} className="flex justify-between text-green-700 pl-2 text-xs">
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
                  <div className="border-t pt-0.5 mt-0.5">
                    <div className="font-bold text-red-700 mb-0.5 text-xs">POTONGAN:</div>
                    {payroll.deductionList.map((deduction, index) => (
                      <div key={index} className="flex justify-between text-red-700 pl-2 text-xs">
                        <span>{index + 1}. {deduction.name}</span>
                        <span className="font-bold">{formatRupiah(deduction.amount)}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* Total */}
              <div className="border-t-2 border-black pt-1 mt-1">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-xs">TOTAL BERSIH</span>
                  <span className="text-sm font-bold">{formatRupiah(netSalary)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Signatures - Compact */}
          <div className="mt-2 pt-1.5 border-t-2 border-gray-300">
            <div className="grid grid-cols-2 gap-8 text-center text-xs">
              <div>
                <p className="mb-8">Karyawan</p>
                <div className="border-t-2 border-black pt-0.5">
                  <p className="font-bold text-xs">{payroll.user?.name}</p>
                </div>
              </div>
              <div>
                <p className="mb-8">HRD / Manager</p>
                <div className="border-t-2 border-black pt-0.5">
                  <p className="font-bold text-xs">{payroll.store?.manager || '________________'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer - Compact */}
          <div className="mt-1.5 text-center text-xs text-gray-600">
            <p>Dicetak: {formatIndonesianDate(new Date())} - Setoran Harian</p>
          </div>
        </div>

      </div>
    );
  }
);

SalarySlip.displayName = "SalarySlip";
