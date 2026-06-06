import type { ProcurementDb } from "@/lib/os/procurement/types";

export type ItemPurchaseIntelligence = {
  itemId: string;
  itemName: string;
  averagePrice: number;
  lastPrice: number;
  bestVendor: { name: string; avgRate: number } | null;
  worstVendor: { name: string; avgRate: number } | null;
  priceTrend: "up" | "down" | "stable";
  purchaseFrequencyDays: number;
  expectedMonthlyConsumption: number;
  suggestedReorderQty: number;
  lastPurchaseDate: string | null;
};

export type SmartPurchaseRecommendation = {
  id: string;
  itemId: string;
  itemName: string;
  reason: string;
  suggestedQty: number;
  unit: string;
  estimatedCost: number;
  preferredVendor: string | null;
  urgency: "critical" | "soon" | "normal";
};

function daysBetween(a: string, b: string): number {
  return Math.abs(
    (new Date(b).getTime() - new Date(a).getTime()) / (1000 * 60 * 60 * 24)
  );
}

export function buildItemPurchaseIntelligence(
  db: ProcurementDb,
  itemId: string
): ItemPurchaseIntelligence | null {
  const item = db.inventoryItems.find((i) => i.id === itemId);
  if (!item) return null;

  const lines: { vendor: string; rate: number; qty: number; date: string }[] = [];
  for (const bill of db.purchaseBills.filter((b) => b.status === "posted")) {
    for (const line of bill.items) {
      if (line.itemId === itemId || line.itemName === item.name) {
        lines.push({
          vendor: bill.vendorName,
          rate: line.rate,
          qty: line.quantity,
          date: bill.invoiceDate,
        });
      }
    }
  }

  if (!lines.length) {
    return {
      itemId,
      itemName: item.name,
      averagePrice: 0,
      lastPrice: 0,
      bestVendor: null,
      worstVendor: null,
      priceTrend: "stable",
      purchaseFrequencyDays: 0,
      expectedMonthlyConsumption: 0,
      suggestedReorderQty: Math.max(item.parLevel - item.currentStock, 0),
      lastPurchaseDate: null,
    };
  }

  lines.sort((a, b) => b.date.localeCompare(a.date));
  const totalQty = lines.reduce((s, l) => s + l.qty, 0);
  const weightedSum = lines.reduce((s, l) => s + l.rate * l.qty, 0);
  const averagePrice = totalQty > 0 ? weightedSum / totalQty : lines[0].rate;
  const lastPrice = lines[0].rate;

  const vendorRates = new Map<string, { sum: number; count: number }>();
  for (const line of lines) {
    const v = vendorRates.get(line.vendor) ?? { sum: 0, count: 0 };
    vendorRates.set(line.vendor, { sum: v.sum + line.rate, count: v.count + 1 });
  }
  const vendorAvgs = [...vendorRates.entries()]
    .map(([name, { sum, count }]) => ({ name, avgRate: sum / count }))
    .sort((a, b) => a.avgRate - b.avgRate);

  const recent = lines.slice(0, 3);
  const older = lines.slice(3, 6);
  const recentAvg = recent.reduce((s, l) => s + l.rate, 0) / Math.max(recent.length, 1);
  const olderAvg =
    older.length > 0 ? older.reduce((s, l) => s + l.rate, 0) / older.length : recentAvg;
  const priceTrend =
    recentAvg > olderAvg * 1.05 ? "up" : recentAvg < olderAvg * 0.95 ? "down" : "stable";

  const dates = [...new Set(lines.map((l) => l.date))].sort();
  const purchaseFrequencyDays =
    dates.length > 1
      ? daysBetween(dates[0], dates[dates.length - 1]) / (dates.length - 1)
      : 30;

  const consumption = db.inventoryMovements
    .filter((m) => m.itemId === itemId && m.type === "consumption")
    .reduce((s, m) => s + Math.abs(m.quantity), 0);
  const consumptionDays = 30;
  const expectedMonthlyConsumption = consumption;

  const suggestedReorderQty = Math.max(
    item.parLevel - item.currentStock,
    expectedMonthlyConsumption * 0.5
  );

  return {
    itemId,
    itemName: item.name,
    averagePrice,
    lastPrice,
    bestVendor: vendorAvgs[0] ?? null,
    worstVendor: vendorAvgs[vendorAvgs.length - 1] ?? null,
    priceTrend,
    purchaseFrequencyDays,
    expectedMonthlyConsumption,
    suggestedReorderQty: Math.round(suggestedReorderQty * 10) / 10,
    lastPurchaseDate: lines[0].date,
  };
}

export function generateSmartPurchaseRecommendations(
  db: ProcurementDb,
  limit = 12
): SmartPurchaseRecommendation[] {
  const recs: SmartPurchaseRecommendation[] = [];

  for (const item of db.inventoryItems) {
    const intel = buildItemPurchaseIntelligence(db, item.id);
    if (!intel) continue;

    const belowPar = item.currentStock < item.parLevel;
    const priceUp = intel.priceTrend === "up";
    if (!belowPar && !priceUp) continue;

    const qty = intel.suggestedReorderQty;
    if (qty <= 0) continue;

    recs.push({
      id: `rec_${item.id}`,
      itemId: item.id,
      itemName: item.name,
      reason: belowPar
        ? `Stock ${item.currentStock}${item.unit} below par ${item.parLevel}${item.unit}`
        : `Price trend rising — last ₹${intel.lastPrice.toFixed(0)} vs avg ₹${intel.averagePrice.toFixed(0)}`,
      suggestedQty: qty,
      unit: item.unit,
      estimatedCost: qty * (intel.lastPrice || intel.averagePrice),
      preferredVendor: intel.bestVendor?.name ?? null,
      urgency: item.currentStock <= item.parLevel * 0.25 ? "critical" : belowPar ? "soon" : "normal",
    });
  }

  return recs
    .sort((a, b) => {
      const rank = { critical: 0, soon: 1, normal: 2 };
      return rank[a.urgency] - rank[b.urgency];
    })
    .slice(0, limit);
}

export function buildProcurementIntelligenceSummary(db: ProcurementDb): string[] {
  const recs = generateSmartPurchaseRecommendations(db, 5);
  return recs.map(
    (r) =>
      `${r.itemName}: reorder ${r.suggestedQty}${r.unit}${r.preferredVendor ? ` from ${r.preferredVendor}` : ""} — ${r.reason}`
  );
}
