"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { OS_NAV, type OsNavItem } from "@/lib/os/navigation";

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
}: {
  item: OsNavItem;
  pathname: string;
  onNavigate?: () => void;
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
      {item.badge ? (
        <Badge variant="default" className="ml-auto">
          {item.badge}
        </Badge>
      ) : null}
    </Link>
  );
}

export default function OsSidebar({ onNavigate, className }: OsSidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "flex h-full w-64 shrink-0 flex-col border-r border-[var(--os-border)] bg-[var(--os-sidebar)]",
        className
      )}
    >
      <div className="flex h-14 shrink-0 items-center gap-3 border-b border-[var(--os-border)] px-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--os-accent)]/15 text-sm font-bold text-[var(--os-accent)] ring-1 ring-[var(--os-accent)]/25">
          TT
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold tracking-tight">Table Tales</p>
          <p className="truncate text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--os-fg-subtle)]">
            OS
          </p>
        </div>
      </div>

      <ScrollArea className="flex-1 os-scroll">
        <nav className="space-y-6 p-3">
          {OS_NAV.map((section, idx) => (
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
                  />
                ))}
              </div>
              {idx < OS_NAV.length - 1 && section.label ? (
                <Separator className="mt-4" />
              ) : null}
            </div>
          ))}
        </nav>
      </ScrollArea>

      <div className="shrink-0 border-t border-[var(--os-border)] p-3">
        <p className="px-3 text-[10px] text-[var(--os-fg-subtle)]">
          Hospitality operations · shell preview
        </p>
      </div>
    </aside>
  );
}
