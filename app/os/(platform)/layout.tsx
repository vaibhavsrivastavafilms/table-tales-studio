import { isSupabaseConfigured } from "@/lib/supabase";
import { getOsSession } from "@/lib/os/auth/server";
import OsShellClient from "@/components/os/OsShellClient";
import { redirect } from "next/navigation";

export default async function OsPlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getOsSession();

  if (isSupabaseConfigured() && !session) {
    redirect("/os/auth/login");
  }

  return (
    <OsShellClient userEmail={session?.email ?? null}>{children}</OsShellClient>
  );
}
