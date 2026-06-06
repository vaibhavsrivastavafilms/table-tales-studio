import {
  renderBlogPost,
  renderInstagramCarousel,
} from "@/lib/story-engine/renderers/multi-render";
import type { CarouselProject, ExportFormat } from "@/lib/story-engine/types";

export type ExportPayload = {
  format: ExportFormat;
  filename: string;
  mimeType: string;
  data: string | Blob | Record<string, unknown>;
};

export interface Exporter {
  format: ExportFormat;
  export(project: CarouselProject): Promise<ExportPayload> | ExportPayload;
}

function baseName(project: CarouselProject): string {
  const slug = project.brief.topic
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .slice(0, 40);
  return slug || project.id;
}

export const htmlExporter: Exporter = {
  format: "html",
  export(project) {
    const ig = renderInstagramCarousel(project);
    const slides = ig.slides
      .map(
        (s, i) =>
          `<section data-slide="${i}"><h2>${escapeHtml(s.caption.split("\n")[0] ?? "")}</h2><p>${escapeHtml(s.caption)}</p></section>`
      )
      .join("\n");
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>${escapeHtml(project.brief.topic)}</title></head><body>${slides}</body></html>`;
    return {
      format: "html",
      filename: `${baseName(project)}.html`,
      mimeType: "text/html",
      data: html,
    };
  },
};

export const canvaJsonExporter: Exporter = {
  format: "canva-json",
  export(project) {
    const data = {
      type: "canva-carousel-v1",
      title: project.brief.topic,
      pages: project.slides.map((slide, i) => ({
        index: i,
        title: slide.headline,
        body: slide.body,
        visualType: slide.visualPlan.visualType,
        imageRef: slide.visualPlan.preferredPhotoId,
      })),
    };
    return {
      format: "canva-json",
      filename: `${baseName(project)}.canva.json`,
      mimeType: "application/json",
      data,
    };
  },
};

export const figmaJsonExporter: Exporter = {
  format: "figma-json",
  export(project) {
    const data = {
      type: "figma-carousel-v1",
      name: project.brief.topic,
      frames: project.slides.map((slide, i) => ({
        name: `Slide ${i + 1} — ${slide.role}`,
        characters: { headline: slide.headline, body: slide.body },
        layout: slide.visualPlan.layout,
        fill: slide.visualPlan.visualType,
      })),
    };
    return {
      format: "figma-json",
      filename: `${baseName(project)}.figma.json`,
      mimeType: "application/json",
      data,
    };
  },
};

/** Raster exporters return metadata; actual blob generation stays in UI layer. */
export const pngExporter: Exporter = {
  format: "png",
  export(project) {
    return {
      format: "png",
      filename: `${baseName(project)}-slides.zip`,
      mimeType: "application/zip",
      data: {
        hint: "Use canvas export pipeline with renderCarousel views",
        slideCount: project.slides.length,
      },
    };
  },
};

export const jpgExporter: Exporter = {
  format: "jpg",
  export(project) {
    return {
      format: "jpg",
      filename: `${baseName(project)}-slides.jpg`,
      mimeType: "image/jpeg",
      data: { slideCount: project.slides.length },
    };
  },
};

export const pdfExporter: Exporter = {
  format: "pdf",
  export(project) {
    const blog = renderBlogPost(project);
    return {
      format: "pdf",
      filename: `${baseName(project)}.pdf`,
      mimeType: "application/pdf",
      data: {
        hint: "Compose PDF from blog sections",
        sections: blog.sections,
      },
    };
  },
};

const EXPORTERS: Record<ExportFormat, Exporter> = {
  html: htmlExporter,
  "canva-json": canvaJsonExporter,
  "figma-json": figmaJsonExporter,
  png: pngExporter,
  jpg: jpgExporter,
  pdf: pdfExporter,
};

export class ExportEngine {
  async export(
    project: CarouselProject,
    format: ExportFormat
  ): Promise<ExportPayload> {
    const exporter = EXPORTERS[format];
    if (!exporter) throw new Error(`Unsupported export format: ${format}`);
    return exporter.export(project);
  }

  listFormats(): ExportFormat[] {
    return Object.keys(EXPORTERS) as ExportFormat[];
  }
}

export const exportEngine = new ExportEngine();

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
