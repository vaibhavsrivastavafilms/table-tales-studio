import type { ProcurementRole } from "@/lib/os/procurement/types";

export type OsSession = {
  userId: string;
  email: string | null;
  role?: ProcurementRole;
  devBypass?: boolean;
};
