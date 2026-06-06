/** Monetary values are stored as integer paise (1 ₹ = 100 paise). */

export const PAISE_PER_RUPEE = 100;

export const EXPENSE_MANAGER_THRESHOLD_PAISE = 500_000; // ₹5,000
export const EXPENSE_OWNER_THRESHOLD_PAISE = 2_000_000; // ₹20,000
export const PURCHASE_MANAGER_THRESHOLD_PAISE = 1_000_000; // ₹10,000
export const PURCHASE_OWNER_THRESHOLD_PAISE = 2_500_000; // ₹25,000

export function rupeesToPaise(rupees: number): number {
  return Math.round(rupees * PAISE_PER_RUPEE);
}

export function paiseToRupees(paise: number): number {
  return paise / PAISE_PER_RUPEE;
}

export function formatPaise(paise: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(paiseToRupees(paise));
}

export function formatPaiseCompact(paise: number): string {
  const rupees = paiseToRupees(paise);
  if (Math.abs(rupees) >= 100_000) return `₹${(rupees / 100_000).toFixed(1)}L`;
  if (Math.abs(rupees) >= 1_000) return `₹${(rupees / 1_000).toFixed(1)}K`;
  return formatPaise(paise);
}

export function formatPercent(value: number, digits = 1): string {
  return `${value.toFixed(digits)}%`;
}

export function marginColorClass(marginPercent: number): string {
  if (marginPercent > 15) return "text-emerald-600";
  if (marginPercent >= 8) return "text-amber-600";
  return "text-rose-600";
}
