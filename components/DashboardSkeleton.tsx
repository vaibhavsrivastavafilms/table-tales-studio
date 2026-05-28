export default function DashboardSkeleton() {
  return (
    <div className="animate-pulse space-y-4" aria-busy="true" aria-label="Loading dashboard">
      <div className="h-10 w-2/3 max-w-md rounded-xl bg-black/10" />
      <div className="h-4 w-1/2 max-w-sm rounded-lg bg-black/10" />
      <div className="grid gap-4 xl:grid-cols-12">
        <div className="hidden h-64 rounded-3xl bg-[#0b0f1a]/40 xl:block xl:col-span-2" />
        <div className="h-80 rounded-[40px] bg-[#0b0f1a]/50 xl:col-span-5" />
        <div className="h-80 rounded-[40px] bg-[#0b0f1a]/50 xl:col-span-5" />
      </div>
    </div>
  );
}
