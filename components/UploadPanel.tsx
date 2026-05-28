"use client";

import { memo } from "react";
import EmptyState from "@/components/EmptyState";
import StyleReferenceCard from "@/components/StyleReferenceCard";
import TemplateMarketplace from "@/components/TemplateMarketplace";
import type { StyleReference } from "@/lib/styleReference";
import type { StyleVisionResult } from "@/lib/styleVision";
import { VIRAL_HOOK_MODES, type ViralHookMode } from "@/lib/viralHooks";
import { TEMPLATE_LIST, type TemplateId } from "@/lib/templates";

type UploadPanelProps = {
  images: string[];
  templateId: TemplateId;
  viralMode: ViralHookMode;
  onViralModeChange: (mode: ViralHookMode) => void;
  onTemplateChange: (id: TemplateId) => void;
  onImagesSelected: (files: File[]) => void;
  onStyleReferenceSelected?: (file: File) => void;
  onStyleReferenceClear?: () => void;
  styleReferencePreview?: string | null;
  styleReference?: StyleReference | null;
  styleVision?: StyleVisionResult | null;
  isAnalyzingStyle?: boolean;
  onGenerate: () => void;
  isGenerating: boolean;
  isUploading: boolean;
};

function UploadPanel({
  images,
  templateId,
  viralMode,
  onViralModeChange,
  onTemplateChange,
  onImagesSelected,
  onStyleReferenceSelected,
  onStyleReferenceClear,
  styleReferencePreview = null,
  styleReference = null,
  styleVision = null,
  isAnalyzingStyle = false,
  onGenerate,
  isGenerating,
  isUploading,
}: UploadPanelProps) {
  return (
    <section className="panel-ambient min-w-0 rounded-[28px] bg-[#0b0f1a] p-5 ring-1 ring-white/5 transition-shadow duration-300 hover:shadow-[0_0_48px_rgba(0,0,0,0.2)] md:rounded-[40px] md:p-8">
      <h2 className="mb-6 text-3xl font-bold leading-tight md:mb-8 md:text-5xl">
        Upload
        <br />
        Carousel
        <br />
        Images
      </h2>

      <TemplateMarketplace value={templateId} onChange={onTemplateChange} />

      <select
        value={templateId}
        onChange={(e) => onTemplateChange(e.target.value as TemplateId)}
        className="focus-ring mb-6 w-full min-h-[48px] rounded-2xl bg-[#1a1f2e] p-4 text-base transition-colors duration-200 hover:bg-zinc-800 md:mb-8 md:p-5 md:text-xl"
      >
        {TEMPLATE_LIST.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name}
          </option>
        ))}
      </select>

      <label className="mb-3 block text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
        Story energy
        <select
          value={viralMode}
          onChange={(e) => onViralModeChange(e.target.value as ViralHookMode)}
          className="mt-1 w-full min-h-[44px] rounded-2xl bg-[#1a1f2e] p-3 text-sm text-white ring-1 ring-zinc-800 focus:ring-[#f7c600]/40 md:text-base"
        >
          {VIRAL_HOOK_MODES.map((m) => (
            <option key={m.id} value={m.id}>
              {m.label}
            </option>
          ))}
        </select>
      </label>

      <div className="mb-6 md:mb-8">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
          Reference style (optional)
        </p>
        <p className="mb-3 text-[11px] leading-relaxed text-zinc-600">
          Upload a carousel screenshot to mimic its storytelling aesthetic — layout,
          stickers, and type rhythm inspired on your food photos.
        </p>
        <label className="block cursor-pointer">
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            disabled={isAnalyzingStyle || isUploading}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file && onStyleReferenceSelected) onStyleReferenceSelected(file);
              e.target.value = "";
            }}
            className="block w-full min-h-[40px] text-sm text-zinc-400 file:mr-4 file:min-h-[40px] file:rounded-xl file:border-0 file:bg-zinc-800 file:px-4 file:py-2 file:font-semibold file:text-[#f7c600] transition-opacity hover:file:bg-zinc-700 disabled:opacity-50"
          />
        </label>
        <StyleReferenceCard
          previewUrl={styleReferencePreview}
          style={styleReference}
          vision={styleVision}
          loading={isAnalyzingStyle}
          onClear={onStyleReferenceClear}
        />
      </div>

      <label className="mb-6 block cursor-pointer md:mb-8">
        <span className="mb-3 block text-xs font-semibold uppercase tracking-wider text-zinc-500">
          Select images
        </span>
        <input
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
          disabled={isUploading}
          onChange={(e) => {
            const files = Array.from(e.target.files || []);
            if (files.length) onImagesSelected(files);
          }}
          className="block w-full min-h-[44px] text-sm text-zinc-400 file:mr-4 file:min-h-[44px] file:rounded-xl file:border-0 file:bg-[#f7c600] file:px-4 file:py-2.5 file:font-semibold file:text-black transition-opacity hover:file:bg-[#ffe033] disabled:opacity-50"
        />
      </label>

      {isUploading && (
        <div className="mb-6 overflow-hidden rounded-xl bg-zinc-900">
          <div className="h-1.5 w-full animate-pulse bg-gradient-to-r from-[#f7c600]/20 via-[#f7c600] to-[#f7c600]/20" />
          <p className="px-4 py-2 text-xs text-zinc-400">Processing uploads…</p>
        </div>
      )}

      {images.length === 0 ? (
        <EmptyState
          icon="🍽"
          title="Your carousel awaits its first frame"
          description="Upload 5–6 food photos — we'll stitch them into a cinematic Instagram story with AI captions."
          actionLabel="Use the file picker above"
        />
      ) : (
        <div className="grid grid-cols-2 gap-3 md:gap-4">
          {images.map((img, index) => (
            <div
              key={`${img.slice(0, 24)}-${index}`}
              className="aspect-square overflow-hidden rounded-2xl ring-1 ring-white/10 transition-transform duration-200 hover:scale-[1.02] md:rounded-3xl"
            >
              <img
                src={img}
                alt=""
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover"
              />
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={onGenerate}
        disabled={isGenerating || isUploading}
        className="mt-6 w-full min-h-[52px] rounded-2xl bg-white py-4 text-lg font-bold text-black transition-all duration-200 hover:bg-[#f7c600] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 md:mt-8 md:rounded-3xl md:py-5 md:text-2xl"
      >
        {isGenerating ? "Generating Story…" : "Generate AI Story"}
      </button>
    </section>
  );
}

export default memo(UploadPanel);
