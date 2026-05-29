import { forwardRef, memo, useMemo } from "react";
import DoodleStorySlide from "@/components/DoodleStorySlide";
import EditorialLayerStack from "@/components/EditorialLayerStack";
import EditorialTypographyBlocks from "@/components/EditorialTypographyBlocks";
import RichRelationshipSlide from "@/components/RichRelationshipSlide";
import {
  fontScaleForPreset,
  resolveSlideAccent,
  type BrandKit,
} from "@/lib/brandKit";
import {
  blendStyleWithTemplate,
  type StyleReference,
} from "@/lib/styleReference";
import type { AiSlideDesign } from "@/lib/aiOverlayRenderer";
import type { SlideEditorPrefs } from "@/lib/slideEditorPrefs";
import type { SlideArtDirection } from "@/lib/slideArtDirector";
import type { StyleVisionResult } from "@/lib/styleVision";
import { DOODLE_CAFE_ACCENT } from "@/lib/doodleCafeLock";
import {
  getTemplateConfig,
  isDoodleStoryTemplate,
  isEditorialCarouselTemplate,
  isRichRelationshipTemplate,
  type TemplateId,
} from "@/lib/templates";

export type CarouselSlideProps = {
  image: string;
  text: string;
  index: number;
  templateId?: TemplateId | string;
  showWatermark?: boolean;
  brandKit?: BrandKit;
  watermarkText?: string | null;
  /** Visual mood hint for editorial sticker selection */
  storyMood?: string;
  /** Optional reference-carousel aesthetic to blend into slides */
  styleReference?: StyleReference | null;
  styleVision?: StyleVisionResult | null;
  aiDesign?: AiSlideDesign | null;
  slidePrefs?: SlideEditorPrefs;
  artDirection?: SlideArtDirection | null;
};

const SLIDE_WIDTH = 320;
const SLIDE_HEIGHT = 400;

