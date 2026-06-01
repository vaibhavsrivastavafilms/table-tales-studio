export type PurchaseStatus = "draft" | "verified" | "posted" | "rejected";
export type VendorStatus = "active" | "inactive";
export type ItemStatus = "active" | "inactive";
export type VendorCategory = "Food Supplier" | "Beverage Supplier" | "Equipment" | "Services";
export type GrnReceiptStatus = "pending" | "partial" | "received";
export type OmissionStatus = "pending" | "resolved";
export type OmissionKind = "partial" | "full_omitted";
export type LineOmissionStatus = "none" | "partial" | "omitted";
export type CreditNoteStatus = "pending" | "applied";

export type CreditRegisterStatus =
  | "pending"
  | "requested"
  | "partial"
  | "received"
  | "adjusted"
  | "closed"
  | "rejected";

export type DisputeReason =
  | "Short Supply"
  | "Missing Item"
  | "Damaged Goods"
  | "Expired Goods"
  | "Wrong Billing"
  | "Incorrect Quantity"
  | "Incorrect Product"
  | "Transport Damage"
  | "Other";

export type DisputeStatus =
  | "open"
  | "credit_requested"
  | "partial"
  | "resolved"
  | "closed"
  | "rejected";

export type ProcurementRole =
  | "owner"
  | "accountant"
  | "procurement_manager"
  | "store_manager";

export type AuditActionType =
  | "create"
  | "update"
  | "delete"
  | "approve"
  | "reject"
  | "apply"
  | "close";

export type AuditEntityType =
  | "bill"
  | "line"
  | "omission"
  | "credit_note"
  | "revision"
  | "dispute"
  | "recovery"
  | "vendor"
  | "document";
export type LedgerEntryType =
  | "purchase"
  | "payment"
  | "credit_note"
  | "adjustment";

export type InventoryCategory =
  | "Dairy"
  | "Vegetables"
  | "Dry Store"
  | "Spices"
  | "Sauces"
  | "Imported Foods"
  | "Canned Goods"
  | "Packaging"
  | "Beverages"
  | "Cleaning"
  | "Consumables"
  | "Kitchen Prep";

export type Vendor = {
  id: string;
  name: string;
  gstNumber: string | null;
  phone: string | null;
  address: string | null;
  email: string | null;
  paymentTermsDays: number;
  invoicePattern: string | null;
  category: VendorCategory;
  status: VendorStatus;
  createdAt: string;
};

export type InventoryItem = {
  id: string;
  name: string;
  category: InventoryCategory;
  unit: string;
  currentStock: number;
  parLevel: number;
  status: ItemStatus;
  createdAt: string;
};

export type PurchaseItem = {
  id: string;
  billId: string;
  itemId: string | null;
  itemName: string;
  quantity: number;
  unit: string;
  rate: number;
  gstPercent: number;
  gstAmount: number;
  amount: number;
  category: InventoryCategory;
  receivedQty: number;
  shortQty: number;
  omissionStatus: LineOmissionStatus;
  creditNoteId: string | null;
  isNewItem: boolean;
};

export type BillExtraCharge = {
  id: string;
  label: string;
  amount: number;
  gstPercent?: number;
};

export type PurchaseBill = {
  id: string;
  vendorId: string | null;
  vendorName: string;
  invoiceNumber: string;
  invoiceDate: string;
  status: PurchaseStatus;
  taxableAmount: number;
  gstAmount: number;
  totalValue: number;
  /** Freight, packing, delivery, round-off, etc. — locked from invoice. */
  extraCharges: BillExtraCharge[];
  imageDataUrl: string | null;
  pdfDataUrl: string | null;
  ocrJson: string | null;
  items: PurchaseItem[];
  revisionParentId: string | null;
  createdAt: string;
  postedAt: string | null;
  rejectedAt: string | null;
  createdBy: string;
  editedAt: string | null;
  editedBy: string | null;
};

