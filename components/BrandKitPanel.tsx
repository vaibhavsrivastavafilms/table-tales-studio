"use client";

import { memo, useCallback, useEffect, useRef, useState, startTransition } from "react";
import { useIsClient } from "@/lib/clientHooks";
import {
  createBrandKit,
  DEFAULT_BRAND_KIT,
  listBrandKitIds,
  loadBrandKit,
  saveBrandKit,
  switchBrandKit,
  TYPOGRAPHY_PRESETS,
  type BrandKit,
  type BrandTone,
  type TypographyPreset,
} from "@/lib/brandKit";

type BrandKitPanelProps = {
  projectId: string | null;
  onChange: (kit: BrandKit) => void;
};

function BrandKitPanel({ projectId, onChange }: BrandKitPanelProps) {
  const isClient = useIsClient();
  const [kit, setKit] = useState<BrandKit>(DEFAULT_BRAND_KIT);
  const [kitIds, setKitIds] = useState<string[]>(["default"]);
  const [open, setOpen] = useState(false);
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (!isClient) return;
    startTransition(() => {
      const loaded = loadBrandKit(projectId);
      setKit(loaded);
      onChangeRef.current(loaded);
      setKitIds(listBrandKitIds(projectId));
    });
  }, [isClient, projectId]);

  const refresh = useCallback(
    (next: BrandKit) => {
      setKit(next);
      onChange(next);
      setKitIds(listBrandKitIds(projectId));
    },
    [onChange, projectId]
  );

  const update = (patch: Partial<BrandKit>) => {
    refresh(saveBrandKit(projectId, patch));
  };

  const applyKit = (id: string) => {
    refresh(switchBrandKit(projectId, id));
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mb-4 w-full rounded-2xl border border-zinc-800 bg-zinc-900/50 py-3 text-xs font-semibold text-zinc-400 transition hover:border-[#f7c600]/30 hover:text-[#f7c600]"
      >
        Brand kit · {kit.brandName || (kit.accentColor === DEFAULT_BRAND_KIT.accentColor ? "default" : "custom")}
      </button>
    );
  }

  return (
    <section className="mb-4 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4 ring-1 ring-white/5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-bold text-[#f7c600]">Brand kit</h3>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-xs text-zinc-500 hover:text-white"
        >
          Collapse
        </button>
      </div>

      <div className="mb-3 flex flex-wrap gap-2">
        <select
          value={kit.id}
          onChange={(e) => applyKit(e.target.value)}
          className="min-h-[36px] flex-1 rounded-lg bg-black p-2 text-xs text-white ring-1 ring-zinc-800"
        >
          {kitIds.map((id) => (
            <option key={id} value={id}>
              {id === "default" ? "Default kit" : id}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => {
            const created = createBrandKit(projectId, `Kit ${kitIds.length + 1}`);
            refresh(created);
          }}
          className="rounded-lg border border-zinc-700 px-2 py-1 text-[10px] font-semibold text-zinc-400"
        >
          New kit
        </button>
        <button
          type="button"
          onClick={() => refresh(loadBrandKit(projectId))}
          className="rounded-lg bg-[#f7c600]/20 px-2 py-1 text-[10px] font-bold text-[#f7c600]"
        >
          Apply brand kit
        </button>
      </div>

      <label className="mb-3 block text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
        Brand name
        <input
          type="text"
          value={kit.brandName}
          onChange={(e) => update({ brandName: e.target.value })}
          className="mt-1 w-full rounded-lg bg-black p-2 text-sm text-white ring-1 ring-zinc-800"
        />
      </label>

      <label className="mb-3 block text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
        Brand tone
        <select
          value={kit.brandTone}
          onChange={(e) => update({ brandTone: e.target.value as BrandTone })}
          className="mt-1 w-full rounded-lg bg-black p-2 text-sm text-white ring-1 ring-zinc-800"
        >
          {(["cinematic", "playful", "luxury", "raw", "founder"] as BrandTone[]).map(
            (t) => (
              <option key={t} value={t}>
                {t}
              </option>
            )
          )}
        </select>
      </label>

      <label className="mb-3 block text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
        Accent color
        <input
          type="color"
          value={kit.accentColor}
          onChange={(e) => update({ accentColor: e.target.value })}
          className="mt-1 block h-10 w-full cursor-pointer rounded-lg bg-black"
        />
      </label>

      <label className="mb-3 block text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
        Typography
        <select
          value={kit.typographyPreset}
          onChange={(e) =>
            update({ typographyPreset: e.target.value as TypographyPreset })
          }
          className="mt-1 w-full rounded-lg bg-black p-2 text-sm text-white ring-1 ring-zinc-800"
        >
          {TYPOGRAPHY_PRESETS.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
        </select>
      </label>

      <label className="mb-3 block text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
        Hook pattern
        <input
          type="text"
          value={kit.hookPattern}
          placeholder="Nobody noticed this tiny stall…"
          onChange={(e) => update({ hookPattern: e.target.value })}
          className="mt-1 w-full rounded-lg bg-black p-2 text-sm text-white ring-1 ring-zinc-800"
        />
      </label>

      <label className="mb-3 block text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
        Hashtags (for reference)
        <input
          type="text"
          value={kit.hashtags}
          placeholder="#streetfood #ahmedabad"
          onChange={(e) => update({ hashtags: e.target.value })}
          className="mt-1 w-full rounded-lg bg-black p-2 text-sm text-white ring-1 ring-zinc-800"
        />
      </label>

      <label className="mb-3 block text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
        Watermark text
        <input
          type="text"
          value={kit.watermarkText}
          placeholder="Your brand name"
          onChange={(e) => update({ watermarkText: e.target.value })}
          className="mt-1 w-full rounded-lg bg-black p-2 text-sm text-white ring-1 ring-zinc-800"
        />
      </label>

      <label className="mb-3 block text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
        Brand CTA default
        <input
          type="text"
          value={kit.brandCta}
          placeholder="Follow for the next drop"
          onChange={(e) => update({ brandCta: e.target.value })}
          className="mt-1 w-full rounded-lg bg-black p-2 text-sm text-white ring-1 ring-zinc-800"
        />
      </label>

      <label className="block text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
        Intro line (slide 1 vibe)
        <input
          type="text"
          value={kit.introLine}
          onChange={(e) => update({ introLine: e.target.value })}
          className="mt-1 w-full rounded-lg bg-black p-2 text-sm text-white ring-1 ring-zinc-800"
        />
      </label>
    </section>
  );
}

export default memo(BrandKitPanel);
