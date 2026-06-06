"use client";

import { useState } from "react";
import { Menu, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import OsSidebar from "@/components/os/OsSidebar";
import OsBranchSelectorSlot from "@/components/os/OsBranchSelectorSlot";
import { useOsTheme } from "@/components/os/OsThemeProvider";

type OsMobileHeaderProps = {
  title: string;
  userEmail?: string | null;
  showBranchSelector?: boolean;
};

export default function OsMobileHeader({
  title,
  userEmail,
  showBranchSelector = false,
}: OsMobileHeaderProps) {
  const { theme, toggleTheme } = useOsTheme();
  const [open, setOpen] = useState(false);

  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-[var(--os-border)] bg-[var(--os-bg-subtle)] px-4 lg:hidden">
      <div className="flex min-w-0 items-center gap-2">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Open navigation">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[min(100vw-2rem,18rem)] p-0">
            <OsSidebar
              className="w-full border-0"
              onNavigate={() => setOpen(false)}
            />
          </SheetContent>
        </Sheet>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{title}</p>
          {userEmail ? (
            <p className="truncate text-[10px] text-[var(--os-fg-subtle)]">
              {userEmail}
            </p>
          ) : null}
        </div>
      </div>
      <div className="flex items-center gap-1">
        {showBranchSelector ? <OsBranchSelectorSlot compact /> : null}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          aria-label="Toggle theme"
        >
          {theme === "dark" ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
        </Button>
      </div>
    </header>
  );
}
