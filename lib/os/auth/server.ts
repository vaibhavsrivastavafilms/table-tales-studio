import { redirect } from "next/navigation";
import { createServerClient, isSupabaseConfigured } from "@/lib/supabase";

export type OsSession = {
  userId: string;
  email: string | null;
};

export async function getOsSession(): Promise<OsSession | null> {
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

export async function requireOsSession(): Promise<OsSession> {
  const session = await getOsSession();
  if (!session) {
    redirect("/os/auth/login");
  }
  return session;
}
