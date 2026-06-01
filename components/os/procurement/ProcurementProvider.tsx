"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  addItemAlias,
  addPurchaseBillDraft,
  addUnitConversion,
  applyCreditNote,
  addDisputeNote,
  closeDispute,
  approvePurchaseBill,
  computeDashboardStats,
  confirmGrn,
  createBillRevision,
  createGrnFromBill,
  createInternalAdjustment,
  createInventoryItem,
  loadProcurementDb,
  omitBillLineToQueue,
  rejectPurchaseBill,
  resolveOmission,
  saveClosingStockOcr,
  saveOpeningStockOcr,
  saveProcurementDb,
  updateBillLineReceivedQty,
  updateGrn,
  updatePurchaseBill,
  updateBillVendorName,
  upsertVendorFromExtract,
} from "@/lib/os/procurement/local-db";
import { processAutomatedBillUpload } from "@/lib/os/procurement/pipeline";
import { resolveItemByNameOrAlias } from "@/lib/os/procurement/aliases";
import { applyOcrTotalsToBill } from "@/lib/os/procurement/bill-totals";
import { suggestCategory } from "@/lib/os/procurement/categories";
import type {
  AutomationSummary,
  CreditNote,
  GoodsReceivedNote,
  GrnLine,
  InternalAdjustment,
  OcrBillResult,
  ProcurementDb,
  PurchaseBill,
  StockOcrLine,
  StockOcrResult,
  VendorExtractResult,
} from "@/lib/os/procurement/types";

type ProcurementContextValue = {
  db: ProcurementDb;
  stats: ReturnType<typeof computeDashboardStats>;
  refresh: () => void;
  processAutomatedUpload: (
    ocr: OcrBillResult,
    imageDataUrl: string | null,
    pdfDataUrl?: string | null
  ) => { bill: PurchaseBill; grn: GoodsReceivedNote; summary: AutomationSummary };
  saveDraftBill: (
    bill: Omit<PurchaseBill, "id" | "createdAt" | "postedAt" | "rejectedAt">,
    createNewItems?: boolean
  ) => PurchaseBill;
  approveBill: (billId: string) => void;
  rejectBill: (billId: string) => void;
  updateBill: (billId: string, patch: Partial<PurchaseBill>) => void;
  updateBillVendor: (billId: string, vendorName: string) => void;
  updateLineReceivedQty: (billId: string, lineId: string, receivedQty: number) => void;
  omitLineToOmissionQueue: (billId: string, lineId: string) => void;
  createBillRevision: (
    parentBillId: string,
    reason: string
  ) => { revisionBill: PurchaseBill } | null;
  createVendor: (extract: VendorExtractResult) => void;
  createItem: (name: string) => void;
  resolveOmissionCase: (caseId: string) => void;
  addDisputeNote: (disputeId: string, text: string) => void;
  closeDisputeRecord: (disputeId: string, reason?: string) => void;
  addCreditNote: (
    note: Omit<CreditNote, "id" | "createdAt" | "appliedAt" | "status" | "createdBy"> & {
      createdBy?: string;
    }
  ) => void;
  addAdjustment: (adj: Omit<InternalAdjustment, "id" | "createdAt">) => void;
  buildBillFromOcr: (
    ocr: OcrBillResult,
    imageDataUrl: string | null,
    vendorId?: string | null
  ) => Omit<PurchaseBill, "id" | "createdAt" | "postedAt" | "rejectedAt">;
  applyOpeningStockOcr: (date: string, lines: StockOcrLine[]) => void;
  applyClosingStockOcr: (date: string, lines: StockOcrLine[]) => void;
  matchStockLines: (lines: StockOcrResult["lines"]) => StockOcrLine[];
  mapAlias: (itemId: string, alias: string, vendorId?: string | null) => void;
  mapUnitConversion: (
    itemId: string,
    fromUnit: string,
    toUnit: string,
    factor: number
  ) => void;
  createGrn: (billId: string) => GoodsReceivedNote | null;
  updateGrnLines: (grnId: string, lines: GrnLine[]) => void;
  confirmGrnRecord: (billId: string) => void;
};

