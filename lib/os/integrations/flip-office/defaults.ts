import type { FlipOfficeIntegrationSettings } from "@/lib/os/integrations/flip-office/types";

export function defaultFlipOfficeSettings(): FlipOfficeIntegrationSettings {
  return {
    apiUrl: null,
    apiKey: null,
    syncFrequencyMinutes: 15,
    salesSyncEnabled: true,
    menuSyncEnabled: true,
    customerSyncEnabled: true,
    paymentSyncEnabled: true,
    connected: false,
    lastSyncAt: null,
    lastSyncStatus: "never",
    lastSyncMessage: null,
    lastSalesSyncAt: null,
    lastMenuSyncAt: null,
    lastCustomerSyncAt: null,
    lastPaymentSyncAt: null,
  };
}

export function isFlipOfficeSalesAutoSync(settings: FlipOfficeIntegrationSettings): boolean {
  return settings.connected && settings.salesSyncEnabled;
}
