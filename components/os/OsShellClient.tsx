"use client";

import { usePathname } from "next/navigation";
import OsShell from "@/components/os/OsShell";
import { ProcurementProvider } from "@/components/os/procurement/ProcurementProvider";
import { findOsNavItem } from "@/lib/os/navigation";

const PAGE_COPY: Record<string, string> = {
  "/os": "Executive snapshot — sales, profit, branches, and actions at a glance.",
  "/os/owner": "Owner command center — full business health and approval queue.",
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
    `${title} module — operational data for your restaurant group.`;

  return (
    <ProcurementProvider>
      <OsShell
        title={title}
        description={description}
        userEmail={userEmail}
        showBranchSelector
      >
        {children}
      </OsShell>
    </ProcurementProvider>
  );
}
