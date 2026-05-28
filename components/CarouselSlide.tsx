import { forwardRef, memo } from "react";
import {
  getTemplateConfig,
  type TemplateId,
} from "@/lib/templates";

export type CarouselSlideProps = {
  image: string;
  text: string;
  index: number;
  templateId?: TemplateId | string;
};

const SLIDE_WIDTH = 320;
const SLIDE_HEIGHT = 400;

const CarouselSlide = memo(
  forwardRef<HTMLElement, CarouselSlideProps>(function CarouselSlide(
    { image, text, index, templateId },
    ref
  ) {
    const config = getTemplateConfig(templateId ?? "street-food");
    const fontSize = Math.round(17 * config.fontScale);
    const captionAlignClass =
      config.captionAlignment === "left"
        ? "text-left"
        : config.captionAlignment === "right"
          ? "text-right"
          : "text-center";

    return (
      <article
        ref={ref}
        className="preview-slide-card relative shrink-0 overflow-hidden rounded-2xl shadow-[0_24px_48px_-12px_rgba(0,0,0,0.65)] ring-1 ring-white/10 transition-all duration-300 hover:-translate-y-0.5 hover:ring-[color:var(--slide-accent)]/25 hover:shadow-[0_32px_64px_-12px_rgba(0,0,0,0.75)]"
        style={{
          width: SLIDE_WIDTH,
          height: SLIDE_HEIGHT,
          ["--slide-accent" as string]: config.accentColor,
        }}
        aria-label={`Slide ${index}`}
      >
        {image ? (
          <img
            src={image}
            alt=""
            loading="lazy"
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-[#0b0f1a] to-black" />
        )}

        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: config.overlayGradient }}
        />

        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: `radial-gradient(ellipse at center, transparent 38%, rgba(0,0,0,${config.vignetteIntensity}) 100%)`,
          }}
        />

        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-44"
          style={{
            background: `linear-gradient(to top, rgba(0,0,0,${config.bottomFadeOpacity}), transparent)`,
          }}
        />

        <div className="absolute left-3 top-3 z-10">
          <span
            className="inline-flex items-center rounded-full border bg-black/60 px-3 py-1 text-[10px] font-bold uppercase tracking-widest backdrop-blur-sm"
            style={{
              borderColor: `${config.accentColor}66`,
              color: config.accentColor,
            }}
          >
            {config.badgeText}
          </span>
        </div>

        <div className="absolute right-3 top-3 z-10">
          <span
            className="flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-xs font-bold text-white/90 backdrop-blur-sm ring-1 ring-white/15"
            style={{ boxShadow: `0 0 12px ${config.accentColor}33` }}
          >
            {index}
          </span>
        </div>

        <div
          className={`absolute inset-x-0 bottom-0 z-10 flex px-6 pb-10 pt-16 ${
            config.captionAlignment === "left"
              ? "justify-start"
              : config.captionAlignment === "right"
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

        <div
          className="absolute bottom-0 left-1/2 z-10 h-0.5 -translate-x-1/2 rounded-full"
          style={{
            width: config.accentLineWidth,
            backgroundColor: config.accentColor,
            opacity: 0.85,
          }}
        />
      </article>
    );
  })
);

export default CarouselSlide;
