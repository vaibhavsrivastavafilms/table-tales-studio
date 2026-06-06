"use client";

import { memo } from "react";
import type { SlideRenderOutput } from "@/lib/renderers/types";

type TemplatePhotoCompositeProps = {
  image: string;
  width: number;
  height: number;
  render: SlideRenderOutput;
  fallbackFilter?: string;
};

/**
 * Food-forward composite: sharp hero region, soft periphery, template-specific grade.
 */
function TemplatePhotoComposite({
  image,
  width,
  height,
  render,
  fallbackFilter,
}: TemplatePhotoCompositeProps) {
  const { photo, photoTreatment } = render;
  const hero = photo.heroBounds;
  const cx = (photo.heroCenterX / width) * 100;
  const cy = (photo.heroCenterY / height) * 100;
  const filter = photoTreatment.filter || fallbackFilter;

  return (
    <>
      {image ? (
        <>
          <img
            src={image}
            alt=""
            width={width}
            height={height}
            loading="lazy"
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover"
            style={{
              filter: `${filter} blur(${photo.backgroundBlurPx}px)`,
              transform: "scale(1.02)",
            }}
          />
          <div
            className="absolute overflow-hidden"
            style={{
              left: hero.x,
              top: hero.y,
              width: hero.width,
              height: hero.height,
              borderRadius: 8,
            }}
          >
            <img
              src={image}
              alt=""
              width={width}
              height={height}
              loading="lazy"
              decoding="async"
              className="absolute object-cover"
              style={{
                left: -hero.x,
                top: -hero.y,
                width,
                height,
                filter: `${filter} contrast(${photo.foodSharpness})`,
              }}
            />
          </div>
        </>
      ) : (
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(160deg, #1a120c 0%, #2a1c12 50%, #3d2918 100%)",
          }}
        />
      )}

      {photoTreatment.topGradient && (
        <div
          className="pointer-events-none absolute inset-0 z-[2]"
          style={{
            background: photoTreatment.topGradient,
            opacity: photoTreatment.overlayOpacity + 0.35,
          }}
        />
      )}
      {photoTreatment.bottomGradient && (
        <div
          className="pointer-events-none absolute inset-0 z-[2]"
          style={{
            background: photoTreatment.bottomGradient,
            opacity: photoTreatment.overlayOpacity + 0.4,
          }}
        />
      )}
      {photoTreatment.radialFoodGlow && (
        <div
          className="pointer-events-none absolute inset-0 z-[3]"
          style={{ background: photoTreatment.radialFoodGlow }}
        />
      )}
      <div
        className="pointer-events-none absolute inset-0 z-[4]"
        style={{
          background: `radial-gradient(ellipse at ${cx}% ${cy}%, transparent 32%, rgba(0,0,0,${photoTreatment.vignetteStrength}) 100%)`,
        }}
      />
      {photoTreatment.grainOpacity > 0 && (
        <div
          className="pointer-events-none absolute inset-0 z-[5] mix-blend-overlay"
          style={{
            opacity: photoTreatment.grainOpacity,
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.35'/%3E%3C/svg%3E\")",
          }}
          aria-hidden
        />
      )}

      {render.showEdgeSketch && (
        <svg
          className="pointer-events-none absolute inset-0 z-[6] h-full w-full"
          viewBox={`0 0 ${width} ${height}`}
          aria-hidden
        >
          <rect
            x="6"
            y="6"
            width={width - 12}
            height={height - 12}
            fill="none"
            stroke="rgba(255,254,248,0.12)"
            strokeWidth="1.5"
            strokeDasharray="8 6"
            rx="20"
          />
        </svg>
      )}
    </>
  );
}

export default memo(TemplatePhotoComposite);
