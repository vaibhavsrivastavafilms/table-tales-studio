import { extractText, getDocumentProxy } from "unpdf";

export type FoodCostSummaryRow = {
  sr: number;
  name: string;
  foodCostRs: number;
};

const CATEGORY_AVERAGE_NAMES = new Set([
  "Soup",
  "Indian Appitizer",
  "GLOBAL APPITIZER",
  "Asian Appitizer",
  "Small Plates",
  "Sandwiches",
  "Pizza",
  "Global Mains",
  "Global Mains (Pasta)",
  "Global Mains (Noodles)",
  "Global Mains (Asian Rice And Curry)",
  "Platters And Parathas",
  "Indian Gravies",
  "Daal",
  "Indian Breads",
  "Rice",
]);

const SKIP_NAME_PATTERN =
  /^(Gm|Oil|Butter|Maida|Grams|Pinch|Touch|Salt|SR\.|Wheat|Coriander|Water|Ghee|Jeera|Cream)/i;

/** Parse the summary table (Sr No · Item Name · Food Cost ₹) from the Food Cost Sheet PDF. */
export async function parseFoodCostSummaryFromPdf(
  buffer: Buffer
): Promise<FoodCostSummaryRow[]> {
  const doc = await getDocumentProxy(new Uint8Array(buffer));
  const { text } = await extractText(doc, { mergePages: false });
  const chunks = Array.isArray(text) ? text : [text];

  const items: FoodCostSummaryRow[] = [];
  for (let ci = 0; ci <= 4 && ci < chunks.length; ci++) {
    for (const line of String(chunks[ci]).split("\n")) {
      const m = line.trim().match(/^(\d+)\s+(.+?)\s+(\d{1,4})$/);
      if (!m) continue;
      const name = m[2].trim();
      if (CATEGORY_AVERAGE_NAMES.has(name)) continue;
      if (SKIP_NAME_PATTERN.test(name)) continue;
      items.push({
        sr: Number(m[1]),
        name,
        foodCostRs: Number(m[3]),
      });
    }
  }

  const seen = new Set<string>();
  return items.filter((row) => {
    const key = `${row.sr}|${row.name.toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/** Extract full text for downstream ingredient parsing (Phase 2). */
export async function extractFoodCostSheetText(buffer: Buffer): Promise<string> {
  const doc = await getDocumentProxy(new Uint8Array(buffer));
  const { text } = await extractText(doc, { mergePages: true });
  return String(text);
}
