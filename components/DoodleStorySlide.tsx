"use client";

import { memo, useMemo } from "react";
import DoodleOverlay from "@/components/DoodleOverlay";
import EditorialCaption from "@/components/EditorialCaption";
import EditorialLayerStack from "@/components/EditorialLayerStack";
import EditorialTypographyBlocks from "@/components/EditorialTypographyBlocks";
import { buildDoodleComposition } from "@/lib/doodleComposition";
import {
  DOODLE_CAFE_ACCENT,
  DOODLE_CAFE_CREAM,
  DOODLE_CAFE_ESPRESSO,
  getLockedOverlayLayers,
  getLockedPhotoTreatment,
} from "@/lib/doodleCafeLock";
import type { AiSlideDesign } from "@/lib/aiOverlayRenderer";
import {
  overlayImageStyle,
  proceduralDoodleOpacity,
} from "@/lib/aiOverlayRenderer";
import type { SlideEditorPrefs } from "@/lib/slideEditorPrefs";
import type { SlideArtDirection } from "@/lib/slideArtDirector";
import type { StyleReference } from "@/lib/styleReference";
import type { StyleVisionResult } from "@/lib/styleVision";
import { getTemplateConfig, type TemplateVisualTreatment } from "@/lib/templates";

type DoodleStorySlideProps = {
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
  styleVision?: StyleVisionResult | null;
  visual?: TemplateVisualTreatment;
  aiDesign?: AiSlideDesign | null;
  slidePrefs?: SlideEditorPrefs;
  artDirection?: SlideArtDirection | null;
};

const DEFAULT_W = 320;
const DEFAULT_H = 400;

function QrDecor({ x, y }: { x: number; y: number }) {
  return (
    <div
      className="pointer-events-none absolute z-[18]"
      style={{ left: x, top: y }}
      aria-hidden
    >
      <div
        className="rounded-md p-1.5"
        style={{
          background: DOODLE_CAFE_CREAM,
          boxShadow: "0 4px 12px rgba(0,0,0,0.35)",
        }}
      >
        <svg viewBox="0 0 40 40" className="h-11 w-11" aria-hidden>
          <rect width="40" height="40" fill={DOODLE_CAFE_ESPRESSO} />
          <rect x="4" y="4" width="12" height="12" fill={DOODLE_CAFE_CREAM} />
          <rect x="24" y="4" width="12" height="12" fill={DOODLE_CAFE_CREAM} />
          <rect x="4" y="24" width="12" height="12" fill={DOODLE_CAFE_CREAM} />
          <rect x="18" y="18" width="6" height="6" fill={DOODLE_CAFE_ACCENT} />
          <rect x="28" y="28" width="8" height="8" fill={DOODLE_CAFE_CREAM} />
        </svg>
      </div>
    </div>
  );
}

