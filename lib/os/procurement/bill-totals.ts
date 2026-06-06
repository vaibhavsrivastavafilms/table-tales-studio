import type { BillExtraCharge, OcrBillResult } from "@/lib/os/procurement/types";

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function sumLineAmounts(
  items: { amount: number }[]
): number {
  return round2(items.reduce((s, i) => s + (Number(i.amount) || 0), 0));
}

export function sumExtraCharges(charges: BillExtraCharge[]): number {
  return round2(charges.reduce((s, c) => s + (Number(c.amount) || 0), 0));
}

/** Reconcile invoice total with product lines + explicit extra charges. */
export function reconcileBillTotals(input: {
  items: { amount: number }[];
  extraCharges: BillExtraCharge[];
  totalValue: number;
  taxableAmount?: number;
  gstAmount?: number;
}): {
  extraCharges: BillExtraCharge[];
  totalValue: number;
  taxableAmount: number;
  gstAmount: number;
  itemsSubtotal: number;
  extraChargesTotal: number;
} {
  const itemsSubtotal = sumLineAmounts(input.items);
  let extraCharges = [...input.extraCharges].map((c) => ({
    ...c,
    amount: round2(c.amount),
  }));
  let extraChargesTotal = sumExtraCharges(extraCharges);

  let totalValue = round2(Number(input.totalValue) || 0);

  if (totalValue <= 0 && itemsSubtotal + extraChargesTotal > 0) {
    totalValue = round2(itemsSubtotal + extraChargesTotal);
  }

  const gap = round2(totalValue - itemsSubtotal - extraChargesTotal);
  if (gap > 0.01) {
    extraCharges = [
      ...extraCharges,
      {
        id: `xch_gap_${Date.now()}`,
        label: "Other charges (freight, packing, round-off, etc.)",
        amount: gap,
        gstPercent: 0,
      },
    ];
    extraChargesTotal = sumExtraCharges(extraCharges);
  }

  let taxableAmount = round2(Number(input.taxableAmount) || 0);
  let gstAmount = round2(Number(input.gstAmount) || 0);

  if (taxableAmount <= 0 && gstAmount <= 0 && totalValue > 0) {
    taxableAmount = round2(totalValue * 0.95);
    gstAmount = round2(totalValue - taxableAmount);
  } else if (taxableAmount <= 0 && gstAmount > 0) {
    taxableAmount = round2(Math.max(0, totalValue - gstAmount));
  } else if (gstAmount <= 0 && taxableAmount > 0) {
    gstAmount = round2(Math.max(0, totalValue - taxableAmount));
  }

  if (totalValue <= 0 && taxableAmount + gstAmount > 0) {
    totalValue = round2(taxableAmount + gstAmount);
  }

  return {
    extraCharges,
    totalValue,
    taxableAmount,
    gstAmount,
    itemsSubtotal,
    extraChargesTotal,
  };
}

export function normalizeOcrExtraCharges(
  raw: OcrBillResult["extraCharges"]
): BillExtraCharge[] {
  if (!raw?.length) return [];
  return raw
    .filter((c) => c.label?.trim() && Number(c.amount) > 0)
    .map((c, i) => ({
      id: `xch_ocr_${i}`,
      label: c.label.trim(),
      amount: round2(Number(c.amount)),
      gstPercent: Number(c.gstPercent) || 0,
    }));
}

export function applyOcrTotalsToBill(ocr: OcrBillResult): {
  taxableAmount: number;
  gstAmount: number;
  totalValue: number;
  extraCharges: BillExtraCharge[];
  itemsSubtotal: number;
} {
  const items = ocr.items ?? [];
  const extraCharges = normalizeOcrExtraCharges(ocr.extraCharges);
  const reconciled = reconcileBillTotals({
    items,
    extraCharges,
    totalValue: ocr.totalValue,
    taxableAmount: ocr.taxableAmount,
    gstAmount: ocr.gstAmount,
  });
  return {
    taxableAmount: reconciled.taxableAmount,
    gstAmount: reconciled.gstAmount,
    totalValue: reconciled.totalValue,
    extraCharges: reconciled.extraCharges,
    itemsSubtotal: reconciled.itemsSubtotal,
  };
}
