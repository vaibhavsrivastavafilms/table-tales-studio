"use client";

import { memo, useCallback, useRef, useState } from "react";
import StyleReferenceCard from "@/components/StyleReferenceCard";
import TemplateMarketplace from "@/components/TemplateMarketplace";
import {
  DIRECTION_EMOTIONS,
  type CreatorDirection,
} from "@/lib/creatorDirection";
import { AI_DESIGN_MODES, type AiDesignModeId } from "@/lib/aiDesignModes";
import type { StyleReference } from "@/lib/styleReference";
import type { StyleVisionResult } from "@/lib/styleVision";
import { TEMPLATE_LIST, isDoodleStoryTemplate, type TemplateId } from "@/lib/templates";
import { VIRAL_HOOK_MODES, type ViralHookMode } from "@/lib/viralHooks";

type CreatorInputPanelProps = {
  images: string[];
  templateId: TemplateId;
  viralMode: ViralHookMode;
  creatorDirection: CreatorDirection;
  aiDesignMode?: AiDesignModeId;
  onAiDesignModeChange?: (mode: AiDesignModeId) => void;
  onTemplateChange: (id: TemplateId) => void;
  onViralModeChange: (mode: ViralHookMode) => void;
  onCreatorDirectionChange: (next: CreatorDirection) => void;
  onImagesSelected: (files: File[]) => void;
  onStyleReferenceSelected?: (file: File) => void;
  onStyleReferenceClear?: () => void;
  styleReferencePreview?: string | null;
  styleReference?: StyleReference | null;
  styleVision?: StyleVisionResult | null;
  isAnalyzingStyle?: boolean;
  onGenerate: () => void;
  onRegenerateDirection: () => void;
  isGenerating: boolean;
  isUploading: boolean;
  isDirecting: boolean;
  disabled?: boolean;
};

