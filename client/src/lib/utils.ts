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
