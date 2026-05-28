type EmptyStateProps = {
  title: string;
  description: string;
  icon?: string;
};

export default function EmptyState({
  title,
  description,
  icon = "✦",
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-700/80 bg-black/30 px-6 py-10 text-center transition-colors duration-300 hover:border-[#f7c600]/25">
      <span className="mb-3 text-2xl text-[#f7c600]/80">{icon}</span>
      <p className="text-sm font-bold text-white">{title}</p>
      <p className="mt-2 max-w-xs text-xs leading-relaxed text-zinc-500">
        {description}
      </p>
    </div>
  );
}
