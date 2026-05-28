"use client";

import { memo, useCallback, useMemo, useState } from "react";
import {
  categoryForMode,
  getHookVariants,
  getViralHooks,
  HOOK_CATEGORIES,
  type HookCategory,
  type ViralHookMode,
} from "@/lib/viralHooks";
import { recordHookCategory } from "@/lib/creatorMemory";

type ViralHooksBarProps = {
  viralMode: ViralHookMode;
  currentHook: string;
  onApplyHook: (hook: string) => void;
};

function ViralHooksBar({
  viralMode,
  currentHook,
  onApplyHook,
}: ViralHooksBarProps) {
  const [category, setCategory] = useState<HookCategory>(() =>
    categoryForMode(viralMode)
  );
  const [variants, setVariants] = useState<string[]>([]);

  const preview = useMemo(() => getViralHooks(category, 3), [category]);

  const generate = useCallback(() => {
    const hooks = getViralHooks(category, 5);
    setVariants(hooks);
    recordHookCategory(category);
    if (hooks[0]) onApplyHook(hooks[0]);
  }, [category, onApplyHook]);

  const remix = useCallback(() => {
    const next = getHookVariants(currentHook, category);
    setVariants(next);
    recordHookCategory(category);
    if (next[1]) onApplyHook(next[1]);
  }, [category, currentHook, onApplyHook]);

  return (
    <div className="mb-4 rounded-2xl bg-zinc-900/80 p-3 ring-1 ring-[#f7c600]/15">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
          Viral hooks
        </p>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as HookCategory)}
          className="min-h-[32px] rounded-lg bg-black px-2 text-xs text-white ring-1 ring-zinc-800"
        >
          {HOOK_CATEGORIES.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={generate}
          className="btn-press rounded-full bg-[#f7c600] px-3 py-1.5 text-[11px] font-bold text-black"
        >
          Generate viral hooks
        </button>
        <button
          type="button"
          onClick={remix}
          className="btn-press rounded-full border border-zinc-700 px-3 py-1.5 text-[11px] font-semibold text-zinc-300"
        >
          Remix hook
        </button>
      </div>
      {(variants.length > 0 || preview.length > 0) && (
        <div className="mt-2 flex flex-wrap gap-2">
          {(variants.length ? variants : preview).map((hook) => (
            <button
              key={hook}
              type="button"
              onClick={() => onApplyHook(hook)}
              className="max-w-full truncate rounded-full border border-zinc-700 px-2 py-1 text-[10px] text-zinc-400 hover:border-[#f7c600]/40 hover:text-[#f7c600]"
              title={hook}
            >
              {hook.length > 48 ? `${hook.slice(0, 48)}…` : hook}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default memo(ViralHooksBar);
