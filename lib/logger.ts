import { logMonitoring, type MonitoringLevel } from "@/lib/monitoring";

type LogLevel = "info" | "warn" | "error";

function sanitizeMeta(
  meta?: Record<string, unknown>
): Record<string, string | number | boolean> | undefined {
  if (!meta) return undefined;
  const out: Record<string, string | number | boolean> = {};
  for (const [key, value] of Object.entries(meta)) {
    if (
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean"
    ) {
      out[key] = typeof value === "string" ? value.slice(0, 500) : value;
    }
  }
  return Object.keys(out).length ? out : undefined;
}

function prefix(level: LogLevel): string {
  return `[TableTales:${level}]`;
}

function mirrorToMonitoring(level: LogLevel, message: string, meta?: Record<string, unknown>): void {
  const name = message
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .slice(0, 48);
  const monitoringLevel: MonitoringLevel =
    level === "error" ? "error" : level === "warn" ? "warn" : "info";
  logMonitoring(name || "log_event", monitoringLevel, sanitizeMeta(meta));
}

export const logger = {
  info(message: string, meta?: Record<string, unknown>) {
    if (process.env.NODE_ENV !== "production") {
      console.log(prefix("info"), message, meta ?? "");
    }
    mirrorToMonitoring("info", message, meta);
  },
  warn(message: string, meta?: Record<string, unknown>) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(prefix("warn"), message, meta ?? "");
    } else {
      console.warn(prefix("warn"), message);
    }
    mirrorToMonitoring("warn", message, meta);
  },
  error(message: string, meta?: Record<string, unknown>) {
    console.error(prefix("error"), message);
    mirrorToMonitoring("error", message, meta);
  },
};
