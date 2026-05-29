import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  BookOpen,
  Boxes,
  ChefHat,
  ClipboardList,
  CreditCard,
  FileText,
  LayoutDashboard,
  Package,
  Receipt,
  Settings,
  Sparkles,
  Store,
  Truck,
  Users,
  Wallet,
} from "lucide-react";

export type OsNavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
};

export type OsNavSection = {
  id: string;
  label?: string;
  items: OsNavItem[];
};

export const OS_NAV: OsNavSection[] = [
  {
    id: "home",
    items: [
      {
        title: "Dashboard",
        href: "/os",
        icon: LayoutDashboard,
      },
    ],
  },
  {
    id: "operations",
    label: "Operations",
    items: [
      { title: "Daily Closing", href: "/os/operations/daily-closing", icon: ClipboardList },
      { title: "Sales", href: "/os/operations/sales", icon: Receipt },
    ],
  },
  {
    id: "inventory",
    label: "Inventory",
    items: [
      { title: "Inventory", href: "/os/inventory", icon: Package },
      { title: "Transfers", href: "/os/inventory/transfers", icon: Truck },
      { title: "Stock Count", href: "/os/inventory/stock-count", icon: Boxes },
    ],
  },
  {
    id: "procurement",
    label: "Procurement",
    items: [
      { title: "Vendors", href: "/os/procurement/vendors", icon: Store },
      { title: "Purchase Bills", href: "/os/procurement/purchase-bills", icon: FileText },
      { title: "Vendor Ledger", href: "/os/procurement/vendor-ledger", icon: BookOpen },
      { title: "Payments", href: "/os/procurement/payments", icon: Wallet },
    ],
  },
  {
    id: "kitchen",
    label: "Kitchen",
    items: [
      { title: "Recipes", href: "/os/kitchen/recipes", icon: ChefHat },
      { title: "Prep Production", href: "/os/kitchen/prep-production", icon: Sparkles },
      { title: "Central Kitchen", href: "/os/kitchen/central-kitchen", icon: Users },
    ],
  },
  {
    id: "reports",
    label: "Reports",
    items: [
      { title: "AI MIS", href: "/os/reports/ai-mis", icon: Sparkles, badge: "AI" },
      { title: "Food Cost", href: "/os/reports/food-cost", icon: BarChart3 },
      { title: "Profitability", href: "/os/reports/profitability", icon: CreditCard },
    ],
  },
  {
    id: "settings",
    items: [
      { title: "Settings", href: "/os/settings", icon: Settings },
    ],
  },
];

export function findOsNavItem(pathname: string): OsNavItem | undefined {
  let best: OsNavItem | undefined;
  let bestLen = -1;

  for (const section of OS_NAV) {
    for (const item of section.items) {
      const exact = pathname === item.href;
      const nested =
        item.href !== "/os" &&
        (pathname.startsWith(`${item.href}/`) || pathname === item.href);
      const isMatch = item.href === "/os" ? exact : nested || exact;

      if (isMatch && item.href.length > bestLen) {
        best = item;
        bestLen = item.href.length;
      }
    }
  }

  return best;
}