const CarouselSlide = memo(
  forwardRef<HTMLElement, CarouselSlideProps>(function CarouselSlide(
    {
      image,
      text,
      index,
      templateId,
      showWatermark = false,
      brandKit,
      watermarkText = null,
      storyMood,
      styleReference,
      styleVision,
      aiDesign,
      slidePrefs,
      artDirection,
    },
    ref
  ) {
    const config = getTemplateConfig(templateId ?? "street-food");
    const isDoodle = isDoodleStoryTemplate(config.id);
    const isEditorialTemplate = isEditorialCarouselTemplate(config.id);

    const blended = useMemo(
      () =>
        blendStyleWithTemplate(
          config.visual,
          config.accentColor,
          config.captionAlignment,
          config.bottomFadeOpacity,
          config.overlayGradient,
          styleReference,
          isEditorialTemplate
        ),
      [config, styleReference, isEditorialTemplate]
    );

    const overlayScale = slidePrefs?.overlayIntensity ?? 1;
    const visual = {
      ...config.visual,
      ...blended.visual,
      overlayIntensity: config.visual.overlayIntensity * overlayScale,
    };
    const isEditorial = isEditorialTemplate || blended.useEditorialLayout;
    const accent = isDoodle
      ? (artDirection?.accentColor ?? DOODLE_CAFE_ACCENT)
      : artDirection?.accentColor ??
        (brandKit
          ? resolveSlideAccent(blended.accentColor ?? config.accentColor, brandKit)
          : (blended.accentColor ?? config.accentColor));
    const captionAlignment = blended.captionAlignment;
    const bottomFadeOpacity =
      blended.bottomFadeOpacity ?? config.bottomFadeOpacity;
    const overlayGradient = blended.overlayGradient ?? config.overlayGradient;
    const slideRadius = blended.borderRadius;
    const shadowLift =
      blended.shadowDepth === "deep"
        ? "0 28px 56px -12px rgba(0,0,0,0.75)"
        : blended.shadowDepth === "soft"
          ? "0 16px 32px -10px rgba(0,0,0,0.45)"
          : "0 24px 48px -12px rgba(0,0,0,0.65)";
    const typeScale = brandKit
      ? fontScaleForPreset(brandKit.typographyPreset)
      : 1;
    const fontSize = Math.round(17 * config.fontScale * typeScale);
    const displayWatermark =
      watermarkText ??
      (showWatermark ? "Made with Table Tales Studio" : null);
    const effectiveAlign =
      slidePrefs?.captionAlignment ??
      artDirection?.typography?.align ??
      captionAlignment;
    const captionAlignClass =
      effectiveAlign === "left"
        ? "text-left"
        : effectiveAlign === "right"
          ? "text-right"
          : "text-center";

    const hoverClass = isEditorial
      ? "hover:duration-400 hover:shadow-[0_28px_56px_-10px_rgba(0,0,0,0.5)]"
      : visual.motionFeel === "punchy"
        ? "hover:duration-200"
        : visual.motionFeel === "slow"
          ? "hover:duration-500"
          : visual.motionFeel === "editorial"
            ? "hover:duration-400"
            : "hover:duration-300";

    const placementTop = slidePrefs?.captionPlacement === "top";
    const placementBottom = slidePrefs?.captionPlacement === "bottom";
    const weightTop = artDirection?.layout?.visualWeight === "top";
    const weightBottom = artDirection?.layout?.visualWeight === "bottom";
    const weightCenter = artDirection?.layout?.visualWeight === "center";
    const captionBottom =
      placementBottom ||
      weightBottom ||
      (!placementTop && !weightTop && !styleReference?.textPlacement.top && !weightCenter);
    const captionTop =
      placementTop ||
      weightTop ||
      (!placementBottom && !weightBottom && !!styleReference?.textPlacement.top && !captionBottom);
    const captionCentered = weightCenter && !placementTop && !placementBottom;
    const typeReveal = artDirection
      ? Math.min(1, Math.max(0, (artDirection.reveal - 0.2) / 0.5))
      : 1;

    return (
      <article
        ref={ref}
        className={`preview-slide-card relative shrink-0 overflow-hidden ring-1 ring-white/10 transition-all duration-300 hover:-translate-y-0.5 hover:ring-[color:var(--slide-accent)]/25 ${hoverClass}`}
        style={{
          width: SLIDE_WIDTH,
          height: SLIDE_HEIGHT,
          borderRadius: isDoodle
            ? (visual.borderRadius ?? slideRadius)
            : slideRadius,
          ["--slide-accent" as string]: accent,
          boxShadow: isDoodle
            ? "0 20px 40px -12px rgba(61,41,20,0.38)"
            : isEditorial
              ? "0 20px 40px -12px rgba(26,18,8,0.45)"
              : `${shadowLift}, 0 0 ${Math.round(visual.glowStrength * 48)}px ${accent}22`,
        }}
        aria-label={`Slide ${index}`}
      >
        {isDoodle ? (
          <DoodleStorySlide
            image={image}
            text={text}
            index={index}
            mood={storyMood ?? styleReference?.emotionalTone}
            accentColor={accent}
            showWatermark={showWatermark}
            watermarkText={watermarkText}
            width={SLIDE_WIDTH}
            height={SLIDE_HEIGHT}
            styleReference={styleReference}
            styleVision={styleVision}
            visual={visual}
            aiDesign={aiDesign}
            slidePrefs={slidePrefs}
            artDirection={artDirection}
          />
        ) : isRichRelationshipTemplate(config.id) ? (
          <RichRelationshipSlide
            image={image}
            text={text}
            index={index}
            mood={storyMood ?? styleReference?.emotionalTone}
            accentColor={accent}
            showWatermark={showWatermark}
            watermarkText={watermarkText}
            width={SLIDE_WIDTH}
            height={SLIDE_HEIGHT}
            styleReference={styleReference}
          />
        ) : (
          <>
            {artDirection?.collage ? (
              <EditorialLayerStack
                collage={artDirection.collage}
                editorial={artDirection.editorial}
                width={SLIDE_WIDTH}
                height={SLIDE_HEIGHT}
                reveal={typeReveal}
              />
            ) : image ? (
              <img
                src={image}
                alt=""
                width={SLIDE_WIDTH}
                height={SLIDE_HEIGHT}
                loading="lazy"
                decoding="async"
                className="absolute inset-0 h-full w-full object-cover"
                style={{
                  filter:
                    artDirection?.photoFilter ??
                    `contrast(${visual.imageContrast}) saturate(${visual.imageSaturation})`,
                }}
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-[#0b0f1a] to-black" />
            )}

            {artDirection?.redesign?.overlayUrl && !artDirection.collage?.layers.some((l) => l.type === "redesign") && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={artDirection.redesign.overlayUrl}
                alt=""
                className="pointer-events-none absolute inset-0 z-[12] h-full w-full object-cover mix-blend-multiply"
                style={{ opacity: typeReveal * 0.88 }}
                aria-hidden
              />
            )}

            {artDirection?.layout?.gradientZones?.top ? (
              <div
                className="pointer-events-none absolute inset-0"
                style={{
                  background: artDirection.layout.gradientZones.top,
                  opacity: overlayScale,
                }}
              />
            ) : (
              <div
                className="pointer-events-none absolute inset-0"
                style={{ background: overlayGradient }}
              />
            )}

            {artDirection?.layout?.gradientZones?.bottom ? (
              <div
                className="pointer-events-none absolute inset-0"
                style={{
                  background: artDirection.layout.gradientZones.bottom,
                  opacity: overlayScale,
                }}
              />
            ) : null}

            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background: `radial-gradient(ellipse at center, transparent 38%, rgba(0,0,0,${artDirection?.layout?.gradientZones?.vignette ?? config.vignetteIntensity}) 100%)`,
              }}
            />

            {captionBottom && (
              <div
                className="pointer-events-none absolute inset-x-0 bottom-0 h-44"
                style={{
                  background: `linear-gradient(to top, rgba(0,0,0,${Math.min(0.98, bottomFadeOpacity * visual.overlayIntensity)}), transparent)`,
                }}
              />
            )}
            {captionTop && (
              <div
                className="pointer-events-none absolute inset-x-0 top-0 h-36"
                style={{
                  background: `linear-gradient(to bottom, rgba(0,0,0,${Math.min(0.92, bottomFadeOpacity * visual.overlayIntensity)}), transparent)`,
                }}
              />
            )}

            {visual.grainOpacity > 0 && (
              <div
                className="pointer-events-none absolute inset-0 opacity-[var(--grain-opacity)] mix-blend-overlay"
                style={
                  {
                    ["--grain-opacity" as string]: visual.grainOpacity,
                    backgroundImage:
                      "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E\")",
                  } as React.CSSProperties
                }
                aria-hidden
              />
            )}

            <div className="absolute left-3 top-3 z-10">
              <span
                className={`inline-flex items-center rounded-full border bg-black/60 px-3 py-1 text-[10px] font-bold uppercase backdrop-blur-sm ${
                  visual.badgeStyle === "elegant"
                    ? "tracking-[0.25em]"
                    : visual.badgeStyle === "documentary"
                      ? "tracking-widest"
                      : "tracking-wider"
                }`}
                style={{
                  borderColor: `${accent}66`,
                  color: accent,
                }}
              >
                {config.badgeText}
              </span>
            </div>

            <div className="absolute right-3 top-3 z-10">
              <span
                className="flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-xs font-bold text-white/90 backdrop-blur-sm ring-1 ring-white/15"
                style={{ boxShadow: `0 0 12px ${accent}33` }}
              >
                {index}
              </span>
            </div>

            {artDirection?.typographyPlan ? (
              <EditorialTypographyBlocks
                caption={text}
                plan={artDirection.typographyPlan}
                typography={artDirection.typography}
                highlightColor={accent}
                reveal={typeReveal}
                width={SLIDE_WIDTH}
                height={SLIDE_HEIGHT}
              />
            ) : (
              <div
                className={`absolute inset-x-0 z-10 flex px-6 ${artDirection?.composition?.motionClass ?? ""} ${
                  captionCentered
                    ? "inset-0 items-center justify-center py-0"
                    : captionTop
                      ? "top-0 pb-8 pt-14"
                      : "bottom-0 pb-10 pt-16"
                } ${
                  effectiveAlign === "center"
                    ? "justify-center"
                    : effectiveAlign === "right"
                      ? "justify-end"
                      : "justify-start"
                }`}
                style={{ opacity: typeReveal }}
              >
                <p
                  className={`max-w-[260px] font-bold leading-snug tracking-tight text-white ${captionAlignClass}`}
                  style={{
                    fontSize: `${Math.round(
                      fontSize *
                        (artDirection?.typography?.scale ?? 1) *
                        (slidePrefs?.typographyScale ?? 1)
                    )}px`,
                    textShadow:
                      "0 2px 14px rgba(0,0,0,0.95), 0 1px 4px rgba(0,0,0,0.85)",
                  }}
                >
                  {text || (
                    <span className="text-sm font-medium text-white/35">
                      Caption appears here
                    </span>
                  )}
                </p>
              </div>
            )}

            {config.accentLineWidth > 0 && (
              <div
                className="absolute bottom-0 left-1/2 z-10 h-0.5 -translate-x-1/2 rounded-full"
                style={{
                  width: config.accentLineWidth,
                  backgroundColor: accent,
                  opacity: 0.85,
                }}
              />
            )}

            {displayWatermark && (
              <p className="pointer-events-none absolute bottom-3 right-3 z-10 text-[9px] font-semibold uppercase tracking-widest text-white/40">
                {displayWatermark}
              </p>
            )}
          </>
        )}
      </article>
    );
  })
);

export default CarouselSlide;
