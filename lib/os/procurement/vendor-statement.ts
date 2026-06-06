import type { ProcurementDb, Vendor } from "@/lib/os/procurement/types";
import { getVendorOutstanding } from "@/lib/os/procurement/local-db";
import { formatInr } from "@/lib/os/procurement/format";

export function buildVendorStatementHtml(
  db: ProcurementDb,
  vendor: Vendor
): string {
  const entries = db.vendorLedger
    .filter((e) => e.vendorId === vendor.id)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  const outstanding = getVendorOutstanding(db, vendor.id);
  const rows = entries
    .map(
      (e) => `
      <tr>
        <td>${e.createdAt.slice(0, 10)}</td>
        <td>${e.description}</td>
        <td align="right">${e.debit ? formatInr(e.debit) : "—"}</td>
        <td align="right">${e.credit ? formatInr(e.credit) : "—"}</td>
        <td align="right">${formatInr(e.balance)}</td>
      </tr>`
    )
    .join("");

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Vendor Statement — ${vendor.name}</title>
  <style>
    body { font-family: Georgia, serif; color: #2a3d36; padding: 40px; }
    h1 { color: #5f9f8d; margin: 0; }
    .meta { color: #6b8279; font-size: 12px; margin-top: 8px; }
    table { width: 100%; border-collapse: collapse; margin-top: 24px; font-size: 13px; }
    th, td { border-bottom: 1px solid #e5e5e5; padding: 8px; text-align: left; }
    th { font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; color: #6b8279; }
    .total { font-size: 18px; font-weight: bold; margin-top: 24px; }
  </style>
</head>
<body>
  <h1>Table Tales OS</h1>
  <p class="meta">Vendor Statement · ${new Date().toLocaleDateString("en-IN")}</p>
  <h2>${vendor.name}</h2>
  <p class="meta">GST ${vendor.gstNumber ?? "—"} · ${vendor.paymentTermsDays} day terms</p>
  <table>
    <thead>
      <tr>
        <th>Date</th>
        <th>Description</th>
        <th>Debit</th>
        <th>Credit</th>
        <th>Balance</th>
      </tr>
    </thead>
    <tbody>
      ${rows || '<tr><td colspan="5">No ledger entries</td></tr>'}
    </tbody>
  </table>
  <p class="total">Outstanding: ${formatInr(outstanding)}</p>
</body>
</html>`;
}

export function downloadVendorStatement(
  db: ProcurementDb,
  vendor: Vendor
): void {
  const html = buildVendorStatementHtml(db, vendor);
  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `vendor-statement-${vendor.name.replace(/\s+/g, "-").toLowerCase()}.html`;
  a.click();
  URL.revokeObjectURL(url);
}

export function printVendorStatement(db: ProcurementDb, vendor: Vendor): void {
  const html = buildVendorStatementHtml(db, vendor);
  const win = window.open("", "_blank");
  if (!win) return;
  win.document.write(html);
  win.document.close();
  win.focus();
  win.print();
}
