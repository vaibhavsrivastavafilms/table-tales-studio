import type {
  AuditActionType,
  AuditEntityType,
  AuditLogEntry,
  ProcurementDb,
} from "@/lib/os/procurement/types";

function uid(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

export type AuditInput = {
  entityType: AuditEntityType;
  entityId: string;
  action: string;
  actionType: AuditActionType;
  detail: string;
  userId: string;
  userName?: string | null;
  oldValue?: string | null;
  newValue?: string | null;
  reason?: string | null;
  field?: string | null;
  ip?: string | null;
};

export function appendAuditEntry(
  db: ProcurementDb,
  input: AuditInput
): ProcurementDb {
  const row: AuditLogEntry = {
    id: uid("aud"),
    entityType: input.entityType,
    entityId: input.entityId,
    action: input.action,
    actionType: input.actionType,
    detail: input.detail,
    userId: input.userId,
    userName: input.userName ?? input.userId,
    oldValue: input.oldValue ?? null,
    newValue: input.newValue ?? null,
    reason: input.reason ?? null,
    ip: input.ip ?? null,
    field: input.field ?? null,
    createdAt: new Date().toISOString(),
  };
  return { ...db, auditLog: [row, ...db.auditLog] };
}

export function normalizeAuditEntry(
  entry: Partial<AuditLogEntry> & Pick<AuditLogEntry, "entityType" | "entityId" | "action" | "userId">
): AuditLogEntry {
  const legacyType = entry.entityType as string;
  const entityType: AuditEntityType =
    legacyType === "bill" ||
    legacyType === "line" ||
    legacyType === "omission" ||
    legacyType === "credit_note" ||
    legacyType === "revision" ||
    legacyType === "dispute" ||
    legacyType === "recovery" ||
    legacyType === "vendor" ||
    legacyType === "document"
      ? (legacyType as AuditEntityType)
      : "bill";

  return {
    id: entry.id ?? uid("aud"),
    entityType,
    entityId: entry.entityId,
    action: entry.action,
    actionType:
      entry.actionType ??
      (entry.action.includes("created")
        ? "create"
        : entry.action.includes("deleted")
          ? "delete"
          : entry.action.includes("approved")
            ? "approve"
            : entry.action.includes("rejected")
              ? "reject"
              : entry.action.includes("applied") || entry.action.includes("closed")
                ? "apply"
                : "update"),
    detail: entry.detail ?? "",
    userId: entry.userId,
    userName: entry.userName ?? entry.userId,
    oldValue: entry.oldValue ?? null,
    newValue: entry.newValue ?? null,
    reason: entry.reason ?? null,
    ip: entry.ip ?? null,
    field: entry.field ?? null,
    createdAt: entry.createdAt ?? new Date().toISOString(),
  };
}

export function getEntityAuditTrail(
  db: ProcurementDb,
  entityId: string
): AuditLogEntry[] {
  return db.auditLog.filter(
    (a) => a.entityId === entityId || a.detail.includes(entityId)
  );
}
