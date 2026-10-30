import type { CSSProperties } from "react";

import { getFontStack } from "./fonts";
import type { PaperType, PaperValues, TypographyValues } from "./store";

/** PRD §5B: millimetres to CSS pixels. */
export const MM_TO_PX = 3.7795;

export type PageGeometryInput = Pick<
  PaperValues,
  "pageWidth" | "pageHeight" | "marginTop" | "marginBottom" | "marginLeft" | "marginRight"
>;

export interface PageGeometry {
  widthPx: number;
  heightPx: number;
  marginTopPx: number;
  marginBottomPx: number;
  marginLeftPx: number;
  marginRightPx: number;
  contentWidthPx: number;
  contentHeightPx: number;
}

/** Smallest content box we allow, so absurd margin values cannot invert it. */
const MIN_CONTENT_PX = 24;

export function getPageGeometry(paper: PageGeometryInput): PageGeometry {
  const widthPx = paper.pageWidth * MM_TO_PX;
  const heightPx = paper.pageHeight * MM_TO_PX;
  const marginTopPx = paper.marginTop * MM_TO_PX;
  const marginBottomPx = paper.marginBottom * MM_TO_PX;
  const marginLeftPx = paper.marginLeft * MM_TO_PX;
  const marginRightPx = paper.marginRight * MM_TO_PX;

  return {
    widthPx,
    heightPx,
    marginTopPx,
    marginBottomPx,
    marginLeftPx,
    marginRightPx,
    contentWidthPx: Math.max(MIN_CONTENT_PX, widthPx - marginLeftPx - marginRightPx),
    contentHeightPx: Math.max(MIN_CONTENT_PX, heightPx - marginTopPx - marginBottomPx),
  };
}

export type TypographyInput = Pick<
  TypographyValues,
  "selectedFont" | "fontSize" | "letterSpacing" | "lineHeight"
>;

/**
 * Only the properties that change line breaking and line height. Pagination
 * measures with exactly this style so the split points match the rendered page.
 */
export function getTypographyStyle(typography: TypographyInput): CSSProperties {
  return {
    fontFamily: getFontStack(typography.selectedFont),
    fontSize: `${typography.fontSize}px`,
    letterSpacing: typography.letterSpacing,
    lineHeight: String(typography.lineHeight),
  };
}

const RULE_COLOR = "rgba(15, 23, 42, 0.18)";
const GRID_COLOR = "rgba(15, 23, 42, 0.12)";
const MARGIN_RULE_COLOR = "rgba(190, 18, 60, 0.38)";

export interface PaperStyleInput {
  paperType: PaperType;
  geometry: PageGeometry;
  lineHeightPx: number;
}

/**
 * Module 3 paper types, built from repeating gradients drawn inside the content
 * box so rulings stay between the margins and line up with the text lines.
 */
export function getPaperStyle({
  paperType,
  geometry,
  lineHeightPx,
}: PaperStyleInput): CSSProperties {
  if (paperType === "blank") {
    return {};
  }

  const line = Math.max(4, lineHeightPx);
  const contentWidth = geometry.contentWidthPx;
  const contentHeight = geometry.contentHeightPx;

  const horizontalRule = `repeating-linear-gradient(to bottom, transparent 0, transparent ${line - 1}px, ${RULE_COLOR} ${line - 1}px, ${RULE_COLOR} ${line}px)`;
  const verticalRule = `repeating-linear-gradient(to right, transparent 0, transparent ${line - 1}px, ${GRID_COLOR} ${line - 1}px, ${GRID_COLOR} ${line}px)`;
  const marginRule = `linear-gradient(to right, ${MARGIN_RULE_COLOR} 0, ${MARGIN_RULE_COLOR} 1px, transparent 1px)`;

  if (paperType === "grid") {
    return {
      backgroundImage: `${horizontalRule}, ${verticalRule}`,
      backgroundSize: `${contentWidth}px ${contentHeight}px, ${contentWidth}px ${contentHeight}px`,
      backgroundPosition: `${geometry.marginLeftPx}px ${geometry.marginTopPx}px, ${geometry.marginLeftPx}px ${geometry.marginTopPx}px`,
      backgroundRepeat: "no-repeat",
    };
  }

  if (paperType === "margin-lined") {
    return {
      backgroundImage: `${marginRule}, ${horizontalRule}`,
      backgroundSize: `1px ${contentHeight}px, ${contentWidth}px ${contentHeight}px`,
      backgroundPosition: `${Math.max(4, geometry.marginLeftPx - 8)}px ${geometry.marginTopPx}px, ${geometry.marginLeftPx}px ${geometry.marginTopPx}px`,
      backgroundRepeat: "no-repeat",
    };
  }

  return {
    backgroundImage: horizontalRule,
    backgroundSize: `${contentWidth}px ${contentHeight}px`,
    backgroundPosition: `${geometry.marginLeftPx}px ${geometry.marginTopPx}px`,
    backgroundRepeat: "no-repeat",
  };
}
