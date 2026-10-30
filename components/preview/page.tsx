import type { CSSProperties } from "react";

import type { PageGeometry } from "@/lib/page-style";

export interface PageProps {
  html: string;
  geometry: PageGeometry;
  typographyStyle: CSSProperties;
  paperStyle: CSSProperties;
  paperColor: string;
  inkColor: string;
  inkOpacity: number;
}

/**
 * One full-size page (PRD §5B): fixed dimensions, `overflow: hidden`, the paper
 * background from Module 3 and the ink typography from Module 2.
 */
export function Page({
  html,
  geometry,
  typographyStyle,
  paperStyle,
  paperColor,
  inkColor,
  inkOpacity,
}: PageProps) {
  return (
    <div
      data-inkflow-page=""
      className="relative shrink-0 overflow-hidden"
      style={{
        width: geometry.widthPx,
        height: geometry.heightPx,
        backgroundColor: paperColor,
        // Explicit colours so nothing inherits a Tailwind oklch/lab value: both
        // html2canvas and the exported file need plain rgb.
        color: inkColor,
        // Inline rgb/rgba rather than Tailwind ring/shadow classes: html2canvas
        // cannot parse the oklch colour functions those classes resolve to.
        boxShadow:
          "0 0 0 1px rgba(148, 163, 184, 0.5), 0 1px 4px rgba(15, 23, 42, 0.16)",
        ...paperStyle,
      }}
    >
      <div
        className="inkflow-content absolute inset-0 overflow-hidden"
        style={{
          paddingTop: geometry.marginTopPx,
          paddingBottom: geometry.marginBottomPx,
          paddingLeft: geometry.marginLeftPx,
          paddingRight: geometry.marginRightPx,
          color: inkColor,
          opacity: inkOpacity,
          ...typographyStyle,
        }}
        // Editor output: TipTap HTML, already reduced to basic formatting on paste.
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}
