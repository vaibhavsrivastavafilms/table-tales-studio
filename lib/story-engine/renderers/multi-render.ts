import {
  projectToCaptions,
  slideToCaption,
} from "@/lib/story-engine/adapters";

import type { CarouselProject, PlatformRenderTarget } from "@/lib/story-engine/types";

export type InstagramSlideOutput = {
  index: number;
  caption: string;
  visualType: string;
  preferredPhotoId?: string | null;
  aspectRatio: "4:5";
};

export type InstagramCarouselOutput = {
  platform: "instagram";
  slides: InstagramSlideOutput[];
  hook: string;
  hashtags: string[];
};

export type LinkedInSlideOutput = {
  index: number;
  headline: string;
  body: string;
};

export type LinkedInCarouselOutput = {
  platform: "linkedin";
  documentTitle: string;
  slides: LinkedInSlideOutput[];
  postCopy: string;
};

export type PinterestPinOutput = {
  title: string;
  description: string;
  slideIndex: number;
};

export type PinterestCarouselOutput = {
  platform: "pinterest";
  pins: PinterestPinOutput[];
};

export type BlogPostOutput = {
  platform: "blog";
  title: string;
  sections: { heading: string; body: string }[];
  metaDescription: string;
};

export type ThreadPostOutput = {
  index: number;
  text: string;
};

export type ThreadOutput = {
  platform: "thread";
  posts: ThreadPostOutput[];
};

export function renderInstagramCarousel(
  project: CarouselProject
): InstagramCarouselOutput {
  return {
    platform: "instagram",
    hook: project.story.hook,
    hashtags: ["#foodstory", "#carousel", "#tabletales"],
    slides: project.slides.map((slide, index) => ({
      index,
      caption: slideToCaption(slide),
      visualType: slide.visualPlan.visualType,
      preferredPhotoId: slide.visualPlan.preferredPhotoId,
      aspectRatio: "4:5",
    })),
  };
}

export function renderLinkedInCarousel(
  project: CarouselProject
): LinkedInCarouselOutput {
  const slides = project.slides.map((slide, index) => ({
    index,
    headline: slide.headline,
    body: slide.body,
  }));
  const postCopy = [
    project.story.hook,
    "",
    ...slides.map((s) => `• ${s.headline}`),
    "",
    project.brief.goal,
  ].join("\n");
  return {
    platform: "linkedin",
    documentTitle: project.brief.topic,
    slides,
    postCopy,
  };
}

export function renderPinterestCarousel(
  project: CarouselProject
): PinterestCarouselOutput {
  return {
    platform: "pinterest",
    pins: project.slides.map((slide, slideIndex) => ({
      slideIndex,
      title: slide.headline,
      description: slide.body || slide.headline,
    })),
  };
}

export function renderBlogPost(project: CarouselProject): BlogPostOutput {
  return {
    platform: "blog",
    title: project.brief.topic,
    metaDescription: project.story.hook.slice(0, 155),
    sections: project.slides.map((slide) => ({
      heading: slide.headline,
      body: slide.body,
    })),
  };
}

export function renderThread(project: CarouselProject): ThreadOutput {
  const captions = projectToCaptions(project);
  const texts = Object.values(captions).filter(Boolean);
  return {
    platform: "thread",
    posts: texts.map((text, index) => ({ index, text })),
  };
}

export function renderForPlatform(
  project: CarouselProject,
  target: PlatformRenderTarget
) {
  switch (target) {
    case "instagram":
      return renderInstagramCarousel(project);
    case "linkedin":
      return renderLinkedInCarousel(project);
    case "pinterest":
      return renderPinterestCarousel(project);
    case "blog":
      return renderBlogPost(project);
    case "thread":
      return renderThread(project);
    default:
      return renderInstagramCarousel(project);
  }
}
