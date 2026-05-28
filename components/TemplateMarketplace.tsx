"use client";

import { memo, useState } from "react";
import Link from "next/link";
import {
  canUseTemplate,
  isPremiumTemplate,
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
        Template marketplace · {MARKETPLACE_TEMPLATES.length} styles
      </button>

      {previewId !== null && (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-3">
          <div className="flex flex-wrap gap-2">
            {MARKETPLACE_TEMPLATES.map((t) => {
              const locked = isPremiumTemplate(t.id) && !canUseTemplate(t.id);
              const active = value === t.id || resolveTemplateForExport(value) === resolveTemplateForExport(t.id);

              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    if (locked) {
                      setPreviewId(t.id);
                      return;
                    }
                    onChange(resolveTemplateForExport(t.id));
                  }}
                  className={`btn-press relative rounded-xl border px-3 py-2 text-left text-xs ${
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
                  {t.premium && (
                    <span className="ml-1 text-[9px] uppercase text-zinc-500">
                      Pro
                    </span>
                  )}
                  {locked && (
                    <span className="absolute -right-1 -top-1 text-[10px]">
                      🔒
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {preview && isPremiumTemplate(preview.id) && !canUseTemplate(preview.id) && (
            <div className="mt-3 rounded-xl bg-black/50 p-3">
              <p className="text-xs text-zinc-400">{preview.tagline}</p>
              <p className="mt-2 text-xs text-zinc-500">Preview mode — export uses Cinematic fallback until upgrade.</p>
              <Link
                href="/pricing"
                className="btn-press mt-2 inline-block text-xs font-bold text-[#f7c600]"
              >
                Upgrade to unlock →
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default memo(TemplateMarketplace);
