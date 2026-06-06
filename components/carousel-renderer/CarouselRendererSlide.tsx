"use client";

import { memo } from "react";
import CarouselDoodleLayer from "@/components/carousel-renderer/CarouselDoodleSvg";
import {
  CAROUSEL_HEIGHT,
  CAROUSEL_WIDTH,
  type CarouselSlideJson,
  type TypographyBlock,
} from "@/lib/carousel-renderer/types";
import CompositionAnchorDebug from "@/components/carousel-renderer/CompositionAnchorDebug";
import { CAFE_TYPO } from "@/lib/carousel-renderer/typography-engine";

function TypographyLayer({ blocks }: { blocks: TypographyBlock[] }) {
  const ordered = [...blocks].sort((a, b) => {
    const rank = { tertiary: 0, secondary: 1, primary: 2 };
    const ar = rank[a.hierarchy ?? "primary"];
    const br = rank[b.hierarchy ?? "primary"];
    return ar - br;
  });

  return (
    <>
      {ordered.map((block, i) => {
        const rot = block.rotation ?? 0;
        const level = block.hierarchy ?? "primary";
        const isBrush = block.kind === "brush-sticker" || block.kind === "cta";
        const isQuote = block.kind === "quote";
        const isTertiary = level === "tertiary";

        return (
          <div
            key={`${block.kind}-${level}-${i}`}
            className="pointer-events-none absolute z-[30]"
            style={{
              left: block.zone.x,
              top: block.zone.y,
              width: block.zone.width,
              maxWidth: block.zone.width,
              transform: `rotate(${rot}deg)`,
              textAlign: block.align,
            }}
          >
            {isQuote && (
              <div
                className="absolute inset-0 -z-10 rounded-md"
                style={{
                  background: "rgba(12,8,6,0.28)",
                }}
                aria-hidden
              />
            )}
            {isBrush && block.backgroundColor && (
              <div
                className="absolute -z-10 rounded-sm"
                style={{
                  inset: "-3px -6px",
                  background: block.backgroundColor,
                  transform: "skewX(-2deg)",
                  boxShadow: "2px 3px 0 rgba(26,18,12,0.18)",
                }}
              />
            )}
            {block.lines.map((line, li) => (
              <p
                key={li}
                style={{
                  margin: 0,
                  padding: isBrush
                    ? "3px 10px"
                    : isQuote
                      ? "10px 14px"
                      : isTertiary
                        ? 0
                        : 0,
                  fontFamily: block.fontFamily,
                  fontSize: block.fontSize,
                  lineHeight: block.lineHeight,
                  letterSpacing: block.letterSpacing,
                  textTransform: block.textTransform,
                  color: block.color,
                  fontWeight:
                    level === "primary" ? 700 : level === "secondary" ? 500 : 600,
                  fontStyle: isQuote ? "italic" : "normal",
                  textShadow:
                    level === "primary" && !isBrush
                      ? "0 2px 10px rgba(0,0,0,0.55)"
                      : isTertiary
                        ? "none"
                        : "none",
                }}
              >
                {line}
              </p>
            ))}
          </div>
        );
      })}
    </>
  );
}

function EdgeVignette({ strength }: { strength: number }) {
  if (strength <= 0) return null;
  const c = `rgba(0,0,0,${strength})`;
  const size = "28% 24%";
  return (
    <>
      <div
        className="pointer-events-none absolute left-0 top-0 z-[11] h-[22%] w-[32%]"
        style={{ background: `radial-gradient(ellipse at 0% 0%, ${c}, transparent ${size})` }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute right-0 top-0 z-[11] h-[22%] w-[32%]"
        style={{ background: `radial-gradient(ellipse at 100% 0%, ${c}, transparent ${size})` }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute bottom-0 left-0 z-[11] h-[18%] w-[30%]"
        style={{ background: `radial-gradient(ellipse at 0% 100%, ${c}, transparent ${size})` }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute bottom-0 right-0 z-[11] h-[18%] w-[30%]"
        style={{ background: `radial-gradient(ellipse at 100% 100%, ${c}, transparent ${size})` }}
        aria-hidden
      />
    </>
  );
}

type CarouselRendererSlideProps = {
  slide: CarouselSlideJson;
  width?: number;
  height?: number;
  showWatermark?: string | null;
};

function CarouselRendererSlide({
  slide,
  width = CAROUSEL_WIDTH,
  height = CAROUSEL_HEIGHT,
  showWatermark,
}: CarouselRendererSlideProps) {
  const { composition } = slide;
  const { layout } = composition;
  const photo = layout.photo;
  const plan = layout.compositionPlan;
  const scale = width / CAROUSEL_WIDTH;
  const showAnchors = composition.showAnchors && plan;

  return (
    <article
      className="carousel-renderer-slide relative overflow-hidden bg-[#1a120c]"
      style={{ width, height }}
      data-carousel-slide={slide.index}
      data-carousel-role={slide.role}
      data-composition-layout={layout.compositionPlan?.layoutId}
    >
      {photo.url ? (
        <img
          src={photo.url}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          style={{
            objectPosition: photo.objectPosition,
            filter: photo.filter,
          }}
          crossOrigin="anonymous"
        />
      ) : (
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(165deg, #2a1c12 0%, #1a120c 45%, #3d2914 100%)",
          }}
        />
      )}

      {layout.gradientTop && layout.topScrimHeight > 0 && (
        <div
          className="pointer-events-none absolute left-0 right-0 top-0 z-[10]"
          style={{ height: layout.topScrimHeight, background: layout.gradientTop }}
        />
      )}
      {layout.gradientBottom && layout.bottomScrimHeight > 0 && (
        <div
          className="pointer-events-none absolute bottom-0 left-0 right-0 z-[10]"
          style={{
            height: layout.bottomScrimHeight,
            background: layout.gradientBottom,
          }}
        />
      )}

      <EdgeVignette strength={photo.vignette} />

      {showAnchors && <CompositionAnchorDebug plan={plan} scale={scale} />}

      <CarouselDoodleLayer doodles={composition.doodles} accent={CAFE_TYPO.brushYellow} />
      <TypographyLayer blocks={composition.typography} />

      {composition.showPin && (
        <div className="absolute bottom-16 right-12 z-[35]" aria-hidden>
          <svg viewBox="0 0 24 32" className="h-12 w-9">
            <path
              d="M12 2c-4 0-7 3-7 7 0 5 7 14 7 14s7-9 7-14c0-4-3-7-7-7z"
              fill="none"
              stroke={CAFE_TYPO.cream}
              strokeWidth="1.5"
            />
            <circle cx="12" cy="9" r="2.5" fill={CAFE_TYPO.brushYellow} />
          </svg>
        </div>
      )}

      {showWatermark && (
        <p
          className="pointer-events-none absolute bottom-4 right-6 z-[35] text-[11px] font-semibold uppercase tracking-widest"
          style={{ color: `${CAFE_TYPO.cream}55` }}
        >
          {showWatermark}
        </p>
      )}
    </article>
  );
}

export default memo(CarouselRendererSlide);
