/**
 * Export pipeline (PRD Phase 4): rasterise each rendered page with html2canvas,
 * then either compile the bitmaps into one multi-page jsPDF document or save
 * one PNG per page.
 *
 * Both libraries are loaded on demand so they never run during server rendering
 * and the initial page load does not pay for them.
 */

export type ExportFormat = "pdf" | "images";

export interface ExportPagesOptions {
  /** The rendered page elements, in reading order. */
  pageNodes: readonly HTMLElement[];
  /** Paper colour used where the page has no background of its own. */
  paperColor: string;
  pageWidthMm: number;
  pageHeightMm: number;
  format: ExportFormat;
  /** Called after each page has been rasterised (1-based). */
  onPageRendered?: (page: number, total: number) => void;
}

/** 2× keeps handwriting crisp at print size without huge files. */
const RENDER_SCALE = 2;
const FILE_BASE_NAME = "inkflow";

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

async function renderPage(node: HTMLElement, paperColor: string): Promise<HTMLCanvasElement> {
  const { default: html2canvas } = await import("html2canvas");

  return html2canvas(node, {
    backgroundColor: paperColor,
    scale: RENDER_SCALE,
    logging: false,
    useCORS: true,
  });
}

function saveDataUrl(url: string, fileName: string): void {
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.rel = "noopener";
  document.body.append(link);
  link.click();
  link.remove();
}

export async function exportPages(options: ExportPagesOptions): Promise<void> {
  const total = options.pageNodes.length;

  if (total === 0) {
    throw new Error("There is nothing to export yet.");
  }

  // The page is measured and rasterised with the handwriting face; wait for it
  // so the first render never falls back to a system font.
  await document.fonts.ready;

  const canvases: HTMLCanvasElement[] = [];

  for (let index = 0; index < total; index += 1) {
    const canvas = await renderPage(options.pageNodes[index], options.paperColor);
    canvases.push(canvas);
    options.onPageRendered?.(index + 1, total);
  }

  if (options.format === "pdf") {
    const { jsPDF } = await import("jspdf");
    const orientation = options.pageWidthMm > options.pageHeightMm ? "landscape" : "portrait";
    const pageFormat: [number, number] = [options.pageWidthMm, options.pageHeightMm];
    const pdf = new jsPDF({ unit: "mm", format: pageFormat, orientation, compress: true });

    canvases.forEach((canvas, index) => {
      if (index > 0) {
        pdf.addPage(pageFormat, orientation);
      }

      pdf.addImage(
        canvas.toDataURL("image/png"),
        "PNG",
        0,
        0,
        options.pageWidthMm,
        options.pageHeightMm,
      );
    });

    pdf.save(`${FILE_BASE_NAME}.pdf`);
    return;
  }

  for (let index = 0; index < canvases.length; index += 1) {
    // A short gap between saves stops the browser collapsing them into one.
    if (index > 0) {
      await wait(150);
    }

    saveDataUrl(canvases[index].toDataURL("image/png"), `${FILE_BASE_NAME}-page-${index + 1}.png`);
  }
}
