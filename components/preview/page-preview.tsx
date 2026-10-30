"use client";

import { ChevronDown, Download, FileImage, FileText, Loader2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { exportPages, type ExportFormat } from "@/lib/export";
import { getPageGeometry, getPaperStyle, getTypographyStyle } from "@/lib/page-style";
import { paginateHtml } from "@/lib/pagination";
import { useAppStore } from "@/lib/store";

import { Page } from "./page";

/** Keeps a burst of keystrokes from re-paginating on every character. */
const PAGINATION_DEBOUNCE_MS = 140;

type ExportStatus =
  | { kind: "idle" }
  | { kind: "working"; message: string }
  | { kind: "done"; message: string }
  | { kind: "error"; message: string };

const MENU_OPTIONS: readonly {
  format: ExportFormat;
  label: string;
  hint: string;
  icon: typeof FileText;
}[] = [
  { format: "pdf", label: "Download PDF", hint: "One multi-page document", icon: FileText },
  { format: "images", label: "Download images", hint: "One PNG per page", icon: FileImage },
];

function hasVisibleContent(pages: readonly string[]): boolean {
  return pages.some(
    (html) => /<img/i.test(html) || html.replace(/<[^>]*>/g, "").trim().length > 0,
  );
}

export function PagePreview() {
  const editorContent = useAppStore((state) => state.editorContent);
  const selectedFont = useAppStore((state) => state.selectedFont);
  const fontSize = useAppStore((state) => state.fontSize);
  const letterSpacing = useAppStore((state) => state.letterSpacing);
  const lineHeight = useAppStore((state) => state.lineHeight);
  const inkColor = useAppStore((state) => state.inkColor);
  const inkOpacity = useAppStore((state) => state.inkOpacity);
  const paperType = useAppStore((state) => state.paperType);
  const pageWidth = useAppStore((state) => state.pageWidth);
  const pageHeight = useAppStore((state) => state.pageHeight);
  const marginTop = useAppStore((state) => state.marginTop);
  const marginBottom = useAppStore((state) => state.marginBottom);
  const marginLeft = useAppStore((state) => state.marginLeft);
  const marginRight = useAppStore((state) => state.marginRight);
  const paperColor = useAppStore((state) => state.paperColor);

  const pagesRef = useRef<HTMLDivElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [exportStatus, setExportStatus] = useState<ExportStatus>({ kind: "idle" });

  const geometry = useMemo(
    () =>
      getPageGeometry({
        pageWidth,
        pageHeight,
        marginTop,
        marginBottom,
        marginLeft,
        marginRight,
      }),
    [pageWidth, pageHeight, marginTop, marginBottom, marginLeft, marginRight],
  );

  const typographyStyle = useMemo(
    () => getTypographyStyle({ selectedFont, fontSize, letterSpacing, lineHeight }),
    [selectedFont, fontSize, letterSpacing, lineHeight],
  );

  const paperStyle = useMemo(
    () => getPaperStyle({ paperType, geometry, lineHeightPx: fontSize * lineHeight }),
    [paperType, geometry, fontSize, lineHeight],
  );

  const [pages, setPages] = useState<string[]>([""]);

  useEffect(() => {
    let cancelled = false;

    const timer = window.setTimeout(() => {
      void (async () => {
        // Measure only once the handwriting font has real metrics.
        await document.fonts.ready;
        if (cancelled) {
          return;
        }

        const nextPages = paginateHtml({
          html: editorContent,
          contentWidth: geometry.contentWidthPx,
          contentHeight: geometry.contentHeightPx,
          style: typographyStyle,
        });

        if (!cancelled) {
          setPages(nextPages);
        }
      })();
    }, PAGINATION_DEBOUNCE_MS);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [editorContent, geometry.contentWidthPx, geometry.contentHeightPx, typographyStyle]);

  useEffect(() => {
    if (!isMenuOpen) {
      return;
    }

    const handlePointerDown = (event: PointerEvent): void => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMenuOpen]);

  const isExporting = exportStatus.kind === "working";
  const canExport = hasVisibleContent(pages) && !isExporting;

  const runExport = async (format: ExportFormat): Promise<void> => {
    setIsMenuOpen(false);

    const root = pagesRef.current;
    const nodes = root
      ? Array.from(root.querySelectorAll<HTMLElement>("[data-inkflow-page]"))
      : [];

    if (nodes.length === 0) {
      setExportStatus({ kind: "error", message: "There is nothing to export yet." });
      return;
    }

    setExportStatus({
      kind: "working",
      message: format === "pdf" ? "Rendering PDF…" : "Rendering images…",
    });

    try {
      await exportPages({
        pageNodes: nodes,
        paperColor,
        pageWidthMm: pageWidth,
        pageHeightMm: pageHeight,
        format,
        onPageRendered: (page, total) => {
          setExportStatus({ kind: "working", message: `Rendering page ${page} of ${total}…` });
        },
      });

      setExportStatus({
        kind: "done",
        message:
          format === "pdf"
            ? "PDF downloaded."
            : `${nodes.length} image${nodes.length === 1 ? "" : "s"} downloaded.`,
      });
    } catch (error) {
      setExportStatus({
        kind: "error",
        message: error instanceof Error ? error.message : "The export failed. Try again.",
      });
    }
  };

  const statusText =
    exportStatus.kind === "idle" ? "Export every page as PDF or PNG." : exportStatus.message;

  const statusClassName =
    exportStatus.kind === "error"
      ? "text-red-600 dark:text-red-400"
      : exportStatus.kind === "done"
        ? "text-emerald-700 dark:text-emerald-400"
        : "text-slate-500 dark:text-slate-400";

  return (
    <div className="flex h-full min-h-0 flex-col border-t border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-950">
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-slate-200 px-4 py-2 dark:border-slate-700">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Live preview
        </span>
        <span className="text-[11px] text-slate-400 dark:text-slate-500">
          {pages.length} {pages.length === 1 ? "page" : "pages"} ·{" "}
          {Number(pageWidth.toFixed(1))} × {Number(pageHeight.toFixed(1))} mm
        </span>
      </div>

      <div ref={pagesRef} className="min-h-0 flex-1 overflow-auto p-4">
        <div className="flex w-max min-w-full flex-col items-center gap-4">
          {pages.map((pageHtml, index) => (
            <Page
              key={index}
              html={pageHtml}
              geometry={geometry}
              typographyStyle={typographyStyle}
              paperStyle={paperStyle}
              paperColor={paperColor}
              inkColor={inkColor}
              inkOpacity={inkOpacity}
            />
          ))}
        </div>
      </div>

      <div className="flex shrink-0 items-center justify-between gap-3 border-t border-slate-200 px-4 py-2 dark:border-slate-700">
        <span aria-live="polite" className={`min-w-0 truncate text-[11px] ${statusClassName}`}>
          {statusText}
        </span>

        <div ref={menuRef} className="relative shrink-0">
          <button
            type="button"
            aria-haspopup="menu"
            aria-expanded={isMenuOpen}
            disabled={!canExport}
            title={canExport ? "Generate PDF or images" : "Add some text to export"}
            onClick={() => setIsMenuOpen((open) => !open)}
            className="flex h-8 items-center gap-1.5 rounded-md bg-slate-900 px-3 text-xs font-medium text-white transition-colors hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
          >
            {isExporting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Download className="h-3.5 w-3.5" />
            )}
            Generate
            <ChevronDown
              className={`h-3.5 w-3.5 transition-transform ${isMenuOpen ? "rotate-180" : ""}`}
            />
          </button>

          {isMenuOpen ? (
            <div
              role="menu"
              aria-label="Generate"
              className="absolute bottom-full right-0 z-20 mb-1 w-56 rounded-lg border border-slate-200 bg-white p-1 shadow-lg dark:border-slate-700 dark:bg-slate-800"
            >
              {MENU_OPTIONS.map((option) => {
                const Icon = option.icon;

                return (
                  <button
                    key={option.format}
                    type="button"
                    role="menuitem"
                    onClick={() => void runExport(option.format)}
                    className="flex w-full items-start gap-2 rounded px-2 py-1.5 text-left transition-colors hover:bg-slate-100 dark:hover:bg-slate-700"
                  >
                    <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-500 dark:text-slate-400" />
                    <span>
                      <span className="block text-xs font-medium text-slate-800 dark:text-slate-100">
                        {option.label}
                      </span>
                      <span className="block text-[10px] text-slate-500 dark:text-slate-400">
                        {option.hint}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
