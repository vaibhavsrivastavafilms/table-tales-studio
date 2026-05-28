import CarouselEditor from "@/components/CarouselEditor";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Table Tales Studio — AI Visual Storytelling Engine",
  description:
    "Simple AI carousel maker for food storytelling — upload, generate, preview, download.",
  openGraph: {
    title: "Table Tales Studio",
    description: "AI-powered cinematic food carousel studio",
    type: "website",
  },
};

export default function HomePage() {
  return <CarouselEditor variant="studio" />;
}
