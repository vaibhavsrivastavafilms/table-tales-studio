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
import {
  createItemMaster,
  createRecipe,
  recordProductionBatch,
  recordSale,
  recordVendorPayment,
  upsertInventoryItem,
  persistStockVariances,
  type CreateRecipeInput,
} from "@/lib/os/procurement/os-operations";
import type { ItemMasterInput } from "@/lib/os/inventory/item-master";
import type { CreatePaymentInput } from "@/lib/os/procurement/payments";
import {
  approvePayrollRun,
  createEmployee,
  generatePayrollRun,
  importAttendanceCsv,
  importAttendanceRows,
  syncFlipOfficeEmployees,
  updateEmployeeRecord,
  type EmployeeMasterInput,
  type FlipOfficeAttendanceRow,
} from "@/lib/os/hr/hr-operations";
import {
  ALL_BRANCHES_ID,
  coalesceBranchId,
  filterByBranch,
  getActiveBranchId,
  setActiveBranchId as persistActiveBranchId,
} from "@/lib/os/branches";
import { rupeesToPaise } from "@/lib/os/money";
import {
  addExpenseRecord,
  createBranch,
  markNotificationRead,
  refreshNotifications,
  reviewApproval,
  runDailyMisAutomation,
  syncDocumentVault,
  updateDocumentTags,
  updateNotificationPreferences,
  upsertBranch,
} from "@/lib/os/platform/operations";
import {
  bulkImportIngredientRates,
  recalculateAllRecipesForIngredient,
  removeMenuRecipeIngredient,
  saveRecipeCostSettings,
  saveRecipeCostSnapshot,
  upsertMenuIngredientRate,
  upsertMenuRecipeIngredient,
} from "@/lib/os/kitchen/menu-operations";
import type {
  ApprovalStatus,
  AutomationSummary,
  Branch,
  CreditNote,
  Employee,
  ExpenseCategory,
  GoodsReceivedNote,
  GrnLine,
  InternalAdjustment,
  NotificationPreferences,
  OcrBillResult,
  ProcurementDb,
  PurchaseBill,
  StoredDocumentRef,
  StockOcrLine,
  StockOcrResult,
  VendorExtractResult,
  SalesChannel,
  InventoryItem,
  MenuRecipeIngredientInput,
} from "@/lib/os/procurement/types";
import type { FlipOfficeEmployeeRow } from "@/lib/os/hr/flip-office";
import { processAutomatedBillUpload } from "@/lib/os/procurement/pipeline";
import {
  ProcurementStorageQuotaError,
  saveProcurementDbSafe,
} from "@/lib/os/procurement/persist";
import { resolveItemByNameOrAlias } from "@/lib/os/procurement/aliases";
import { applyOcrTotalsToBill } from "@/lib/os/procurement/bill-totals";
import { suggestCategory } from "@/lib/os/procurement/categories";
import {
  importFlipOfficeSalesCsv as importFlipCsv,
  setManualMenuMapping,
  syncFlipOfficeCustomers,
  syncFlipOfficeMenu,
  syncFlipOfficeSales,
  updateFlipOfficeSettings,
} from "@/lib/os/integrations/flip-office";
import type {
  FlipOfficeIntegrationSettings,
  FlipOfficeSyncResult,
} from "@/lib/os/integrations/flip-office/types";

