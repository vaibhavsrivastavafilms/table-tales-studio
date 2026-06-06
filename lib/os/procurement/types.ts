import type {
  FlipCustomer,
  FlipMenuMapping,
  FlipOfficeIntegrationSettings,
  FlipSale,
  FlipSaleItem,
} from "@/lib/os/integrations/flip-office/types";
import type { PlatformSetupProfile } from "@/lib/os/platform/setup-profile";

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
  | "store_manager"
  | "kitchen_manager";

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
  | "document"
  | "employee"
  | "attendance"
  | "payroll"
  | "expense"
  | "approval"
  | "branch";
export type LedgerEntryType =
  | "purchase"
  | "payment"
  | "credit_note"
  | "debit_note"
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
  panNumber: string | null;
  phone: string | null;
  address: string | null;
  email: string | null;
  contactPerson: string | null;
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

/** External document reference — never store base64 in localStorage. */
export type StoredDocumentRef = {
  id: string;
  filename: string;
  size: number;
  mimeType: string;
  storageUrl: string;
  pageCount?: number;
};

export type PurchaseBill = {
  id: string;
  branchId: string;
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
  /** Primary invoice attachment in external storage. */
  document: StoredDocumentRef | null;
  /** URL to OCR JSON in external storage (ocr-json bucket). */
  ocrJsonUrl: string | null;
  /** @deprecated stripped on save — use document.storageUrl */
  imageDataUrl: string | null;
  /** @deprecated stripped on save — use document.storageUrl */
  pdfDataUrl: string | null;
  /** @deprecated stripped on save — use ocrJsonUrl */
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
  branchId: string;
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
  branchId: string;
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
  branchId: string;
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
  document: StoredDocumentRef | null;
  /** @deprecated stripped on save — use document.storageUrl */
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
  branchId: string;
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
  document: StoredDocumentRef | null;
  ocrJsonUrl: string | null;
  /** @deprecated stripped on save */
  imageDataUrl: string | null;
  /** @deprecated stripped on save */
  pdfDataUrl: string | null;
  /** @deprecated stripped on save */
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
  branchId: string;
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
  branchId: string;
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

export type RecipeStatus = "active" | "inactive" | "draft";
export type SalesChannel = "dine_in" | "takeaway" | "swiggy" | "zomato";
export type PrepBatchStatus = "planned" | "in_progress" | "completed";

export type Recipe = {
  id: string;
  branchId: string | null;
  name: string;
  /** Selling price in paise for menu items; legacy recipes may use rupees in this field. */
  sellingPrice: number;
  sellingPricePaise?: number;
  yield: number;
  yieldUnit: string;
  status: RecipeStatus;
  outlet: string;
  menuCategory?: string | null;
  menuSubcategory?: string | null;
  description?: string | null;
  servingSize?: string | null;
  isSignature?: boolean;
  isSpicy?: boolean;
  isJainAvailable?: boolean;
  isActive?: boolean;
  foodCostTargetPct?: number;
  createdAt: string;
};

export type MenuIngredientCategory =
  | "Dairy"
  | "Vegetables"
  | "DryStore"
  | "Sauces"
  | "Imported"
  | "Spices"
  | "Beverages";

export type MenuIngredient = {
  id: string;
  name: string;
  category: MenuIngredientCategory;
  unit: string;
  costPerUnitPaise: number;
  yieldFactor: number;
  lastUpdated: string;
  createdAt: string;
};

export interface MenuRecipeIngredient {
  id: string;
  recipeId: string;
  ingredientId: string;
  quantity: number;
  unit: string;
  notes?: string;
  createdAt: string;
}

/** Payload for creating/updating a menu recipe ingredient line. */
export type MenuRecipeIngredientInput = {
  recipeId: string;
  ingredientId: string;
  quantity: number;
  unit: string;
  notes?: string;
  id?: string;
};

export type RecipeCostSettings = {
  recipeId: string;
  overheadPct: number;
  packagingCostPaise: number;
  updatedAt: string;
};

export type RecipeCostSnapshot = {
  id: string;
  recipeId: string;
  ingredientCostPaise: number;
  overheadPct: number;
  packagingCostPaise: number;
  totalCostPaise: number;
  sellingPricePaise: number;
  foodCostPct: number;
  marginPaise: number;
  marginPct: number;
  targetPct: number;
  status: "on_target" | "over_target" | "critical";
  portions: number;
  createdAt: string;
};

export type RecipeIngredient = {
  id: string;
  recipeId: string;
  itemId: string;
  itemName: string;
  quantity: number;
  unit: string;
};

export type PrepRecipe = {
  id: string;
  name: string;
  outputItemId: string | null;
  outputItemName: string;
  outputYield: number;
  outputUnit: string;
  status: RecipeStatus;
  createdAt: string;
};

export type PrepIngredient = {
  id: string;
  prepRecipeId: string;
  itemId: string;
  itemName: string;
  quantity: number;
  unit: string;
};

export type ProductionBatch = {
  id: string;
  branchId: string;
  prepRecipeId: string;
  prepRecipeName: string;
  inputCost: number;
  outputQty: number;
  productionCost: number;
  status: PrepBatchStatus;
  createdAt: string;
  createdBy: string;
};

export type Sale = {
  id: string;
  branchId: string;
  channel: SalesChannel;
  recipeId: string;
  recipeName: string;
  quantity: number;
  unitPrice: number;
  totalRevenue: number;
  consumedAt: string;
  outlet: string;
  source?: SaleSource;
  flipOfficeOrderId?: string | null;
  flipOfficeLineId?: string | null;
  paymentMethod?: string | null;
};

export type VendorPayment = {
  id: string;
  vendorId: string;
  vendorName: string;
  amount: number;
  paymentDate: string;
  reference: string;
  note: string | null;
  createdAt: string;
  createdBy: string;
};

export type StockVarianceRecord = {
  id: string;
  itemId: string;
  itemName: string;
  date: string;
  expected: number;
  actual: number;
  variance: number;
  valueLoss: number;
  unit: string;
  createdAt: string;
};

export type FoodCostReportRow = {
  recipeId: string;
  recipeName: string;
  recipeCost: number;
  sellingPrice: number;
  foodCostPercent: number;
  margin: number;
  marginPercent: number;
  outlet: string;
};

export type OrgInsight = {
  id: string;
  severity: "info" | "warning" | "critical";
  title: string;
  detail: string;
  module: string;
};

export type EmployeeStatus = "active" | "inactive" | "on_leave";
export type EmployeeDepartment =
  | "kitchen"
  | "service"
  | "management"
  | "central_kitchen"
  | "procurement";
export type AttendanceStatus =
  | "present"
  | "absent"
  | "half_day"
  | "leave"
  | "holiday"
  | "week_off";
export type PayrollRunStatus = "draft" | "approved" | "paid";
export type ExpenseCategory =
  | "Rent"
  | "Electricity"
  | "Gas"
  | "Water"
  | "Internet"
  | "Marketing"
  | "Maintenance"
  | "Repairs"
  | "Licenses"
  | "Software"
  | "PettyCash"
  | "Housekeeping"
  | "Uniforms"
  | "Transport"
  | "Miscellaneous";
export type ExpenseStatus = "pending" | "approved" | "rejected";
export type ExpenseRecurrence = "monthly" | "weekly" | null;
export type ApprovalType =
  | "purchase"
  | "expense"
  | "credit_note"
  | "inventory_adjustment"
  | "payroll";
export type ApprovalStatus = "pending" | "approved" | "rejected" | "changes_requested";
export type NotificationType =
  | "low_stock"
  | "pending_credit"
  | "vendor_payment_due"
  | "high_variance"
  | "attendance_issue"
  | "payroll_due"
  | "expense_pending"
  | "purchase_pending"
  | "food_cost_alert"
  | "labor_cost_alert"
  | "approval_required"
  | "pnl_alert";
export type DocumentCategory =
  | "invoice"
  | "credit_note"
  | "vendor"
  | "payroll"
  | "attendance"
  | "mis"
  | "expense"
  | "contract"
  | "branch";
export type PnlPeriod = "daily" | "weekly" | "monthly";
export type AttendanceSource = "flip_office" | "csv" | "manual";

export type Branch = {
  id: string;
  name: string;
  code: string;
  address: string | null;
  managerName: string | null;
  managerPhone: string | null;
  settings: {
    timezone: string;
    currency: string;
    targetFoodCostPercent: number;
    targetLaborCostPercent: number;
  };
  status: "active" | "inactive";
  createdAt: string;
};

export type Employee = {
  id: string;
  branchId: string;
  flipOfficeId: string | null;
  employeeCode: string;
  name: string;
  department: EmployeeDepartment;
  designation: string;
  outlet: string;
  phone: string | null;
  email: string | null;
  dateOfJoining: string;
  monthlySalary: number;
  hourlyRate: number | null;
  status: EmployeeStatus;
  createdAt: string;
};

export type AttendanceRecord = {
  id: string;
  branchId: string;
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  hoursWorked: number;
  overtimeHours: number;
  status: AttendanceStatus;
  source: AttendanceSource;
  syncedAt: string;
};

export type PayrollLine = {
  id: string;
  payrollRunId: string;
  employeeId: string;
  employeeName: string;
  baseSalary: number;
  overtimePay: number;
  deductions: number;
  netPay: number;
  daysPresent: number;
  daysAbsent: number;
};

export type PayrollRun = {
  id: string;
  branchId: string;
  periodStart: string;
  periodEnd: string;
  month: string;
  outlet: string;
  status: PayrollRunStatus;
  totalGross: number;
  totalDeductions: number;
  totalNet: number;
  employeeCount: number;
  createdAt: string;
  approvedAt: string | null;
  createdBy: string;
};

export type OperatingExpense = {
  id: string;
  branchId: string;
  date: string;
  month: string;
  category: ExpenseCategory;
  vendorName: string | null;
  description: string;
  amountPaise: number;
  outlet: string;
  attachmentUrl: string | null;
  status: ExpenseStatus;
  isRecurring: boolean;
  recurrence: ExpenseRecurrence;
  createdBy: string;
  approvedBy: string | null;
  approvedAt: string | null;
  createdAt: string;
  auditLog: { action: string; at: string; by: string; note?: string | null }[];
};

export type FlipOfficeSyncType =
  | "attendance"
  | "employees"
  | "sales"
  | "menu"
  | "customers"
  | "payments";

export type FlipOfficeSyncLog = {
  id: string;
  syncType: FlipOfficeSyncType;
  recordsImported: number;
  recordsSkipped?: number;
  errorCount?: number;
  date: string;
  status: "success" | "partial" | "failed";
  message: string;
  createdAt: string;
};

export type SaleSource = "manual" | "flip_office" | "csv";

export type MonthlyMisSnapshot = {
  month: string;
  branchId: string;
  revenue: number;
  procurementSpend: number;
  inventoryValue: number;
  vendorOutstanding: number;
  creditNotesApplied: number;
  payrollCost: number;
  laborCostPercent: number;
  foodCostPercent: number;
  operatingExpenses: number;
  estimatedProfit: number;
  estimatedProfitMargin: number;
  attendanceRate: number;
  headcount: number;
  salesCount: number;
};

export type ApprovalRequest = {
  id: string;
  branchId: string;
  type: ApprovalType;
  entityId: string;
  entityLabel: string;
  referenceTable: string;
  amountPaise: number;
  requiredRole: ProcurementRole;
  status: ApprovalStatus;
  requestedBy: string;
  reviewedBy: string | null;
  note: string | null;
  createdAt: string;
  reviewedAt: string | null;
};

export type OsNotification = {
  id: string;
  branchId: string | null;
  type: NotificationType;
  title: string;
  detail: string;
  severity: "info" | "warning" | "critical";
  read: boolean;
  href: string | null;
  createdAt: string;
};

export type NotificationPreferences = {
  lowStock: boolean;
  pendingCredit: boolean;
  vendorPaymentDue: boolean;
  highVariance: boolean;
  attendanceIssue: boolean;
  payrollDue: boolean;
  expensePending: boolean;
  purchasePending: boolean;
  foodCostAlert: boolean;
  laborCostAlert: boolean;
  pendingApproval: boolean;
  dailyMis: boolean;
};

export type VaultDocument = {
  id: string;
  branchId: string | null;
  category: DocumentCategory;
  folder: string;
  title: string;
  tags: string[];
  dataUrl: string | null;
  mimeType: string | null;
  entityId: string | null;
  createdAt: string;
  createdBy: string;
};

export type PnlReport = {
  id: string;
  branchId: string;
  period: PnlPeriod;
  periodKey: string;
  revenue: number;
  foodCost: number;
  laborCost: number;
  operatingExpenses: number;
  grossProfit: number;
  netProfit: number;
  profitPercent: number;
  createdAt: string;
};

export type DailyMisReport = {
  id: string;
  branchId: string;
  date: string;
  sales: number;
  ordersCount: number;
  purchases: number;
  attendanceRate: number;
  attendancePresent: number;
  attendanceAbsent: number;
  attendanceLate: number;
  lowStockCount: number;
  pendingPayments: number;
  pendingCredits: number;
  foodCostPercent: number;
  laborCostEst: number;
  expensesTotal: number;
  profitEstimate: number;
  summaryText: string;
  exportPdfUrl: string | null;
  exportExcelUrl: string | null;
  generatedAt: string;
  createdAt: string;
};

export type MonthlyMisExecutiveSummary = {
  month: string;
  branchId: string;
  salesSummary: string;
  procurementSummary: string;
  inventorySummary: string;
  vendorSummary: string;
  foodCostSummary: string;
  laborCostSummary: string;
  expenseSummary: string;
  profitabilitySummary: string;
  executiveSummary: string;
};

export type ProcurementDb = {
  branches: Branch[];
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
  recipes: Recipe[];
  recipeIngredients: RecipeIngredient[];
  menuIngredients: MenuIngredient[];
  menuRecipeIngredients: MenuRecipeIngredient[];
  recipeCostSettings: RecipeCostSettings[];
  recipeCostSnapshots: RecipeCostSnapshot[];
  prepRecipes: PrepRecipe[];
  prepIngredients: PrepIngredient[];
  productionBatches: ProductionBatch[];
  sales: Sale[];
  vendorPayments: VendorPayment[];
  stockVariances: StockVarianceRecord[];
  employees: Employee[];
  attendanceRecords: AttendanceRecord[];
  payrollRuns: PayrollRun[];
  payrollLines: PayrollLine[];
  operatingExpenses: OperatingExpense[];
  flipOfficeSyncLogs: FlipOfficeSyncLog[];
  flipOfficeSettings: FlipOfficeIntegrationSettings;
  flipSales: FlipSale[];
  flipSaleItems: FlipSaleItem[];
  flipCustomers: FlipCustomer[];
  flipMenuMappings: FlipMenuMapping[];
  platformSetup: PlatformSetupProfile;
  approvalRequests: ApprovalRequest[];
  notifications: OsNotification[];
  notificationPreferences: NotificationPreferences;
  vaultDocuments: VaultDocument[];
  dailyMisReports: DailyMisReport[];
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
