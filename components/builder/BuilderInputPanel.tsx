"use client";

import { memo, useCallback, useRef, useState } from "react";
import StyleReferenceCard from "@/components/StyleReferenceCard";
import { BUILDER_TEMPLATE_OPTIONS } from "@/lib/builderTemplates";
import { BUILDER_TONES, type BuilderToneId } from "@/lib/builderTone";
import type { TemplateId } from "@/lib/templates";
import type { StyleReference } from "@/lib/styleReference";
import type { StyleVisionResult } from "@/lib/styleVision";

type BuilderInputPanelProps = {
  templateId: TemplateId;
  onTemplateChange: (id: TemplateId) => void;
  images: string[];
  onImagesSelected: (files: File[]) => void;
  onReorderImage?: (fromIndex: number, toIndex: number) => void;
  onStyleReferenceSelected?: (file: File) => void;
  onStyleReferenceClear?: () => void;
  styleReferencePreview?: string | null;
  styleReference?: StyleReference | null;
  styleVision?: StyleVisionResult | null;
  isAnalyzingStyle?: boolean;
  aiTextEnabled: boolean;
  onAiTextEnabledChange: (v: boolean) => void;
  tone: BuilderToneId;
  onToneChange: (tone: BuilderToneId) => void;
  onGenerate: () => void;
  isGenerating: boolean;
  isUploading: boolean;
  disabled?: boolean;
};

function BuilderInputPanel({
  templateId,
  onTemplateChange,
  images,
  onImagesSelected,
  onReorderImage,
  onStyleReferenceSelected,
  onStyleReferenceClear,
  styleReferencePreview,
  styleReference,
  styleVision,
  isAnalyzingStyle,
  aiTextEnabled,
  onAiTextEnabledChange,
  tone,
  onToneChange,
  onGenerate,
  isGenerating,
  isUploading,
  disabled,
}: BuilderInputPanelProps) {
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const refRef = useRef<HTMLInputElement>(null);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      if (disabled || isUploading) return;
      const files = Array.from(e.dataTransfer.files).filter((f) =>
        f.type.startsWith("image/")
      );
      if (files.length) onImagesSelected(files);
    },
    [disabled, isUploading, onImagesSelected]
  );

  return (
    <aside className="builder-panel flex h-full flex-col gap-5 overflow-y-auto p-4 md:p-5">
      <section>
        <h2 className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
          Template style
        </h2>
        <select
          value={templateId}
          disabled={disabled}
          onChange={(e) => onTemplateChange(e.target.value as TemplateId)}
          className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white"
        >
          {BUILDER_TEMPLATE_OPTIONS.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label}
            </option>
          ))}
        </select>
      </section>

      <section>
        <h2 className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
          Food photos
        </h2>
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          onClick={() => fileRef.current?.click()}
          className={`mt-2 cursor-pointer rounded-xl border-2 border-dashed px-3 py-6 text-center transition ${
            dragOver
              ? "border-[#f4c430]/50 bg-[#f4c430]/5"
              : "border-white/10 hover:border-white/20"
          }`}
        >
          <input
            ref={fileRef}
            type="file"
            multiple
            accept="image/*"
            className="sr-only"
            disabled={disabled || isUploading}
            onChange={(e) => {
              const files = Array.from(e.target.files || []);
              if (files.length) onImagesSelected(files);
              e.target.value = "";
            }}
          />
          <p className="text-sm font-medium text-zinc-300">Drag & drop food photos</p>
          <p className="mt-1 text-[11px] text-zinc-600">or click to browse · up to 6</p>
        </div>
        {images.length > 0 && (
          <ul className="mt-3 grid grid-cols-3 gap-1.5">
            {images.slice(0, 6).map((src, i) => (
              <li
                key={`${src.slice(0, 16)}-${i}`}
                className="group relative aspect-square overflow-hidden rounded-lg ring-1 ring-white/10"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" className="h-full w-full object-cover" />
                {onReorderImage && images.length > 1 && (
                  <div className="absolute inset-x-0 bottom-0 flex justify-between bg-black/70 p-0.5 opacity-0 transition group-hover:opacity-100">
                    <button
                      type="button"
                      disabled={i === 0 || disabled}
                      onClick={(e) => {
                        e.stopPropagation();
                        onReorderImage(i, i - 1);
                      }}
                      className="px-1 text-[10px] text-zinc-300 hover:text-[#f4c430] disabled:opacity-30"
                      aria-label="Move earlier"
                    >
                      ←
                    </button>
                    <span className="text-[9px] font-bold text-zinc-500">{i + 1}</span>
                    <button
                      type="button"
                      disabled={i >= images.length - 1 || disabled}
                      onClick={(e) => {
                        e.stopPropagation();
                        onReorderImage(i, i + 1);
                      }}
                      className="px-1 text-[10px] text-zinc-300 hover:text-[#f4c430] disabled:opacity-30"
                      aria-label="Move later"
                    >
                      →
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
          Reference style
          <span className="ml-1 font-normal normal-case text-zinc-600">
            (optional)
          </span>
        </h2>
        <p className="mt-1 text-[11px] leading-snug text-zinc-600">
          Pinterest screenshot, doodle carousel, or editorial inspiration
        </p>
        <button
          type="button"
          disabled={disabled || isAnalyzingStyle}
          onClick={() => refRef.current?.click()}
          className="mt-2 w-full rounded-lg border border-white/10 py-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-400 hover:border-[#f4c430]/30 hover:text-[#f4c430]"
        >
          Upload reference
        </button>
        <input
          ref={refRef}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f && onStyleReferenceSelected) onStyleReferenceSelected(f);
            e.target.value = "";
          }}
        />
        <StyleReferenceCard
          previewUrl={styleReferencePreview ?? null}
          style={styleReference ?? null}
          vision={styleVision ?? null}
          loading={isAnalyzingStyle}
          onClear={onStyleReferenceClear}
        />
      </section>

      <section className="rounded-xl border border-white/[0.06] bg-black/30 p-3">
        <label className="flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            checked={aiTextEnabled}
            disabled={disabled}
            onChange={(e) => onAiTextEnabledChange(e.target.checked)}
            className="h-4 w-4 rounded border-zinc-600 accent-[#f4c430]"
          />
          <span className="text-sm text-zinc-300">Generate AI storytelling</span>
        </label>
        {aiTextEnabled && (
          <label className="mt-3 block text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
            Tone
            <select
              value={tone}
              disabled={disabled}
              onChange={(e) => onToneChange(e.target.value as BuilderToneId)}
              className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-2 py-2 text-sm text-white"
            >
              {BUILDER_TONES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>
        )}
      </section>

      <button
        type="button"
        onClick={onGenerate}
        disabled={disabled || isGenerating || isUploading}
        className="builder-cta mt-auto w-full rounded-xl py-3 text-sm font-bold text-black disabled:opacity-50"
      >
        {isGenerating ? "Art-directing…" : "Generate carousel"}
      </button>
    </aside>
  );
}

export default memo(BuilderInputPanel);
