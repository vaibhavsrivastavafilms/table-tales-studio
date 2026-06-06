/**
 * Story Engine ↔ Carousel Rendering Engine integration.
 */
export {
  storyProjectToRenderProject,
  studioCaptionsToRenderProject,
} from "@/lib/carousel-renderer/story-bridge";

export {
  buildRenderProject,
  buildCarouselFromPipeline,
} from "@/lib/carousel-renderer/pipeline";

export {
  renderSlidesToPNG,
  renderProjectToPNG,
  preparePngExport,
  slideFilename,
} from "@/lib/carousel-renderer/export-engine";

export type {
  CarouselRenderProject,
  RenderSlide,
  DoodleAsset,
} from "@/lib/carousel-renderer/project-types";
