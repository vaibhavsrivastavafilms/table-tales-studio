import { redirect } from "next/navigation";
import { createServerClient, isSupabaseConfigured } from "@/lib/supabase";
import { getDevOsSession, isOsDevAuthBypass } from "@/lib/os/auth/dev-bypass";
import { ensureInitialOrgOwner } from "@/lib/os/repositories/org-member-repository";
import type { OsSession } from "@/lib/os/auth/types";

export type { OsSession } from "@/lib/os/auth/types";

export class OsUnauthorizedError extends Error {
  constructor(message = "Unauthorized") {
    super(message);
    this.name = "OsUnauthorizedError";
  }
}

async function getSupabaseAuthSession(): Promise<OsSession | null> {
  if (!isSupabaseConfigured()) return null;

  try {
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;
    return {
      userId: user.id,
      email: user.email ?? null,
    };
  } catch {
    return null;
  }
}

export async function getOsSession(): Promise<OsSession | null> {
  const supabaseSession = await getSupabaseAuthSession();
  if (supabaseSession) return supabaseSession;

  if (isOsDevAuthBypass()) {
    return getDevOsSession();
  }

  return null;
}

export async function requireOsSession(): Promise<OsSession> {
  const session = await getOsSession();
  if (!session) {
    redirect("/os/auth/login");
  }
  return session;
}

/** API routes: returns 401-friendly error instead of redirect. Ensures org owner row exists. */
export async function requireOsApiSession(): Promise<OsSession> {
  const session = await getOsSession();
  if (!session) {
    throw new OsUnauthorizedError();
  }

  if (!session.devBypass && isSupabaseConfigured()) {
    await ensureInitialOrgOwner(session);
  }

  if (process.env.NODE_ENV === "development" && isSupabaseConfigured() && !session.devBypass) {
    try {
      const supabase = await createServerClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      console.log("[os/auth] API session", {
        sessionUserId: session.userId,
        authUserId: user?.id ?? null,
        email: user?.email ?? session.email,
      });
    } catch {
      console.log("[os/auth] API session", {
        sessionUserId: session.userId,
        authUserId: null,
        email: session.email,
      });
    }
  }

  return session;
}
