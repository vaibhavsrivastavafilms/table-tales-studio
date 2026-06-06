import { coalesceBranchId } from "@/lib/os/branches";
import type { OmissionCase, PurchaseItem } from "@/lib/os/procurement/types";

export function computeShortQty(billQty: number, receivedQty: number): number {
  return Math.max(0, billQty - receivedQty);
}

export function computeExpectedCredit(shortQty: number, rate: number): number {
  return Math.round(shortQty * rate * 100) / 100;
}

export function deriveOmissionStatus(
  billQty: number,
  receivedQty: number
): PurchaseItem["omissionStatus"] {
  if (receivedQty <= 0) return "omitted";
  if (receivedQty < billQty) return "partial";
  return "none";
}

export function buildOmissionFromLine(
  line: PurchaseItem,
  bill: {
    id: string;
    branchId: string;
    vendorId: string | null;
    vendorName: string;
    invoiceNumber: string;
  },
  caseNumberSeq: number
): OmissionCase {
  const billQty = line.quantity;
  const receivedQty = Math.max(0, line.receivedQty ?? billQty);
  const shortQty = computeShortQty(billQty, receivedQty);
  const rate = line.rate;

  return {
    id: `omc_${line.id}`,
    branchId: bill.branchId,
    caseNumber: `OMC-${String(caseNumberSeq).padStart(4, "0")}`,
    vendorId: bill.vendorId,
    vendorName: bill.vendorName,
    billId: bill.id,
    invoiceNumber: bill.invoiceNumber,
    itemId: line.itemId,
    itemName: line.itemName,
    lineItemId: line.id,
    expectedQty: billQty,
    receivedQty,
    shortQty,
    difference: receivedQty - billQty,
    rate,
    expectedCredit: computeExpectedCredit(shortQty, rate),
    kind: receivedQty <= 0 ? "full_omitted" : "partial",
    status: "pending",
    creditNoteId: null,
    createdAt: new Date().toISOString(),
    resolvedAt: null,
    createdBy: "review",
    editedAt: new Date().toISOString(),
    editedBy: "review",
  };
}

export function lineNeedsOmission(line: PurchaseItem): boolean {
  const received = line.receivedQty ?? line.quantity;
  return deriveOmissionStatus(line.quantity, received) !== "none";
}
