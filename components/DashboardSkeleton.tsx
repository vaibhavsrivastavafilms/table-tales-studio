type DashboardSkeletonProps = {
  variant?: "dashboard" | "studio";
};

export default function DashboardSkeleton({
  variant = "dashboard",
}: DashboardSkeletonProps) {
  if (variant === "studio") {
    return (
      <div
        className="flex h-full flex-col"
        aria-busy="true"
        aria-label="Loading studio"
      >
        <div className="h-14 shrink-0 border-b border-white/[0.06] bg-[#0a0a0c] animate-pulse" />
        <div className="flex flex-1 flex-col gap-3 p-4 lg:flex-row">
          <div className="h-48 rounded-2xl bg-white/[0.04] animate-pulse lg:h-auto lg:w-72" />
          <div className="min-h-[40vh] flex-1 rounded-2xl bg-white/[0.06] animate-pulse" />
          <div className="h-48 rounded-2xl bg-white/[0.04] animate-pulse lg:h-auto lg:w-72" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading dashboard">
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-black/10">
        <div className="creator-loading-bar h-full w-1/3 rounded-full" />
      </div>
      <div className="skeleton-rise animate-pulse">
        <div className="h-10 w-2/3 max-w-md rounded-xl bg-black/10" />
        <div className="h-4 w-1/2 max-w-sm rounded-lg bg-black/10" />
        <div className="grid gap-4 xl:grid-cols-12">
          <div className="hidden h-64 rounded-3xl bg-[#0b0f1a]/40 xl:block xl:col-span-2" />
          <div className="h-80 rounded-[40px] bg-[#0b0f1a]/50 xl:col-span-5" />
          <div className="h-80 rounded-[40px] bg-[#0b0f1a]/50 xl:col-span-5" />
        </div>
      </div>
    </div>
  );
}
