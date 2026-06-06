"use client";

import { memo } from "react";
import { assetSize } from "@/lib/carousel-renderer/svg-assets";
import type { PlacedDoodle } from "@/lib/carousel-renderer/types";
import { CAFE_TYPO } from "@/lib/carousel-renderer/typography-engine";

function DoodlePaths({
  doodle,
  accent = CAFE_TYPO.brushYellow,
}: {
  doodle: PlacedDoodle;
  accent?: string;
}) {
  const { w, h } = assetSize(doodle.type, doodle.scale);
  const stroke = CAFE_TYPO.cream;

  switch (doodle.type) {
    case "steam":
      return (
        <svg viewBox="0 0 48 48" width={w} height={h}>
          <path d="M8 36c0-10 6-18 14-18 4 0 8 3 9 9" fill="none" stroke={stroke} strokeWidth={2} strokeLinecap="round" />
          <path d="M26 34c0-11 7-19 15-19 5 0 9 4 10 10" fill="none" stroke={stroke} strokeWidth={2} strokeLinecap="round" />
        </svg>
      );
    case "arrow":
      return (
        <svg viewBox="0 0 40 40" width={w} height={h}>
          <path d="M4 20h24M24 12l10 8-10 8" fill="none" stroke={stroke} strokeWidth={2.2} strokeLinecap="round" />
        </svg>
      );
    case "circle":
      return (
        <svg viewBox="0 0 56 48" width={w} height={h}>
          <ellipse cx="28" cy="24" rx="22" ry="16" fill="none" stroke={stroke} strokeWidth={1.8} strokeDasharray="6 5" />
        </svg>
      );
    case "people":
      return (
        <svg viewBox="0 0 96 72" width={w} height={h}>
          <circle cx="28" cy="14" r="7" fill="none" stroke={stroke} strokeWidth={1.6} />
          <path d="M14 58c3-14 10-20 14-20s11 6 14 20" fill="none" stroke={stroke} strokeWidth={1.6} strokeLinecap="round" />
          <circle cx="62" cy="16" r="7" fill="none" stroke={stroke} strokeWidth={1.6} />
          <path d="M48 60c3-14 10-20 14-20s11 6 14 20" fill="none" stroke={stroke} strokeWidth={1.6} strokeLinecap="round" />
        </svg>
      );
    case "heart":
      return (
        <svg viewBox="0 0 36 36" width={w} height={h}>
          <path d="M18 30c-7-6-12-10-12-15a6 6 0 0112 0c0 5-5 9-12 15-7-6-12-10-12-15a6 6 0 0112 0c0 6-5 10-12 15z" fill="none" stroke={stroke} strokeWidth={1.5} />
        </svg>
      );
    case "star":
    case "sparkle":
      return (
        <svg viewBox="0 0 32 32" width={w} height={h}>
          <path d="M16 2v6M16 26v6M2 16h6M26 16h6M6 6l3 3M23 23l3 3M26 6l-3 3M9 23l-3 3" fill="none" stroke={accent} strokeWidth={1.5} strokeLinecap="round" />
        </svg>
      );
    case "light-bulb":
      return (
        <svg viewBox="0 0 40 56" width={w} height={h}>
          <path d="M20 4c-8 0-14 6-14 14 0 6 4 10 6 12v6h16v-6c2-2 6-6 6-12 0-8-6-14-14-14z" fill="none" stroke={stroke} strokeWidth={1.5} />
          <path d="M12 40h16M14 46h12" stroke={stroke} strokeWidth={1.5} strokeLinecap="round" />
        </svg>
      );
    case "coffee-stain":
      return (
        <svg viewBox="0 0 64 64" width={w} height={h}>
          <ellipse cx="32" cy="32" rx="28" ry="26" fill="none" stroke={stroke} strokeWidth={1} opacity={0.35} />
          <ellipse cx="32" cy="32" rx="20" ry="18" fill="none" stroke={stroke} strokeWidth={1} strokeDasharray="4 6" opacity={0.5} />
        </svg>
      );
    case "scribble":
      return (
        <svg viewBox="0 0 72 24" width={w} height={h}>
          <path d="M2 16c12-14 28-18 44-10s18 14 24 6" fill="none" stroke={accent} strokeWidth={2.2} strokeLinecap="round" />
        </svg>
      );
    case "speech-bubble":
      return (
        <svg viewBox="0 0 72 56" width={w} height={h}>
          <path
            d="M8 8h48a8 8 0 018 8v20a8 8 0 01-8 8H28l-12 12V44H8a8 8 0 01-8-8V16a8 8 0 018-8z"
            fill="none"
            stroke={stroke}
            strokeWidth={1.6}
            strokeLinejoin="round"
          />
        </svg>
      );
    default:
      return null;
  }
}

function CarouselDoodleLayer({
  doodles,
  accent,
}: {
  doodles: PlacedDoodle[];
  accent?: string;
}) {
  return (
    <div className="pointer-events-none absolute inset-0 z-[25]" aria-hidden>
      {doodles.map((d, i) => (
        <div
          key={`${d.type}-${i}-${d.x}`}
          className="absolute origin-center"
          style={{
            left: d.x,
            top: d.y,
            transform: `rotate(${d.rotation}deg)`,
            opacity: d.opacity ?? 0.88,
          }}
        >
          <DoodlePaths doodle={d} accent={accent} />
        </div>
      ))}
    </div>
  );
}

export default memo(CarouselDoodleLayer);
