export function getAppUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  return "";
}

export function hasOpenAiKey(): boolean {
  return Boolean(process.env.OPENAI_API_KEY?.trim());
}

import { getSupabasePublicKey, getSupabaseUrl } from "@/utils/supabase/config";

export function validateServerEnv(): {
  openai: boolean;
  supabase: boolean;
  appUrl: string;
  missingPublic: string[];
} {
  const missingPublic: string[] = [];
  if (!getSupabaseUrl()) {
    missingPublic.push("NEXT_PUBLIC_SUPABASE_URL");
  }
  if (!getSupabasePublicKey()) {
    missingPublic.push("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
  }

  return {
    openai: hasOpenAiKey(),
    supabase: missingPublic.length === 0,
    appUrl: getAppUrl(),
    missingPublic,
  };
}
