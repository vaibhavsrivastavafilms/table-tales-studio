import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/lib/database.types";
import { getSupabasePublicKey, getSupabaseUrl } from "@/utils/supabase/config";

export async function createClient(
  cookieStore: Awaited<ReturnType<typeof cookies>> = await cookies()
) {
  return createServerClient<Database>(getSupabaseUrl(), getSupabasePublicKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // setAll unavailable in Server Components; middleware refreshes sessions.
        }
      },
    },
  });
}
