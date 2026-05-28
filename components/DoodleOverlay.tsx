"use client";

import { memo } from "react";
import { DOODLE_CAFE_ACCENT, DOODLE_CAFE_CREAM } from "@/lib/doodleCafeLock";
import type { DoodleElement, DoodleElementType, DoodleHumanVariant } from "@/lib/doodleSystem";

type DoodleOverlayProps = {
  elements: DoodleElement[];
  accentColor?: string;
  animate?: boolean;
  className?: string;
};

const STROKE = "#fffef8";

function HumanDoodle({ variant }: { variant?: DoodleHumanVariant }) {
  const s = STROKE;
  if (variant === "duo-sitting") {
    return (
      <g fill="none" stroke={s} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="22" cy="10" r="5" />
        <path d="M14 38c2-10 6-14 8-14s6 4 8 14" />
        <circle cx="52" cy="12" r="5" />
        <path d="M44 40c2-10 6-14 8-14s6 4 8 14" />
        <path d="M18 48h44" opacity="0.5" />
      </g>
    );
  }
  if (variant === "table-duo") {
    return (
      <g fill="none" stroke={s} strokeWidth="1.35" strokeLinecap="round">
        <ellipse cx="40" cy="52" rx="28" ry="8" opacity="0.35" />
        <circle cx="28" cy="18" r="5" />
        <path d="M20 42c2-8 5-12 8-12s6 4 8 12" />
        <circle cx="50" cy="20" r="5" />
        <path d="M42 44c2-8 5-12 8-12s6 4 8 12" />
      </g>
    );
  }
  if (variant === "on-rim") {
    return (
      <g fill="none" stroke={s} strokeWidth="1.45" strokeLinecap="round">
        <ellipse cx="40" cy="58" rx="32" ry="10" opacity="0.4" />
        <circle cx="38" cy="14" r="6" />
        <path d="M28 52c3-14 8-20 10-20s7 6 10 20" />
        <path d="M48 30c6-4 12-2 14 4" />
      </g>
    );
  }
  return (
    <g fill="none" stroke={s} strokeWidth="1.5" strokeLinecap="round">
      <circle cx="36" cy="12" r="6" />
      <path d="M22 56c3-14 8-22 14-22s11 8 14 22" />
    </g>
  );
}

function DoodleShape({
  type,
  accent,
  label,
  variant,
}: {
  type: DoodleElementType;
  accent: string;
  label?: string;
  variant?: DoodleHumanVariant;
}) {
  switch (type) {
    case "human":
      return <HumanDoodle variant={variant} />;
    case "pin":
      return (
        <g fill="none" stroke={STROKE} strokeWidth="1.6" strokeLinejoin="round">
          <path d="M18 8c0-6 5-10 10-10s10 4 10 10c0 7-10 18-10 18S8 15 8 8z" />
          <circle cx="18" cy="8" r="3" fill={accent} fillOpacity="0.85" />
        </g>
      );
    case "steam":
      return (
        <g stroke={STROKE} strokeWidth="1.5" fill="none" strokeLinecap="round">
          <path d="M6 30c0-8 5-14 11-14 3 0 6 2 7 7" />
          <path d="M22 28c0-9 6-15 12-15 4 0 7 3 8 8" />
        </g>
      );
    case "heart":
      return (
        <path
          d="M18 32c-6-5-10-9-10-14a6 6 0 0112 0c0 4-4 8-10 14-6-5-10-9-10-14a6 6 0 0112 0c0 5-4 9-10 14z"
          fill="none"
          stroke={STROKE}
          strokeWidth="1.4"
        />
      );
    case "arrow":
      return (
        <path
          d="M4 18h26M22 10l10 8-10 8"
          stroke={STROKE}
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        />
      );
    case "sparkle":
      return (
        <g stroke={accent} strokeWidth="1.4" strokeLinecap="round">
          <path d="M16 2v5M16 27v5M2 16h5M27 16h5" />
        </g>
      );
    case "speech":
      return (
        <g>
          <path
            d="M4 4h32c2 0 4 2 4 4v12c0 2-2 4-4 4H16l-8 10v-10H8c-2 0-4-2-4-4V8c0-2 2-4 4-4z"
            fill="rgba(26,18,12,0.55)"
            stroke={STROKE}
            strokeWidth="1.3"
          />
          {label && (
            <text
              x="20"
              y="17"
              textAnchor="middle"
              fill={DOODLE_CAFE_CREAM}
              fontSize="7"
              fontFamily="Georgia, serif"
              fontStyle="italic"
            >
              {label}
            </text>
          )}
        </g>
      );
    case "circle":
      return (
        <ellipse
          cx="18"
          cy="18"
          rx="14"
          ry="11"
          stroke={STROKE}
          strokeWidth="1.4"
          fill="none"
          strokeDasharray="4 3"
        />
      );
    case "underline":
      return (
        <path
          d="M2 14c14-5 28-7 40-4"
          stroke={accent}
          strokeWidth="2.2"
          fill="none"
          strokeLinecap="round"
        />
      );
    default:
      return null;
  }
}

function sizeClass(type: DoodleElementType, scale: number): string {
  if (type === "human") {
    if (scale >= 2) return "h-[88px] w-[88px]";
    if (scale >= 1.5) return "h-[72px] w-[72px]";
    return "h-[56px] w-[56px]";
  }
  if (type === "speech" && scale > 1.2) return "h-14 w-16";
  if (type === "pin") return "h-10 w-10";
  return scale > 1 ? "h-11 w-11" : "h-8 w-8";
}

function DoodleOverlay({
  elements,
  accentColor = DOODLE_CAFE_ACCENT,
  animate = true,
  className = "",
}: DoodleOverlayProps) {
  return (
    <div
      className={`pointer-events-none absolute inset-0 z-[15] overflow-hidden ${className}`}
      aria-hidden
    >
      {elements.map((el, i) => (
        <div
          key={`${el.type}-${i}-${el.x}-${el.variant ?? ""}`}
          className={`absolute origin-center ${animate ? "doodle-float" : ""}`}
          style={{
            left: el.x,
            top: el.y,
            transform: `rotate(${el.rotation}deg)`,
            opacity: el.type === "human" ? 0.92 : 0.8,
            animationDelay: animate ? `${(i % 5) * 0.4}s` : undefined,
          }}
        >
          <svg
            viewBox={el.type === "human" ? "0 0 80 64" : "0 0 40 40"}
            className={`${sizeClass(el.type, el.scale)} ${animate && i % 4 === 0 ? "doodle-shimmer" : ""}`}
            style={{ filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.35))" }}
          >
            <DoodleShape
              type={el.type}
              accent={accentColor}
              label={el.label}
              variant={el.variant}
            />
          </svg>
        </div>
      ))}
    </div>
  );
}

export default memo(DoodleOverlay);
