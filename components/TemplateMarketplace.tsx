"use client";

import { memo, useState } from "react";
import {
  MARKETPLACE_TEMPLATES,
  resolveTemplateForExport,
} from "@/lib/premiumTemplates";
import type { TemplateId } from "@/lib/templates";

type TemplateMarketplaceProps = {
  value: TemplateId | string;
  onChange: (id: TemplateId) => void;
};

function TemplateMarketplace({ value, onChange }: TemplateMarketplaceProps) {
  const [previewId, setPreviewId] = useState<string | null>(null);
  const preview = MARKETPLACE_TEMPLATES.find((t) => t.id === previewId);

  return (
    <div className="mb-4">
      <button
        type="button"
        onClick={() =>
          setPreviewId(previewId ? null : MARKETPLACE_TEMPLATES[0].id)
        }
        className="mb-2 w-full rounded-xl border border-zinc-800 py-2 text-xs font-semibold text-zinc-400 hover:text-[#f7c600]"
      >
        Cinematic styles · {MARKETPLACE_TEMPLATES.length} looks
      </button>

      {previewId !== null && (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-3">
          <div className="flex flex-wrap gap-2">
            {MARKETPLACE_TEMPLATES.map((t) => {
              const active =
                value === t.id ||
                resolveTemplateForExport(value) ===
                  resolveTemplateForExport(t.id);

              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => onChange(resolveTemplateForExport(t.id))}
                  className={`btn-press rounded-xl border px-3 py-2 text-left text-xs ${
                    active
                      ? "border-[#f7c600] bg-[#f7c600]/10"
                      : "border-zinc-800"
                  }`}
                >
                  <span
                    className="font-bold"
                    style={{ color: t.previewAccent }}
                  >
                    {t.name}
                  </span>
                </button>
              );
            })}
          </div>

          {preview && (
            <p className="mt-3 text-xs text-zinc-500">{preview.tagline}</p>
          )}
        </div>
      )}
    </div>
  );
}

export default memo(TemplateMarketplace);
