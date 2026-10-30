import { mergeAttributes, Node } from "@tiptap/core";

export type ShapeKind = "rectangle" | "rounded" | "ellipse" | "triangle" | "diamond" | "arrow";

export interface ShapeOption {
  kind: ShapeKind;
  label: string;
}

export const SHAPE_OPTIONS: readonly ShapeOption[] = [
  { kind: "rectangle", label: "Rectangle" },
  { kind: "rounded", label: "Rounded rectangle" },
  { kind: "ellipse", label: "Ellipse" },
  { kind: "triangle", label: "Triangle" },
  { kind: "diamond", label: "Diamond" },
  { kind: "arrow", label: "Arrow" },
];

/** Outlines that CSS borders cannot express, drawn as a 100×100 SVG. */
const SVG_PATHS: Partial<Record<ShapeKind, string>> = {
  triangle: "M50 3L97 97H3Z",
  diamond: "M50 2L98 50L50 98L2 50Z",
  arrow: "M3 35H58V14L97 50L58 86V65H3Z",
};

function shapeArtUrl(path: string): string {
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="none">` +
    `<path d="${path}" fill="none" stroke="#64748b" stroke-width="1.5" vector-effect="non-scaling-stroke"/>` +
    `</svg>`;

  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

/**
 * Inline style for the outlines that need a path. Rectangles and ellipses use
 * plain CSS borders instead, which every renderer including html2canvas
 * rasterises exactly.
 */
export function shapeOutlineStyle(kind: ShapeKind): string | null {
  const path = SVG_PATHS[kind];

  if (!path) {
    return null;
  }

  return `background-image:url("${shapeArtUrl(path)}");background-size:100% 100%;background-repeat:no-repeat;`;
}

/**
 * A block that holds editable text inside a drawn outline (Word's "shape with
 * text"). Kept as a simple div so the page renderer and the exporter see exactly
 * the same markup the editor produced.
 */
export const Shape = Node.create({
  name: "shape",
  group: "block",
  content: "block+",
  defining: true,
  isolating: true,

  addAttributes() {
    return {
      kind: {
        default: "rectangle",
        parseHTML: (element) => element.getAttribute("data-shape") ?? "rectangle",
        // Rendered explicitly as `data-shape` below; no stray attribute.
        renderHTML: () => ({}),
      },
    };
  },

  parseHTML() {
    return [{ tag: "div[data-shape]" }];
  },

  renderHTML({ node, HTMLAttributes }) {
    const kind = (node.attrs.kind as ShapeKind | undefined) ?? "rectangle";
    const outline = shapeOutlineStyle(kind);

    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-shape": kind,
        class: "inkflow-shape",
        ...(outline ? { style: outline } : {}),
      }),
      0,
    ];
  },
});
