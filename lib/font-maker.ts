import { Font, Glyph, Path } from "opentype.js";

/**
 * Builds a real TTF from hand-drawn strokes (the "Make New Font" editor).
 *
 * Glyphs are drawn on a 300px square canvas; the conversion treats 240px as the
 * baseline and 4px as one font unit step, giving a 1000 unit em box.
 */

export interface StrokePoint {
  x: number;
  y: number;
}

/** Drawn strokes per character, in canvas pixels. */
export type StrokeMap = Record<string, StrokePoint[][]>;

export const CANVAS_SIZE = 300;
export const BASELINE_Y = 240;
export const X_HEIGHT_Y = 150;
export const CAP_HEIGHT_Y = 80;
export const ASCENDER_Y = 40;
export const DESCENDER_Y = 290;
export const BRUSH_PX = 17;

export const GLYPH_CHARACTERS: string[] = [
  ..."abcdefghijklmnopqrstuvwxyz",
  ..."ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  ..."0123456789",
  ".",
  ",",
  "!",
  "?",
  "'",
  "-",
  ":",
  ";",
];

const UNITS_PER_PX = 4;
const BRUSH_UNITS = 68;
const SPACE_ADVANCE = 240;
const MIN_ADVANCE = 200;
const MAX_ADVANCE = 1200;

const toUnitsX = (x: number): number => x * UNITS_PER_PX;
const toUnitsY = (y: number): number => (BASELINE_Y - y) * UNITS_PER_PX;

/** A stroke segment becomes a filled quad: fonts fill outlines, they cannot stroke. */
function addSegment(path: Path, from: StrokePoint, to: StrokePoint): void {
  const x1 = toUnitsX(from.x);
  const y1 = toUnitsY(from.y);
  const x2 = toUnitsX(to.x);
  const y2 = toUnitsY(to.y);

  const dx = x2 - x1;
  const dy = y2 - y1;
  const length = Math.hypot(dx, dy);

  if (length < 0.01) {
    return;
  }

  const half = BRUSH_UNITS / 2;
  const nx = (-dy / length) * half;
  const ny = (dx / length) * half;

  path.moveTo(x1 + nx, y1 + ny);
  path.lineTo(x2 + nx, y2 + ny);
  path.lineTo(x2 - nx, y2 - ny);
  path.lineTo(x1 - nx, y1 - ny);
  path.close();
}

/** A tap with no movement still needs a mark. */
function addDot(path: Path, point: StrokePoint): void {
  const x = toUnitsX(point.x);
  const y = toUnitsY(point.y);
  const half = BRUSH_UNITS / 2;

  path.moveTo(x - half, y - half);
  path.lineTo(x + half, y - half);
  path.lineTo(x + half, y + half);
  path.lineTo(x - half, y + half);
  path.close();
}

function glyphName(character: string): string {
  const code = character.codePointAt(0) ?? 63;
  return `uni${code.toString(16).toUpperCase().padStart(4, "0")}`;
}

/** Characters that actually have strokes, so an empty glyph never ships. */
export function drawnCharacters(strokes: StrokeMap): string[] {
  return Object.keys(strokes).filter((character) =>
    (strokes[character] ?? []).some((stroke) => stroke.length > 0),
  );
}

export function buildFontFile(strokes: StrokeMap): ArrayBuffer {
  const notdef = new Glyph({
    name: ".notdef",
    unicode: 0,
    advanceWidth: 500,
    path: new Path(),
  });

  const space = new Glyph({
    name: "space",
    unicode: 32,
    advanceWidth: SPACE_ADVANCE,
    path: new Path(),
  });

  const glyphs: Glyph[] = [notdef, space];

  for (const character of drawnCharacters(strokes)) {
    const path = new Path();
    let maxX = 0;

    for (const stroke of strokes[character] ?? []) {
      if (stroke.length === 0) {
        continue;
      }

      if (stroke.length === 1) {
        addDot(path, stroke[0]);
        maxX = Math.max(maxX, stroke[0].x);
        continue;
      }

      for (const point of stroke) {
        maxX = Math.max(maxX, point.x);
      }

      for (let index = 0; index < stroke.length - 1; index += 1) {
        addSegment(path, stroke[index], stroke[index + 1]);
      }
    }

    const advanceWidth = Math.min(
      MAX_ADVANCE,
      Math.max(MIN_ADVANCE, Math.round(toUnitsX(maxX) + 60)),
    );

    glyphs.push(
      new Glyph({
        name: glyphName(character),
        unicode: character.codePointAt(0) ?? 63,
        advanceWidth,
        path,
      }),
    );
  }

  const font = new Font({
    familyName: "CustomUserFont",
    styleName: "Regular",
    unitsPerEm: 1000,
    ascender: 800,
    descender: -200,
    glyphs,
  });

  return font.toArrayBuffer();
}
