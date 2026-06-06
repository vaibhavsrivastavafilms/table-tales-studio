"use client";

import { isOsDevAuthBypass } from "@/lib/os/auth/dev-bypass";

export default function OsDevModeBanner() {
  if (!isOsDevAuthBypass()) return null;

  return (
    <span
      className="shrink-0 rounded-md border border-amber-500/40 bg-amber-500/15 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-300"
      title="Supabase authentication is bypassed in local development"
    >
      DEV MODE – AUTH BYPASSED
    </span>
  );
}
