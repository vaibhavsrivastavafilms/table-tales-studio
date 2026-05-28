import { isBrowser } from "@/lib/browser";

export type MonitoringLevel = "info" | "warn" | "error";

export type MonitoringEvent = {
  name: string;
  level: MonitoringLevel;
  at: string;
  meta?: Record<string, string | number | boolean>;
};

const MAX_BUFFER = 40;
const buffer: MonitoringEvent[] = [];

const PRODUCTION_QUIET_EVENTS = new Set([
  "monitoring_initialized",
  "log_event",
]);

function pushEvent(event: MonitoringEvent): void {
  buffer.unshift(event);
  if (buffer.length > MAX_BUFFER) buffer.pop();

  const isProd = process.env.NODE_ENV === "production";
  if (isProd && PRODUCTION_QUIET_EVENTS.has(event.name) && event.level === "info") {
    return;
  }

  if (!isProd) {
    const tag = `[tts:${event.level}] ${event.name}`;
    if (event.level === "error") console.error(tag, event.meta);
    else if (event.level === "warn") console.warn(tag, event.meta);
  } else if (event.level === "error") {
    console.error(`[tts:error] ${event.name}`);
  }
}

export function logMonitoring(
  name: string,
  level: MonitoringLevel = "info",
  meta?: Record<string, string | number | boolean>
): void {
  pushEvent({ name, level, at: new Date().toISOString(), meta });
}

export function reportClientError(
  error: unknown,
  context?: Record<string, string>
): void {
  const message = error instanceof Error ? error.message : String(error);
  logMonitoring("client_error", "error", {
    message: message.slice(0, 200),
    ...context,
  });
}

export function initClientMonitoring(): void {
  if (!isBrowser()) return;

  window.addEventListener("error", (e) => {
    reportClientError(e.error ?? e.message, { source: "window.onerror" });
  });

  window.addEventListener("unhandledrejection", (e) => {
    reportClientError(e.reason, { source: "unhandledrejection" });
  });

  logMonitoring("monitoring_initialized", "info", {
    env: process.env.NODE_ENV ?? "unknown",
  });
}

export function getRecentMonitoringEvents(): MonitoringEvent[] {
  return [...buffer];
}

/** Scaffold for future Sentry/Datadog — no external SDK yet. */
export function flushMonitoringBatch(): MonitoringEvent[] {
  return getRecentMonitoringEvents();
}
