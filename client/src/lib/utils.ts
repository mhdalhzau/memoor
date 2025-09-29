import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Format currency as Rupiah
export function formatRupiah(amount: string | number | null | undefined): string {
  if (!amount && amount !== 0) return "Rp 0";
  
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(numAmount)) return "Rp 0";
  
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numAmount);
}

// Format liters with proper decimal handling
export function formatLiters(amount: string | number | null | undefined): string {
  if (!amount && amount !== 0) return "0";
  
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(numAmount)) return "0";
  
  return new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(numAmount);
}

// Format numbers without currency for input fields
export function formatNumber(amount: string | number | null | undefined): string {
  if (!amount && amount !== 0) return "0";
  
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(numAmount)) return "0";
  
  return new Intl.NumberFormat('id-ID').format(numAmount);
}

// Indonesian month names
const INDONESIAN_MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

// Format YYYY-MM to readable Indonesian format (e.g., "September 2025")
export function formatIndonesianMonth(monthStr: string): string {
  if (!monthStr || !monthStr.includes('-')) return monthStr;
  
  try {
    const [year, month] = monthStr.split('-');
    const monthIndex = parseInt(month) - 1;
    
    if (monthIndex < 0 || monthIndex > 11) return monthStr;
    
    return `${INDONESIAN_MONTHS[monthIndex]} ${year}`;
  } catch (error) {
    console.warn('Error formatting Indonesian month:', error);
    return monthStr;
  }
}

// Get current month in YYYY-MM format
export function getCurrentMonth(): string {
  return new Date().toISOString().slice(0, 7);
}

// Get previous month in YYYY-MM format
export function getPreviousMonth(monthStr: string): string {
  try {
    const [year, month] = monthStr.split('-').map(Number);
    const date = new Date(year, month - 1, 1);
    date.setMonth(date.getMonth() - 1);
    
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  } catch (error) {
    console.warn('Error getting previous month:', error);
    return monthStr;
  }
}

// Get next month in YYYY-MM format
export function getNextMonth(monthStr: string): string {
  try {
    const [year, month] = monthStr.split('-').map(Number);
    const date = new Date(year, month - 1, 1);
    date.setMonth(date.getMonth() + 1);
    
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  } catch (error) {
    console.warn('Error getting next month:', error);
    return monthStr;
  }
}

// Generate array of months for selection (last 12 months and next 6 months)
export function getSelectableMonths(): Array<{ value: string; label: string }> {
  const months = [];
  const currentDate = new Date();
  
  // Generate 12 previous months
  for (let i = 11; i >= 0; i--) {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
    const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const label = formatIndonesianMonth(value);
    months.push({ value, label });
  }
  
  // Add next 6 months
  for (let i = 1; i <= 6; i++) {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth() + i, 1);
    const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const label = formatIndonesianMonth(value);
    months.push({ value, label });
  }
  
  return months;
}

// Format date range for display
export function formatDateRange(startMonth: string, endMonth: string): string {
  if (startMonth === endMonth) {
    return formatIndonesianMonth(startMonth);
  }
  
  return `${formatIndonesianMonth(startMonth)} - ${formatIndonesianMonth(endMonth)}`;
}
