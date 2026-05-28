"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Sidebar from "@/components/Sidebar";
import PreviewPanel from "@/components/PreviewPanel";
import ExportPanel from "@/components/ExportPanel";
import ExportToast from "@/components/ExportToast";
import UploadPanel from "@/components/UploadPanel";
import StoryPanel from "@/components/StoryPanel";
import type { Captions } from "@/lib/slides";
import {
  createEmptyCaptions,
  draftTemplateId,
  filesToDataUrls,
  loadDraft,
  saveDraft,
} from "@/lib/draftStorage";
import {
  DEFAULT_TEMPLATE_ID,
  getTemplateConfig,
  type TemplateId,
} from "@/lib/templates";

export default function DashboardPage() {
  const [images, setImages] = useState<string[]>([]);
  const [captions, setCaptions] = useState<Captions>(createEmptyCaptions);
  const [templateId, setTemplateId] =
    useState<TemplateId>(DEFAULT_TEMPLATE_ID);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [draftReady, setDraftReady] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    variant: "success" | "error";
  } | null>(null);

  const slideRefs = useRef<(HTMLElement | null)[]>([]);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback(
    (message: string, variant: "success" | "error" = "success") => {
      setToast({ message, variant });
      window.setTimeout(() => setToast(null), 4000);
    },
    []
  );

  useEffect(() => {
    const draft = loadDraft();
    if (draft) {
      setCaptions(draft.captions);
      setTemplateId(draftTemplateId(draft.templateId));
      setImages(draft.images);
      setToast({ message: "Draft restored", variant: "success" });
      window.setTimeout(() => setToast(null), 4000);
    }
    setDraftReady(true);
  }, []);

  useEffect(() => {
    if (!draftReady) return;

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      saveDraft({ captions, templateId, images });
    }, 400);

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [captions, templateId, images, draftReady]);

  const handleImagesSelected = useCallback(
    async (files: File[]) => {
      setIsUploading(true);
      try {
        const urls = await filesToDataUrls(files);
        setImages(urls);
        showToast(`${files.length} image${files.length > 1 ? "s" : ""} uploaded`);
      } catch {
        showToast("Upload failed", "error");
      } finally {
        setIsUploading(false);
      }
    },
    [showToast]
  );

  const handleCaptionChange = useCallback(
    (key: keyof Captions, value: string) => {
      setCaptions((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const generateStory = useCallback(async () => {
    setIsGenerating(true);
    try {
      const templateName = getTemplateConfig(templateId).name;
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          template: templateName,
          imageCount: images.length || 5,
        }),
      });

      const data = await res.json();
      setCaptions(data);
      showToast("AI story generated");
    } catch (error) {
      console.log(error);
      showToast("Story generation failed", "error");
    } finally {
      setIsGenerating(false);
    }
  }, [images.length, showToast, templateId]);

  return (
    <main className="dashboard-main min-h-screen overflow-x-hidden bg-[#f7c600] p-4 text-white md:p-6">
      <ExportToast
        message={toast?.message ?? null}
        variant={toast?.variant}
      />

      <div className="mx-auto max-w-[1600px]">
        <header className="mb-6 md:mb-10">
          <h1 className="text-3xl font-bold text-black sm:text-5xl xl:text-7xl">
            Table Tales Studio
          </h1>
          <p className="mt-2 text-base text-black sm:text-xl xl:mt-3 xl:text-2xl">
            AI Food Storytelling Carousel Generator
          </p>
        </header>

        <div className="flex flex-col gap-4 xl:grid xl:grid-cols-12 xl:gap-6">
          <div className="xl:col-span-2">
            <Sidebar />
          </div>

          <div className="flex min-w-0 flex-col gap-4 xl:col-span-5 xl:gap-6">
            <UploadPanel
              images={images}
              templateId={templateId}
              onTemplateChange={setTemplateId}
              onImagesSelected={handleImagesSelected}
              onGenerate={generateStory}
              isGenerating={isGenerating}
              isUploading={isUploading}
            />
            <StoryPanel
              captions={captions}
              onCaptionChange={handleCaptionChange}
              isGenerating={isGenerating}
            />
          </div>

          <div className="flex min-w-0 flex-col gap-4 pb-20 xl:col-span-5 xl:gap-6 xl:pb-0">
            <PreviewPanel
              images={images}
              captions={captions}
              templateId={templateId}
              slideRefs={slideRefs}
            />
            <ExportPanel
              images={images}
              captions={captions}
              templateId={templateId}
              slideRefs={slideRefs}
              onToast={showToast}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
