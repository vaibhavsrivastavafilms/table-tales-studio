"use client";

import { memo } from "react";
import { SLIDE_KEYS, SLIDE_COUNT } from "@/lib/slides";
import { useRenderDiagnostic, slideStatesKey } from "@/lib/renderProfiler";
import type { SlideRenderState } from "@/lib/generationStages";

type BuilderSlideTimelineProps = {
  images: string[];
  /** Per-slide URLs from hero engine (index 0 = slide 1). Falls back to upload order. */
  slideImages?: string[];
  selectedIndex: number;
  onSelectSlide: (index: number) => void;
  onSwapSlides?: (fromIndex: number, toIndex: number) => void;
  disabled?: boolean;
  slideStates?: Map<number, SlideRenderState>;
};

function timelineThumbClass(state: SlideRenderState | undefined): string {
  if (state === "rendered") return "builder-thumb-rendered";
  if (state === "generating") return "builder-thumb-generating builder-thumb-shimmer";
  return "builder-thumb-queued";
}

function ringClass(
  state: SlideRenderState | undefined,
  active: boolean
): string {
  if (active) return "ring-2 ring-[#f4c430] shadow-[0_0_20px_rgba(244,196,48,0.15)]";
  if (state === "rendered") return "ring-1 ring-[#f4c430]/40";
  if (state === "generating") return "ring-1 ring-[#f4c430]/25 builder-thumb-shimmer";
  return "ring-1 ring-white/10 opacity-70";
}

function BuilderSlideTimeline({
  images,
  slideImages,
  selectedIndex,
  onSelectSlide,
  onSwapSlides,
  disabled,
  slideStates,
}: BuilderSlideTimelineProps) {
  useRenderDiagnostic("BuilderSlideTimeline");
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
            slideImages?.[i] ??
            images[i] ??
            images[images.length - 1] ??
            images[0] ??
            "";
          const active = i === selectedIndex;
          const state = slideStates?.get(i + 1);
          return (
            <div
              key={key}
              className={`builder-timeline-item shrink-0 rounded-xl transition-all duration-300 ${ringClass(state, active)}`}
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
                      className={`h-full w-full object-cover transition-all duration-500 ${timelineThumbClass(state)}`}
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
                        : state === "rendered"
                          ? "bg-[#f4c430]/90 text-black"
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

function timelinePropsEqual(
  prev: BuilderSlideTimelineProps,
  next: BuilderSlideTimelineProps
): boolean {
  return (
    prev.selectedIndex === next.selectedIndex &&
    prev.disabled === next.disabled &&
    prev.images === next.images &&
    prev.slideImages === next.slideImages &&
    prev.onSelectSlide === next.onSelectSlide &&
    prev.onSwapSlides === next.onSwapSlides &&
    slideStatesKey(prev.slideStates) === slideStatesKey(next.slideStates)
  );
}

export default memo(BuilderSlideTimeline, timelinePropsEqual);
