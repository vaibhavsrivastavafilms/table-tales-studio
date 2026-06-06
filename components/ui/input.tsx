import * as React from "react";
import { cn } from "@/lib/utils";

const Input = React.forwardRef<
  HTMLInputElement,
  React.ComponentProps<"input">
>(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        "flex h-10 w-full rounded-lg border border-[var(--os-border)] bg-[var(--os-surface)] px-3 py-2 text-sm text-[var(--os-fg)] shadow-sm transition-colors placeholder:text-[var(--os-fg-subtle)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--os-accent)] disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      ref={ref}
      {...props}
    />
  );
});
Input.displayName = "Input";

export { Input };
