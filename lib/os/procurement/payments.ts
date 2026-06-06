import type { ProcurementDb, VendorPayment } from "@/lib/os/procurement/types";

export function listVendorPayments(db: ProcurementDb, vendorId?: string) {
  const rows = vendorId
    ? db.vendorPayments.filter((p) => p.vendorId === vendorId)
    : db.vendorPayments;
  return [...rows].sort((a, b) => b.paymentDate.localeCompare(a.paymentDate));
}

export function computePaymentStats(db: ProcurementDb) {
  const totalPaid = db.vendorPayments.reduce((s, p) => s + p.amount, 0);
  const thisMonth = new Date().toISOString().slice(0, 7);
  const paidThisMonth = db.vendorPayments
    .filter((p) => p.paymentDate.startsWith(thisMonth))
    .reduce((s, p) => s + p.amount, 0);
  return { totalPaid, paidThisMonth, paymentCount: db.vendorPayments.length };
}

export function summarizePaymentsByVendor(db: ProcurementDb) {
  const map = new Map<string, { vendorName: string; total: number; count: number }>();
  for (const payment of db.vendorPayments) {
    const current = map.get(payment.vendorId) ?? {
      vendorName: payment.vendorName,
      total: 0,
      count: 0,
    };
    map.set(payment.vendorId, {
      vendorName: payment.vendorName,
      total: current.total + payment.amount,
      count: current.count + 1,
    });
  }
  return [...map.entries()]
    .map(([vendorId, stats]) => ({ vendorId, ...stats }))
    .sort((a, b) => b.total - a.total);
}

export type CreatePaymentInput = Omit<
  VendorPayment,
  "id" | "createdAt" | "vendorName"
>;
