"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Camera,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  FileText,
  FileUp,
  ImageIcon,
  LayoutDashboard,
  Loader2,
  Package,
  Store,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useProcurement } from "@/components/os/procurement/ProcurementProvider";
import {
  formatInr,
  PageHeader,
  StatusBadge,
} from "@/components/os/procurement/ProcurementUi";
import type { OcrBillResult } from "@/lib/os/procurement/types";

const UPLOAD_BUTTON_CLASS =
  "flex h-auto min-h-[140px] w-full flex-col items-center justify-center gap-3 rounded-xl border-2 border-[#1B3A2D] bg-white px-4 py-6 text-[#1B3A2D] transition-colors hover:bg-[#1B3A2D] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A84C] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FDF6EC] disabled:opacity-50 [&_svg]:size-10";

const PRIMARY_BUTTON_CLASS =
  "min-h-12 w-full rounded-xl border border-[#1B3A2D] bg-[#1B3A2D] text-base font-semibold text-white hover:bg-[#153024] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A84C] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FDF6EC] disabled:opacity-50";

const WORKFLOW_STEPS = [
  {
    title: "Vendor",
    description: "Match or create supplier",
    icon: Store,
  },
  {
    title: "Purchase Bill",
    description: "OCR invoice + line items",
    icon: FileText,
  },
  {
    title: "Inventory",
    description: "Auto-create stock items",
    icon: Package,
  },
  {
    title: "GRN",
    description: "Pending qty verification",
    icon: ClipboardCheck,
  },
  {
    title: "Dashboard",
    description: "Ledger + recovery updates",
    icon: LayoutDashboard,
  },
] as const;

