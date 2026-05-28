type EmptyStateProps = {
  title: string;
  description: string;
  icon?: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
};

export default function EmptyState({
  title,
  description,
  icon = "✦",
  actionLabel,
  onAction,
  secondaryLabel,
  onSecondary,
}: EmptyStateProps) {
  return (
    <div className="empty-state flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-700/80 bg-gradient-to-b from-black/40 to-black/20 px-6 py-10 text-center transition-colors duration-200 hover:border-[#f7c600]/25">
      <div
        className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f7c600]/10 text-2xl ring-1 ring-[#f7c600]/20"
        aria-hidden
      >
        {icon}
      </div>
      <p className="text-sm font-bold text-white">{title}</p>
      <p className="mt-2 max-w-xs text-xs leading-relaxed text-zinc-500">
        {description}
      </p>
      {(actionLabel || secondaryLabel) && (
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          {actionLabel && onAction && (
            <button
              type="button"
              onClick={onAction}
              className="btn-press min-h-[40px] rounded-xl bg-[#f7c600] px-5 py-2 text-xs font-bold text-black transition hover:bg-[#ffe033]"
            >
              {actionLabel}
            </button>
          )}
          {secondaryLabel && onSecondary && (
            <button
              type="button"
              onClick={onSecondary}
              className="btn-press min-h-[40px] rounded-xl border border-zinc-700 px-5 py-2 text-xs font-semibold text-zinc-400 transition hover:text-white"
            >
              {secondaryLabel}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
