import type { DocumentCategory, ProcurementDb, VaultDocument } from "@/lib/os/procurement/types";

export const VAULT_FOLDERS: { category: DocumentCategory | "all"; label: string }[] = [
  { category: "all", label: "All documents" },
  { category: "invoice", label: "Invoices" },
  { category: "credit_note", label: "Credit Notes" },
  { category: "vendor", label: "Vendor Documents" },
  { category: "payroll", label: "Payroll Reports" },
  { category: "attendance", label: "Attendance Reports" },
  { category: "mis", label: "MIS Reports" },
  { category: "expense", label: "Expense Attachments" },
  { category: "contract", label: "Contracts" },
  { category: "branch", label: "Branch Documents" },
];

export function listVaultDocuments(
  db: ProcurementDb,
  opts?: { branchId?: string; category?: DocumentCategory | "all"; query?: string }
) {
  let rows = db.vaultDocuments;
  if (opts?.branchId && opts.branchId !== "all") {
    rows = rows.filter((d) => !d.branchId || d.branchId === opts.branchId);
  }
  if (opts?.category && opts.category !== "all") {
    rows = rows.filter((d) => d.category === opts.category);
  }
  if (opts?.query) {
    const q = opts.query.toLowerCase();
    rows = rows.filter(
      (d) =>
        d.title.toLowerCase().includes(q) ||
        d.tags.some((t) => t.toLowerCase().includes(q)) ||
        d.folder.toLowerCase().includes(q)
    );
  }
  return [...rows].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function groupByFolder(documents: VaultDocument[]) {
  const map = new Map<string, VaultDocument[]>();
  for (const doc of documents) {
    const list = map.get(doc.folder) ?? [];
    list.push(doc);
    map.set(doc.folder, list);
  }
  return [...map.entries()].map(([folder, docs]) => ({ folder, docs }));
}

export function updateVaultDocumentTags(
  db: ProcurementDb,
  documentId: string,
  tags: string[]
): ProcurementDb {
  return {
    ...db,
    vaultDocuments: db.vaultDocuments.map((d) =>
      d.id === documentId ? { ...d, tags: [...new Set(tags.map((t) => t.trim()).filter(Boolean))] } : d
    ),
  };
}

export function syncVaultFromProcurement(db: ProcurementDb): VaultDocument[] {
  const existing = db.vaultDocuments;
  const fromBills = db.purchaseBills
    .filter((b) => b.imageDataUrl || b.pdfDataUrl)
    .map(
      (b): VaultDocument => ({
        id: `vault_bill_${b.id}`,
        branchId: b.branchId,
        category: "invoice",
        folder: "Invoices",
        title: `${b.vendorName} · ${b.invoiceNumber}`,
        tags: ["invoice", b.vendorName],
        dataUrl: b.pdfDataUrl ?? b.imageDataUrl,
        mimeType: b.pdfDataUrl ? "application/pdf" : "image/jpeg",
        entityId: b.id,
        createdAt: b.createdAt,
        createdBy: b.createdBy,
      })
    );

  const fromCredits = db.creditNotes
    .filter((c) => c.imageDataUrl || c.pdfDataUrl)
    .map(
      (c): VaultDocument => ({
        id: `vault_cn_${c.id}`,
        branchId: c.branchId,
        category: "credit_note",
        folder: "Credit Notes",
        title: c.creditNoteNumber,
        tags: ["credit_note"],
        dataUrl: c.pdfDataUrl ?? c.imageDataUrl,
        mimeType: c.pdfDataUrl ? "application/pdf" : "image/jpeg",
        entityId: c.id,
        createdAt: c.createdAt,
        createdBy: c.createdBy,
      })
    );

  const fromExpenses = db.operatingExpenses
    .filter((e) => e.attachmentUrl)
    .map(
      (e): VaultDocument => ({
        id: `vault_exp_${e.id}`,
        branchId: e.branchId,
        category: "expense",
        folder: "Expenses",
        title: e.description,
        tags: ["expense", e.category],
        dataUrl: e.attachmentUrl,
        mimeType: "image/jpeg",
        entityId: e.id,
        createdAt: e.createdAt,
        createdBy: e.createdBy,
      })
    );

  const fromPayroll = db.payrollRuns
    .filter((r) => r.status === "approved" || r.status === "paid")
    .map(
      (r): VaultDocument => ({
        id: `vault_pay_${r.id}`,
        branchId: r.branchId,
        category: "payroll",
        folder: "Payroll Reports",
        title: `Payroll ${r.month} · ${r.outlet}`,
        tags: ["payroll", r.month],
        dataUrl: null,
        mimeType: "application/pdf",
        entityId: r.id,
        createdAt: r.createdAt,
        createdBy: r.createdBy,
      })
    );

  const fromMis = db.dailyMisReports.map(
    (r): VaultDocument => ({
      id: `vault_mis_${r.id}`,
      branchId: r.branchId === "all" ? null : r.branchId,
      category: "mis",
      folder: "MIS Reports",
      title: `Daily MIS · ${r.date}`,
      tags: ["mis", "daily", r.date],
      dataUrl: null,
      mimeType: "text/plain",
      entityId: r.id,
      createdAt: r.generatedAt ?? r.createdAt,
      createdBy: "system",
    })
  );

  const merged = new Map(existing.map((d) => [d.id, d]));
  for (const doc of [...fromBills, ...fromCredits, ...fromExpenses, ...fromPayroll, ...fromMis]) {
    if (!merged.has(doc.id)) merged.set(doc.id, doc);
  }
  return [...merged.values()];
}
