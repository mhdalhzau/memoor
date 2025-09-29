// Attendance calculation utilities
import type { Store } from './schema';

// Shift schedule type matching both default and custom shifts
export interface ShiftSchedule {
  start: string;
  end: string;
}

export interface ShiftSchedules {
  [key: string]: ShiftSchedule;
}

// Shift time definitions (Indonesian SPBU shift standards)
export const SHIFT_SCHEDULES: ShiftSchedules = {
  pagi: { start: '07:00', end: '15:00' },
  siang: { start: '15:00', end: '23:00' },
  malam: { start: '23:00', end: '07:00' }
};

// Get store's custom shifts or return default shifts
export function getStoreShifts(store?: Pick<Store, 'shifts'> | null): ShiftSchedules {
  if (!store?.shifts) {
    return SHIFT_SCHEDULES;
  }
  
  try {
    const parsed = JSON.parse(store.shifts);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return SHIFT_SCHEDULES;
    }
    
    // Convert array format [{name, start, end}] to object format {name: {start, end}}
    const shiftsObject: ShiftSchedules = {};
    parsed.forEach((shift: { name: string; start: string; end: string }) => {
      const key = shift.name.toLowerCase().replace(/\s+/g, '_');
      shiftsObject[key] = { start: shift.start, end: shift.end };
    });
    
    return shiftsObject;
  } catch (error) {
    console.error('Failed to parse store shifts:', error);
    return SHIFT_SCHEDULES;
  }
}

// Day boundary reset at 3 AM WIB (Indonesia business standard)
const DAY_RESET_HOUR = 3;

// Convert time string (HH:MM) to minutes since day reset (3 AM)
function timeToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number);
  let totalMinutes = hours * 60 + minutes;
  
  // Adjust for 3 AM day reset
  // Times from 03:00 - 23:59 are positive
  // Times from 00:00 - 02:59 are considered next day (+24 hours)
  if (hours < DAY_RESET_HOUR) {
    totalMinutes += 24 * 60; // Add 24 hours for next day
  }
  
  // Normalize to start from 3 AM = 0
  totalMinutes -= DAY_RESET_HOUR * 60;
  
  return totalMinutes;
}

// Convert minutes since midnight to time string (HH:MM)
function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60) % 24;
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

// Auto-detect shift based on check-in time
export function detectShift(checkInTime: string, customShifts?: ShiftSchedules): string {
  const shifts = customShifts || SHIFT_SCHEDULES;
  const checkInMinutes = timeToMinutes(checkInTime);
  
  // Find the closest shift based on check-in time
  let closestShift = Object.keys(shifts)[0];
  let minDifference = Infinity;
  
  Object.entries(shifts).forEach(([shiftName, schedule]) => {
    const shiftStartMinutes = timeToMinutes(schedule.start);
    const difference = Math.abs(checkInMinutes - shiftStartMinutes);
    
    if (difference < minDifference) {
      minDifference = difference;
      closestShift = shiftName;
    }
  });
  
  return closestShift;
}

// Calculate lateness in minutes
export function calculateLateness(checkInTime: string, shift: string, customShifts?: ShiftSchedules): number {
  const shifts = customShifts || SHIFT_SCHEDULES;
  const shiftSchedule = shifts[shift];
  
  if (!shiftSchedule) {
    console.warn(`Shift "${shift}" not found in shifts, using 0 lateness`);
    return 0;
  }
  
  const checkInMinutes = timeToMinutes(checkInTime);
  const shiftStartMinutes = timeToMinutes(shiftSchedule.start);
  
  return Math.max(0, checkInMinutes - shiftStartMinutes);
}

// Calculate early arrival in minutes (positive when arriving before shift start)
export function calculateEarlyArrival(checkInTime: string, shift: string, customShifts?: ShiftSchedules): number {
  const shifts = customShifts || SHIFT_SCHEDULES;
  const shiftSchedule = shifts[shift];
  
  if (!shiftSchedule) {
    console.warn(`Shift "${shift}" not found in shifts, using 0 early arrival`);
    return 0;
  }
  
  const checkInMinutes = timeToMinutes(checkInTime);
  const shiftStartMinutes = timeToMinutes(shiftSchedule.start);
  
  // Return positive minutes when arriving early (check-in before shift start)
  return Math.max(0, shiftStartMinutes - checkInMinutes);
}

// Calculate overtime in minutes
export function calculateOvertime(checkOutTime: string, shift: string, customShifts?: ShiftSchedules): number {
  if (!checkOutTime) return 0;
  
  const shifts = customShifts || SHIFT_SCHEDULES;
  const shiftSchedule = shifts[shift];
  
  if (!shiftSchedule) {
    console.warn(`Shift "${shift}" not found in shifts, using 0 overtime`);
    return 0;
  }
  
  const shiftStart = timeToMinutes(shiftSchedule.start);
  let shiftEnd = timeToMinutes(shiftSchedule.end);
  let checkOut = timeToMinutes(checkOutTime);
  
  // Handle wrap-around shifts (night shift: 23:00-07:00)
  // For shifts where end < start, normalize to continuous timeline
  if (shiftEnd <= shiftStart) {
    shiftEnd += 1440; // Add 24 hours to end time
  }
  
  // If checkout is before shift start, it's part of next day
  if (checkOut < shiftStart) {
    checkOut += 1440; // Add 24 hours to checkout time
  }
  
  return Math.max(0, checkOut - shiftEnd);
}

// Get current month's day count
export function getCurrentMonthDays(): number {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  return new Date(year, month + 1, 0).getDate();
}

// Format attendance data for display
export function formatAttendanceData(attendance: {
  checkIn: string;
  checkOut: string | null;
  shift: string;
  latenessMinutes: number;
  overtimeMinutes: number;
}) {
  return {
    jamMasuk: attendance.checkIn,
    jamKeluar: attendance.checkOut || '-',
    shift: attendance.shift,
    telat: `${attendance.latenessMinutes} menit`,
    lembur: `${attendance.overtimeMinutes} menit`
  };
}
