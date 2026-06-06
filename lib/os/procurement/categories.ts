import type { InventoryCategory } from "@/lib/os/procurement/types";

export const INVENTORY_CATEGORIES: InventoryCategory[] = [
  "Dairy",
  "Vegetables",
  "Dry Store",
  "Spices",
  "Sauces",
  "Imported Foods",
  "Canned Goods",
  "Packaging",
  "Beverages",
  "Cleaning",
  "Consumables",
  "Kitchen Prep",
];

const KEYWORD_MAP: Record<InventoryCategory, string[]> = {
  Dairy: ["milk", "cheese", "paneer", "butter", "cream", "yogurt", "curd", "amul", "dairy"],
  Vegetables: ["tomato", "onion", "potato", "vegetable", "lettuce", "capsicum", "carrot", "corn"],
  "Dry Store": ["flour", "rice", "sugar", "salt", "dal", "oil", "grain"],
  Spices: ["pepper", "spice", "masala", "cumin", "turmeric", "chilli", "cardamom"],
  Sauces: ["sauce", "puree", "ketchup", "mayo", "paste", "chutney"],
  "Imported Foods": ["olive", "imported", "parmesan", "brie", "truffle"],
  "Canned Goods": ["canned", "tin", "sweet corn", "preserved", "jar"],
  Packaging: ["box", "container", "foil", "wrap", "bag", "packaging", "tissue"],
  Beverages: ["juice", "soda", "coffee", "tea", "beverage", "drink", "water"],
  Cleaning: ["detergent", "cleaner", "sanitizer", "soap", "bleach", "cleaning"],
  Consumables: ["napkin", "glove", "disposable", "consumable", "candle"],
  "Kitchen Prep": ["prep", "marinade", "base", "stock", "broth"],
};

export function suggestCategory(itemName: string): InventoryCategory {
  const lower = itemName.toLowerCase();
  for (const [category, keywords] of Object.entries(KEYWORD_MAP) as [
    InventoryCategory,
    string[],
  ][]) {
    if (keywords.some((kw) => lower.includes(kw))) return category;
  }
  return "Dry Store";
}

export function suggestCategoryWithOverride(
  itemName: string,
  overrides: Record<string, InventoryCategory>
): InventoryCategory {
  const key = itemName.trim().toLowerCase();
  return overrides[key] ?? suggestCategory(itemName);
}
