"use server";

import { redirect } from "next/navigation";
import { createServerClient, isSupabaseConfigured } from "@/lib/supabase";
import { ensureInitialOrgOwner } from "@/lib/os/repositories/org-member-repository";

export type AuthActionState = {
  error?: string;
};

export async function signInWithEmail(
  _prev: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  if (!isSupabaseConfigured()) {
    return {
      error:
        "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    };
  }

  const supabase = await createServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: error.message };
  }

  if (user) {
    await ensureInitialOrgOwner({ userId: user.id, email: user.email ?? null });
    if (process.env.NODE_ENV === "development") {
      console.log("[os/auth] signInWithPassword", {
        userId: user.id,
        email: user.email,
      });
    }
  }

  redirect("/os");
}

export async function signOut(): Promise<void> {
  if (isSupabaseConfigured()) {
    const supabase = await createServerClient();
    await supabase.auth.signOut();
  }
  redirect("/os/auth/login");
}
