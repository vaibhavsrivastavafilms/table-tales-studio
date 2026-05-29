"use client";

import { memo, useMemo } from "react";
import EditorialCaption from "@/components/EditorialCaption";
import {
  DOODLE_CAFE_ACCENT,
  DOODLE_CAFE_CREAM,
  DOODLE_CAFE_ESPRESSO,
} from "@/lib/doodleCafeLock";
import type { DynamicTypographyPlan } from "@/lib/aiTypographyEngine";
import type { TypographyComposition } from "@/lib/aiTypographyEngine";

type EditorialTypographyBlocksProps = {
  caption: string;
  plan?: DynamicTypographyPlan | null;
  typography?: TypographyComposition | null;
  highlightColor: string;
  reveal?: number;
  width: number;
  height: number;
};

function lineWithYellowEmphasis(line: string, highlightColor: string) {
  const words = line.trim().split(/\s+/);
  if (words.length === 0) return line;
  const lead = words.slice(0, -1).join(" ");
  const last = words[words.length - 1];
  return (
    <>
      {lead ? <span>{lead} </span> : null}
      <span
        className="inline-block px-1 py-0.5"
        style={{
          backgroundColor: highlightColor,
          color: DOODLE_CAFE_ESPRESSO,
        }}
      >
        {last}
      </span>
    </>
  );
}

const ROLE_ORDER: Record<string, number> = {
  micro: 0,
  vertical: 1,
  script: 2,
  body: 3,
  headline: 4,
  hero: 5,
  "floating-label": 3,
};

function EditorialTypographyBlocks({
  caption,
  plan,
  typography,
  highlightColor,
  reveal = 1,
}: EditorialTypographyBlocksProps) {
  const sorted = useMemo(
    () =>
      [...(plan?.blocks ?? [])].sort(
        (a, b) => (ROLE_ORDER[a.role] ?? 3) - (ROLE_ORDER[b.role] ?? 3)
      ),
    [plan?.blocks]
  );

  if (!sorted.length) {
    return (
      <div className="absolute inset-0 z-[22]" style={{ opacity: reveal }}>
        <EditorialCaption
          text={caption}
          highlightColor={highlightColor}
          scriptLine={typography?.scriptLine}
          align={typography?.align ?? "left"}
        />
      </div>
    );
  }

  return (
    <>
      {sorted.map((block) => {
        const isHero = block.role === "hero" || block.role === "headline";
        const isScript = block.role === "script";
        const isMicro = block.role === "micro";

        if (isScript) {
          return (
            <p
              key={block.id}
              className="pointer-events-none absolute z-[26] font-medium italic text-white/85"
              style={{
                left: block.x,
                top: block.y,
                width: block.width,
                fontSize: block.fontSize,
                transform: block.transform ?? `rotate(${block.rotation}deg)`,
                opacity: block.opacity * reveal,
                textShadow: "0 2px 10px rgba(0,0,0,0.75)",
              }}
            >
              {block.text}
            </p>
          );
        }

        if (isMicro) {
          return (
            <p
              key={block.id}
              className="pointer-events-none absolute z-[23] font-medium tracking-wide text-white/65"
              style={{
                left: block.x,
                top: block.y,
                width: block.width,
                fontSize: block.fontSize,
                fontWeight: block.fontWeight,
                letterSpacing: "0.06em",
                opacity: block.opacity * reveal,
                textAlign: block.align,
                textShadow: "0 1px 6px rgba(0,0,0,0.7)",
              }}
            >
              {block.text}
            </p>
          );
        }

        return (
          <div
            key={block.id}
            className="pointer-events-none absolute z-[24] px-0.5"
            style={{
              left: block.x,
              top: block.y,
              width: block.width,
              transform: block.transform ?? `rotate(${block.rotation}deg)`,
              opacity: block.opacity * reveal,
            }}
          >
            {isHero ? (
              <p
                className="font-black uppercase leading-[0.92] tracking-[0.04em]"
                style={{
                  fontSize: block.fontSize,
                  color: DOODLE_CAFE_CREAM,
                  fontFamily:
                    "var(--font-geist-sans), Impact, Arial Narrow, sans-serif",
                  textShadow:
                    "0 4px 20px rgba(0,0,0,0.9), 0 1px 3px rgba(0,0,0,0.8)",
                  textAlign: block.align,
                  maxWidth: block.width,
                }}
              >
                {highlightColor === DOODLE_CAFE_ACCENT ||
                highlightColor === "#f4c430"
                  ? block.text
                      .split("\n")
                      .map((line, li) => (
                        <span key={li} className="block">
                          {lineWithYellowEmphasis(line, highlightColor)}
                        </span>
                      ))
                  : block.text}
              </p>
            ) : (
              <p
                className="font-semibold leading-snug text-white/90"
                style={{
                  fontSize: block.fontSize,
                  textShadow: "0 2px 12px rgba(0,0,0,0.85)",
                  textAlign: block.align,
                }}
              >
                {block.text}
              </p>
            )}
          </div>
        );
      })}
    </>
  );
}

export default memo(EditorialTypographyBlocks);
