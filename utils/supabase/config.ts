/** Shared Supabase public env (supports legacy anon key + publishable key). */
export function getSupabaseUrl(): string {
  return process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
}

export function getSupabasePublicKey(): string {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ??
    ""
  );
}

export function isSupabasePublicEnvConfigured(): boolean {
  return Boolean(getSupabaseUrl() && getSupabasePublicKey());
}

/** Server-only service role key — never import from client components. */
export function getSupabaseServiceRoleKey(): string {
  return process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ?? "";
}
