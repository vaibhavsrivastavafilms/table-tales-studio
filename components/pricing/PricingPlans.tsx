"use client";

import Link from "next/link";
import {
  PRICING_FEATURE_MATRIX,
  PRICING_TIERS,
  type PricingTierId,
} from "@/lib/pricingTiers";

type PricingPlansProps = {
  compact?: boolean;
};

function formatCell(value: string | boolean): string {
  if (typeof value === "boolean") return value ? "✓" : "—";
  return value;
}

export default function PricingPlans({ compact = false }: PricingPlansProps) {
  return (
    <div className={compact ? "space-y-6" : "space-y-10"}>
      <div className="grid gap-4 md:grid-cols-3">
        {PRICING_TIERS.map((tier) => (
          <article
            key={tier.id}
            className={`rounded-3xl p-6 ring-1 ${
              tier.highlighted
                ? "bg-[#0b0f1a] ring-[#f7c600]/40"
                : "bg-[#0b0f1a]/80 ring-white/10"
            }`}
          >
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#f7c600]">
              {tier.name}
            </p>
            <p className="mt-2 text-3xl font-bold text-white">{tier.priceLabel}</p>
            <p className="mt-2 text-sm text-zinc-400">{tier.description}</p>
            <Link
              href={tier.id === "free" ? "/signup" : "/pricing"}
              className="btn-press mt-6 inline-flex min-h-[44px] w-full items-center justify-center rounded-2xl bg-[#f7c600] text-sm font-bold text-black"
            >
              {tier.cta}
            </Link>
          </article>
        ))}
      </div>

      {!compact && (
        <div className="overflow-x-auto rounded-2xl ring-1 ring-white/10">
          <table className="w-full min-w-[520px] text-left text-xs">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-500">
                <th className="p-4 font-semibold">Feature</th>
                {PRICING_TIERS.map((t) => (
                  <th key={t.id} className="p-4 font-semibold capitalize">
                    {t.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PRICING_FEATURE_MATRIX.map((row) => (
                <tr key={row.label} className="border-b border-zinc-900">
                  <td className="p-4 text-zinc-400">{row.label}</td>
                  {(["free", "creator", "studio"] as PricingTierId[]).map(
                    (id) => (
                      <td key={id} className="p-4 text-white">
                        {formatCell(row[id])}
                      </td>
                    )
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
