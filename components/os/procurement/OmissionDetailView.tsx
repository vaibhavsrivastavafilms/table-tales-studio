"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useProcurement } from "@/components/os/procurement/ProcurementProvider";
import {
  formatInr,
  PageHeader,
  StatusBadge,
} from "@/components/os/procurement/ProcurementUi";

type OmissionDetailViewProps = {
  caseId: string;
};

export default function OmissionDetailView({ caseId }: OmissionDetailViewProps) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const { db, addCreditNote, addAdjustment } = useProcurement();
  const omission = db.omissionCases.find((c) => c.id === caseId);

  if (!omission) {
    return <p className="text-sm text-[var(--os-fg-muted)]">Case not found.</p>;
  }

  async function applyCreditFromUpload(file: File) {
    if (!omission?.vendorId) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/os/procurement/ocr", { method: "POST", body: form });
      const data = (await res.json()) as {
        result?: { creditNoteNumber?: string; totalValue?: number; invoiceNumber?: string };
      };
      const reader = new FileReader();
      const imageDataUrl = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      addCreditNote({
        branchId: omission.branchId,
        vendorId: omission.vendorId,
        billId: omission.billId,
        omissionId: omission.id,
        creditNoteNumber:
          data.result?.creditNoteNumber ??
          data.result?.invoiceNumber ??
          `CN-${Date.now().toString().slice(-5)}`,
        creditNoteDate: new Date().toISOString().slice(0, 10),
        amount: data.result?.totalValue ?? omission.expectedCredit,
        taxableAmount: null,
        gstAmount: null,
        items: [
          {
            itemName: omission.itemName,
            quantity: omission.shortQty,
            rate: omission.rate,
            gstPercent: 0,
            amount: omission.expectedCredit,
          },
        ],
        imageDataUrl: file.type.startsWith("image/") ? imageDataUrl : null,
        pdfDataUrl: file.type === "application/pdf" ? imageDataUrl : null,
        document: null,
        ocrJsonUrl: null,
        ocrJson: JSON.stringify(data.result ?? {}),
      });
      router.push("/os/procurement/credit-notes");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        eyebrow="Omission · Credit workflow"
        title={omission.caseNumber}
        description={`${omission.vendorName} · Invoice ${omission.invoiceNumber}`}
      />

      <div className="os-card grid gap-4 p-5 sm:grid-cols-2">
        <Detail label="Vendor" value={omission.vendorName} />
        <Detail label="Invoice" value={omission.invoiceNumber} />
        <Detail label="Item" value={omission.itemName} />
        <Detail label="Bill Qty" value={String(omission.expectedQty)} />
        <Detail label="Received Qty" value={String(omission.receivedQty)} />
        <Detail label="Short Qty" value={String(omission.shortQty)} />
        <Detail label="Rate (locked)" value={formatInr(omission.rate)} />
        <Detail label="Expected Credit" value={formatInr(omission.expectedCredit)} />
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--os-fg-muted-on-card)]">
            Status
          </p>
          <div className="mt-1">
            <StatusBadge
              status={omission.kind === "full_omitted" ? "omitted" : omission.status}
            />
          </div>
        </div>
      </div>

      {omission.status === "pending" ? (
        <div className="flex flex-wrap gap-2">
          <input
            ref={fileRef}
            type="file"
            accept="image/*,application/pdf"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void applyCreditFromUpload(file);
            }}
          />
          <Button disabled={uploading} onClick={() => fileRef.current?.click()}>
            {uploading ? "Processing…" : "Upload Credit Note (OCR)"}
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              if (!omission.vendorId) return;
              addCreditNote({
                branchId: omission.branchId,
                vendorId: omission.vendorId,
                billId: omission.billId,
                omissionId: omission.id,
                creditNoteNumber: `CN-${Date.now().toString().slice(-5)}`,
                creditNoteDate: new Date().toISOString().slice(0, 10),
                amount: omission.expectedCredit,
                taxableAmount: null,
                gstAmount: null,
                items: [
                  {
                    itemName: omission.itemName,
                    quantity: omission.shortQty,
                    rate: omission.rate,
                    gstPercent: 0,
                    amount: omission.expectedCredit,
                  },
                ],
                imageDataUrl: null,
                pdfDataUrl: null,
                document: null,
                ocrJsonUrl: null,
                ocrJson: null,
              });
              router.push("/os/procurement/credit-notes");
            }}
          >
            Apply Expected Credit ({formatInr(omission.expectedCredit)})
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              addAdjustment({
                vendorId: omission.vendorId,
                billId: omission.billId,
                itemId: omission.itemId,
                itemName: omission.itemName,
                quantity: -omission.shortQty,
                amount: omission.expectedCredit,
                reason: "Short Supply",
              });
              router.push("/os/procurement/omissions");
            }}
          >
            Internal Adjustment
          </Button>
        </div>
      ) : null}
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--os-fg-muted-on-card)]">
        {label}
      </p>
      <p className="mt-1 font-medium text-[var(--os-fg-on-card)]">{value}</p>
    </div>
  );
}
