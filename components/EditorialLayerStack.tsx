"use client";

import { memo } from "react";
import type { CollageComposition } from "@/lib/editorialCollageEngine";
import type { EditorialLayoutPlan } from "@/lib/editorialLayouts";

type EditorialLayerStackProps = {
  collage: CollageComposition;
  editorial?: EditorialLayoutPlan | null;
  width: number;
  height: number;
  reveal?: number;
};

function paperBackground(treatment: EditorialLayoutPlan["backgroundTreatment"]): string {
  switch (treatment) {
    case "cream-card":
      return "linear-gradient(165deg, #faf6ee 0%, #efe6d4 100%)";
    case "torn-paper":
      return "linear-gradient(180deg, #f4ede0 0%, #e8dcc8 55%, #f0e8d8 100%)";
    case "paper":
      return "linear-gradient(165deg, #f6f0e4 0%, #ebe3d2 40%, #f2ead8 100%)";
    case "phone-frame":
      return "radial-gradient(ellipse at 50% 30%, #1a1a22 0%, #060608 70%)";
    case "dark-cinematic":
      return "linear-gradient(180deg, #0a0a0f 0%, #12121a 100%)";
    default:
      return "linear-gradient(160deg, #0c0c10 0%, #1a1510 45%, #08080a 100%)";
  }
}

function EditorialLayerStack({
  collage,
  editorial,
  reveal = 1,
}: EditorialLayerStackProps) {
  const sorted = [...collage.layers].sort((a, b) => a.zIndex - b.zIndex);

  return (
    <div
      className={`pointer-events-none absolute inset-0 overflow-hidden ${collage.parallaxClass}`}
      style={{ opacity: reveal }}
      aria-hidden
    >
      {sorted.map((layer) => {
        if (layer.type === "background") {
          return (
            <div
              key={layer.id}
              className="absolute inset-0"
              style={{
                background: paperBackground(
                  editorial?.backgroundTreatment ?? "noise-gradient"
                ),
              }}
            />
          );
        }

        if (layer.type === "paper") {
          return (
            <div
              key={layer.id}
              className="absolute mix-blend-multiply"
              style={{
                left: layer.x,
                top: layer.y,
                width: layer.width,
                height: layer.height,
                transform: `rotate(${layer.rotation}deg) scale(${layer.scale})`,
                opacity: layer.opacity * reveal,
                borderRadius: layer.borderRadius,
                background:
                  editorial?.backgroundTreatment === "torn-paper"
                    ? "linear-gradient(180deg, rgba(244,237,224,0.98) 0%, rgba(232,220,200,0.95) 100%)"
                    : "linear-gradient(165deg, #f6f0e4 0%, #ebe3d2 100%)",
                boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
              }}
            />
          );
        }

        if (layer.type === "shadow") {
          return (
            <div
              key={layer.id}
              className="absolute rounded-full blur-xl"
              style={{
                left: layer.x,
                top: layer.y,
                width: layer.width,
                height: layer.height,
                transform: `rotate(${layer.rotation}deg)`,
                opacity: layer.opacity * reveal,
                background: "rgba(0,0,0,0.55)",
                filter: "blur(12px)",
              }}
            />
          );
        }

        if (layer.type === "frame") {
          return (
            <div
              key={layer.id}
              className="absolute border-2 border-white/15 bg-black/20"
              style={{
                left: layer.x,
                top: layer.y,
                width: layer.width,
                height: layer.height,
                borderRadius: layer.borderRadius ?? 28,
                transform: `rotate(${layer.rotation}deg)`,
                opacity: layer.opacity * reveal,
                boxShadow: layer.boxShadow,
              }}
            />
          );
        }

        if (!layer.src) return null;

        const isCutout = layer.type === "cutout";

        return (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={layer.id}
            src={layer.src}
            alt=""
            width={Math.round(layer.width)}
            height={Math.round(layer.height)}
            className="absolute object-cover"
            style={{
              left: layer.x,
              top: layer.y,
              width: layer.width,
              height: layer.height,
              transform: `rotate(${layer.rotation}deg) scale(${layer.scale})`,
              opacity: layer.opacity * reveal,
              zIndex: layer.zIndex,
              clipPath: layer.clipPath,
              WebkitMaskImage: isCutout ? layer.maskImage : undefined,
              maskImage: isCutout ? layer.maskImage : undefined,
              filter: layer.filter,
              mixBlendMode: (layer.blendMode as React.CSSProperties["mixBlendMode"]) ?? undefined,
              borderRadius: layer.borderRadius,
              boxShadow: layer.boxShadow ?? collage.depthShadow,
            }}
            decoding="async"
            aria-hidden
          />
        );
      })}

      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E\")",
        }}
      />
    </div>
  );
}

export default memo(EditorialLayerStack);