export type InventoryMovement = {
  id: string;
  itemId: string;
  billId: string | null;
  type: "purchase" | "consumption" | "transfer" | "wastage" | "adjustment";
  quantity: number;
  note: string | null;
  createdAt: string;
};

export type OpeningStock = {
  id: string;
  itemId: string;
  date: string;
  quantity: number;
  source: "manual" | "ocr";
};

export type ClosingStock = {
  id: string;
  itemId: string;
  date: string;
  quantity: number;
  source: "manual" | "ocr";
};

export type OmissionCase = {
  id: string;
  caseNumber: string;
  vendorId: string | null;
  vendorName: string;
  billId: string;
  invoiceNumber: string;
  itemId: string | null;
  itemName: string;
  lineItemId: string;
  expectedQty: number;
  receivedQty: number;
  shortQty: number;
  difference: number;
  rate: number;
  expectedCredit: number;
  kind: OmissionKind;
  status: OmissionStatus;
  creditNoteId: string | null;
  createdAt: string;
  resolvedAt: string | null;
  createdBy: string;
  editedAt: string | null;
  editedBy: string | null;
};

export type BillRevision = {
  id: string;
  parentBillId: string;
  revisionBillId: string;
  reason: string;
  createdAt: string;
  createdBy: string;
};

export type AuditLogEntry = {
  id: string;
  entityType: AuditEntityType;
  entityId: string;
  action: string;
  actionType: AuditActionType;
  detail: string;
  userId: string;
  userName: string | null;
  oldValue: string | null;
  newValue: string | null;
  reason: string | null;
  ip: string | null;
  field: string | null;
  createdAt: string;
};

export type BillEditHistory = {
  id: string;
  billId: string;
  lineItemId: string;
  itemName: string;
  userName: string;
  originalQty: number;
  newQty: number;
  reason: string;
  createdAt: string;
};

/** Per-line persisted vendor dispute (auto-created on qty difference). */
export type VendorDisputeRecord = {
  id: string;
  disputeNumber: string;
  vendorId: string | null;
  vendorName: string;
  billId: string;
  invoiceNumber: string;
  invoiceDate: string;
  lineItemId: string;
  itemId: string | null;
  itemName: string;
  billQty: number;
  receivedQty: number;
  differenceQty: number;
  rate: number;
  gstPercent: number;
  gstAmount: number;
  expectedCredit: number;
  receivedCredit: number;
  pendingCredit: number;
  reason: DisputeReason;
  status: DisputeStatus;
  omissionId: string | null;
  creditNoteId: string | null;
  branch: string;
  internalNotes: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  closedAt: string | null;
  closedBy: string | null;
};

/** Vendor-level rollup for dashboards. */
export type VendorDisputeSummary = {
  id: string;
  vendorId: string;
  vendorName: string;
  totalPurchases: number;
  totalCreditNotes: number;
  pendingCredits: number;
  recoveredCredits: number;
  pendingRecoverable: number;
  caseCount: number;
  openDisputes: number;
  closedDisputes: number;
  updatedAt: string;
};

export type DisputeNote = {
  id: string;
  disputeId: string;
  text: string;
  createdBy: string;
  createdAt: string;
};

export type CreditRecoveryRecord = {
  id: string;
  disputeId: string;
  omissionId: string | null;
  vendorId: string | null;
  vendorName: string;
  invoiceNumber: string;
  itemName: string;
  expectedCredit: number;
  receivedCredit: number;
  balance: number;
  status: "pending" | "partial" | "received" | "closed";
  creditNoteId: string | null;
  updatedAt: string;
};

export type RecoveryActivity = {
  id: string;
  disputeId: string;
  creditNoteId: string | null;
  amount: number;
  activityType: "credit_requested" | "credit_received" | "adjustment" | "closed";
  note: string;
  createdBy: string;
  createdAt: string;
};

