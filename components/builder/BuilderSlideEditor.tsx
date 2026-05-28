"use client";

import { memo } from "react";
import type { SlideKey } from "@/lib/slides";
import {
  DEFAULT_SLIDE_PREFS,
  type CaptionAlignmentPref,
  type CaptionPlacementPref,
  type SlideEditorPrefs,
} from "@/lib/slideEditorPrefs";

type BuilderSlideEditorProps = {
  slideIndex: number;
  slideKey: SlideKey;
  caption: string;
  prefs: SlideEditorPrefs;
  onCaptionChange: (key: SlideKey, value: string) => void;
  onPrefsChange: (slideIndex: number, patch: Partial<SlideEditorPrefs>) => void;
  isDoodleTemplate: boolean;
};

function BuilderSlideEditor({
  slideIndex,
  slideKey,
  caption,
  prefs,
  onCaptionChange,
  onPrefsChange,
  isDoodleTemplate,
}: BuilderSlideEditorProps) {
  const patch = (p: Partial<SlideEditorPrefs>) =>
    onPrefsChange(slideIndex, p);

  return (
    <aside className="builder-panel flex h-full flex-col gap-4 overflow-y-auto p-4 md:p-5">
      <div>
        <h2 className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
          Slide {slideIndex + 1}
        </h2>
        <p className="mt-0.5 text-[11px] text-zinc-600">Fine-tune this frame</p>
      </div>

      <label className="block">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
          Caption
        </span>
        <textarea
          value={caption}
          onChange={(e) => onCaptionChange(slideKey, e.target.value)}
          rows={4}
          className="mt-2 w-full resize-none rounded-xl border border-white/10 bg-black/40 p-3 text-sm text-white placeholder:text-zinc-600 focus:border-[#f4c430]/40 focus:outline-none"
          placeholder="Emotional beat for this slide…"
        />
      </label>

      <label className="block text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
        Text position
        <select
          value={prefs.captionPlacement}
          onChange={(e) =>
            patch({
              captionPlacement: e.target.value as CaptionPlacementPref,
            })
          }
          className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-2 py-2 text-sm text-white"
        >
          <option value="top">Top</option>
          <option value="bottom">Bottom</option>
        </select>
      </label>

      <label className="block text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
        Alignment
        <select
          value={prefs.captionAlignment}
          onChange={(e) =>
            patch({
              captionAlignment: e.target.value as CaptionAlignmentPref,
            })
          }
          className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-2 py-2 text-sm text-white"
        >
          <option value="left">Left</option>
          <option value="center">Center</option>
          <option value="right">Right</option>
        </select>
      </label>

      <label className="block">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
          Typography size
        </span>
        <div className="mt-2 flex items-center gap-3">
          <input
            type="range"
            min={85}
            max={125}
            value={Math.round(prefs.typographyScale * 100)}
            onChange={(e) =>
              patch({ typographyScale: Number(e.target.value) / 100 })
            }
            className="flex-1 accent-[#f4c430]"
          />
          <span className="w-10 text-right text-xs text-zinc-400">
            {Math.round(prefs.typographyScale * 100)}%
          </span>
        </div>
      </label>

      {isDoodleTemplate && (
        <>
          <label className="flex items-center justify-between gap-3">
            <span className="text-sm text-zinc-300">Doodles</span>
            <input
              type="checkbox"
              checked={prefs.doodlesEnabled}
              onChange={(e) => patch({ doodlesEnabled: e.target.checked })}
              className="h-4 w-4 accent-[#f4c430]"
            />
          </label>

          <label className="block">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
              Overlay intensity
            </span>
            <div className="mt-2 flex items-center gap-3">
              <input
                type="range"
                min={0}
                max={100}
                value={Math.round(prefs.overlayIntensity * 100)}
                onChange={(e) =>
                  patch({ overlayIntensity: Number(e.target.value) / 100 })
                }
                className="flex-1 accent-[#f4c430]"
              />
              <span className="w-8 text-right text-xs text-zinc-400">
                {Math.round(prefs.overlayIntensity * 100)}%
              </span>
            </div>
          </label>

          <label className="block">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
              Sticker density
            </span>
            <div className="mt-2 flex items-center gap-3">
              <input
                type="range"
                min={0}
                max={100}
                value={Math.round(prefs.stickerDensity * 100)}
                onChange={(e) =>
                  patch({ stickerDensity: Number(e.target.value) / 100 })
                }
                className="flex-1 accent-[#f4c430]"
              />
              <span className="w-8 text-right text-xs text-zinc-400">
                {Math.round(prefs.stickerDensity * 100)}%
              </span>
            </div>
          </label>
        </>
      )}

      <button
        type="button"
        onClick={() => onPrefsChange(slideIndex, { ...DEFAULT_SLIDE_PREFS })}
        className="text-[10px] font-semibold uppercase tracking-wider text-zinc-600 hover:text-zinc-400"
      >
        Reset slide
      </button>
    </aside>
  );
}

export default memo(BuilderSlideEditor);
