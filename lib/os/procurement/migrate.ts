import { normalizeAuditEntry } from "@/lib/os/procurement/audit";
import { reconcileBillTotals } from "@/lib/os/procurement/bill-totals";
import { migrateDisputesFromOmissions } from "@/lib/os/procurement/disputes";
import { createSeedDb } from "@/lib/os/procurement/seed";
import { suggestCategory } from "@/lib/os/procurement/categories";
import { normalizePurchaseItemLine } from "@/lib/os/procurement/bill-review";
import { computeExpectedCredit, computeShortQty } from "@/lib/os/procurement/procurement-controls";
import type {
  AuditLogEntry,
  InventoryItem,
  OmissionCase,
  ProcurementDb,
  PurchaseBill,
  PurchaseItem,
  Vendor,
} from "@/lib/os/procurement/types";

const LEGACY_KEYS = [
  "tts:os:procurement:v1",
  "tts:os:procurement:v1.5",
  "tts:os:procurement:v2",
  "tts:os:procurement:v3",
  "tts:os:procurement:v4",
];
export const STORAGE_KEY = "tts:os:procurement:v4";

function normalizeVendor(v: Vendor): Vendor {
  return {
    ...v,
    email: v.email ?? null,
    category: v.category ?? "Food Supplier",
    status: v.status ?? "active",
  };
}

function normalizeItem(i: InventoryItem): InventoryItem {
  return {
    ...i,
    status: i.status ?? "active",
  };
}

function normalizeLine(line: PurchaseItem): PurchaseItem {
  const base = {
    ...line,
    unit: line.unit ?? "kg",
    gstAmount:
      line.gstAmount ??
      line.amount - line.amount / (1 + line.gstPercent / 100),
    category: line.category ?? suggestCategory(line.itemName),
    receivedQty: line.receivedQty ?? line.quantity,
    shortQty: line.shortQty ?? computeShortQty(line.quantity, line.receivedQty ?? line.quantity),
    omissionStatus: line.omissionStatus ?? "none",
    creditNoteId: line.creditNoteId ?? null,
  };
  return normalizePurchaseItemLine(base);
}

function normalizeBill(b: PurchaseBill): PurchaseBill {
  const extraCharges = b.extraCharges ?? [];
  const reconciled = reconcileBillTotals({
    items: b.items,
    extraCharges,
    totalValue: b.totalValue,
    taxableAmount: b.taxableAmount,
    gstAmount: b.gstAmount,
  });
  return {
    ...b,
    taxableAmount: reconciled.taxableAmount,
    gstAmount: reconciled.gstAmount,
    totalValue: reconciled.totalValue,
    extraCharges: reconciled.extraCharges,
    pdfDataUrl: b.pdfDataUrl ?? null,
    ocrJson: b.ocrJson ?? null,
    rejectedAt: b.rejectedAt ?? null,
    revisionParentId: b.revisionParentId ?? null,
    createdBy: b.createdBy ?? "system",
    editedAt: b.editedAt ?? null,
    editedBy: b.editedBy ?? null,
    items: b.items.map(normalizeLine),
  };
}

function normalizeOmission(c: OmissionCase, bill?: PurchaseBill): OmissionCase {
  const line = bill?.items.find((l) => l.id === c.lineItemId);
  const rate = c.rate ?? line?.rate ?? 0;
  const shortQty = c.shortQty ?? computeShortQty(c.expectedQty, c.receivedQty);
  return {
    ...c,
    lineItemId: c.lineItemId ?? `legacy_${c.id}`,
    shortQty,
    rate,
    expectedCredit: c.expectedCredit ?? computeExpectedCredit(shortQty, rate),
    kind: c.kind ?? (c.receivedQty <= 0 ? "full_omitted" : "partial"),
    creditNoteId: c.creditNoteId ?? null,
    createdBy: c.createdBy ?? "system",
    editedAt: c.editedAt ?? null,
    editedBy: c.editedBy ?? null,
  };
}

export function migrateProcurementDb(raw: unknown): ProcurementDb {
  const seed = createSeedDb();
  if (!raw || typeof raw !== "object") return seed;

  const legacy = raw as Partial<ProcurementDb>;
  const bills = (legacy.purchaseBills ?? []).map(normalizeBill);

  const migrated: ProcurementDb = {
    ...seed,
    ...legacy,
    vendors: (legacy.vendors ?? seed.vendors).map(normalizeVendor),
    inventoryItems: (legacy.inventoryItems ?? seed.inventoryItems).map(normalizeItem),
    purchaseBills: bills,
    itemAliases: legacy.itemAliases ?? seed.itemAliases,
    unitConversions: legacy.unitConversions ?? seed.unitConversions,
    grns: (legacy.grns ?? []).map((g) => {
      const legacyStatus = g.status as string;
      return {
        ...g,
        receiptStatus:
          g.receiptStatus ??
          (legacyStatus === "confirmed" ? "received" : "pending"),
        status:
          legacyStatus === "draft"
            ? "pending"
            : legacyStatus === "confirmed"
              ? "confirmed"
              : g.status,
      };
    }),
    categories: legacy.categories ?? seed.categories,
    categoryMappings: legacy.categoryMappings ?? [],
    billRevisions: legacy.billRevisions ?? [],
    auditLog: (legacy.auditLog ?? []).map((e) =>
      normalizeAuditEntry(e as AuditLogEntry)
    ),
    billEditHistory: legacy.billEditHistory ?? [],
    vendorDisputes: legacy.vendorDisputes ?? [],
    creditRecoveries: legacy.creditRecoveries ?? [],
    recoveryActivities: legacy.recoveryActivities ?? [],
    vendorDocuments: legacy.vendorDocuments ?? [],
    disputeNotes: legacy.disputeNotes ?? [],
    omissionCases: (legacy.omissionCases ?? []).map((c) => {
      const bill = bills.find((b) => b.id === c.billId);
      return normalizeOmission(c as OmissionCase, bill);
    }),
    creditNotes: (legacy.creditNotes ?? []).map((n) => ({
      ...n,
      omissionId: n.omissionId ?? null,
      creditNoteDate: n.creditNoteDate ?? n.createdAt.slice(0, 10),
      taxableAmount: n.taxableAmount ?? null,
      gstAmount: n.gstAmount ?? null,
      pdfDataUrl: n.pdfDataUrl ?? null,
      ocrJson: n.ocrJson ?? null,
      createdBy: n.createdBy ?? "system",
      items: n.items.map((i) => ({
        ...i,
        rate: "rate" in i ? (i as { rate: number }).rate : 0,
        gstPercent: "gstPercent" in i ? (i as { gstPercent: number }).gstPercent : 0,
      })),
    })),
  };

  return migrateDisputesFromOmissions(migrated);
}

export function loadStoredProcurementRaw(): ProcurementDb {
  if (typeof window === "undefined") return createSeedDb();

  for (const key of [...LEGACY_KEYS, STORAGE_KEY]) {
    const raw = localStorage.getItem(key);
    if (raw) {
      try {
        const parsed = migrateProcurementDb(JSON.parse(raw));
        localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
        return parsed;
      } catch {
        continue;
      }
    }
  }

  const seed = createSeedDb();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
  return seed;
}
