"use client";

import { memo } from "react";
import { SLIDE_KEYS, SLIDE_COUNT } from "@/lib/slides";

type BuilderSlideTimelineProps = {
  images: string[];
  selectedIndex: number;
  onSelectSlide: (index: number) => void;
  onSwapSlides?: (fromIndex: number, toIndex: number) => void;
  disabled?: boolean;
};

function BuilderSlideTimeline({
  images,
  selectedIndex,
  onSelectSlide,
  onSwapSlides,
  disabled,
}: BuilderSlideTimelineProps) {
  const hasImages = images.length > 0;

  return (
    <div className="builder-timeline shrink-0 border-t border-white/[0.06] bg-black/40 px-3 py-3 md:px-4">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
          Storyboard · {SLIDE_COUNT} slides
        </p>
        {onSwapSlides && hasImages && (
          <p className="text-[9px] text-zinc-600">← → reorder photos</p>
        )}
      </div>
      <div className="carousel-scroll flex gap-2 overflow-x-auto pb-1">
        {SLIDE_KEYS.map((key, i) => {
          const thumb =
            images[i] ?? images[images.length - 1] ?? images[0] ?? "";
          const active = i === selectedIndex;
          return (
            <div
              key={key}
              className={`builder-timeline-item shrink-0 rounded-xl transition-all duration-300 ${
                active
                  ? "ring-2 ring-[#f4c430] shadow-[0_0_20px_rgba(244,196,48,0.15)]"
                  : "ring-1 ring-white/10 opacity-80 hover:opacity-100"
              }`}
            >
              <button
                type="button"
                disabled={disabled}
                onClick={() => onSelectSlide(i)}
                className="block overflow-hidden rounded-xl"
                aria-label={`Select slide ${i + 1}`}
                aria-current={active ? "true" : undefined}
              >
                <div className="relative h-16 w-[52px] bg-zinc-900 md:h-[72px] md:w-[58px]">
                  {thumb ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={thumb}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-lg text-zinc-700">
                      {i + 1}
                    </div>
                  )}
                  <span
                    className={`absolute bottom-1 left-1 rounded px-1 py-0.5 text-[9px] font-bold ${
                      active
                        ? "bg-[#f4c430] text-black"
                        : "bg-black/70 text-zinc-400"
                    }`}
                  >
                    {i + 1}
                  </span>
                </div>
              </button>
              {onSwapSlides && hasImages && images.length > 1 && (
                <div className="flex justify-between border-t border-white/5 px-0.5 py-0.5">
                  <button
                    type="button"
                    disabled={disabled || i === 0}
                    onClick={() => onSwapSlides(i, i - 1)}
                    className="px-1 text-[9px] text-zinc-500 hover:text-[#f4c430] disabled:opacity-25"
                    aria-label={`Move slide ${i + 1} earlier`}
                  >
                    ←
                  </button>
                  <button
                    type="button"
                    disabled={disabled || i >= images.length - 1}
                    onClick={() => onSwapSlides(i, i + 1)}
                    className="px-1 text-[9px] text-zinc-500 hover:text-[#f4c430] disabled:opacity-25"
                    aria-label={`Move slide ${i + 1} later`}
                  >
                    →
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default memo(BuilderSlideTimeline);