export type VendorDocument = {
  id: string;
  vendorId: string | null;
  billId: string | null;
  disputeId: string | null;
  creditNoteId: string | null;
  docType:
    | "invoice"
    | "credit_note"
    | "grn_photo"
    | "supporting_image"
    | "vendor_communication"
    | "revision";
  label: string;
  dataUrl: string | null;
  createdAt: string;
  createdBy: string;
};

export type RecoveryDashboardStats = {
  totalRecoverable: number;
  recoveredAmount: number;
  pendingRecovery: number;
  recoveredThisMonth: number;
  disputesOpen: number;
  disputesClosed: number;
  topVendorCredits: { vendorName: string; amount: number }[];
  topDisputedItems: { itemName: string; count: number }[];
};

export type CreditRegisterRow = {
  id: string;
  omissionId: string;
  disputeId: string;
  vendorId: string | null;
  vendorName: string;
  billId: string;
  invoiceNumber: string;
  invoiceDate: string;
  itemId: string | null;
  itemName: string;
  lineItemId: string;
  billQty: number;
  receivedQty: number;
  shortQty: number;
  rate: number;
  unit: string;
  expectedCredit: number;
  actualCredit: number;
  balance: number;
  creditNoteNumber: string | null;
  creditNoteDate: string | null;
  creditNoteId: string | null;
  status: CreditRegisterStatus;
  disputeReason: DisputeReason;
  createdBy: string;
  createdAt: string;
  branch: string;
};

export type CreditRegisterStats = {
  totalCreditNotes: number;
  pendingCreditNotes: number;
  receivedCreditNotes: number;
  totalRecoverable: number;
  recoveredThisMonth: number;
  topVendorCredits: { vendorName: string; amount: number }[];
};

export type CreditRegisterInsight = {
  id: string;
  title: string;
  detail: string;
  severity: "info" | "warning" | "critical";
};

export type CreditRegisterFilters = {
  vendor: string;
  invoice: string;
  item: string;
  creditNoteNumber: string;
  status: CreditRegisterStatus | "all";
  dateFrom: string;
  dateTo: string;
  branch: string;
  pendingOnly: boolean;
  minAmount: number | null;
  disputeReason: DisputeReason | "all";
};

export type CreditNote = {
  id: string;
  vendorId: string;
  billId: string | null;
  omissionId: string | null;
  creditNoteNumber: string;
  creditNoteDate: string | null;
  amount: number;
  taxableAmount: number | null;
  gstAmount: number | null;
  items: {
    itemName: string;
    quantity: number;
    rate: number;
    gstPercent: number;
    amount: number;
  }[];
  status: CreditNoteStatus;
  imageDataUrl: string | null;
  pdfDataUrl: string | null;
  ocrJson: string | null;
  createdAt: string;
  appliedAt: string | null;
  createdBy: string;
};

export type InternalAdjustment = {
  id: string;
  vendorId: string | null;
  billId: string | null;
  itemId: string | null;
  itemName: string;
  quantity: number;
  amount: number;
  reason: "Short Supply" | "Damage" | "Spoilage" | "Wrong Billing";
  createdAt: string;
};

export type VendorLedgerEntry = {
  id: string;
  vendorId: string;
  type: LedgerEntryType;
  referenceId: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
  createdAt: string;
};

export type Category = {
  id: string;
  name: InventoryCategory;
};

export type ItemAlias = {
  id: string;
  itemId: string;
  alias: string;
  vendorId: string | null;
  createdAt: string;
};

export type UnitConversion = {
  id: string;
  itemId: string;
  fromUnit: string;
  toUnit: string;
  factor: number;
};

export type GrnStatus = "pending" | "partial" | "received" | "confirmed";

export type GrnLine = {
  id: string;
  itemId: string | null;
  itemName: string;
  billedQty: number;
  receivedQty: number;
  unit: string;
  variance: number;
};

export type GoodsReceivedNote = {
  id: string;
  billId: string;
  vendorId: string | null;
  vendorName: string;
  invoiceNumber: string;
  status: GrnStatus;
  receiptStatus: GrnReceiptStatus;
  lines: GrnLine[];
  createdAt: string;
  confirmedAt: string | null;
};

