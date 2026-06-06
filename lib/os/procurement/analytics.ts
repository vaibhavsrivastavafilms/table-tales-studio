import {
  computeVariance,
  getVendorOutstanding,
} from "@/lib/os/procurement/local-db";
import type {
  ProcurementAnalytics,
  ProcurementDb,
  ProcurementInsight,
  StockAuditRow,
  VendorAgeingBucket,
} from "@/lib/os/procurement/types";

function daysBetween(a: string, b: string): number {
  const ms = new Date(b).getTime() - new Date(a).getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

export function computeVendorAgeing(db: ProcurementDb): VendorAgeingBucket[] {
  const today = new Date().toISOString().slice(0, 10);

  return db.vendors.map((vendor) => {
    const bucket: VendorAgeingBucket = {
      vendorId: vendor.id,
      vendorName: vendor.name,
      current: 0,
      days1to15: 0,
      days16to30: 0,
      days31to60: 0,
      days60plus: 0,
      total: getVendorOutstanding(db, vendor.id),
    };

    const debits = db.vendorLedger.filter(
      (e) => e.vendorId === vendor.id && e.debit > 0
    );

    for (const entry of debits) {
      const age = daysBetween(entry.createdAt.slice(0, 10), today);
      const open = entry.debit;
      if (age <= 15) bucket.days1to15 += open;
      else if (age <= 30) bucket.days16to30 += open;
      else if (age <= 60) bucket.days31to60 += open;
      else bucket.days60plus += open;
    }

    bucket.current = bucket.total - bucket.days1to15 - bucket.days16to30 - bucket.days31to60 - bucket.days60plus;
    if (bucket.current < 0) bucket.current = bucket.total;

    return bucket;
  });
}

export function computeProcurementAnalytics(db: ProcurementDb): ProcurementAnalytics {
  const today = new Date();
  const d7 = new Date(today);
  d7.setDate(d7.getDate() - 7);
  const d30 = new Date(today);
  d30.setDate(d30.getDate() - 30);

  const posted = db.purchaseBills.filter((b) => b.status === "posted");
  const in7 = posted.filter((b) => new Date(b.invoiceDate) >= d7);
  const in30 = posted.filter((b) => new Date(b.invoiceDate) >= d30);

  const purchaseVolume7d = in7.reduce((s, b) => s + b.totalValue, 0);
  const purchaseVolume30d = in30.reduce((s, b) => s + b.totalValue, 0);
  const avgBillValue = posted.length
    ? posted.reduce((s, b) => s + b.totalValue, 0) / posted.length
    : 0;

  const totalLines = posted.reduce((s, b) => s + b.items.length, 0);
  const omissionRate =
    totalLines > 0 ? db.omissionCases.length / totalLines : 0;

  const grnVarianceTotal = db.grns
    .filter((g) => g.status === "confirmed")
    .reduce(
      (s, g) =>
        s + g.lines.reduce((ls, line) => ls + Math.abs(line.variance), 0),
      0
    );

  const categorySpendMap = new Map<string, number>();
  for (const bill of posted) {
    for (const line of bill.items) {
      const item = db.inventoryItems.find((i) => i.id === line.itemId);
      const cat = item?.category ?? "Dry Store";
      categorySpendMap.set(cat, (categorySpendMap.get(cat) ?? 0) + line.amount);
    }
  }

  const dailyMap = new Map<string, number>();
  for (const bill of in30) {
    dailyMap.set(
      bill.invoiceDate,
      (dailyMap.get(bill.invoiceDate) ?? 0) + bill.totalValue
    );
  }

  return {
    purchaseVolume7d,
    purchaseVolume30d,
    avgBillValue,
    omissionRate,
    grnVarianceTotal,
    categorySpend: [...categorySpendMap.entries()].map(([category, amount]) => ({
      category: category as ProcurementAnalytics["categorySpend"][0]["category"],
      amount,
    })),
    dailyPurchases: [...dailyMap.entries()]
      .map(([date, amount]) => ({ date, amount }))
      .sort((a, b) => a.date.localeCompare(b.date)),
  };
}

export function buildStockAudit(
  db: ProcurementDb,
  date: string
): StockAuditRow[] {
  return db.inventoryItems.map((item) => {
    const opening = db.openingStock.find(
      (o) => o.itemId === item.id && o.date === date
    );
    const closing = db.closingStock.find(
      (c) => c.itemId === item.id && c.date === date
    );
    const purchases = db.inventoryMovements
      .filter(
        (m) =>
          m.itemId === item.id &&
          m.type === "purchase" &&
          m.createdAt.slice(0, 10) === date
      )
      .reduce((s, m) => s + m.quantity, 0);
    const consumption = db.inventoryMovements
      .filter(
        (m) =>
          m.itemId === item.id &&
          m.type === "consumption" &&
          m.createdAt.slice(0, 10) === date
      )
      .reduce((s, m) => s + Math.abs(m.quantity), 0);

    const varianceResult = computeVariance(db, item.id, date);
    const expected =
      varianceResult?.expected ??
      (opening ? opening.quantity + purchases - consumption : null);
    const actual = closing?.quantity ?? varianceResult?.actual ?? null;
    const variance =
      expected !== null && actual !== null ? actual - expected : null;

    return {
      itemId: item.id,
      itemName: item.name,
      opening: opening?.quantity ?? null,
      purchases,
      consumption,
      expected,
      closing: actual,
      variance,
      unit: item.unit,
    };
  });
}

export function generateProcurementInsights(
  db: ProcurementDb
): ProcurementInsight[] {
  const insights: ProcurementInsight[] = [];
  const analytics = computeProcurementAnalytics(db);
  const today = new Date().toISOString().slice(0, 10);
  const audit = buildStockAudit(db, today);

  const posted = db.purchaseBills.filter((b) => b.status === "posted");
  const cheeseSpend = posted.reduce((sum, bill) => {
    return (
      sum +
      bill.items
        .filter((l) => l.itemName.toLowerCase().includes("cheese"))
        .reduce((s, l) => s + l.amount, 0)
    );
  }, 0);
  const paneerQty = posted.reduce((sum, bill) => {
    return (
      sum +
      bill.items
        .filter((l) => l.itemName.toLowerCase().includes("paneer"))
        .reduce((s, l) => s + l.quantity, 0)
    );
  }, 0);

  const d30 = new Date();
  d30.setDate(d30.getDate() - 30);
  const cheeseRecent = posted
    .filter((b) => new Date(b.invoiceDate) >= d30)
    .reduce((sum, bill) => {
      return (
        sum +
        bill.items
          .filter((l) => l.itemName.toLowerCase().includes("cheese"))
          .reduce((s, l) => s + l.amount, 0)
      );
    }, 0);
  const cheeseOlder = cheeseSpend - cheeseRecent;
  if (cheeseRecent > cheeseOlder * 0.5 && cheeseRecent > 5000) {
    insights.push({
      id: "cheese-trend",
      severity: "info",
      title: "Cheese purchases increased",
      detail: `₹${Math.round(cheeseRecent).toLocaleString("en-IN")} in the last 30 days vs ₹${Math.round(cheeseOlder).toLocaleString("en-IN")} earlier.`,
    });
  }

  if (paneerQty >= 20) {
    insights.push({
      id: "paneer-consumption",
      severity: "warning",
      title: "Paneer consumption unusually high",
      detail: `${paneerQty} kg purchased across posted bills — review menu mix or wastage.`,
    });
  }

  const highOutstanding = db.vendors.filter((v) => {
    const out = getVendorOutstanding(db, v.id);
    return out > 50000;
  });
  if (highOutstanding.length) {
    insights.push({
      id: "vendor-outstanding",
      severity: "warning",
      title: "Vendor outstanding exceeds normal cycle",
      detail: highOutstanding
        .map((v) => `${v.name}: ₹${Math.round(getVendorOutstanding(db, v.id)).toLocaleString("en-IN")}`)
        .slice(0, 3)
        .join(" · "),
    });
  }

  const lowStock = db.inventoryItems.filter((i) => i.currentStock < i.parLevel);
  if (lowStock.length) {
    const reorder = lowStock
      .map((i) => `${i.name}: suggest ${Math.max(i.parLevel - i.currentStock, 1)} ${i.unit}`)
      .slice(0, 4)
      .join("; ");
    insights.push({
      id: "low-stock",
      severity: "critical",
      title: `${lowStock.length} items below par — low stock warning`,
      detail: reorder,
    });
  }

  const highVariance = audit.filter(
    (r) => r.variance !== null && Math.abs(r.variance) >= 2
  );
  if (highVariance.length) {
    insights.push({
      id: "variance",
      severity: "warning",
      title: `${highVariance.length} items with stock variance today`,
      detail: highVariance
        .slice(0, 3)
        .map((r) => `${r.itemName}: ${r.variance! > 0 ? "+" : ""}${r.variance} ${r.unit}`)
        .join(" · "),
    });
  }

  if (analytics.omissionRate > 0.1) {
    insights.push({
      id: "omissions",
      severity: "warning",
      title: "Elevated omission rate on posted bills",
      detail: `${(analytics.omissionRate * 100).toFixed(1)}% of bill lines triggered shortage cases.`,
    });
  }

  const pendingGrns = db.grns.filter((g) => g.status !== "confirmed").length;
  if (pendingGrns) {
    insights.push({
      id: "grn",
      severity: "info",
      title: `${pendingGrns} GRN(s) awaiting confirmation`,
      detail: "Confirm received quantities before posting inventory from bills.",
    });
  }

  const ageing = computeVendorAgeing(db).filter((a) => a.days60plus > 0);
  if (ageing.length) {
    insights.push({
      id: "ageing",
      severity: "warning",
      title: `${ageing.length} vendor(s) with 60+ day outstanding`,
      detail: ageing.map((a) => a.vendorName).join(", "),
    });
  }

  if (!insights.length) {
    insights.push({
      id: "ok",
      severity: "info",
      title: "Procurement health looks stable",
      detail: "No critical variance, stock, or ageing alerts for today.",
    });
  }

  return insights;
}
