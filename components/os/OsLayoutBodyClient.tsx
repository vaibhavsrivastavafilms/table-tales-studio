"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import OsShellClient from "@/components/os/OsShellClient";
import type { OsSession } from "@/lib/os/auth/server";
import { getDevOsSession, isOsDevAuthBypass } from "@/lib/os/auth/dev-bypass";

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
  const devBypass = isOsDevAuthBypass();
  const effectiveSession = session ?? (devBypass ? getDevOsSession() : null);

  useEffect(() => {
    if (devBypass || isAuthRoute || !supabaseConfigured || session) return;
    const next = pathname || "/os";
    router.replace(`/os/auth/login?next=${encodeURIComponent(next)}`);
  }, [devBypass, isAuthRoute, supabaseConfigured, session, pathname, router]);

  if (isAuthRoute) {
    return <>{children}</>;
  }

  if (!devBypass && supabaseConfigured && !session) {
    return null;
  }

  return (
    <OsShellClient userEmail={effectiveSession?.email ?? null}>{children}</OsShellClient>
  );
}
