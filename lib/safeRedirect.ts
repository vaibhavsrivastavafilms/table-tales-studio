/**
 * Validates post-auth redirect targets to prevent open redirects.
 */
export function getSafeRedirectPath(
  next: string | null | undefined,
  fallback = "/dashboard"
): string {
  if (!next || typeof next !== "string") return fallback;

  const path = next.trim();
  if (!path.startsWith("/")) return fallback;
  if (path.startsWith("//")) return fallback;
  if (path.includes("://") || path.includes("@") || path.includes("\\")) {
    return fallback;
  }
  if (/[\x00-\x1f\x7f]/.test(path)) return fallback;
  if (path.includes("%2f") || path.includes("%5c")) return fallback;

  return path.split("?")[0]?.split("#")[0] ?? fallback;
}