function DoodleStorySlide({
  image,
  text,
  index,
  mood,
  accentColor: accentColorProp,
  showWatermark = false,
  watermarkText = null,
  width = DEFAULT_W,
  height = DEFAULT_H,
  styleReference,
  styleVision,
  visual: visualProp,
  aiDesign,
  slidePrefs,
  artDirection,
}: DoodleStorySlideProps) {
  const templateVisual =
    visualProp ?? getTemplateConfig("doodle-story").visual;
  const overlayMix = (slidePrefs?.overlayIntensity ?? 1) * (artDirection?.reveal ?? 1);
  const doodlesOn = (slidePrefs?.doodlesEnabled ?? true) && (artDirection?.phase !== "layout");
  const highlight =
    artDirection?.highlightColor ?? accentColorProp ?? DOODLE_CAFE_ACCENT;
  const borderRadius = templateVisual.borderRadius ?? 28;

  const composition = useMemo(() => {
    if (artDirection?.doodles) return artDirection.doodles.procedural;
    return buildDoodleComposition({
      caption: text,
      slideIndex: index,
      width,
      height,
      styleReference,
      styleVision,
      mood,
    });
  }, [artDirection, text, index, width, height, styleReference, styleVision, mood]);

  const photoFilter = artDirection?.photoFilter;
  const overlays = artDirection?.overlayLayers ?? getLockedOverlayLayers();
  const gradientTop = artDirection?.layout?.gradientZones?.top;
  const gradientBottom = artDirection?.layout?.gradientZones?.bottom;
  const vignetteStrength = artDirection?.layout?.gradientZones?.vignette ?? 0.28;
  const photoGrain =
    artDirection?.emotional?.grain ?? templateVisual.grainOpacity ?? 0.025;

  const captionCard = artDirection?.composition?.captionCard ?? {
        x: composition.captionCard.x,
        y: composition.captionCard.y,
        width: composition.captionCard.width,
        rotation: composition.captionCard.rotation,
      };

  const typeReveal = artDirection
    ? Math.min(1, Math.max(0, (artDirection.reveal - 0.2) / 0.5))
    : 1;
  const doodleReveal = artDirection
    ? Math.min(1, Math.max(0, (artDirection.reveal - 0.45) / 0.45))
    : 1;

  const displayWatermark =
    watermarkText ?? (showWatermark ? "Made with Table Tales Studio" : null);

  const scriptLine =
    (artDirection?.typography?.scriptLine ?? composition.scriptLine) &&
    !text
      .toUpperCase()
      .includes(
        (artDirection?.typography?.scriptLine ?? composition.scriptLine ?? "").toUpperCase()
      )
      ? (artDirection?.typography?.scriptLine ?? composition.scriptLine)
      : undefined;

  const aiLayer = artDirection?.aiOverlay ?? aiDesign;
  const collage = artDirection?.collage;
  const typeRevealCollage = typeReveal;

  return (
    <>
      {collage ? (
        <EditorialLayerStack
          collage={collage}
          editorial={artDirection?.editorial}
          width={width}
          height={height}
          reveal={typeRevealCollage}
        />
      ) : image ? (
        <img
          src={image}
          alt=""
          width={width}
          height={height}
          loading="lazy"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover"
          style={{ filter: photoFilter ?? getLockedPhotoTreatment(templateVisual).filter }}
        />
      ) : (
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(160deg, ${DOODLE_CAFE_ESPRESSO} 0%, #221810 45%, #3a2818 100%)`,
          }}
        />
      )}

      {gradientTop && (
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: gradientTop, opacity: overlayMix }}
        />
      )}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: overlays.tungsten, opacity: overlayMix * 0.9 }}
      />
      {gradientBottom && (
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: gradientBottom, opacity: overlayMix }}
        />
      )}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `radial-gradient(ellipse at center, transparent 35%, rgba(0,0,0,${vignetteStrength}) 100%)`,
          opacity: overlayMix,
        }}
      />

      {photoGrain > 0 && (
        <div
          className="pointer-events-none absolute inset-0 mix-blend-overlay"
          style={{
            opacity: photoGrain * overlayMix,
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.35'/%3E%3C/svg%3E\")",
          }}
          aria-hidden
        />
      )}

      {aiLayer?.overlayUrl && (
        <img
          src={aiLayer.overlayUrl}
          alt=""
          width={width}
          height={height}
          loading="lazy"
          decoding="async"
          className="pointer-events-none absolute inset-0 h-full w-full object-cover"
          style={{
            ...overlayImageStyle(aiLayer),
            opacity: (aiLayer.source === "ai" ? 0.94 : 0) * overlayMix * doodleReveal,
          }}
          aria-hidden
        />
      )}

      {(aiLayer?.loading || artDirection?.redesign?.loading) && (
        <div
          className="pointer-events-none absolute inset-0 z-[17] flex items-end justify-center pb-6"
          data-export-loading="true"
          aria-hidden
        >
          <span className="rounded-full bg-black/50 px-3 py-1 text-[9px] font-bold uppercase tracking-wider text-[#f4c430]">
            AI art directing…
          </span>
        </div>
      )}

      {doodlesOn && (
        <div
          className="pointer-events-none absolute inset-0 z-[18]"
          style={{
            opacity:
              proceduralDoodleOpacity(aiLayer) *
              overlayMix *
              doodleReveal *
              (artDirection?.doodles?.density ?? 1) *
              (artDirection?.editorial?.doodleBudget ?? 1) *
              (slidePrefs?.stickerDensity ?? 1),
          }}
          aria-hidden
        >
          <DoodleOverlay
            elements={composition.elements}
            accentColor={composition.adaptation.accentColor ?? highlight}
            animate
          />
        </div>
      )}

      {artDirection?.typographyPlan ? (
        <EditorialTypographyBlocks
          caption={text}
          plan={artDirection.typographyPlan}
          typography={artDirection.typography}
          highlightColor={highlight}
          reveal={typeReveal}
          width={width}
          height={height}
        />
      ) : (
        <div
          className={`pointer-events-none absolute z-[22] px-0 ${artDirection?.composition?.motionClass ?? ""}`}
          style={{
            left: captionCard.x,
            top:
              slidePrefs?.captionPlacement === "bottom"
                ? height - 120
                : captionCard.y,
            width: captionCard.width,
            transform: `rotate(${captionCard.rotation}deg)`,
            borderRadius,
            opacity: typeReveal,
          }}
        >
          <EditorialCaption
            text={text}
            highlightColor={highlight}
            scriptLine={scriptLine}
            align={
              slidePrefs?.captionAlignment === "center" ||
              artDirection?.typography?.align === "center"
                ? "center"
                : "left"
            }
          />
        </div>
      )}

      {(artDirection?.showQr ?? composition.showQr) && (
        <QrDecor x={width - 62} y={height - 78} />
      )}

      {(artDirection?.showPin ?? composition.showPin) && (
        <div
          className="pointer-events-none absolute z-[20]"
          style={{ left: width - 36, top: height - 36 }}
          aria-hidden
        >
          <svg viewBox="0 0 24 32" className="h-8 w-6">
            <path
              d="M12 2c-4 0-7 3-7 7 0 5 7 14 7 14s7-9 7-14c0-4-3-7-7-7z"
              fill="none"
              stroke={DOODLE_CAFE_CREAM}
              strokeWidth="1.5"
            />
            <circle cx="12" cy="9" r="2.5" fill={DOODLE_CAFE_ACCENT} />
          </svg>
          <p
            className="mt-0.5 text-right text-[7px] font-bold uppercase tracking-wider"
            style={{ color: `${DOODLE_CAFE_CREAM}99` }}
          >
            Table Tales Café
          </p>
        </div>
      )}

      <div className="absolute right-3 top-3 z-20">
        <span
          className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold"
          style={{
            color: DOODLE_CAFE_CREAM,
            background: "rgba(10,8,6,0.55)",
            border: `1px solid ${DOODLE_CAFE_CREAM}30`,
          }}
        >
          {index}
        </span>
      </div>

      {displayWatermark && (
        <p
          className="pointer-events-none absolute bottom-2 right-2 z-20 text-[8px] font-semibold uppercase tracking-widest"
          style={{ color: `${DOODLE_CAFE_CREAM}40` }}
        >
          {displayWatermark}
        </p>
      )}
    </>
  );
}

export default memo(DoodleStorySlide);
