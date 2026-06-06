/** Canonical Table Tales brand assets — single source of truth. */
export const TABLE_TALES_LOGO_PATH = "/brand/table-tales-logo.png";
export const TABLE_TALES_LOGO_ALT = "Table Tales";
export const TABLE_TALES_BRAND_GREEN = "#88B098";

export const TABLE_TALES_LOGO_SIZES = {
  xs: { width: 64, height: 40 },
  sm: { width: 96, height: 60 },
  md: { width: 128, height: 80 },
  lg: { width: 160, height: 100 },
  xl: { width: 200, height: 125 },
} as const;

export type TableTalesLogoSize = keyof typeof TABLE_TALES_LOGO_SIZES;
