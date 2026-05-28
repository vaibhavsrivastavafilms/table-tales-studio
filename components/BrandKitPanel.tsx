"use client";

import { memo, useState } from "react";
import {
  DEFAULT_BRAND_KIT,
  loadBrandKit,
  saveBrandKit,
  TYPOGRAPHY_PRESETS,
  type BrandKit,
  type TypographyPreset,
} from "@/lib/brandKit";

type BrandKitPanelProps = {
  projectId: string | null;
  onChange: (kit: BrandKit) => void;
};

function BrandKitPanel({ projectId, onChange }: BrandKitPanelProps) {
  const [kit, setKit] = useState<BrandKit>(() => loadBrandKit(projectId));
  const [open, setOpen] = useState(false);

  const update = (patch: Partial<BrandKit>) => {
    const next = saveBrandKit(projectId, patch);
    setKit(next);
    onChange(next);
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mb-4 w-full rounded-2xl border border-zinc-800 bg-zinc-900/50 py-3 text-xs font-semibold text-zinc-400 transition hover:border-[#f7c600]/30 hover:text-[#f7c600]"
      >
        Brand kit · {kit.accentColor === DEFAULT_BRAND_KIT.accentColor ? "default" : "custom"}
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
