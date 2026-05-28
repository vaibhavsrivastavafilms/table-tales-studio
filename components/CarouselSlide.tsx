import { forwardRef, memo, useMemo } from "react";
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
import {
  getTemplateConfig,
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
    },
    ref
  ) {
    const config = getTemplateConfig(templateId ?? "street-food");
    const isEditorialTemplate = isRichRelationshipTemplate(config.id);

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

    const visual = { ...config.visual, ...blended.visual };
    const isEditorial = isEditorialTemplate || blended.useEditorialLayout;
    const accent = brandKit
      ? resolveSlideAccent(blended.accentColor ?? config.accentColor, brandKit)
      : (blended.accentColor ?? config.accentColor);
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
    const captionAlignClass =
      config.captionAlignment === "left"
        ? "text-left"
        : config.captionAlignment === "right"
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

    const captionBottom = !styleReference?.textPlacement.top;
    const captionTop = !!styleReference?.textPlacement.top && !captionBottom;

    return (
      <article
        ref={ref}
        className={`preview-slide-card relative shrink-0 overflow-hidden ring-1 ring-white/10 transition-all duration-300 hover:-translate-y-0.5 hover:ring-[color:var(--slide-accent)]/25 ${hoverClass}`}
        style={{
          width: SLIDE_WIDTH,
          height: SLIDE_HEIGHT,
          borderRadius: slideRadius,
          ["--slide-accent" as string]: accent,
          boxShadow: isEditorial
            ? "0 20px 40px -12px rgba(26,18,8,0.45)"
            : `${shadowLift}, 0 0 ${Math.round(visual.glowStrength * 48)}px ${accent}22`,
        }}
        aria-label={`Slide ${index}`}
      >
        {isEditorial ? (
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
            {image ? (
              <img
                src={image}
                alt=""
                width={SLIDE_WIDTH}
                height={SLIDE_HEIGHT}
                loading="lazy"
                decoding="async"
                className="absolute inset-0 h-full w-full object-cover"
                style={{
                  filter: `contrast(${visual.imageContrast}) saturate(${visual.imageSaturation})`,
                }}
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-[#0b0f1a] to-black" />
            )}

            <div
              className="pointer-events-none absolute inset-0"
              style={{ background: overlayGradient }}
            />

            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background: `radial-gradient(ellipse at center, transparent 38%, rgba(0,0,0,${config.vignetteIntensity}) 100%)`,
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

            <div
              className={`absolute inset-x-0 z-10 flex px-6 ${
                captionTop ? "top-0 pb-8 pt-14" : "bottom-0 pb-10 pt-16"
              } ${
                captionAlignment === "left"
                  ? "justify-start"
                  : captionAlignment === "right"
                    ? "justify-end"
                    : "justify-center"
              }`}
            >
              <p
                className={`max-w-[260px] font-bold leading-snug tracking-tight text-white ${captionAlignClass}`}
                style={{
                  fontSize: `${fontSize}px`,
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
