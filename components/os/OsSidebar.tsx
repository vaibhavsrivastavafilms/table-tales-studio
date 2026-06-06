"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { OS_NAV, type OsNavItem } from "@/lib/os/navigation";
import TableTalesLogo from "@/components/brand/TableTalesLogo";
import { countPendingApprovals } from "@/lib/os/approvals/engine";
import { useProcurement } from "@/components/os/procurement/ProcurementProvider";

type OsSidebarProps = {
  onNavigate?: () => void;
  className?: string;
};

function isActive(pathname: string, href: string): boolean {
  if (href === "/os") return pathname === "/os";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavLink({
  item,
  pathname,
  onNavigate,
  badge,
}: {
  item: OsNavItem;
  pathname: string;
  onNavigate?: () => void;
  badge?: number;
}) {
  const active = isActive(pathname, item.href);
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={cn(
        "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
        active
          ? "os-nav-active"
          : "text-[var(--os-fg-muted)] hover:bg-[var(--os-surface-hover)] hover:text-[var(--os-fg)]"
      )}
    >
      <Icon
        className={cn(
          "h-4 w-4 shrink-0",
          active ? "text-[var(--os-accent)]" : "opacity-70 group-hover:opacity-100"
        )}
      />
      <span className="truncate">{item.title}</span>
      {badge && badge > 0 ? (
        <span className="ml-auto rounded-full bg-[var(--os-terracotta)] px-1.5 py-0.5 text-[10px] font-bold text-white">
          {badge}
        </span>
      ) : null}
      {item.badge && !badge ? (
        <span className="ml-auto text-[9px] font-bold uppercase tracking-wider text-[var(--os-accent)]">
          {item.badge}
        </span>
      ) : null}
    </Link>
  );
}

export default function OsSidebar({ onNavigate, className }: OsSidebarProps) {
  const pathname = usePathname();
  const { db, activeBranchId } = useProcurement();
  const pendingApprovals = countPendingApprovals(db, activeBranchId);

  return (
    <aside
      className={cn(
        "flex h-full min-h-[100dvh] w-64 shrink-0 flex-col border-r border-[var(--os-border)] bg-[var(--os-sidebar)]",
        className
      )}
    >
      <div className="shrink-0 border-b border-[var(--os-border)] px-4 py-5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <TableTalesLogo size="sm" className="max-w-[140px]" priority />
            <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--os-fg-subtle)]">
              Hospitality OS
            </p>
          </div>
          <span className="os-tag shrink-0">OS</span>
        </div>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto os-scroll p-3">
        {OS_NAV.map((section) => (
          <div key={section.id}>
            {section.label ? (
              <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--os-fg-subtle)]">
                {section.label}
              </p>
            ) : null}
            <div className="space-y-0.5">
              {section.items.map((item) => (
                <NavLink
                  key={item.href}
                  item={item}
                  pathname={pathname}
                  onNavigate={onNavigate}
                  badge={item.href === "/os/approvals" ? pendingApprovals : undefined}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}
