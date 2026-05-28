"use client";

import { memo } from "react";
import { BUILDER_TEMPLATE_OPTIONS } from "@/lib/builderTemplates";
import type { TemplateId } from "@/lib/templates";

type BuilderTopBarProps = {
  templateId: TemplateId;
  onTemplateChange: (id: TemplateId) => void;
  onDownload: () => void;
  downloading?: boolean;
  disabled?: boolean;
};

function BuilderTopBar({
  templateId,
  onTemplateChange,
  onDownload,
  downloading = false,
  disabled = false,
}: BuilderTopBarProps) {
  return (
    <header className="builder-topbar flex shrink-0 items-center justify-between gap-3 border-b border-white/[0.08] px-4 py-3 md:px-6">
      <div className="min-w-0">
        <p className="text-sm font-bold tracking-tight text-white">
          Table Tales Studio
        </p>
      </div>

      <label className="hidden min-w-0 flex-1 max-w-xs sm:block">
        <span className="sr-only">Template</span>
        <select
          value={templateId}
          disabled={disabled}
          onChange={(e) => onTemplateChange(e.target.value as TemplateId)}
          className="w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-xs font-medium text-white"
        >
          {BUILDER_TEMPLATE_OPTIONS.map((t) => (
            <option key={`${t.id}-${t.label}`} value={t.id}>
              {t.label}
            </option>
          ))}
        </select>
      </label>

      <button
        type="button"
        onClick={onDownload}
        disabled={disabled || downloading}
        className="builder-cta shrink-0 rounded-lg px-4 py-2 text-xs font-bold uppercase tracking-wider text-black disabled:opacity-50"
      >
        {downloading ? "Exporting…" : "Export"}
      </button>
    </header>
  );
}

export default memo(BuilderTopBar);
