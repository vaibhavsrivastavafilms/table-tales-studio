"use client";

import { memo } from "react";
import { doodleSize, DOODLE_VIEWBOX } from "@/lib/renderers/doodle-elements";
import type { DoodleElement, DoodleLayer } from "@/lib/renderers/types";

function DoodleSvg({
  el,
  accent,
  stroke,
}: {
  el: DoodleElement;
  accent: string;
  stroke: string;
}) {
  const sw = el.strokeWidth ?? 1.5;
  switch (el.type) {
    case "arrow":
      return (
        <path
          d="M4 18h26M22 10l10 8-10 8"
          stroke={stroke}
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        />
      );
    case "circle":
      return (
        <ellipse
          cx="24"
          cy="24"
          rx="18"
          ry="14"
          stroke={stroke}
          strokeWidth={sw}
          fill="none"
          strokeDasharray="5 4"
        />
      );
    case "underline":
      return (
        <path
          d="M2 10c16-6 32-8 46-3"
          stroke={accent}
          strokeWidth="2.4"
          fill="none"
          strokeLinecap="round"
        />
      );
    case "star":
    case "sparkle":
      return (
        <g stroke={accent} strokeWidth="1.5" strokeLinecap="round">
          <path d="M16 2v6M16 26v6M2 16h6M26 16h6M6 6l4 4M22 22l4 4M26 6l-4 4M6 26l4-4" />
        </g>
      );
    case "scribble":
      return (
        <path
          d="M2 14c8-10 18-12 28-8s14 8 22 4"
          stroke={stroke}
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
          opacity="0.85"
        />
      );
    case "coffee-stain":
      return (
        <g opacity="0.9">
          <ellipse
            cx="32"
            cy="32"
            rx="28"
            ry="26"
            fill="none"
            stroke={stroke}
            strokeWidth="1.2"
            opacity="0.35"
          />
          <ellipse
            cx="32"
            cy="32"
            rx="22"
            ry="20"
            fill={accent}
            fillOpacity="0.08"
            stroke={stroke}
            strokeWidth="0.8"
            strokeDasharray="3 5"
          />
        </g>
      );
    case "highlight":
      return (
        <path
          d="M4 16 Q40 4 76 14"
          stroke={accent}
          strokeWidth="10"
          fill="none"
          strokeLinecap="round"
          opacity="0.35"
        />
      );
    case "burst":
      return (
        <g stroke={accent} strokeWidth="1.8" strokeLinecap="round">
          <path d="M24 4v6M24 38v6M4 24h6M38 24h6" />
          <path d="M10 10l4 4M34 34l4 4M34 10l-4 4M10 34l4-4" />
        </g>
      );
    case "heart":
      return (
        <path
          d="M18 30c-6-5-10-9-10-13a5 5 0 0110 0c0 4-4 8-10 13-6-5-10-9-10-13a5 5 0 0110 0c0 4-4 8-10 13z"
          fill="none"
          stroke={stroke}
          strokeWidth="1.4"
        />
      );
    default:
      return null;
  }
}

type RendererDoodleLayerProps = {
  layer: DoodleLayer;
  opacity?: number;
  animate?: boolean;
};

function RendererDoodleLayer({
  layer,
  opacity = 1,
  animate = true,
}: RendererDoodleLayerProps) {
  return (
    <div
      className="pointer-events-none absolute inset-0 z-[19] overflow-hidden"
      aria-hidden
    >
      {layer.doodles.map((el, i) => {
        const { w, h } = doodleSize(el.type, el.scale);
        return (
          <div
            key={`${el.type}-${i}-${el.x}-${el.y}`}
            className={`absolute origin-center ${animate ? "doodle-float" : ""}`}
            style={{
              left: el.x,
              top: el.y,
              transform: `rotate(${el.rotation}deg)`,
              opacity: (el.opacity ?? 0.85) * opacity,
              animationDelay: animate ? `${(i % 5) * 0.35}s` : undefined,
            }}
          >
            <svg
              viewBox={DOODLE_VIEWBOX[el.type]}
              width={w}
              height={h}
              className={animate && i % 3 === 0 ? "doodle-shimmer" : ""}
              style={{ filter: "drop-shadow(0 1px 4px rgba(0,0,0,0.4))" }}
            >
              <DoodleSvg el={el} accent={layer.accentColor} stroke={layer.strokeColor} />
            </svg>
          </div>
        );
      })}
    </div>
  );
}

export default memo(RendererDoodleLayer);
