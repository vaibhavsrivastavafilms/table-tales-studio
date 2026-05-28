import type { ViralHookMode } from "@/lib/viralHooks";

export type BuilderToneId =
  | "emotional"
  | "viral"
  | "luxury"
  | "cozy"
  | "minimal";

export const BUILDER_TONES: { id: BuilderToneId; label: string }[] = [
  { id: "emotional", label: "Emotional" },
  { id: "viral", label: "Viral" },
  { id: "luxury", label: "Luxury" },
  { id: "cozy", label: "Cozy" },
  { id: "minimal", label: "Minimal" },
];

export function builderToneToViralMode(tone: BuilderToneId): ViralHookMode {
  switch (tone) {
    case "viral":
      return "viral";
    case "luxury":
      return "luxury";
    case "cozy":
      return "aesthetic";
    case "minimal":
      return "aesthetic";
    default:
      return "emotional";
  }
}