const ProcurementContext = createContext<ProcurementContextValue | null>(null);

export function ProcurementProvider({ children }: { children: React.ReactNode }) {
  const [db, setDb] = useState<ProcurementDb | null>(null);

  const refresh = useCallback(() => {
    setDb(loadProcurementDb());
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const persist = useCallback((next: ProcurementDb) => {
    saveProcurementDb(next);
    setDb(next);
  }, []);

  const mutate = useCallback((updater: (db: ProcurementDb) => ProcurementDb) => {
    setDb((current) => {
      const base = current ?? loadProcurementDb();
      const next = updater(base);
      saveProcurementDb(next);
      return next;
    });
  }, []);

  const matchStockLines = useCallback(
    (lines: StockOcrResult["lines"]): StockOcrLine[] => {
      const current = db ?? loadProcurementDb();
      return lines.map((line) => {
        const item = resolveItemByNameOrAlias(current, line.itemName);
        return {
          ...line,
          matchedItemId: item?.id ?? line.matchedItemId,
        };
      });
    },
    [db]
  );

  const buildBillFromOcr = useCallback(
    (
      ocr: OcrBillResult,
      imageDataUrl: string | null,
      vendorId?: string | null
    ): Omit<PurchaseBill, "id" | "createdAt" | "postedAt" | "rejectedAt"> => {
      const current = db ?? loadProcurementDb();
      const vendor = current.vendors.find(
        (v) =>
          v.id === vendorId ||
          v.name.toLowerCase() === ocr.vendorName.toLowerCase()
      );

      const totals = applyOcrTotalsToBill(ocr);
      return {
        vendorId: vendor?.id ?? vendorId ?? null,
        vendorName: vendor?.name ?? ocr.vendorName,
        invoiceNumber: ocr.invoiceNumber,
        invoiceDate: ocr.invoiceDate,
        status: "draft",
        taxableAmount: totals.taxableAmount,
        gstAmount: totals.gstAmount,
        totalValue: totals.totalValue,
        extraCharges: totals.extraCharges,
        imageDataUrl,
        pdfDataUrl: null,
        ocrJson: JSON.stringify(ocr),
        revisionParentId: null,
        createdBy: "ocr",
        editedAt: null,
        editedBy: null,
        items: ocr.items.map((row) => {
          const existing = resolveItemByNameOrAlias(
            current,
            row.itemName,
            vendor?.id
          );
          const category = row.suggestedCategory ?? suggestCategory(row.itemName);
          return {
            id: "",
            billId: "",
            itemId: existing?.id ?? null,
            itemName: row.itemName,
            quantity: row.quantity,
            unit: row.unit ?? "kg",
            rate: row.rate,
            gstPercent: row.gstPercent,
            gstAmount: row.amount - row.amount / (1 + row.gstPercent / 100),
            amount: row.amount,
            category,
            receivedQty: row.quantity,
            shortQty: 0,
            omissionStatus: "none" as const,
            creditNoteId: null,
            isNewItem: !existing,
          };
        }),
      };
    },
    [db]
  );

  const value = useMemo<ProcurementContextValue | null>(() => {
    if (!db) return null;

    return {
      db,
      stats: computeDashboardStats(db),
      refresh,
      matchStockLines,
      buildBillFromOcr,
      processAutomatedUpload: (ocr, imageDataUrl, pdfDataUrl = null) => {
        const result = processAutomatedBillUpload(db, ocr, imageDataUrl, pdfDataUrl);
        persist({
          ...result.db,
          categoryMappings: [
            ...result.db.categoryMappings,
            ...result.summary.categoriesAssigned.map((c) => ({
              id: `map_${Date.now()}_${c.itemName}`,
              itemName: c.itemName,
              category: c.category,
              createdAt: new Date().toISOString(),
            })),
          ],
        });
        return {
          bill: result.bill,
          grn: result.grn,
          summary: result.summary,
        };
      },
      saveDraftBill: (bill, createNewItems = false) => {
        let next = db;
        if (createNewItems) {
          for (const line of bill.items.filter((i) => i.isNewItem && !i.itemId)) {
            const created = createInventoryItem(next, line.itemName, line.category);
            next = created.db;
            line.itemId = created.item.id;
            line.isNewItem = false;
          }
        }
        const result = addPurchaseBillDraft(next, bill);
        persist(result.db);
        return result.bill;
      },
      approveBill: (billId) => mutate((d) => approvePurchaseBill(d, billId)),
      rejectBill: (billId) => mutate((d) => rejectPurchaseBill(d, billId)),
      updateBill: (billId, patch) => mutate((d) => updatePurchaseBill(d, billId, patch)),
      updateBillVendor: (billId, vendorName) =>
        mutate((d) => updateBillVendorName(d, billId, vendorName)),
      updateLineReceivedQty: (billId, lineId, receivedQty) =>
        mutate((d) => updateBillLineReceivedQty(d, billId, lineId, receivedQty)),
      omitLineToOmissionQueue: (billId, lineId) =>
        mutate((d) => omitBillLineToQueue(d, billId, lineId)),
      createBillRevision: (parentBillId, reason) => {
        const current = db;
        const created = createBillRevision(current, parentBillId, reason);
        if (!created) return null;
        persist(created.db);
        return { revisionBill: created.revisionBill };
      },
      createVendor: (extract) => persist(upsertVendorFromExtract(db, extract).db),
      createItem: (name) => persist(createInventoryItem(db, name).db),
      resolveOmissionCase: (caseId) => persist(resolveOmission(db, caseId)),
      addDisputeNote: (disputeId, text) => {
        const actor =
          typeof window !== "undefined"
            ? localStorage.getItem("tts:os:procurement:role") ?? "review"
            : "review";
        persist(addDisputeNote(db, disputeId, text, actor));
      },
      closeDisputeRecord: (disputeId, reason) => {
        const actor =
          typeof window !== "undefined"
            ? localStorage.getItem("tts:os:procurement:role") ?? "owner"
            : "owner";
        persist(closeDispute(db, disputeId, actor, reason));
      },
      addCreditNote: (note) => persist(applyCreditNote(db, note)),
      addAdjustment: (adj) => persist(createInternalAdjustment(db, adj)),
      applyOpeningStockOcr: (date, lines) =>
        persist(saveOpeningStockOcr(db, date, lines)),
      applyClosingStockOcr: (date, lines) =>
        persist(saveClosingStockOcr(db, date, lines)),
      mapAlias: (itemId, alias, vendorId) =>
        persist(addItemAlias(db, itemId, alias, vendorId)),
      mapUnitConversion: (itemId, fromUnit, toUnit, factor) =>
        persist(addUnitConversion(db, { itemId, fromUnit, toUnit, factor })),
      createGrn: (billId) => {
        const result = createGrnFromBill(db, billId);
        if (!result) return null;
        persist(result.db);
        return result.grn;
      },
      updateGrnLines: (grnId, lines) => mutate((d) => updateGrn(d, grnId, { lines })),
      confirmGrnRecord: (grnId) => mutate((d) => confirmGrn(d, grnId)),
    };
  }, [db, refresh, buildBillFromOcr, matchStockLines, persist, mutate]);

  if (!value) return null;

  return (
    <ProcurementContext.Provider value={value}>
      {children}
    </ProcurementContext.Provider>
  );
}

export function useProcurement(): ProcurementContextValue {
  const ctx = useContext(ProcurementContext);
  if (!ctx) {
    throw new Error("useProcurement must be used within ProcurementProvider");
  }
  return ctx;
}
