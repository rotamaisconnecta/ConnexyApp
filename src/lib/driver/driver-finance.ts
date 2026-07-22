import { DriverFinanceEntry } from "./driver-types";

export function calculateCommission(amount: number, rate: number): number {
  return Math.round(amount * rate * 100) / 100;
}

export function calculateNetEarning(gross: number, commission: number): number {
  return Math.round((gross - commission) * 100) / 100;
}

export function formatFinanceEntry(entry: DriverFinanceEntry): string {
  const sign = entry.type === "credit" ? "+" : "-";
  const amount = entry.amount.toFixed(2).replace(".", ",");
  return `${sign} R$ ${amount} - ${entry.description}`;
}

export function getTotalCredits(entries: DriverFinanceEntry[]): number {
  return entries.filter((e) => e.type === "credit").reduce((sum, e) => sum + e.amount, 0);
}

export function getTotalDebits(entries: DriverFinanceEntry[]): number {
  return entries.filter((e) => e.type === "debit").reduce((sum, e) => sum + e.amount, 0);
}

export function getBalance(entries: DriverFinanceEntry[]): number {
  return Math.round((getTotalCredits(entries) - getTotalDebits(entries)) * 100) / 100;
}
