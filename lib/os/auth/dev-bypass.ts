import type { ProcurementRole } from "@/lib/os/procurement/types";
import type { OsSession } from "@/lib/os/auth/types";
import { isSupabasePublicEnvConfigured } from "@/utils/supabase/config";

/**
 * Development-only OS auth bypass when Supabase is not configured, or when
 * OS_DEV_AUTH_BYPASS=true. When Supabase env is present, real auth is used
 * so RLS and repository writes receive an authenticated session.
 */
export function isOsDevAuthBypass(): boolean {
  if (process.env.NODE_ENV !== "development") return false;
  if (process.env.OS_DEV_AUTH_BYPASS === "true") return true;
  return !isSupabasePublicEnvConfigured();
}

export const DEV_OS_USER_ID = "dev-owner";
export const DEV_OS_EMAIL = "owner@tabletales.local";
export const DEV_OS_ROLE: ProcurementRole = "owner";

export function getDevOsSession(): OsSession {
  return {
    userId: DEV_OS_USER_ID,
    email: DEV_OS_EMAIL,
    role: DEV_OS_ROLE,
    devBypass: true,
  };
}
