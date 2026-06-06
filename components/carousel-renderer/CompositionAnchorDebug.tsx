"use client";

import { memo } from "react";
import type { CompositionPlan } from "@/lib/carousel-renderer/composition-types";
import type { SubjectAnchors } from "@/lib/carousel-renderer/subject-types";
import type { Rect } from "@/lib/carousel-renderer/types";

const COLORS: Record<keyof SubjectAnchors | "negative" | "type" | "doodle", string> = {
  heroDish: "#f4c430",
  secondaryDish: "#fde047",
  drink: "#60a5fa",
  garnish: "#86efac",
  table: "#a78bfa",
  people: "#f472b6",
  interior: "#94a3b8",
  logoArea: "#fb923c",
  negative: "#22d3ee",
  type: "#fff8f0",
  doodle: "#4ade80",
};

function AnchorBox({
  rect,
  label,
  color,
  dashed = false,
}: {
  rect: Rect;
  label: string;
  color: string;
  dashed?: boolean;
}) {
  return (
    <div
      className="pointer-events-none absolute z-[50] box-border"
      style={{
        left: rect.x,
        top: rect.y,
        width: rect.width,
        height: rect.height,
        border: `2px ${dashed ? "dashed" : "solid"} ${color}`,
        background: `${color}18`,
      }}
      aria-hidden
    >
      <span
        className="absolute -top-5 left-0 whitespace-nowrap rounded px-1 py-0.5 text-[9px] font-bold uppercase tracking-wide"
        style={{ background: color, color: "#1a120c" }}
      >
        {label}
      </span>
    </div>
  );
}

type CompositionAnchorDebugProps = {
  plan: CompositionPlan;
  scale?: number;
};

function CompositionAnchorDebug({ plan, scale = 1 }: CompositionAnchorDebugProps) {
  const { anchors, negativeSpace } = plan.subjects;

  const wrap = (r: Rect): Rect => ({
    x: r.x * scale,
    y: r.y * scale,
    width: r.width * scale,
    height: r.height * scale,
  });

  return (
    <div className="pointer-events-none absolute inset-0 z-[45]" aria-hidden>
      {anchors.heroDish && (
        <AnchorBox rect={wrap(anchors.heroDish)} label="heroDish" color={COLORS.heroDish} />
      )}
      {anchors.secondaryDish && (
        <AnchorBox
          rect={wrap(anchors.secondaryDish)}
          label="secondaryDish"
          color={COLORS.secondaryDish}
          dashed
        />
      )}
      {anchors.drink && (
        <AnchorBox rect={wrap(anchors.drink)} label="drink" color={COLORS.drink} />
      )}
      {anchors.garnish && (
        <AnchorBox rect={wrap(anchors.garnish)} label="garnish" color={COLORS.garnish} dashed />
      )}
      {anchors.table && (
        <AnchorBox rect={wrap(anchors.table)} label="table" color={COLORS.table} dashed />
      )}
      {anchors.people && (
        <AnchorBox rect={wrap(anchors.people)} label="people" color={COLORS.people} />
      )}
      {anchors.interior && (
        <AnchorBox rect={wrap(anchors.interior)} label="interior" color={COLORS.interior} dashed />
      )}
      {anchors.logoArea && (
        <AnchorBox rect={wrap(anchors.logoArea)} label="logoArea" color={COLORS.logoArea} dashed />
      )}
      {negativeSpace.slice(0, 3).map((ns, i) => (
        <AnchorBox
          key={`neg-${ns.label}-${i}`}
          rect={wrap(ns.rect)}
          label={`neg ${ns.label}`}
          color={COLORS.negative}
          dashed
        />
      ))}
      <AnchorBox
        rect={wrap(plan.primaryTextZone)}
        label="primary type"
        color={COLORS.type}
      />
      {plan.secondaryTextZone && (
        <AnchorBox
          rect={wrap(plan.secondaryTextZone)}
          label="secondary type"
          color={COLORS.type}
          dashed
        />
      )}
      {plan.doodleZones.map((z, i) => (
        <AnchorBox
          key={`doodle-zone-${i}`}
          rect={wrap(z)}
          label={`doodle ${i + 1}`}
          color={COLORS.doodle}
          dashed
        />
      ))}
    </div>
  );
}

export default memo(CompositionAnchorDebug);
