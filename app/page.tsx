import CarouselEditor from "@/components/CarouselEditor";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Table Tales Studio — AI Carousel Builder",
  description:
    "Upload food photos and art-direct a cinematic Pinterest-quality carousel — layouts, doodles, typography, export.",
  openGraph: {
    title: "Table Tales Studio",
    description: "AI-powered cinematic food carousel builder",
    type: "website",
  },
};

export default function HomePage() {
  return <CarouselEditor />;
}
