"use client";

import { memo, useCallback } from "react";
import {
  DIRECTION_AUDIENCES,
  DIRECTION_EMOTIONS,
  STORY_GOALS,
  type CreatorDirection,
} from "@/lib/creatorDirection";
import { PLATFORM_MODES, type PlatformModeId } from "@/lib/platformModes";

const PLATFORM_OPTIONS: { id: PlatformModeId; label: string }[] = [
  ...PLATFORM_MODES.map((p) => ({ id: p.id, label: p.label })),
];

type CreativeDirectorPanelProps = {
  value: CreatorDirection;
  onChange: (next: CreatorDirection) => void;
  disabled?: boolean;
};

function CreativeDirectorPanel({
  value,
  onChange,
  disabled = false,
}: CreativeDirectorPanelProps) {
  const patch = useCallback(
    (partial: Partial<CreatorDirection>) => {
      onChange({ ...value, ...partial });
    },
    [onChange, value]
  );

  return (
    <section className="mb-4 rounded-2xl border border-[#f7c600]/20 bg-[#0b0f1a] p-4 ring-1 ring-[#f7c600]/10">
      <header className="mb-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#f7c600]">
          AI creative director
        </p>
        <p className="mt-1 text-xs text-zinc-500">
          Set story intent before upload — the engine directs mood, pacing, and
          retention from here.
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-[10px] font-semibold uppercase tracking-wider text-zinc-500 sm:col-span-2">
          Story goal
          <select
            value={value.storyGoal}
            disabled={disabled}
            onChange={(e) =>
              patch({ storyGoal: e.target.value as CreatorDirection["storyGoal"] })
            }
            className="mt-1 w-full min-h-[40px] rounded-xl bg-black p-2.5 text-sm text-white ring-1 ring-zinc-800"
          >
            {STORY_GOALS.map((g) => (
              <option key={g.id} value={g.id}>
                {g.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
          Emotion
          <select
            value={value.emotion}
            disabled={disabled}
            onChange={(e) =>
              patch({ emotion: e.target.value as CreatorDirection["emotion"] })
            }
            className="mt-1 w-full min-h-[40px] rounded-xl bg-black p-2.5 text-sm text-white ring-1 ring-zinc-800"
          >
            {DIRECTION_EMOTIONS.map((e) => (
              <option key={e.id} value={e.id}>
                {e.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
          Audience
          <select
            value={value.audience}
            disabled={disabled}
            onChange={(e) =>
              patch({ audience: e.target.value as CreatorDirection["audience"] })
            }
            className="mt-1 w-full min-h-[40px] rounded-xl bg-black p-2.5 text-sm text-white ring-1 ring-zinc-800"
          >
            {DIRECTION_AUDIENCES.map((a) => (
              <option key={a.id} value={a.id}>
                {a.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-[10px] font-semibold uppercase tracking-wider text-zinc-500 sm:col-span-2">
          Platform
          <select
            value={value.platform}
            disabled={disabled}
            onChange={(e) =>
              patch({ platform: e.target.value as PlatformModeId })
            }
            className="mt-1 w-full min-h-[40px] rounded-xl bg-black p-2.5 text-sm text-white ring-1 ring-zinc-800"
          >
            {PLATFORM_OPTIONS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-[10px] font-semibold uppercase tracking-wider text-zinc-500 sm:col-span-2">
          Story energy
          <div className="mt-2 flex items-center gap-3">
            <span className="text-[10px] text-zinc-600">Calm</span>
            <input
              type="range"
              min={0}
              max={100}
              value={value.energy}
              disabled={disabled}
              onChange={(e) => patch({ energy: Number(e.target.value) })}
              className="h-2 flex-1 accent-[#f7c600]"
            />
            <span className="text-[10px] text-zinc-600">High</span>
            <span className="w-8 text-right text-xs font-bold text-[#f7c600]">
              {value.energy}
            </span>
          </div>
        </label>

        <label className="block text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
          Caption density
          <select
            value={value.captionDensity}
            disabled={disabled}
            onChange={(e) =>
              patch({
                captionDensity: e.target.value as CreatorDirection["captionDensity"],
              })
            }
            className="mt-1 w-full min-h-[40px] rounded-xl bg-black p-2.5 text-sm text-white ring-1 ring-zinc-800"
          >
            <option value="minimal">Minimal</option>
            <option value="balanced">Balanced</option>
            <option value="dense">Dense</option>
          </select>
        </label>

        <label className="block text-[10px] font-semibold uppercase tracking-wider text-zinc-500 sm:col-span-2">
          Virality vs aesthetic
          <div className="mt-2 flex items-center gap-3">
            <span className="text-[10px] text-zinc-600">Aesthetic</span>
            <input
              type="range"
              min={0}
              max={100}
              value={value.viralityBalance}
              disabled={disabled}
              onChange={(e) =>
                patch({ viralityBalance: Number(e.target.value) })
              }
              className="h-2 flex-1 accent-[#f7c600]"
            />
            <span className="text-[10px] text-zinc-600">Viral</span>
            <span className="w-8 text-right text-xs font-bold text-[#f7c600]">
              {value.viralityBalance}
            </span>
          </div>
        </label>
      </div>
    </section>
  );
}

export default memo(CreativeDirectorPanel);