type ProcurementContextValue = {
  db: ProcurementDb;
  branchDb: ProcurementDb;
  activeBranchId: string;
  setActiveBranch: (branchId: string) => void;
  stats: ReturnType<typeof computeDashboardStats>;
  refresh: () => void;
  processAutomatedUpload: (
    ocr: OcrBillResult,
    document: StoredDocumentRef | null,
    ocrJsonUrl?: string | null
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
    document: StoredDocumentRef | null,
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
  recordPayment: (input: CreatePaymentInput) => void;
  saveItemMaster: (input: ItemMasterInput) => void;
  updateItem: (itemId: string, patch: Partial<InventoryItem>) => void;
  saveRecipe: (input: CreateRecipeInput) => void;
  runPrepBatch: (prepRecipeId: string, outputQty: number) => void;
  recordSaleOrder: (
    recipeId: string,
    quantity: number,
    channel: SalesChannel,
    outlet?: string
  ) => void;
  snapshotStockVariances: (date: string) => void;
  saveEmployee: (input: EmployeeMasterInput) => void;
  updateEmployee: (employeeId: string, patch: Partial<Employee>) => void;
  importAttendance: (rows: FlipOfficeAttendanceRow[], source?: "flip_office" | "manual") => {
    imported: number;
    skipped: number;
  };
  importAttendanceFromCsv: (csvText: string) => { imported: number; skipped: number };
  syncFlipOfficeStaff: (employees: FlipOfficeEmployeeRow[]) => void;
  runPayroll: (month: string, outlet?: string) => void;
  approvePayroll: (runId: string) => void;
  addExpense: (input: {
    date: string;
    category: ExpenseCategory;
    vendorName: string | null;
    description: string;
    amountRupees: number;
    attachmentUrl?: string | null;
    isRecurring?: boolean;
    recurrence?: "monthly" | "weekly" | null;
  }) => void;
  saveBranch: (branch: Omit<Branch, "createdAt"> & { createdAt?: string }) => void;
  createNewBranch: (branch: Omit<Branch, "id" | "createdAt">) => void;
  reviewApprovalRequest: (
    approvalId: string,
    status: ApprovalStatus,
    reason?: string
  ) => void;
  refreshAlerts: () => void;
  markRead: (notificationId: string) => void;
  updateAlertPreferences: (prefs: Partial<NotificationPreferences>) => void;
  syncDocuments: () => void;
  updateDocumentTags: (documentId: string, tags: string[]) => void;
  generateDailyMis: (date: string) => void;
  updateIngredientRate: (ingredientId: string, rateRupees: number) => void;
  bulkImportRates: (csv: string) => { updated: number; errors: string[]; recalculated: number };
  saveMenuRecipeIngredient: (line: MenuRecipeIngredientInput) => void;
  removeMenuRecipeIngredient: (lineId: string) => void;
  saveRecipeCostSettings: (
    recipeId: string,
    settings: { overheadPct: number; packagingCostPaise: number }
  ) => void;
  saveRecipeCostSnapshot: (recipeId: string, portions?: number) => void;
  updateFlipOfficeIntegration: (patch: Partial<FlipOfficeIntegrationSettings>) => void;
  runFlipOfficeSync: (
    module: "sales" | "menu" | "customers" | "all",
    date?: string
  ) => Promise<FlipOfficeSyncResult[]>;
  importFlipOfficeSalesCsv: (csvText: string) => Promise<FlipOfficeSyncResult>;
  mapFlipMenuItem: (menuItemName: string, recipeId: string) => void;
};

function getActor(fallback: string): string {
  if (typeof window === "undefined") return fallback;
  return localStorage.getItem("tts:os:procurement:role") ?? fallback;
}

const ProcurementContext = createContext<ProcurementContextValue | null>(null);

export function ProcurementProvider({ children }: { children: React.ReactNode }) {
  const [db, setDb] = useState<ProcurementDb | null>(null);
  const [activeBranchId, setActiveBranchState] = useState<string>(ALL_BRANCHES_ID);

  const refresh = useCallback(() => {
    setDb(loadProcurementDb());
    setActiveBranchState(getActiveBranchId());
  }, []);

  const setActiveBranch = useCallback((branchId: string) => {
    persistActiveBranchId(branchId);
    setActiveBranchState(branchId);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    setActiveBranchState(getActiveBranchId());
  }, []);

  const persist = useCallback((next: ProcurementDb) => {
    try {
      saveProcurementDbSafe(next);
      setDb(next);
    } catch (error) {
      if (error instanceof ProcurementStorageQuotaError) {
        console.error(error.message);
        alert(error.message);
        return;
      }
      throw error;
    }
  }, []);

  const mutate = useCallback((updater: (db: ProcurementDb) => ProcurementDb) => {
    setDb((current) => {
      const base = current ?? loadProcurementDb();
      const next = updater(base);
      try {
        saveProcurementDbSafe(next);
      } catch (error) {
        if (error instanceof ProcurementStorageQuotaError) {
          console.error(error.message);
          alert(error.message);
          return base;
        }
        throw error;
      }
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
      document: StoredDocumentRef | null,
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
        branchId: coalesceBranchId(undefined, activeBranchId !== ALL_BRANCHES_ID ? activeBranchId : null),
        vendorId: vendor?.id ?? vendorId ?? null,
        vendorName: vendor?.name ?? ocr.vendorName,
        invoiceNumber: ocr.invoiceNumber,
        invoiceDate: ocr.invoiceDate,
        status: "draft",
        taxableAmount: totals.taxableAmount,
        gstAmount: totals.gstAmount,
        totalValue: totals.totalValue,
        extraCharges: totals.extraCharges,
        document,
        ocrJsonUrl: null,
        imageDataUrl: null,
        pdfDataUrl: null,
        ocrJson: null,
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
    [db, activeBranchId]
  );

  const value = useMemo<ProcurementContextValue | null>(() => {
    if (!db) return null;

    const branchDb: ProcurementDb = {
      ...db,
      purchaseBills: filterByBranch(db.purchaseBills, activeBranchId),
      sales: filterByBranch(db.sales, activeBranchId),
      grns: filterByBranch(db.grns, activeBranchId),
      omissionCases: filterByBranch(db.omissionCases, activeBranchId),
      creditNotes: filterByBranch(db.creditNotes, activeBranchId),
      vendorDisputes: filterByBranch(db.vendorDisputes, activeBranchId),
      operatingExpenses: filterByBranch(db.operatingExpenses, activeBranchId),
      employees: filterByBranch(db.employees, activeBranchId),
      attendanceRecords: filterByBranch(db.attendanceRecords, activeBranchId),
      payrollRuns: filterByBranch(db.payrollRuns, activeBranchId),
      recipes: filterByBranch(db.recipes, activeBranchId),
      productionBatches: filterByBranch(db.productionBatches, activeBranchId),
      approvalRequests: filterByBranch(db.approvalRequests, activeBranchId),
    };

    return {
      db,
      branchDb,
      activeBranchId,
      setActiveBranch,
      stats: computeDashboardStats(branchDb),
      refresh,
      matchStockLines,
      buildBillFromOcr,
      processAutomatedUpload: (ocr, document, ocrJsonUrl = null) => {
        const result = processAutomatedBillUpload(db, ocr, document, ocrJsonUrl);
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
      recordPayment: (input) => {
        const actor =
          typeof window !== "undefined"
            ? localStorage.getItem("tts:os:procurement:role") ?? "accountant"
            : "accountant";
        mutate((d) => recordVendorPayment(d, input, actor));
      },
      saveItemMaster: (input) => {
        const actor =
          typeof window !== "undefined"
            ? localStorage.getItem("tts:os:procurement:role") ?? "store_manager"
            : "store_manager";
        mutate((d) => createItemMaster(d, input, actor));
      },
      updateItem: (itemId, patch) => mutate((d) => upsertInventoryItem(d, itemId, patch)),
      saveRecipe: (input) => {
        const actor =
          typeof window !== "undefined"
            ? localStorage.getItem("tts:os:procurement:role") ?? "kitchen_manager"
            : "kitchen_manager";
        mutate((d) => createRecipe(d, input, actor));
      },
      runPrepBatch: (prepRecipeId, outputQty) => {
        const actor =
          typeof window !== "undefined"
            ? localStorage.getItem("tts:os:procurement:role") ?? "kitchen_manager"
            : "kitchen_manager";
        mutate((d) => recordProductionBatch(d, prepRecipeId, outputQty, actor));
      },
      recordSaleOrder: (recipeId, quantity, channel, outlet = "Table Tales") => {
        const actor =
          typeof window !== "undefined"
            ? localStorage.getItem("tts:os:procurement:role") ?? "store_manager"
            : "store_manager";
        mutate((d) => recordSale(d, recipeId, quantity, channel, outlet, actor));
      },
      snapshotStockVariances: (date) => mutate((d) => persistStockVariances(d, date)),
      saveEmployee: (input) => mutate((d) => createEmployee(d, input, getActor("owner"))),
      updateEmployee: (employeeId, patch) =>
        mutate((d) => updateEmployeeRecord(d, employeeId, patch)),
      importAttendance: (rows, source = "flip_office") => {
        let result = { imported: 0, skipped: 0 };
        mutate((d) => {
          const out = importAttendanceRows(d, rows, source, getActor("owner"));
          result = { imported: out.imported, skipped: out.skipped };
          return out.db;
        });
        return result;
      },
      importAttendanceFromCsv: (csvText) => {
        let result = { imported: 0, skipped: 0 };
        mutate((d) => {
          const out = importAttendanceCsv(d, csvText, getActor("owner"));
          result = { imported: out.imported, skipped: out.skipped };
          return out.db;
        });
        return result;
      },
      syncFlipOfficeStaff: (employees) =>
        mutate((d) => syncFlipOfficeEmployees(d, employees, getActor("owner"))),
      runPayroll: (month, outlet = "Table Tales") =>
        mutate((d) => generatePayrollRun(d, month, outlet, getActor("accountant"))),
      approvePayroll: (runId) =>
        mutate((d) => approvePayrollRun(d, runId, getActor("owner"))),
      addExpense: (input) => {
        const branchId =
          activeBranchId === ALL_BRANCHES_ID
            ? db.branches[0]?.id ?? "br_prahladnagar"
            : activeBranchId;
        const branch = db.branches.find((b) => b.id === branchId);
        mutate((d) =>
          addExpenseRecord(
            d,
            {
              branchId,
              date: input.date,
              category: input.category,
              vendorName: input.vendorName,
              description: input.description,
              amountPaise: rupeesToPaise(input.amountRupees),
              outlet: branch?.name ?? "Table Tales",
              attachmentUrl: input.attachmentUrl ?? null,
              isRecurring: input.isRecurring,
              recurrence: input.recurrence ?? null,
              createdBy: getActor("accountant"),
            },
            getActor("accountant")
          )
        );
      },
      saveBranch: (branch) => mutate((d) => upsertBranch(d, branch, getActor("owner"))),
      createNewBranch: (branch) => mutate((d) => createBranch(d, branch, getActor("owner"))),
      reviewApprovalRequest: (approvalId, status, reason) =>
        mutate((d) => reviewApproval(d, approvalId, status, getActor("owner"), reason)),
      refreshAlerts: () => mutate((d) => refreshNotifications(d, activeBranchId)),
      markRead: (notificationId) =>
        mutate((d) => markNotificationRead(d, notificationId)),
      updateAlertPreferences: (prefs) =>
        mutate((d) => updateNotificationPreferences(d, prefs)),
      syncDocuments: () => mutate((d) => syncDocumentVault(d)),
      updateDocumentTags: (documentId, tags) =>
        mutate((d) => updateDocumentTags(d, documentId, tags)),
      generateDailyMis: (date) =>
        mutate((d) => runDailyMisAutomation(d, date, activeBranchId)),
      updateIngredientRate: (ingredientId, rateRupees) =>
        mutate((d) =>
          recalculateAllRecipesForIngredient(
            upsertMenuIngredientRate(d, ingredientId, rupeesToPaise(rateRupees)),
            ingredientId
          )
        ),
      bulkImportRates: (csv) => {
        let result = { updated: 0, errors: [] as string[], recalculated: 0 };
        mutate((d) => {
          const out = bulkImportIngredientRates(d, csv);
          result = out.result;
          return out.db;
        });
        return result;
      },
      saveMenuRecipeIngredient: (line) =>
        mutate((d) => upsertMenuRecipeIngredient(d, line)),
      removeMenuRecipeIngredient: (lineId) =>
        mutate((d) => removeMenuRecipeIngredient(d, lineId)),
      saveRecipeCostSettings: (recipeId, settings) =>
        mutate((d) => saveRecipeCostSettings(d, recipeId, settings)),
      saveRecipeCostSnapshot: (recipeId, portions) =>
        mutate((d) => saveRecipeCostSnapshot(d, recipeId, portions)),
      updateFlipOfficeIntegration: (patch) =>
        mutate((d) => updateFlipOfficeSettings(d, patch)),
      runFlipOfficeSync: async (module, date) => {
        const current = db ?? loadProcurementDb();
        let next = current;
        const results: FlipOfficeSyncResult[] = [];
        const syncDate = date ?? new Date().toISOString().slice(0, 10);

        if (module === "sales" || module === "all") {
          const out = await syncFlipOfficeSales(next, syncDate, getActor("owner"));
          next = out.db;
          results.push(out.result);
        }
        if (module === "menu" || module === "all") {
          const out = await syncFlipOfficeMenu(next, getActor("owner"));
          next = out.db;
          results.push(out.result);
        }
        if (module === "customers" || module === "all") {
          const out = await syncFlipOfficeCustomers(next, getActor("owner"));
          next = out.db;
          results.push(out.result);
        }

        persist(next);
        return results;
      },
      importFlipOfficeSalesCsv: async (csvText) => {
        const current = db ?? loadProcurementDb();
        const out = await importFlipCsv(current, csvText, getActor("owner"));
        persist(out.db);
        return out.result;
      },
      mapFlipMenuItem: (menuItemName, recipeId) =>
        mutate((d) => setManualMenuMapping(d, menuItemName, recipeId)),
    };
  }, [db, activeBranchId, setActiveBranch, refresh, buildBillFromOcr, matchStockLines, persist, mutate]);

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
