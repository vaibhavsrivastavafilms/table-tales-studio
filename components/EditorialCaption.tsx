"use client";

import { memo, useMemo } from "react";
import {
  DOODLE_CAFE_ACCENT,
  DOODLE_CAFE_CREAM,
  DOODLE_CAFE_ESPRESSO,
} from "@/lib/doodleCafeLock";
import { formatEditorialCaption } from "@/lib/editorialCopy";

type EditorialCaptionProps = {
  text: string;
  accentColor?: string;
  highlightColor?: string;
  scriptLine?: string;
  align?: "left" | "center" | "right";
  className?: string;
  style?: React.CSSProperties;
};

/** Reference style: last word on each line gets solid yellow block. */
function renderLineWithYellowBlock(line: string, highlightColor: string) {
  const words = line.trim().split(/\s+/);
  if (words.length === 0) return null;
  const lead = words.slice(0, -1).join(" ");
  const last = words[words.length - 1];
  return (
    <>
      {lead ? <span>{lead} </span> : null}
      <span
        className="inline-block px-1 py-0.5 font-black"
        style={{
          backgroundColor: highlightColor,
          color: DOODLE_CAFE_ESPRESSO,
          boxShadow: `0 1px 0 ${highlightColor}`,
        }}
      >
        {last}
      </span>
    </>
  );
}

function EditorialCaption({
  text,
  highlightColor = DOODLE_CAFE_ACCENT,
  scriptLine,
  align = "left",
  className = "",
  style,
}: EditorialCaptionProps) {
  const lines = useMemo(() => formatEditorialCaption(text), [text]);

  const alignClass =
    align === "left"
      ? "text-left items-start"
      : align === "right"
        ? "text-right items-end"
        : "text-center items-center";

  if (!lines.length) {
    return (
      <p
        className={`text-[11px] italic ${className}`}
        style={{ ...style, color: `${DOODLE_CAFE_CREAM}50` }}
      >
        Your cozy caption
      </p>
    );
  }

  return (
    <div
      className={`flex flex-col gap-1 ${alignClass} ${className}`}
      style={style}
    >
      {lines.map((line, li) => (
        <p
          key={li}
          className="max-w-full text-[11px] font-black uppercase leading-[1.08] tracking-[0.04em]"
          style={{
            color: DOODLE_CAFE_CREAM,
            fontFamily: "var(--font-geist-sans), Impact, Arial Narrow, sans-serif",
            textShadow: "0 2px 16px rgba(0,0,0,0.75), 0 1px 3px rgba(0,0,0,0.9)",
          }}
        >
          {renderLineWithYellowBlock(line, highlightColor)}
        </p>
      ))}
      {scriptLine && (
        <p
          className="mt-0.5 text-[9px] font-normal italic leading-tight"
          style={{
            color: DOODLE_CAFE_CREAM,
            fontFamily: "Georgia, 'Times New Roman', serif",
            textShadow: "0 1px 8px rgba(0,0,0,0.65)",
          }}
        >
          {scriptLine}
        </p>
      )}
    </div>
  );
}

export default memo(EditorialCaption);
