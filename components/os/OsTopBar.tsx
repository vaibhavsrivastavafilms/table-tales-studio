"use client";

import { LogOut, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/os/auth/actions";
import { useOsTheme } from "@/components/os/OsThemeProvider";

type OsTopBarProps = {
  title: string;
  description?: string;
  userEmail?: string | null;
};

export default function OsTopBar({
  title,
  description,
  userEmail,
}: OsTopBarProps) {
  const { theme, toggleTheme } = useOsTheme();

  return (
    <header className="hidden h-14 shrink-0 items-center justify-between gap-4 border-b border-[var(--os-border)] bg-[var(--os-bg-subtle)] px-6 lg:flex">
      <div className="min-w-0">
        <h1 className="truncate text-base font-semibold tracking-tight">{title}</h1>
        {description ? (
          <p className="truncate text-xs text-[var(--os-fg-muted)]">{description}</p>
        ) : null}
      </div>
      <div className="flex items-center gap-2">
        {userEmail ? (
          <span className="hidden text-xs text-[var(--os-fg-subtle)] xl:inline">
            {userEmail}
          </span>
        ) : null}
        <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
          {theme === "dark" ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
        </Button>
        <form action={signOut}>
          <Button variant="outline" size="sm" type="submit">
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        </form>
      </div>
    </header>
  );
}
