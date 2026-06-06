#!/usr/bin/env node
/** Generates menu-catalog.ts and SQL migration from embedded menu rows. */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

function slug(name) {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 48);
  return base || "item";
}

function sqlEscape(s) {
  return String(s).replace(/'/g, "''");
}

// [name, menuCategory, menuSubcategory, description, sellingPricePaise, servingSize, isSignature, isSpicy, isJainAvailable, isActive, foodCostTargetPct]
const ROWS = [];

export { ROWS, slug, sqlEscape, root, fs, path };
