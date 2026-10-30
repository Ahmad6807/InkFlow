import { CUSTOM_FONT_NAME } from "./store";

/**
 * The five pre-loaded handwriting fonts (PRD Module 2), in dropdown order.
 * Each is loaded by `next/font/google` in `app/layout.tsx`, which exposes it as
 * a CSS variable so the renderer can use the exact file rather than a CDN name.
 */
export const GOOGLE_FONTS = [
  "Caveat",
  "Kalam",
  "Indie Flower",
  "Shadows Into Light",
  "Patrick Hand",
] as const;

export type GoogleFont = (typeof GOOGLE_FONTS)[number];

const FONT_STACKS: Record<GoogleFont, string> = {
  Caveat: "var(--font-caveat), Caveat, cursive",
  Kalam: "var(--font-kalam), Kalam, cursive",
  "Indie Flower": "var(--font-indie-flower), 'Indie Flower', cursive",
  "Shadows Into Light": "var(--font-shadows-into-light), 'Shadows Into Light', cursive",
  "Patrick Hand": "var(--font-patrick-hand), 'Patrick Hand', cursive",
};

/** CSS `font-family` value for a store font name, including uploaded fonts. */
export function getFontStack(fontName: string): string {
  if (fontName === CUSTOM_FONT_NAME) {
    // Uploaded and hand-built fonts can be partial, so missing glyphs fall back
    // to the default handwriting face instead of rendering blank boxes.
    return `'${CUSTOM_FONT_NAME}', var(--font-caveat), cursive`;
  }

  return FONT_STACKS[fontName as GoogleFont] ?? `'${fontName}', cursive`;
}
