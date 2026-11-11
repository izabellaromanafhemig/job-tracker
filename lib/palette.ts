export const PALETTE_STORAGE_KEY = "palette";

/**
 * The site's color scales. `main` is the light-mode main color from
 * app/globals.css (also used as the swatch in the picker); `tint` is a very
 * light shade of it, used for striped rows in exported PDF/XLSX files.
 */
export const PALETTES = [
  { value: "neutral", label: "Neutral", main: "#171717", tint: "#f5f5f5" },
  { value: "blue", label: "Blue", main: "#2563eb", tint: "#eff6ff" },
  { value: "green", label: "Green", main: "#16a34a", tint: "#f0fdf4" },
  { value: "rose", label: "Rose", main: "#e11d48", tint: "#fff1f2" },
  { value: "violet", label: "Violet", main: "#7c3aed", tint: "#f5f3ff" },
  { value: "orange", label: "Orange", main: "#f97316", tint: "#fff7ed" },
] as const;

export type Palette = (typeof PALETTES)[number];

export function findPalette(value: string | null | undefined): Palette {
  return PALETTES.find((p) => p.value === value) ?? PALETTES[0];
}

/** The color scale currently shown on the page (browser only). */
export function currentPaletteValue(): string {
  return document.documentElement.getAttribute("data-palette") ?? "neutral";
}

/**
 * Runs in <head> before the page paints, so the saved color scale is applied
 * without a flash of the default colors.
 */
export const paletteScript = `try{var p=localStorage.getItem("${PALETTE_STORAGE_KEY}");if(p&&p!=="neutral")document.documentElement.setAttribute("data-palette",p)}catch(e){}`;
