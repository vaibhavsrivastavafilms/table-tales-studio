import { BUCKETS } from "@/lib/storage";
import { getSupabaseEnv, isSupabaseConfigured } from "@/lib/supabase";
import { logger } from "@/lib/logger";

export type UploadEnvStatus = {
  supabaseUrl: boolean;
  supabaseAnonKey: boolean;
  appUrl: boolean;
  bucketsExpected: readonly string[];
};

const REQUIRED_PUBLIC = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
] as const;

export function checkUploadEnv(): UploadEnvStatus {
  const env = getSupabaseEnv();
  return {
    supabaseUrl: Boolean(env?.url),
    supabaseAnonKey: Boolean(env?.anonKey),
    appUrl: Boolean(
      process.env.NEXT_PUBLIC_APP_URL?.trim() || process.env.VERCEL_URL?.trim()
    ),
    bucketsExpected: [
      BUCKETS.projectImages,
      BUCKETS.thumbnails,
      BUCKETS.exports,
    ],
  };
}

/**
 * Server / build-time: fail fast when Supabase public env is missing in production.
 * Cloud upload is optional at runtime (local fallback), but misconfigured deploys should surface early.
 */
export function assertProductionUploadEnv(): void {
  if (process.env.NODE_ENV !== "production") return;

  const missing = REQUIRED_PUBLIC.filter(
    (key) => !process.env[key]?.trim()
  );

  if (missing.length === 0) return;

  throw new Error(
    `Table Tales Studio: missing required environment variables for production upload: ${missing.join(", ")}. ` +
      `Set them in Vercel Project Settings → Environment Variables. ` +
      `Expected storage buckets (public): ${BUCKETS.projectImages}, ${BUCKETS.thumbnails}.`
  );
}

let clientEnvLogged = false;

/** Browser startup: log configuration once; warn instead of crashing when Supabase is absent. */
export function initClientUploadEnv(): UploadEnvStatus {
  const status = checkUploadEnv();
  if (clientEnvLogged) return status;
  clientEnvLogged = true;

  if (!isSupabaseConfigured()) {
    console.warn(
      "[TableTales:upload] Supabase env not set — cloud sync disabled. " +
        "Generation will use local image URLs. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
    );
    return status;
  }

  const env = getSupabaseEnv();
  logger.info("upload env ready", {
    supabaseHost: env?.url ? new URL(env.url).host : "unknown",
    buckets: status.bucketsExpected.join(","),
  });

  return status;
}
