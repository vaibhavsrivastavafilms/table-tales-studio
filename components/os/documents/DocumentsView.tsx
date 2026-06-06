"use client";

import { useMemo, useState } from "react";
import { useProcurement } from "@/components/os/procurement/ProcurementProvider";
import BranchFilterBar from "@/components/os/BranchFilterBar";
import { PageHeader } from "@/components/os/procurement/ProcurementUi";
import {
  listVaultDocuments,
  VAULT_FOLDERS,
} from "@/lib/os/documents/vault";
import type { DocumentCategory, VaultDocument } from "@/lib/os/procurement/types";

function isPreviewable(doc: VaultDocument): boolean {
  if (!doc.dataUrl) return false;
  return (
    doc.mimeType?.startsWith("image/") ||
    doc.mimeType === "application/pdf" ||
    doc.dataUrl.startsWith("data:image/") ||
    doc.dataUrl.startsWith("data:application/pdf")
  );
}

export default function DocumentsView() {
  const { db, activeBranchId, syncDocuments, updateDocumentTags } = useProcurement();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<DocumentCategory | "all">("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tagInput, setTagInput] = useState("");

  const docs = useMemo(
    () => listVaultDocuments(db, { branchId: activeBranchId, category, query }),
    [db, activeBranchId, category, query]
  );
  const selected = docs.find((d) => d.id === selectedId) ?? docs[0] ?? null;

  function saveTags() {
    if (!selected) return;
    const tags = tagInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    updateDocumentTags(selected.id, tags.length ? tags : selected.tags);
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        eyebrow="Documents"
        title="Document Vault"
        description="Invoices, credit notes, payroll, MIS, expenses, and branch documents."
      />
      <BranchFilterBar />
      <div className="flex flex-wrap gap-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by filename or tags…"
          className="min-w-[200px] flex-1 rounded-md border border-[var(--os-border)] bg-white/90 px-3 py-2 text-sm"
        />
        <button
          type="button"
          onClick={syncDocuments}
          className="rounded-md bg-[var(--os-accent)] px-3 py-2 text-xs text-white"
        >
          Sync from procurement
        </button>
      </div>
      <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
        <aside className="os-card space-y-1 p-3">
          <p className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-wide text-[var(--os-fg-muted)]">
            Categories
          </p>
          {VAULT_FOLDERS.map(({ category: cat, label }) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={`w-full rounded-md px-3 py-2 text-left text-sm ${
                category === cat
                  ? "bg-[var(--os-primary)] text-white"
                  : "hover:bg-[var(--os-bg-muted)]"
              }`}
            >
              {label}
            </button>
          ))}
        </aside>
        <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
          <section className="os-card p-4">
            <h3 className="text-sm font-semibold">
              {category === "all" ? "All files" : VAULT_FOLDERS.find((f) => f.category === category)?.label}
              <span className="ml-2 text-xs font-normal text-[var(--os-fg-muted)]">({docs.length})</span>
            </h3>
            <ul className="mt-3 max-h-[420px] space-y-2 overflow-y-auto text-sm">
              {docs.map((d) => (
                <li key={d.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedId(d.id);
                      setTagInput(d.tags.join(", "));
                    }}
                    className={`flex w-full items-center justify-between gap-2 rounded-md px-2 py-2 text-left ${
                      selected?.id === d.id ? "bg-[var(--os-bg-muted)]" : "hover:bg-[var(--os-bg-muted)]/60"
                    }`}
                  >
                    <span className="truncate">{d.title}</span>
                    <span className="shrink-0 text-[10px] uppercase text-[var(--os-fg-muted)]">
                      {d.category.replace("_", " ")}
                    </span>
                  </button>
                </li>
              ))}
              {!docs.length ? (
                <li className="py-8 text-center text-xs text-[var(--os-fg-muted)]">No documents found</li>
              ) : null}
            </ul>
          </section>
          <section className="os-card space-y-4 p-4">
            {selected ? (
              <>
                <div>
                  <h3 className="font-semibold">{selected.title}</h3>
                  <p className="mt-1 text-xs text-[var(--os-fg-muted-on-card)]">
                    {selected.folder} · {new Date(selected.createdAt).toLocaleDateString("en-IN")}
                  </p>
                </div>
                {isPreviewable(selected) ? (
                  selected.mimeType === "application/pdf" ||
                  selected.dataUrl?.startsWith("data:application/pdf") ? (
                    <iframe
                      title={selected.title}
                      src={selected.dataUrl ?? undefined}
                      className="h-48 w-full rounded-md border"
                    />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={selected.dataUrl ?? undefined}
                      alt={selected.title}
                      className="max-h-48 w-full rounded-md border object-contain"
                    />
                  )
                ) : (
                  <p className="rounded-md bg-[var(--os-bg-muted)] p-4 text-xs text-[var(--os-fg-muted-on-card)]">
                    Preview not available — download or sync linked records.
                  </p>
                )}
                {selected.dataUrl ? (
                  <a
                    href={selected.dataUrl}
                    download={`${selected.title}.bin`}
                    className="inline-block rounded-md border px-3 py-2 text-xs"
                  >
                    Download
                  </a>
                ) : null}
                <div>
                  <label className="text-xs font-medium">Tags (comma-separated)</label>
                  <input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    className="mt-1 w-full rounded-md border border-[var(--os-border)] px-2 py-1.5 text-sm"
                  />
                  <button
                    type="button"
                    onClick={saveTags}
                    className="mt-2 rounded-md bg-[var(--os-primary)] px-3 py-1.5 text-xs text-white"
                  >
                    Save tags
                  </button>
                </div>
              </>
            ) : (
              <p className="text-sm text-[var(--os-fg-muted-on-card)]">Select a document to preview.</p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
