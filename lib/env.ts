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

export function validateServerEnv(): {
  openai: boolean;
  supabase: boolean;
  appUrl: string;
  missingPublic: string[];
} {
  const missingPublic: string[] = [];
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()) {
    missingPublic.push("NEXT_PUBLIC_SUPABASE_URL");
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()) {
    missingPublic.push("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }

  return {
    openai: hasOpenAiKey(),
    supabase: missingPublic.length === 0,
    appUrl: getAppUrl(),
    missingPublic,
  };
}
