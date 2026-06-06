import { applyOcrTotalsToBill } from "@/lib/os/procurement/bill-totals";
import type { OcrBillResult } from "@/lib/os/procurement/types";

/** Merge per-page OCR results into a single purchase draft. */
export function mergeOcrPageResults(
  pages: OcrBillResult[],
  pageCount: number
): OcrBillResult {
  if (!pages.length) {
    throw new Error("No OCR pages to merge");
  }

  const [first, ...rest] = pages;
  const itemKey = (row: OcrBillResult["items"][number]) =>
    `${row.itemName.trim().toLowerCase()}|${row.unit ?? "kg"}|${row.rate}`;

  const mergedItems = [...first.items];
  const seen = new Set(mergedItems.map(itemKey));

  for (const page of rest) {
    for (const row of page.items) {
      const key = itemKey(row);
      if (seen.has(key)) continue;
      seen.add(key);
      mergedItems.push(row);
    }
  }

  const lastWithTotals = [...pages].reverse().find((p) => p.totalValue > 0) ?? first;

  return applyOcrTotalsToBill({
    vendorName: first.vendorName || lastWithTotals.vendorName,
    vendorGst: first.vendorGst ?? lastWithTotals.vendorGst,
    vendorAddress: first.vendorAddress ?? lastWithTotals.vendorAddress,
    vendorPhone: first.vendorPhone ?? lastWithTotals.vendorPhone,
    vendorEmail: first.vendorEmail ?? lastWithTotals.vendorEmail,
    invoiceNumber: first.invoiceNumber || lastWithTotals.invoiceNumber,
    invoiceDate: first.invoiceDate || lastWithTotals.invoiceDate,
    taxableAmount: lastWithTotals.taxableAmount,
    gstAmount: lastWithTotals.gstAmount,
    totalValue: lastWithTotals.totalValue,
    extraCharges: lastWithTotals.extraCharges,
    items: mergedItems,
    pageCount,
  }) as OcrBillResult & { pageCount?: number };
}
