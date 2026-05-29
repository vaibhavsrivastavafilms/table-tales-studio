import { Skeleton } from "@/components/ui/skeleton";

type OsPlaceholderProps = {
  title: string;
  description: string;
};

export default function OsPlaceholder({ title, description }: OsPlaceholderProps) {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="os-card p-6 md:p-8">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--os-accent)]">
          Coming soon
        </p>
        <h2 className="mt-2 text-2xl font-bold tracking-tight">{title}</h2>
        <p className="mt-2 max-w-2xl text-sm text-[var(--os-fg-muted)]">
          {description}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="os-card p-4 space-y-3">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-4/5" />
          </div>
        ))}
      </div>
    </div>
  );
}
