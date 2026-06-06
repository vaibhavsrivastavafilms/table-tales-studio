/**
 * Export render session + mutex — prevents overlapping exports and stale callbacks.
 */

const MAX_LOCK_MS = 5 * 60_000;

let exportLocked = false;
let activeSessionId: string | null = null;
let lockAcquiredAt = 0;

let exportSessionCounter = 0;

export function createRenderSessionId(): string {
  exportSessionCounter += 1;
  return `render-${exportSessionCounter}`;
}

function releaseStaleLockIfNeeded(): void {
  if (!exportLocked || !lockAcquiredAt) return;
  if (Date.now() - lockAcquiredAt > MAX_LOCK_MS) {
    exportLocked = false;
    activeSessionId = null;
    lockAcquiredAt = 0;
  }
}

export function acquireExportLock(): {
  acquired: boolean;
  sessionId: string;
} {
  releaseStaleLockIfNeeded();
  const sessionId = createRenderSessionId();
  if (exportLocked) {
    return { acquired: false, sessionId };
  }
  exportLocked = true;
  activeSessionId = sessionId;
  lockAcquiredAt = Date.now();
  return { acquired: true, sessionId };
}

export function releaseExportLock(sessionId: string): void {
  if (activeSessionId === sessionId) {
    exportLocked = false;
    activeSessionId = null;
    lockAcquiredAt = 0;
  }
}

export function isActiveRenderSession(sessionId: string): boolean {
  releaseStaleLockIfNeeded();
  return activeSessionId === sessionId;
}

export function isExportLocked(): boolean {
  releaseStaleLockIfNeeded();
  return exportLocked;
}
