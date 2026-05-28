import type { ViralHookMode } from "@/lib/viralHooks";

export type BuilderToneId =
  | "emotional"
  | "viral"
  | "cozy"
  | "luxury"
  | "minimal"
  | "relationship"
  | "cinematic";

export const BUILDER_TONES: { id: BuilderToneId; label: string }[] = [
  { id: "emotional", label: "Emotional" },
  { id: "viral", label: "Viral" },
  { id: "cozy", label: "Cozy" },
  { id: "luxury", label: "Luxury" },
  { id: "minimal", label: "Minimal" },
  { id: "relationship", label: "Relationship" },
  { id: "cinematic", label: "Cinematic" },
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
    case "relationship":
      return "emotional";
    case "cinematic":
      return "aesthetic";
    default:
      return "emotional";
  }
}
