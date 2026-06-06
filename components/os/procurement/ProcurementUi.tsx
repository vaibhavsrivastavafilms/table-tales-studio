import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type StatCardProps = {
  label: string;
  value: string | number;
  hint?: string;
  className?: string;
};

export function StatCard({ label, value, hint, className }: StatCardProps) {
  return (
    <div className={cn("os-card p-4", className)}>
      <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--os-fg-muted-on-card)]">
        {label}
      </p>
      <p className="mt-2 text-2xl font-bold tabular-nums text-[var(--os-fg-on-card)]">
        {value}
      </p>
      {hint ? (
        <p className="mt-1 text-xs text-[var(--os-fg-muted-on-card)]">{hint}</p>
      ) : null}
    </div>
  );
}

type StatusBadgeProps = {
  status: string;
};

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-zinc-500/20 text-zinc-300",
  verified: "bg-blue-500/20 text-blue-200",
  posted: "bg-emerald-500/20 text-emerald-200",
  rejected: "bg-red-500/20 text-red-200",
  pending: "bg-[var(--os-terracotta)]/20 text-[var(--os-terracotta)]",
  pending_approval: "bg-[var(--os-terracotta)]/20 text-[var(--os-terracotta)]",
  partial: "bg-amber-500/20 text-amber-200",
  received: "bg-emerald-500/20 text-emerald-200",
  confirmed: "bg-blue-500/20 text-blue-200",
  resolved: "bg-emerald-500/20 text-emerald-200",
  omitted: "bg-red-500/20 text-red-200",
  applied: "bg-emerald-500/20 text-emerald-200",
  requested: "bg-blue-500/20 text-blue-200",
  credit_requested: "bg-blue-500/20 text-blue-200",
  credit_received: "bg-emerald-500/20 text-emerald-200",
  open: "bg-amber-500/20 text-amber-200",
  adjusted: "bg-violet-500/20 text-violet-200",
  closed: "bg-zinc-500/20 text-zinc-300",
};

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
        STATUS_STYLES[status] ?? "bg-white/10 text-white/70"
      )}
    >
      {status}
    </span>
  );
}

export { formatInr } from "@/lib/os/procurement/format";

export function LockLabel({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[var(--os-fg-muted-on-card)]">
        {label}
        <Lock className="h-3 w-3 opacity-60" />
      </p>
      <p className="mt-1 font-medium tabular-nums text-[var(--os-fg-on-card)]">
        {value}
      </p>
    </div>
  );
}

export function LineBadge({
  children,
  variant,
}: {
  children: ReactNode;
  variant: "omitted" | "short";
}) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase",
        variant === "omitted"
          ? "bg-red-500/20 text-red-700"
          : "bg-amber-500/20 text-amber-800"
      )}
    >
      {children}
    </span>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
}) {
  return (
    <div>
      {eyebrow ? (
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--os-accent)]">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="os-brand mt-1 text-3xl leading-none text-[var(--os-fg)]">
        {title}
      </h2>
      {description ? (
        <p className="mt-2 max-w-2xl text-sm text-[var(--os-fg-muted)]">
          {description}
        </p>
      ) : null}
    </div>
  );
}
