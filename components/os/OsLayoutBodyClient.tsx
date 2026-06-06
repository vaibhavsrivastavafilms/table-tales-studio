"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import OsShellClient from "@/components/os/OsShellClient";
import type { OsSession } from "@/lib/os/auth/server";

type OsLayoutBodyClientProps = {
  session: OsSession | null;
  supabaseConfigured: boolean;
  children: React.ReactNode;
};

export default function OsLayoutBodyClient({
  session,
  supabaseConfigured,
  children,
}: OsLayoutBodyClientProps) {
  const pathname = usePathname();
  const router = useRouter();
  const isAuthRoute = pathname.startsWith("/os/auth");

  useEffect(() => {
    if (isAuthRoute || !supabaseConfigured || session) return;
    const next = pathname || "/os";
    router.replace(`/os/auth/login?next=${encodeURIComponent(next)}`);
  }, [isAuthRoute, supabaseConfigured, session, pathname, router]);

  if (isAuthRoute) {
    return <>{children}</>;
  }

  if (supabaseConfigured && !session) {
    return null;
  }

  return (
    <OsShellClient userEmail={session?.email ?? null}>{children}</OsShellClient>
  );
}
