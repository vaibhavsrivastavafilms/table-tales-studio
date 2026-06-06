import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  BarChart3,
  Bell,
  BookOpen,
  Boxes,
  Building2,
  CheckSquare,
  ChefHat,
  ClipboardCheck,
  ClipboardList,
  CreditCard,
  Crown,
  FileText,
  FolderOpen,
  LayoutDashboard,
  Moon,
  Package,
  Receipt,
  Plug,
  Settings,
  ShoppingCart,
  Sparkles,
  ClipboardCheck,
  Wand2,
  Store,
  Sun,
  Truck,
  Users,
  Wallet,
  Scale,
  CircleDollarSign,
  UserCircle,
  CalendarCheck,
  Banknote,
  Zap,
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
        title: "Command Center",
        href: "/os",
        icon: Crown,
      },
      {
        title: "Owner View",
        href: "/os/owner",
        icon: LayoutDashboard,
      },
      {
        title: "Business Readiness",
        href: "/os/business-readiness",
        icon: ClipboardCheck,
      },
      {
        title: "Setup Wizard",
        href: "/os/setup",
        icon: Wand2,
      },
      {
        title: "AI Copilot",
        href: "/os/ai-copilot",
        icon: Sparkles,
        badge: "AI",
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
      { title: "Opening Stock", href: "/os/inventory/opening-stock", icon: Sun },
      { title: "Closing Stock", href: "/os/inventory/closing-stock", icon: Moon },
      { title: "Stock Audit", href: "/os/inventory/stock-audit", icon: Boxes },
      { title: "Item Master", href: "/os/inventory/items", icon: Package },
      { title: "Transfers", href: "/os/inventory/transfers", icon: Truck },
      { title: "Stock Count", href: "/os/inventory/stock-count", icon: Boxes },
    ],
  },
  {
    id: "procurement",
    label: "Procurement",
    items: [
      {
        title: "Procurement",
        href: "/os/procurement",
        icon: ShoppingCart,
        badge: "V1.5",
      },
      { title: "Analytics", href: "/os/procurement/analytics", icon: BarChart3 },
      { title: "GRN", href: "/os/procurement/grn", icon: ClipboardCheck },
      { title: "Upload Bill", href: "/os/procurement/upload-bill", icon: FileText },
      { title: "Vendors", href: "/os/procurement/vendors", icon: Store },
      { title: "Purchase Bills", href: "/os/procurement/purchase-bills", icon: Receipt },
      {
        title: "Revision Invoices",
        href: "/os/procurement/revision-invoices",
        icon: FileText,
      },
      { title: "Vendor Ledger", href: "/os/procurement/vendor-ledger", icon: BookOpen },
      { title: "Omissions", href: "/os/procurement/omissions", icon: AlertTriangle },
      {
        title: "Credit Note Register",
        href: "/os/procurement/credit-note-register",
        icon: ClipboardList,
      },
      { title: "Vendor Disputes", href: "/os/procurement/vendor-disputes", icon: Scale },
      {
        title: "Recovery Dashboard",
        href: "/os/procurement/recovery",
        icon: LayoutDashboard,
      },
      { title: "Credit Recovery", href: "/os/procurement/credit-recovery", icon: CircleDollarSign },
      { title: "Credit Notes", href: "/os/procurement/credit-notes", icon: CreditCard },
      { title: "Payments", href: "/os/procurement/payments", icon: Wallet },
    ],
  },
  {
    id: "finance",
    label: "Finance",
    items: [
      { title: "Expenses", href: "/os/finance/expenses", icon: Wallet },
      { title: "Approvals", href: "/os/approvals", icon: CheckSquare },
    ],
  },
  {
    id: "hr",
    label: "HR & Payroll",
    items: [
      { title: "Employee Master", href: "/os/hr/employees", icon: UserCircle },
      { title: "Attendance", href: "/os/hr/attendance", icon: CalendarCheck, badge: "Flip" },
      { title: "Payroll", href: "/os/hr/payroll", icon: Banknote },
      { title: "HR MIS", href: "/os/hr/mis", icon: BarChart3 },
    ],
  },
  {
    id: "kitchen",
    label: "Kitchen",
    items: [
      { title: "Recipes", href: "/os/kitchen/recipes", icon: ChefHat },
      { title: "Menu Overview", href: "/os/recipes/menu", icon: BookOpen },
      { title: "Ingredient Rates", href: "/os/recipes/ingredients", icon: Scale },
      { title: "Prep Production", href: "/os/kitchen/prep-production", icon: Sparkles },
      { title: "Central Kitchen", href: "/os/kitchen/central-kitchen", icon: Users },
    ],
  },
  {
    id: "reports",
    label: "Reports",
    items: [
      { title: "AI Owner Insights", href: "/os/reports/ai-insights", icon: Sparkles, badge: "AI" },
      { title: "Monthly MIS", href: "/os/reports/monthly-mis", icon: LayoutDashboard },
      { title: "P&L Report", href: "/os/reports/pnl", icon: BarChart3 },
      { title: "Management MIS", href: "/os/reports/profitability", icon: ClipboardList },
      { title: "Food Cost", href: "/os/reports/food-cost", icon: BarChart3 },
      { title: "Labor Cost", href: "/os/reports/labor-cost", icon: Users },
    ],
  },
  {
    id: "platform",
    label: "Platform",
    items: [
      { title: "Notifications", href: "/os/notifications", icon: Bell },
      { title: "Document Vault", href: "/os/documents", icon: FolderOpen },
      { title: "Daily Auto MIS", href: "/os/automation/daily-mis", icon: Zap },
    ],
  },
  {
    id: "integrations",
    label: "Integrations",
    items: [
      {
        title: "Flip Office POS",
        href: "/os/integrations/flip-office",
        icon: Plug,
      },
    ],
  },
  {
    id: "settings",
    items: [
      { title: "Settings", href: "/os/settings", icon: Settings },
      { title: "Branches", href: "/os/settings/branches", icon: Building2 },
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
