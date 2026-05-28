"use client";

import { memo, useMemo } from "react";
import { generateEditorialComposition } from "@/lib/editorialComposition";
import { generateEditorialLayout } from "@/lib/editorialStickers";
import type { StyleReference } from "@/lib/styleReference";

type RichRelationshipSlideProps = {
  image: string;
  text: string;
  index: number;
  mood?: string;
  accentColor: string;
  showWatermark?: boolean;
  watermarkText?: string | null;
  width?: number;
  height?: number;
  styleReference?: StyleReference | null;
};

const DEFAULT_W = 320;
const DEFAULT_H = 400;

function RichRelationshipSlide({
  image,
  text,
  index,
  mood,
  accentColor,
  showWatermark = false,
  watermarkText = null,
  width = DEFAULT_W,
  height = DEFAULT_H,
  styleReference,
}: RichRelationshipSlideProps) {
  const layout = useMemo(() => {
    const composition = styleReference
      ? generateEditorialComposition(styleReference, index)
      : undefined;
    return generateEditorialLayout({
      caption: text,
      slideIndex: index,
      mood,
      composition,
    });
  }, [text, index, mood, styleReference]);

  const displayWatermark =
    watermarkText ?? (showWatermark ? "Made with Table Tales Studio" : null);

  return (
    <>
      {image ? (
        <img
          src={image}
          alt=""
          width={width}
          height={height}
          loading="lazy"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover"
          style={{
            filter: "contrast(1.08) saturate(1.04)",
          }}
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-[#f5e6d3] via-[#e8d4bc] to-[#c9a66b]" />
      )}

      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(255,248,240,0.14) 0%, transparent 30%, transparent 58%, rgba(24,14,8,0.32) 100%)",
        }}
      />

      <div
        className="pointer-events-none absolute inset-0 opacity-[0.02] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
        aria-hidden
      />

      <div
        className="pointer-events-none absolute z-20 max-w-[140px]"
        style={{
          left: layout.burst.x,
          top: layout.burst.y,
          transform: `rotate(${layout.burst.rotation}deg)`,
          filter: "drop-shadow(0 6px 14px rgba(0,0,0,0.35))",
        }}
      >
        <span
          className="inline-block rounded-lg border-2 border-[#1a1208] bg-[#fff8ee] px-2.5 py-1.5 text-[13px] font-black uppercase leading-none tracking-tight text-[#1a1208]"
          style={{
            fontFamily: "var(--font-geist-sans), system-ui, sans-serif",
            boxShadow: "3px 4px 0 rgba(26,18,8,0.25)",
          }}
        >
          {layout.burst.text}
        </span>
      </div>

      {layout.accent && (
        <div
          className="pointer-events-none absolute z-20"
          style={{
            left: layout.accent.x,
            top: layout.accent.y,
            transform: `rotate(${layout.accent.rotation}deg)`,
            filter: "drop-shadow(0 4px 10px rgba(0,0,0,0.3))",
          }}
        >
          <span
            className="inline-block rounded-full bg-[#f7c600] px-2 py-0.5 text-[8px] font-bold uppercase tracking-wide text-[#1a1208] ring-2 ring-[#1a1208]/80"
            style={{ transform: "rotate(-2deg)" }}
          >
            {layout.accent.text}
          </span>
        </div>
      )}

      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-20 px-3 pb-4 pt-8"
        style={{
          transform: `rotate(${layout.ribbon.rotation}deg)`,
          transformOrigin: "bottom center",
        }}
      >
        <div
          className="mx-auto max-w-[292px] rounded-2xl border-2 border-[#1a1208]/90 px-3 py-2.5 text-center shadow-[0_8px_24px_rgba(0,0,0,0.28)]"
          style={{
            background:
              "linear-gradient(135deg, rgba(255,248,238,0.96) 0%, rgba(247,198,0,0.35) 100%)",
            filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.2))",
          }}
        >
          <p
            className="text-[11px] font-bold leading-snug text-[#1a1208] sm:text-xs"
            style={{
              fontFamily: "var(--font-geist-sans), system-ui, sans-serif",
              textShadow: "0 1px 0 rgba(255,255,255,0.6)",
            }}
          >
            {layout.ribbon.primary || (
              <span className="text-[#1a1208]/40">Your story line</span>
            )}
          </p>
        </div>
      </div>

      <div className="absolute right-3 top-3 z-20">
        <span
          className="flex h-7 w-7 items-center justify-center rounded-full bg-[#fff8ee]/90 text-xs font-bold text-[#1a1208] shadow-md ring-1 ring-[#1a1208]/20"
          style={{ color: accentColor }}
        >
          {index}
        </span>
      </div>

      {displayWatermark && (
        <p className="pointer-events-none absolute bottom-2 right-2 z-20 text-[8px] font-semibold uppercase tracking-widest text-white/50">
          {displayWatermark}
        </p>
      )}
    </>
  );
}

export default memo(RichRelationshipSlide);
