"use client";

import { usePathname } from "next/navigation";
import OsShell from "@/components/os/OsShell";
import { findOsNavItem } from "@/lib/os/navigation";

const PAGE_COPY: Record<string, string> = {
  "/os": "Overview of outlets, sales pulse, and operational alerts.",
};

type OsShellClientProps = {
  userEmail?: string | null;
  children: React.ReactNode;
};

export default function OsShellClient({
  userEmail,
  children,
}: OsShellClientProps) {
  const pathname = usePathname();
  const navItem = findOsNavItem(pathname);
  const title = navItem?.title ?? "Table Tales OS";
  const description =
    PAGE_COPY[pathname] ??
    `${title} module — business logic ships in a future release.`;

  return (
    <OsShell title={title} description={description} userEmail={userEmail}>
      {children}
    </OsShell>
  );
}
