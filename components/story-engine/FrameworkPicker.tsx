"use client";

import { FRAMEWORK_LABELS } from "@/lib/story-engine/constants";
import { listFrameworks } from "@/lib/story-engine/framework-engine";
import { useCarouselProjectStore } from "@/lib/story-engine/store";
import type { StoryFramework } from "@/lib/story-engine/types";

type FrameworkPickerProps = {
  className?: string;
};

export default function FrameworkPicker({ className }: FrameworkPickerProps) {
  const framework = useCarouselProjectStore(
    (s) => s.project?.story.framework ?? "transformation"
  );
  const setFramework = useCarouselProjectStore((s) => s.setFramework);
  const definitions = listFrameworks();

  return (
    <div className={className}>
      <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
        Story framework
      </label>
      <select
        className="mt-1 w-full rounded-lg border border-white/10 bg-black/50 px-2 py-1.5 text-xs text-white"
        value={framework}
        onChange={(e) => setFramework(e.target.value as StoryFramework)}
      >
        {definitions.map((def) => (
          <option key={def.id} value={def.id}>
            {FRAMEWORK_LABELS[def.id] ?? def.name} ({def.slideRoles.length} slides)
          </option>
        ))}
      </select>
      <p className="mt-1 text-[10px] text-zinc-500">
        {definitions.find((d) => d.id === framework)?.description}
      </p>
    </div>
  );
}
