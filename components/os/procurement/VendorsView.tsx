"use client";

import Link from "next/link";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Mic } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useProcurement } from "@/components/os/procurement/ProcurementProvider";
import VendorProfilePanel from "@/components/os/procurement/VendorProfilePanel";
import { PageHeader } from "@/components/os/procurement/ProcurementUi";
import type { VendorExtractResult } from "@/lib/os/procurement/types";

export default function VendorsView() {
  const searchParams = useSearchParams();
  const selectedVendorId = searchParams.get("vendorId");
  const { db, createVendor } = useProcurement();
  const [voiceText, setVoiceText] = useState(
    "Create vendor Amul Dairy. GST 24AABCA1234F1Z5. Credit period 15 days."
  );
  const [preview, setPreview] = useState<VendorExtractResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeVendorId, setActiveVendorId] = useState<string | null>(
    selectedVendorId
  );

  async function extractVendor() {
    setLoading(true);
    try {
      const res = await fetch("/api/os/procurement/vendor-extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: voiceText }),
      });
      const data = (await res.json()) as { result: VendorExtractResult };
      setPreview(data.result);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        eyebrow="Vendors"
        title="Vendor Directory"
        description="Purchases, ledger, disputes, credit notes, recovery, documents, and analytics per vendor."
      />

      <div className="os-card space-y-3 p-5">
        <div className="flex items-center gap-2 text-sm font-semibold text-[var(--os-fg-on-card)]">
          <Mic className="h-4 w-4 text-[var(--os-accent)]" />
          Voice / text vendor creation
        </div>
        <Input
          value={voiceText}
          onChange={(e) => setVoiceText(e.target.value)}
          className="bg-white/90"
        />
        <div className="flex gap-2">
          <Button onClick={extractVendor} disabled={loading}>
            Extract with AI
          </Button>
          {preview ? (
            <Button
              variant="secondary"
              onClick={() => {
                createVendor(preview);
                setPreview(null);
              }}
            >
              Create Vendor
            </Button>
          ) : null}
        </div>
        {preview ? (
          <pre className="overflow-auto rounded-lg bg-black/5 p-3 text-xs text-[var(--os-fg-on-card)]">
            {JSON.stringify(preview, null, 2)}
          </pre>
        ) : null}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
        <div className="grid gap-4 sm:grid-cols-2">
          {db.vendors.map((vendor) => (
            <Link
              key={vendor.id}
              href={`/os/procurement/vendors/${vendor.id}`}
              className={`os-card block p-4 text-left transition hover:ring-1 hover:ring-[var(--os-accent)] ${
                activeVendorId === vendor.id ? "ring-2 ring-[var(--os-accent)]" : ""
              }`}
            >
              <p className="font-semibold text-[var(--os-fg-on-card)]">{vendor.name}</p>
              <p className="mt-1 text-xs text-[var(--os-fg-muted-on-card)]">
                GST {vendor.gstNumber ?? "—"}
              </p>
              <p className="mt-1 text-xs text-[var(--os-fg-muted-on-card)]">
                {vendor.phone ?? "No phone"} · {vendor.paymentTermsDays} day terms
              </p>
            </Link>
          ))}
        </div>

        {activeVendorId ? (
          <VendorProfilePanel vendorId={activeVendorId} />
        ) : (
          <p className="text-sm text-[var(--os-fg-muted)]">
            Select a vendor to view profile tabs.
          </p>
        )}
      </div>
    </div>
  );
}
