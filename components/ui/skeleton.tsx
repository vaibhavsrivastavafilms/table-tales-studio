import { cn } from "@/lib/utils";

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-lg bg-[var(--os-surface-elevated)]",
        className
      )}
      {...props}
    />
  );
}

export { Skeleton };
