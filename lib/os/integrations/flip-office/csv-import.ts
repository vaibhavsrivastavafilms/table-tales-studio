import { syncFlipOfficeSalesFromOrders } from "@/lib/os/integrations/flip-office/sync-sales";
import type { FlipOfficeOrderRow } from "@/lib/os/integrations/flip-office/types";
import type { ProcurementDb } from "@/lib/os/procurement/types";

function splitCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (ch === "," && !inQuotes) {
      cells.push(current.trim());
      current = "";
      continue;
    }
    current += ch;
  }
  cells.push(current.trim());
  return cells;
}

function headerIndex(headers: string[], names: string[]): number {
  const normalized = headers.map((h) => h.toLowerCase().replace(/\s+/g, "_"));
  for (const name of names) {
    const idx = normalized.indexOf(name);
    if (idx >= 0) return idx;
  }
  return -1;
}

export function parseFlipOfficeSalesCsv(csvText: string): FlipOfficeOrderRow[] {
  const lines = csvText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length < 2) return [];

  const headers = splitCsvLine(lines[0]);
  const idx = {
    date: headerIndex(headers, ["date", "sale_date", "order_date"]),
    time: headerIndex(headers, ["time", "sale_time", "order_time"]),
    outlet: headerIndex(headers, ["outlet", "branch", "store"]),
    orderNumber: headerIndex(headers, ["order_number", "order_no", "bill_no", "invoice"]),
    itemName: headerIndex(headers, ["item_name", "menu_item", "item", "product"]),
    quantity: headerIndex(headers, ["quantity", "qty"]),
    unitPrice: headerIndex(headers, ["unit_price", "rate", "price"]),
    total: headerIndex(headers, ["total", "line_total", "amount"]),
    channel: headerIndex(headers, ["channel", "order_type"]),
    paymentMethod: headerIndex(headers, ["payment_method", "payment", "pay_mode"]),
    customerName: headerIndex(headers, ["customer_name", "customer"]),
  };

  if (idx.date < 0 || idx.outlet < 0 || idx.itemName < 0) {
    throw new Error(
      "CSV must include at least date, outlet, and item_name columns."
    );
  }

  const grouped = new Map<string, FlipOfficeOrderRow>();

  for (const line of lines.slice(1)) {
    const cells = splitCsvLine(line);
    const date = cells[idx.date] ?? new Date().toISOString().slice(0, 10);
    const outlet = cells[idx.outlet] ?? "Table Tales Prahladnagar";
    const orderNumber =
      (idx.orderNumber >= 0 ? cells[idx.orderNumber] : null) ??
      `CSV-${date}-${outlet.slice(0, 3).toUpperCase()}-${Math.random().toString(36).slice(2, 6)}`;
    const key = `${date}|${outlet}|${orderNumber}`;

    const itemName = cells[idx.itemName];
    const quantity = Number(cells[idx.quantity] ?? "1") || 1;
    const unitPrice = Number(cells[idx.unitPrice] ?? cells[idx.total] ?? "0") || 0;
    const total = Number(cells[idx.total] ?? String(unitPrice * quantity)) || unitPrice * quantity;

    const existing = grouped.get(key) ?? {
      id: `csv_${key.replace(/[^a-z0-9|]/gi, "_")}`,
      orderNumber,
      outlet,
      date,
      time: idx.time >= 0 ? cells[idx.time] : "12:00",
      channel: idx.channel >= 0 ? cells[idx.channel] : "dine_in",
      customerName: idx.customerName >= 0 ? cells[idx.customerName] : null,
      paymentMethod: idx.paymentMethod >= 0 ? cells[idx.paymentMethod] : null,
      subtotal: 0,
      tax: 0,
      discount: 0,
      total: 0,
      items: [],
    };

    existing.items.push({
      id: `${existing.id}_line_${existing.items.length}`,
      name: itemName,
      quantity,
      unitPrice,
      total,
    });
    existing.subtotal = (existing.subtotal ?? 0) + total;
    existing.total = (existing.total ?? 0) + total;
    grouped.set(key, existing);
  }

  return [...grouped.values()];
}

export async function importFlipOfficeSalesCsv(
  db: ProcurementDb,
  csvText: string,
  actor = "csv_import"
) {
  const orders = parseFlipOfficeSalesCsv(csvText);
  const date = orders[0]?.date ?? new Date().toISOString().slice(0, 10);
  return syncFlipOfficeSalesFromOrders(db, date, actor, orders);
}
