import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatPercentage(value: number, decimals = 1): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatMonthYear(year: number, month: number): string {
  const date = new Date(year, month - 1);
  return date.toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
  });
}

export function getStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case "locked":
      return "bg-green-100 text-green-800";
    case "countersigned":
      return "bg-lime-100 text-lime-800";
    case "signed":
      return "bg-yellow-100 text-yellow-800";
    case "submitted":
      return "bg-orange-100 text-orange-800";
    case "draft":
      return "bg-gray-100 text-gray-600";
    case "missing":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-600";
  }
}

export function getSeverityColor(severity: string): string {
  switch (severity) {
    case "error":
      return "bg-red-100 text-red-800 border-red-200";
    case "warning":
      return "bg-amber-100 text-amber-800 border-amber-200";
    case "info":
      return "bg-blue-100 text-blue-800 border-blue-200";
    default:
      return "bg-gray-100 text-gray-600 border-gray-200";
  }
}

export function daysOverdue(year: number, month: number, deadlineDays: number): number {
  const periodEnd = new Date(year, month, 0);
  const deadline = new Date(periodEnd);
  deadline.setDate(deadline.getDate() + deadlineDays);
  const now = new Date();
  const diff = Math.floor((now.getTime() - deadline.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(0, diff);
}