export default function BillUploadView() {
  const router = useRouter();
  const { db, processAutomatedUpload } = useProcurement();
  const [loading, setLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastSummary, setLastSummary] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const pdfRef = useRef<HTMLInputElement>(null);

  const recentUploads = useMemo(
    () =>
      [...db.purchaseBills]
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .slice(0, 5),
    [db.purchaseBills]
  );

  function clearSelection() {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    if (cameraRef.current) cameraRef.current.value = "";
    if (galleryRef.current) galleryRef.current.value = "";
    if (pdfRef.current) pdfRef.current.value = "";
  }

  function handleFilePick(file: File | undefined) {
    if (!file) return;
    clearSelection();
    setSelectedFile(file);
    setError(null);
    setLastSummary(null);
    if (file.type.startsWith("image/")) {
      setPreviewUrl(URL.createObjectURL(file));
    }
  }

  async function processFile(file: File) {
    setLoading(true);
    setLastSummary(null);
    setError(null);
    setLoadingStage("Reading invoice…");
    try {
      const isImage = file.type.startsWith("image/");
      const isPdf =
        file.type === "application/pdf" ||
        file.name.toLowerCase().endsWith(".pdf");

      const form = new FormData();
      form.append("file", file);

      setLoadingStage(
        isPdf ? "Extracting bill data from PDF (5–15s)…" : "Extracting bill data…"
      );

      const res = await fetch("/api/os/procurement/ocr", { method: "POST", body: form });

      const data = (await res.json()) as {
        result?: OcrBillResult;
        source?: string;
        warning?: string;
        error?: string;
        document?: import("@/lib/os/procurement/types").StoredDocumentRef;
        ocrJsonUrl?: string | null;
        pageCount?: number;
      };

      if (!res.ok || !data.result) {
        throw new Error(data.error ?? "OCR failed — could not read this file");
      }

      if (data.source === "mock" && data.warning) {
        setError(data.warning);
      }

      setLoadingStage("Creating bill, vendor, and GRN…");

      const { bill, summary } = processAutomatedUpload(
        data.result,
        data.document ?? null,
        data.ocrJsonUrl ?? null
      );

      const sourceLabel =
        data.source === "openai-text"
          ? "PDF text OCR"
          : data.source === "openai-vision-multipage"
            ? `Multi-page PDF OCR (${data.pageCount ?? "?"} pages)`
            : data.source === "openai-vision"
              ? "Vision OCR"
              : "Demo data";

      setLastSummary(
        `${sourceLabel} · Vendor ${summary.vendorAction}: ${summary.vendorName} · ${summary.itemsCreated} new items · GRN pending`
      );

      router.push(
        `/os/procurement/purchase-bills/${bill.id}/review?automated=1`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setLoading(false);
      setLoadingStage(null);
    }
  }

  async function handleProcessClick() {
    if (!selectedFile || loading) return;
    await processFile(selectedFile);
  }

  const fileKind = selectedFile
    ? selectedFile.type.startsWith("image/")
      ? "image"
      : selectedFile.name.toLowerCase().endsWith(".pdf") ||
          selectedFile.type === "application/pdf"
        ? "pdf"
        : "file"
    : null;

  return (
    <div className="mx-auto max-w-4xl space-y-8 pb-28 md:pb-8">
      {/* 1. Header */}
      <PageHeader
        eyebrow="AI Procurement Workflow"
        title="Upload Bill"
        description="Snap, pick, or drop a vendor invoice. One tap starts vendor match, bill creation, inventory, GRN, and dashboard updates."
      />

      {/* 2. Upload Methods */}
      <section aria-labelledby="upload-methods-heading">
        <h3
          id="upload-methods-heading"
          className="mb-3 text-sm font-semibold uppercase tracking-wider text-[#1B3A2D]"
        >
          Choose upload method
        </h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <button
            type="button"
            className={UPLOAD_BUTTON_CLASS}
            disabled={loading}
            aria-label="Upload bill using camera"
            onClick={() => cameraRef.current?.click()}
          >
            <Camera aria-hidden />
            <span className="text-sm font-semibold">Camera Upload</span>
          </button>
          <button
            type="button"
            className={UPLOAD_BUTTON_CLASS}
            disabled={loading}
            aria-label="Upload bill from gallery"
            onClick={() => galleryRef.current?.click()}
          >
            <ImageIcon aria-hidden />
            <span className="text-sm font-semibold">Gallery Upload</span>
          </button>
          <button
            type="button"
            className={UPLOAD_BUTTON_CLASS}
            disabled={loading}
            aria-label="Upload bill as PDF"
            onClick={() => pdfRef.current?.click()}
          >
            <FileUp aria-hidden />
            <span className="text-sm font-semibold">PDF Upload</span>
          </button>
        </div>

        <input
          ref={cameraRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => handleFilePick(e.target.files?.[0])}
        />
        <input
          ref={galleryRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFilePick(e.target.files?.[0])}
        />
        <input
          ref={pdfRef}
          type="file"
          accept="application/pdf,.pdf"
          className="hidden"
          onChange={(e) => handleFilePick(e.target.files?.[0])}
        />
      </section>

      {/* 3. Upload Preview */}
      <section aria-labelledby="upload-preview-heading">
        <h3
          id="upload-preview-heading"
          className="mb-3 text-sm font-semibold uppercase tracking-wider text-[#1B3A2D]"
        >
          Upload preview
        </h3>
        <Card className="border-2 border-[#1B3A2D]/20 bg-white">
          <CardContent className="p-5">
            {!selectedFile ? (
              <div className="flex min-h-[120px] flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-[#1B3A2D]/30 bg-[#FDF6EC]/60 px-4 py-8 text-center">
                <FileText className="h-8 w-8 text-[#1B3A2D]/50" aria-hidden />
                <p className="text-sm font-medium text-[#1B3A2D]">
                  No file selected yet
                </p>
                <p className="text-xs text-[#1B3A2D]/70">
                  Use camera, gallery, or PDF above to attach your bill.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                <div className="flex h-28 w-full shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[#1B3A2D]/20 bg-[#FDF6EC] sm:w-28">
                  {previewUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={previewUrl}
                      alt="Bill preview"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <FileText className="h-10 w-10 text-[#1B3A2D]" aria-hidden />
                  )}
                </div>
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-[#1B3A2D]">
                        {selectedFile.name}
                      </p>
                      <p className="text-xs text-[#1B3A2D]/70">
                        {(selectedFile.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      className="min-h-10 shrink-0 border-2 border-[#1B3A2D] bg-white text-[#1B3A2D] hover:bg-[#1B3A2D] hover:text-white"
                      disabled={loading}
                      onClick={clearSelection}
                    >
                      <X className="h-4 w-4" />
                      Remove
                    </Button>
                  </div>
                  <Badge className="border-[#C9A84C]/40 bg-[#C9A84C]/15 text-[#1B3A2D]">
                    {fileKind === "pdf"
                      ? "PDF invoice"
                      : fileKind === "image"
                        ? "Photo invoice"
                        : "Document"}
                  </Badge>
                  {loading ? (
                    <div className="flex items-center gap-2 text-sm text-[#1B3A2D]/80">
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                      {loadingStage ?? "Processing…"}
                    </div>
                  ) : null}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      {/* 4. Process CTA — inline on desktop, fixed bar on mobile */}
      <section aria-labelledby="process-cta-heading" className="hidden md:block">
        <h3
          id="process-cta-heading"
          className="mb-3 text-sm font-semibold uppercase tracking-wider text-[#1B3A2D]"
        >
          Process bill
        </h3>
        <Button
          type="button"
          className={PRIMARY_BUTTON_CLASS}
          disabled={!selectedFile || loading}
          onClick={() => void handleProcessClick()}
        >
          {loading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
              Processing…
            </>
          ) : (
            "Upload & Process Bill"
          )}
        </Button>
        {!selectedFile ? (
          <p className="mt-2 text-xs text-[#1B3A2D]/70">
            Select a bill above to enable processing.
          </p>
        ) : null}
      </section>

      <div
        className="fixed inset-x-0 bottom-0 z-40 border-t-2 border-[#1B3A2D]/15 bg-[#FDF6EC] p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-[0_-8px_24px_rgba(27,58,45,0.12)] md:hidden"
        aria-label="Upload actions"
      >
        <Button
          type="button"
          className={PRIMARY_BUTTON_CLASS}
          disabled={!selectedFile || loading}
          onClick={() => void handleProcessClick()}
        >
          {loading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
              Processing…
            </>
          ) : (
            "Upload & Process Bill"
          )}
        </Button>
      </div>

      {error ? (
        <Card className="border-2 border-red-400/50 bg-white">
          <CardContent className="p-4 text-sm text-red-800">{error}</CardContent>
        </Card>
      ) : null}

      {lastSummary ? (
        <Card className="border-2 border-[#1B3A2D]/20 bg-white">
          <CardContent className="flex items-start gap-2 p-4 text-sm text-[#1B3A2D]">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#1B3A2D]" />
            {lastSummary}
          </CardContent>
        </Card>
      ) : null}

      <Separator className="bg-[#1B3A2D]/15" />

      {/* 5. Automation Workflow */}
      <section aria-labelledby="workflow-heading">
        <Card className="border-2 border-[#1B3A2D]/20 bg-white">
          <CardHeader>
            <Badge className="w-fit border-[#C9A84C]/40 bg-[#C9A84C]/15 text-[#1B3A2D]">
              Automated workflow
            </Badge>
            <CardTitle className="text-[#1B3A2D]">
              What happens after you upload
            </CardTitle>
            <CardDescription className="text-[#1B3A2D]/70">
              Five connected steps run automatically — no manual data entry.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="flex gap-2 overflow-x-auto pb-2 os-scroll">
              {WORKFLOW_STEPS.map((step, index) => {
                const Icon = step.icon;
                return (
                  <div key={step.title} className="flex shrink-0 items-center gap-2">
                    <div className="flex w-[132px] flex-col items-center rounded-xl border-2 border-[#1B3A2D] bg-white px-3 py-4 text-center">
                      <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-[#1B3A2D]/10">
                        <Icon className="h-5 w-5 text-[#1B3A2D]" aria-hidden />
                      </div>
                      <p className="text-xs font-bold text-[#1B3A2D]">
                        {step.title}
                      </p>
                      <p className="mt-1 text-[10px] leading-snug text-[#1B3A2D]/70">
                        {step.description}
                      </p>
                    </div>
                    {index < WORKFLOW_STEPS.length - 1 ? (
                      <ChevronRight
                        className="h-5 w-5 shrink-0 text-[#C9A84C]"
                        aria-hidden
                      />
                    ) : null}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </section>

      {/* 6. Recent Uploads */}
      <section aria-labelledby="recent-uploads-heading">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
          <h3
            id="recent-uploads-heading"
            className="text-sm font-semibold uppercase tracking-wider text-[#1B3A2D]"
          >
            Recent uploads
          </h3>
          <Link
            href="/os/procurement/purchase-bills"
            className="text-xs font-semibold text-[#1B3A2D] underline-offset-2 hover:underline"
          >
            View all bills
          </Link>
        </div>
        <Card className="border-2 border-[#1B3A2D]/20 bg-white">
          <CardContent className="p-0">
            {recentUploads.length ? (
              <ul className="divide-y divide-[#1B3A2D]/10">
                {recentUploads.map((bill) => (
                  <li
                    key={bill.id}
                    className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium text-[#1B3A2D]">
                        {bill.invoiceNumber || "Draft invoice"}
                      </p>
                      <p className="text-xs text-[#1B3A2D]/70">
                        {bill.vendorName} · {bill.invoiceDate}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold tabular-nums text-[#1B3A2D]">
                        {formatInr(bill.totalValue)}
                      </span>
                      <StatusBadge status={bill.status} />
                      {bill.status === "draft" ? (
                        <Link
                          href={`/os/procurement/purchase-bills/${bill.id}/review`}
                          className="min-h-10 inline-flex items-center rounded-lg border-2 border-[#1B3A2D] bg-white px-3 text-xs font-semibold text-[#1B3A2D] hover:bg-[#1B3A2D] hover:text-white"
                        >
                          Review
                        </Link>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="px-5 py-8 text-center text-sm text-[#1B3A2D]/70">
                No bills uploaded yet. Your processed invoices will appear here.
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
