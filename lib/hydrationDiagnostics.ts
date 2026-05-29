/** Browser extensions that commonly mutate `<html>` / `<body>` before React hydrates. */
export const HYDRATION_EXTENSION_PATTERNS = [
  "webcrx",
  "grammarly",
  "gr-ext",
  "gr__",
  "adblock",
  "darkreader",
  "dark-reader",
  "colorzilla",
  "lastpass",
  "1password",
  "dashlane",
  "metamask",
  "honey",
  "ublock",
  "ghostery",
  "privacy-badger",
] as const;

export function buildRootHtmlClass(...parts: string[]): string {
  return parts.filter(Boolean).join(" ");
}

export function normalizeClassList(value: string): string[] {
  return value.trim().split(/\s+/).filter(Boolean).sort();
}

export function classListsMatch(a: string, b: string): boolean {
  const left = normalizeClassList(a);
  const right = normalizeClassList(b);
  if (left.length !== right.length) return false;
  return left.every((token, i) => token === right[i]);
}

export function detectExtensionAttributes(el: Element): string[] {
  const hits = new Set<string>();

  for (const attr of Array.from(el.attributes)) {
    const haystack = `${attr.name} ${attr.value}`.toLowerCase();
    for (const pattern of HYDRATION_EXTENSION_PATTERNS) {
      if (haystack.includes(pattern)) {
        hits.add(`${el.tagName.toLowerCase()}[${attr.name}="${attr.value.slice(0, 48)}"]`);
      }
    }
  }

  return [...hits];
}

export function diffAttributes(
  serverClass: string,
  el: Element
): { name: string; server: string | null; client: string | null }[] {
  const diffs: { name: string; server: string | null; client: string | null }[] =
    [];

  const clientAttrs = new Map<string, string>();
  for (const attr of Array.from(el.attributes)) {
    clientAttrs.set(attr.name, attr.value);
  }

  if (el === document.documentElement) {
    const server = serverClass || null;
    const client = clientAttrs.get("class") ?? null;
    if (server !== client) {
      diffs.push({ name: "class", server, client });
    }
    for (const [name, value] of clientAttrs) {
      if (name === "class" || name === "data-root-body-class") continue;
      if (name.startsWith("data-") && name.startsWith("data-root")) continue;
      diffs.push({ name, server: null, client: value });
    }
    return diffs;
  }

  const server = serverClass || null;
  const client = clientAttrs.get("class") ?? null;
  if (server !== client) {
    diffs.push({ name: "class", server, client });
  }

  return diffs;
}

export function logServerRootHtmlClasses(bodyClass: string): void {
  if (process.env.NODE_ENV !== "development") return;
  console.info(
    "[TableTales:hydration] Server render classes (html):",
    "(none — fonts on body)"
  );
  console.info("[TableTales:hydration] Server render classes (body):", bodyClass);
}

export type HydrationClassReport = {
  serverClass: string | null;
  clientClass: string;
  htmlExtensionAttributes: string[];
  bodyExtensionAttributes: string[];
  htmlAttributeDiffs: ReturnType<typeof diffAttributes>;
  matches: boolean;
  likelyExtensionInjection: boolean;
};

export function inspectClientRootHtml(serverBodyClass: string | null): HydrationClassReport {
  const html = document.documentElement;
  const body = document.body;
  const clientBodyClass = body.className;
  const htmlExtensionAttributes = detectExtensionAttributes(html);
  const bodyExtensionAttributes = detectExtensionAttributes(body);
  const htmlAttributeDiffs = diffAttributes("", html);
  const extensionAttributes = [
    ...htmlExtensionAttributes,
    ...bodyExtensionAttributes,
  ];
  const matches = serverBodyClass
    ? classListsMatch(serverBodyClass, clientBodyClass)
    : true;
  const likelyExtensionInjection =
    (htmlExtensionAttributes.length > 0 ||
      htmlAttributeDiffs.some((d) => d.name !== "class")) &&
    (htmlAttributeDiffs.length > 0 || !matches);

  console.info("[TableTales:hydration] Client render classes (html):", html.className || "(none)");
  console.info("[TableTales:hydration] Client render classes (body):", clientBodyClass);
  if (serverBodyClass) {
    console.info("[TableTales:hydration] Server render classes (body):", serverBodyClass);
  }

  if (extensionAttributes.length > 0) {
    console.info(
      "[TableTales:hydration] Browser extension attributes detected — injected outside app code (Grammarly, Dark Reader, ad blockers, etc.):",
      extensionAttributes
    );
  }

  if (htmlAttributeDiffs.length > 0) {
    console.info(
      "[TableTales:hydration] Extra/changed `<html>` attributes (usually extensions):",
      htmlAttributeDiffs
    );
  }

  if (!matches) {
    if (likelyExtensionInjection) {
      console.info(
        "[TableTales:hydration] Mismatch is likely extension injection on `<html>`, not application code. App classes live on `<body>`."
      );
    } else {
      console.warn(
        "[TableTales:hydration] `<body>` class mismatch between server and client",
        { serverClass: serverBodyClass, clientClass: clientBodyClass }
      );
    }
  } else {
    console.info("[TableTales:hydration] Root `<body>` classes match server render.");
  }

  return {
    serverClass: serverBodyClass,
    clientClass: clientBodyClass,
    htmlExtensionAttributes,
    bodyExtensionAttributes,
    htmlAttributeDiffs,
    matches,
    likelyExtensionInjection,
  };
}
