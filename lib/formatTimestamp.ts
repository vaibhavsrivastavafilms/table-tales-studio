/** Locale-neutral timestamp — identical output on server and client. */
export function formatTimestampNeutral(iso: string | number): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().replace("T", " ").slice(0, 16);
}