function CreatorInputPanel({
  images,
  templateId,
  viralMode,
  creatorDirection,
  aiDesignMode,
  onAiDesignModeChange,
  onTemplateChange,
  onViralModeChange,
  onCreatorDirectionChange,
  onImagesSelected,
  onStyleReferenceSelected,
  onStyleReferenceClear,
  styleReferencePreview = null,
  styleReference = null,
  styleVision = null,
  isAnalyzingStyle = false,
  onGenerate,
  onRegenerateDirection,
  isGenerating,
  isUploading,
  isDirecting,
  disabled = false,
}: CreatorInputPanelProps) {
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const refFileRef = useRef<HTMLInputElement>(null);
  const showAiModes = isDoodleStoryTemplate(templateId);

  const ingestFiles = useCallback(
    (files: FileList | File[]) => {
      const list = Array.from(files).filter((f) => f.type.startsWith("image/"));
      if (list.length) onImagesSelected(list);
    },
    [onImagesSelected]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      if (disabled || isUploading) return;
      ingestFiles(e.dataTransfer.files);
    },
    [disabled, ingestFiles, isUploading]
  );

  const onPaste = useCallback(
    (e: React.ClipboardEvent) => {
      if (disabled) return;
      const items = e.clipboardData?.items;
      if (!items) return;
      const files: File[] = [];
      for (const item of items) {
        if (item.type.startsWith("image/")) {
          const f = item.getAsFile();
          if (f) files.push(f);
        }
      }
      if (files.length) {
        e.preventDefault();
        onImagesSelected(files);
      }
    },
    [disabled, onImagesSelected]
  );

  const patchDirection = (partial: Partial<CreatorDirection>) => {
    onCreatorDirectionChange({ ...creatorDirection, ...partial });
  };

  return (
    <aside
      id="studio-templates"
      className="studio-panel panel-scroll flex max-h-[calc(100vh-4rem)] flex-col gap-4 overflow-y-auto p-4 md:p-5"
      onPaste={onPaste}
    >
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#f4c430]">
          Creative input
        </p>
        <h2 className="mt-1 text-lg font-bold text-white">Drop food photos</h2>
      </div>

      <div
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") fileRef.current?.click();
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => fileRef.current?.click()}
        className={`studio-dropzone cursor-pointer rounded-2xl border-2 border-dashed px-4 py-8 text-center transition ${
          dragOver
            ? "border-[#f4c430]/60 bg-[#f4c430]/[0.06]"
            : "border-white/10 bg-white/[0.02] hover:border-[#f4c430]/30"
        }`}
      >
        <input
          ref={fileRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
          className="sr-only"
          disabled={disabled || isUploading}
          onChange={(e) => {
            const files = Array.from(e.target.files || []);
            if (files.length) onImagesSelected(files);
            e.target.value = "";
          }}
        />
        <p className="text-2xl" aria-hidden>
          ◈
        </p>
        <p className="mt-2 text-sm font-semibold text-zinc-300">
          Drag & drop · click to browse
        </p>
        <p className="mt-1 text-[11px] text-zinc-500">
          Multiple uploads · paste from clipboard
        </p>
      </div>

      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {images.slice(0, 6).map((img, i) => (
            <div
              key={`${img.slice(0, 16)}-${i}`}
              className="aspect-square overflow-hidden rounded-lg ring-1 ring-white/10"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img}
                alt=""
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </div>
          ))}
        </div>
      )}

      <div className="studio-glass rounded-xl p-3">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
          Reference style
        </p>
        <p className="mb-2 text-[10px] leading-relaxed text-zinc-600">
          Pinterest screenshot or carousel reference for style replication
        </p>
        <button
          type="button"
          disabled={disabled || isAnalyzingStyle}
          onClick={() => refFileRef.current?.click()}
          className="w-full rounded-lg border border-white/10 bg-black/40 py-2 text-[10px] font-bold uppercase tracking-wider text-zinc-400 transition hover:border-[#f4c430]/30 hover:text-[#f4c430] disabled:opacity-50"
        >
          Upload reference
        </button>
        <input
          ref={refFileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file && onStyleReferenceSelected) onStyleReferenceSelected(file);
            e.target.value = "";
          }}
        />
        <StyleReferenceCard
          previewUrl={styleReferencePreview}
          style={styleReference}
          vision={styleVision}
          loading={isAnalyzingStyle}
          onClear={onStyleReferenceClear}
        />
      </div>

      <TemplateMarketplace value={templateId} onChange={onTemplateChange} />

      <label className="block text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
        Template
        <select
          value={templateId}
          disabled={disabled}
          onChange={(e) => onTemplateChange(e.target.value as TemplateId)}
          className="mt-1 w-full min-h-[40px] rounded-xl bg-black/60 p-2.5 text-sm text-white ring-1 ring-white/10"
        >
          {TEMPLATE_LIST.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </label>

      <label className="block text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
        Mood
        <select
          value={creatorDirection.emotion}
          disabled={disabled}
          onChange={(e) =>
            patchDirection({
              emotion: e.target.value as CreatorDirection["emotion"],
            })
          }
          className="mt-1 w-full min-h-[40px] rounded-xl bg-black/60 p-2.5 text-sm text-white ring-1 ring-white/10"
        >
          {DIRECTION_EMOTIONS.map((e) => (
            <option key={e.id} value={e.id}>
              {e.label}
            </option>
          ))}
        </select>
      </label>

      <label className="block text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
        Storytelling intensity
        <div className="mt-2 flex items-center gap-3">
          <input
            type="range"
            min={0}
            max={100}
            value={creatorDirection.energy}
            disabled={disabled}
            onChange={(e) =>
              patchDirection({ energy: Number(e.target.value) })
            }
            className="h-1 flex-1 accent-[#f4c430]"
          />
          <span className="w-8 text-right text-xs font-bold text-[#f4c430]">
            {creatorDirection.energy}
          </span>
        </div>
      </label>

      <label className="block text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
        Story energy
        <select
          value={viralMode}
          disabled={disabled}
          onChange={(e) => onViralModeChange(e.target.value as ViralHookMode)}
          className="mt-1 w-full min-h-[40px] rounded-xl bg-black/60 p-2.5 text-sm text-white ring-1 ring-white/10"
        >
          {VIRAL_HOOK_MODES.map((m) => (
            <option key={m.id} value={m.id}>
              {m.label}
            </option>
          ))}
        </select>
      </label>

      {showAiModes && onAiDesignModeChange && aiDesignMode && (
        <label className="block text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
          Visual style (AI overlays)
          <select
            value={aiDesignMode}
            disabled={disabled}
            onChange={(e) =>
              onAiDesignModeChange(e.target.value as AiDesignModeId)
            }
            className="mt-1 w-full min-h-[40px] rounded-xl bg-black/60 p-2.5 text-sm text-white ring-1 ring-white/10"
          >
            {AI_DESIGN_MODES.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </select>
        </label>
      )}

      <div className="mt-auto flex flex-col gap-2 pt-2">
        <button
          type="button"
          onClick={onGenerate}
          disabled={disabled || isGenerating || isUploading}
          className="studio-cta-primary w-full min-h-[48px] rounded-xl py-3 text-sm font-bold text-black transition disabled:opacity-50"
        >
          {isGenerating ? "Generating story…" : "Generate story"}
        </button>
        <button
          type="button"
          onClick={onRegenerateDirection}
          disabled={
            disabled || isDirecting || isUploading || images.length === 0
          }
          className="w-full min-h-[44px] rounded-xl border border-[#f4c430]/25 bg-[#f4c430]/10 py-2.5 text-xs font-bold uppercase tracking-wider text-[#f4c430] transition hover:bg-[#f4c430]/20 disabled:opacity-40"
        >
          {isDirecting ? "Directing visuals…" : "Regenerate visual direction"}
        </button>
      </div>
    </aside>
  );
}

export default memo(CreatorInputPanel);
