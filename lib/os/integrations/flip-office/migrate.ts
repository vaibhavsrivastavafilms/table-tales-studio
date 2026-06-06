import { defaultFlipOfficeSettings } from "@/lib/os/integrations/flip-office/defaults";
import type { ProcurementDb } from "@/lib/os/procurement/types";

export function ensureFlipOfficeDefaults(db: ProcurementDb): ProcurementDb {
  return {
    ...db,
    flipOfficeSettings: {
      ...defaultFlipOfficeSettings(),
      ...(db.flipOfficeSettings ?? {}),
      connected: Boolean(
        (db.flipOfficeSettings?.apiUrl ?? null) && (db.flipOfficeSettings?.apiKey ?? null)
      ),
    },
    flipSales: db.flipSales ?? [],
    flipSaleItems: db.flipSaleItems ?? [],
    flipCustomers: db.flipCustomers ?? [],
    flipMenuMappings: db.flipMenuMappings ?? [],
  };
}