export type CategoryMapping = {
  id: string;
  itemName: string;
  category: InventoryCategory;
  createdAt: string;
};

export type StockOcrLine = {
  itemName: string;
  quantity: number;
  unit: string;
  matchedItemId: string | null;
};

export type StockAuditRow = {
  itemId: string;
  itemName: string;
  opening: number | null;
  purchases: number;
  consumption: number;
  expected: number | null;
  closing: number | null;
  variance: number | null;
  unit: string;
};

export type VendorAgeingBucket = {
  vendorId: string;
  vendorName: string;
  current: number;
  days1to15: number;
  days16to30: number;
  days31to60: number;
  days60plus: number;
  total: number;
};

export type ProcurementAnalytics = {
  purchaseVolume7d: number;
  purchaseVolume30d: number;
  avgBillValue: number;
  omissionRate: number;
  grnVarianceTotal: number;
  categorySpend: { category: InventoryCategory; amount: number }[];
  dailyPurchases: { date: string; amount: number }[];
};

export type ProcurementInsight = {
  id: string;
  severity: "info" | "warning" | "critical";
  title: string;
  detail: string;
};

export type ProcurementDb = {
  vendors: Vendor[];
  purchaseBills: PurchaseBill[];
  inventoryItems: InventoryItem[];
  inventoryMovements: InventoryMovement[];
  openingStock: OpeningStock[];
  closingStock: ClosingStock[];
  omissionCases: OmissionCase[];
  creditNotes: CreditNote[];
  internalAdjustments: InternalAdjustment[];
  vendorLedger: VendorLedgerEntry[];
  categories: Category[];
  itemAliases: ItemAlias[];
  unitConversions: UnitConversion[];
  grns: GoodsReceivedNote[];
  categoryMappings: CategoryMapping[];
  billRevisions: BillRevision[];
  auditLog: AuditLogEntry[];
  billEditHistory: BillEditHistory[];
  vendorDisputes: VendorDisputeRecord[];
  creditRecoveries: CreditRecoveryRecord[];
  recoveryActivities: RecoveryActivity[];
  vendorDocuments: VendorDocument[];
  disputeNotes: DisputeNote[];
};

export type OcrBillResult = {
  vendorName: string;
  vendorGst?: string | null;
  vendorAddress?: string | null;
  vendorPhone?: string | null;
  vendorEmail?: string | null;
  invoiceNumber: string;
  invoiceDate: string;
  taxableAmount?: number;
  gstAmount?: number;
  /** Grand total printed on invoice (includes all extra charges). */
  totalValue: number;
  extraCharges?: { label: string; amount: number; gstPercent?: number }[];
  items: {
    itemName: string;
    quantity: number;
    unit?: string;
    rate: number;
    gstPercent: number;
    amount: number;
    suggestedCategory?: InventoryCategory;
    isNewItem?: boolean;
  }[];
};

export type AutomationSummary = {
  vendorAction: "matched" | "created";
  vendorName: string;
  itemsCreated: number;
  itemsMatched: number;
  categoriesAssigned: { itemName: string; category: InventoryCategory }[];
  grnId: string;
  billId: string;
};

export type VendorExtractResult = {
  name: string;
  gstNumber: string | null;
  phone: string | null;
  address: string | null;
  paymentTermsDays: number;
  invoicePattern: string | null;
  matchedVendorId: string | null;
};

export type ProcurementDashboardStats = {
  todaysPurchases: number;
  monthPurchases: number;
  vendorOutstanding: number;
  pendingCreditNotes: number;
  pendingOmissions: number;
  lowStockItems: number;
  topVendors: { name: string; total: number }[];
  topItems: { name: string; quantity: number }[];
  pendingGrns: number;
  stockVariances: number;
};

export type StockOcrResult = {
  date: string;
  lines: StockOcrLine[];
};
