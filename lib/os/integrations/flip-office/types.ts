import type { SalesChannel } from "@/lib/os/procurement/types";

export type FlipOfficeSyncModule = "sales" | "menu" | "customers" | "payments";

export type FlipOfficeSyncStatus = "success" | "partial" | "failed" | "never";

export type FlipOfficeIntegrationSettings = {
  apiUrl: string | null;
  apiKey: string | null;
  syncFrequencyMinutes: number;
  salesSyncEnabled: boolean;
  menuSyncEnabled: boolean;
  customerSyncEnabled: boolean;
  paymentSyncEnabled: boolean;
  connected: boolean;
  lastSyncAt: string | null;
  lastSyncStatus: FlipOfficeSyncStatus;
  lastSyncMessage: string | null;
  lastSalesSyncAt: string | null;
  lastMenuSyncAt: string | null;
  lastCustomerSyncAt: string | null;
  lastPaymentSyncAt: string | null;
};

export type FlipCustomer = {
  id: string;
  flipOfficeId: string;
  name: string;
  phone: string | null;
  email: string | null;
  outlet: string | null;
  branchId: string | null;
  totalOrders: number;
  totalSpendPaise: number;
  lastOrderAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type FlipMenuMapping = {
  id: string;
  flipMenuItemId: string;
  flipMenuItemName: string;
  flipMenuItemCode: string | null;
  recipeId: string | null;
  recipeName: string | null;
  matchMethod: "auto_name" | "auto_code" | "auto_fuzzy" | "manual" | "unmapped";
  confidence: number;
  updatedAt: string;
};

export type FlipSaleStatus = "imported" | "partial" | "pending" | "failed";

export type FlipSale = {
  id: string;
  flipOfficeId: string;
  branchId: string;
  saleDate: string;
  saleTime: string;
  outlet: string;
  orderNumber: string;
  channel: SalesChannel;
  customerId: string | null;
  customerName: string | null;
  subtotalPaise: number;
  taxPaise: number;
  discountPaise: number;
  totalPaise: number;
  paymentMethod: string | null;
  status: FlipSaleStatus;
  errorMessage: string | null;
  importedAt: string | null;
  createdAt: string;
};

export type FlipSaleItem = {
  id: string;
  flipSaleId: string;
  flipMenuItemId: string | null;
  menuItemName: string;
  recipeId: string | null;
  quantity: number;
  unitPricePaise: number;
  totalPaise: number;
  mappingStatus: "mapped" | "unmapped" | "manual";
  saleId: string | null;
  errorMessage: string | null;
};

/** Raw payload from Flip Office POS API. */
export type FlipOfficeOrderRow = {
  id: string;
  orderNumber: string;
  outlet: string;
  date: string;
  time?: string;
  channel?: string;
  customerId?: string | null;
  customerName?: string | null;
  paymentMethod?: string | null;
  subtotal?: number;
  tax?: number;
  discount?: number;
  total: number;
  items: FlipOfficeOrderItemRow[];
};

export type FlipOfficeOrderItemRow = {
  id: string;
  menuItemId?: string | null;
  name: string;
  code?: string | null;
  quantity: number;
  unitPrice: number;
  total: number;
};

export type FlipOfficeMenuRow = {
  id: string;
  name: string;
  code?: string | null;
  category?: string | null;
  price: number;
  outlet?: string | null;
  active?: boolean;
};

export type FlipOfficeCustomerRow = {
  id: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  outlet?: string | null;
  totalOrders?: number;
  totalSpend?: number;
  lastOrderAt?: string | null;
};

export type FlipOfficeSyncResult = {
  module: FlipOfficeSyncModule;
  recordsImported: number;
  recordsSkipped: number;
  errors: string[];
  status: "success" | "partial" | "failed";
  message: string;
};

export type FlipOfficeSyncHealth = {
  lastSyncAt: string | null;
  lastSyncStatus: FlipOfficeSyncStatus;
  lastSyncMessage: string | null;
  recordsImportedToday: number;
  errorCount: number;
  unmappedMenuItems: { name: string; count: number }[];
  missingRecipeMappings: number;
  unmappedMenuItemCount: number;
  connected: boolean;
  modules: {
    sales: { enabled: boolean; lastSyncAt: string | null };
    menu: { enabled: boolean; lastSyncAt: string | null };
    customers: { enabled: boolean; lastSyncAt: string | null };
    payments: { enabled: boolean; lastSyncAt: string | null };
  };
};
