import { createBrowserClient as createSupabaseBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/database.types";
import { getSupabasePublicKey, getSupabaseUrl } from "@/utils/supabase/config";

export function createClient() {
  return createSupabaseBrowserClient<Database>(getSupabaseUrl(), getSupabasePublicKey(), {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
}
