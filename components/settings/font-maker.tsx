"use client";

import { Undo2, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";

import {
  ASCENDER_Y,
  BASELINE_Y,
  BRUSH_PX,
  buildFontFile,
  CANVAS_SIZE,
  CAP_HEIGHT_Y,
  DESCENDER_Y,
  drawnCharacters,
  GLYPH_CHARACTERS,
  X_HEIGHT_Y,
  type StrokeMap,
  type StrokePoint,
} from "@/lib/font-maker";
import { useAppStore } from "@/lib/store";

export interface FontMakerProps {
  onClose: () => void;
}

const GUIDE_LINES: { y: number; color: string; dashed: boolean }[] = [
  { y: ASCENDER_Y, color: "rgba(148, 163, 184, 0.45)", dashed: true },
  { y: CAP_HEIGHT_Y, color: "rgba(148, 163, 184, 0.45)", dashed: true },
  { y: X_HEIGHT_Y, color: "rgba(59, 130, 246, 0.4)", dashed: true },
  { y: BASELINE_Y, color: "rgba(220, 38, 38, 0.45)", dashed: false },
  { y: DESCENDER_Y, color: "rgba(148, 163, 184, 0.45)", dashed: true },
];

const MIN_POINT_DISTANCE = 2.5;

export function FontMaker({ onClose }: FontMakerProps) {
  const loadCustomFont = useAppStore((state) => state.loadCustomFont);

  const [glyphs, setGlyphs] = useState<StrokeMap>({});
  const [activeCharacter, setActiveCharacter] = useState<string>("a");
  const [error, setError] = useState<string | null>(null);
  const [isBuilding, setIsBuilding] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const activeStroke = useRef<StrokePoint[] | null>(null);

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    const ratio = window.devicePixelRatio || 1;
    const target = Math.round(CANVAS_SIZE * ratio);
    if (canvas.width !== target) {
      canvas.width = target;
      canvas.height = target;
    }

    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    for (const guide of GUIDE_LINES) {
      context.save();
      context.strokeStyle = guide.color;
      context.lineWidth = 1;
      context.setLineDash(guide.dashed ? [4, 4] : []);
      context.beginPath();
      context.moveTo(0, guide.y);
      context.lineTo(CANVAS_SIZE, guide.y);
      context.stroke();
      context.restore();
    }

    const committed = glyphs[activeCharacter] ?? [];
    const pending = activeStroke.current;
    const strokes = pending ? [...committed, pending] : committed;

    context.strokeStyle = "#0f172a";
    context.lineWidth = BRUSH_PX;
    context.lineCap = "round";
    context.lineJoin = "round";

    for (const stroke of strokes) {
      if (stroke.length === 0) {
        continue;
      }

      context.beginPath();
      context.moveTo(stroke[0].x, stroke[0].y);

      if (stroke.length === 1) {
        context.lineTo(stroke[0].x + 0.01, stroke[0].y);
      }

      for (let index = 1; index < stroke.length; index += 1) {
        context.lineTo(stroke[index].x, stroke[index].y);
      }

      context.stroke();
    }
  }, [activeCharacter, glyphs]);

  useEffect(() => {
    redraw();
  }, [redraw]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const pointFromEvent = (event: ReactPointerEvent<HTMLCanvasElement>): StrokePoint => {
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * CANVAS_SIZE,
      y: ((event.clientY - rect.top) / rect.height) * CANVAS_SIZE,
    };
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLCanvasElement>): void => {
    event.preventDefault();

    try {
      // Best effort: capture keeps the stroke going if the pointer leaves the canvas.
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // Pointer capture is unavailable for some pointers; drawing still works.
    }

    activeStroke.current = [pointFromEvent(event)];
    redraw();
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLCanvasElement>): void => {
    const stroke = activeStroke.current;
    if (!stroke) {
      return;
    }

    const point = pointFromEvent(event);
    const last = stroke[stroke.length - 1];

    if (Math.hypot(point.x - last.x, point.y - last.y) < MIN_POINT_DISTANCE) {
      return;
    }

    stroke.push(point);
    redraw();
  };

  const handlePointerUp = (event: ReactPointerEvent<HTMLCanvasElement>): void => {
    const stroke = activeStroke.current;
    activeStroke.current = null;

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    if (!stroke || stroke.length === 0) {
      redraw();
      return;
    }

    setGlyphs((previous) => ({
      ...previous,
      [activeCharacter]: [...(previous[activeCharacter] ?? []), stroke],
    }));
  };

  const undoStroke = (): void => {
    setGlyphs((previous) => {
      const strokes = previous[activeCharacter] ?? [];
      if (strokes.length === 0) {
        return previous;
      }
      return { ...previous, [activeCharacter]: strokes.slice(0, -1) };
    });
  };

  const clearCharacter = (): void => {
    setGlyphs((previous) => ({ ...previous, [activeCharacter]: [] }));
  };

  const createFont = async (): Promise<void> => {
    setError(null);

    if (drawnCharacters(glyphs).length === 0) {
      setError("Draw at least one character before creating the font.");
      return;
    }

    setIsBuilding(true);

    try {
      const buffer = buildFontFile(glyphs);
      const file = new File([buffer], "my-handwriting.ttf", { type: "font/ttf" });
      await loadCustomFont(file);
      onClose();
    } catch {
      setError("That font could not be built. Try drawing with fewer, shorter strokes.");
    } finally {
      setIsBuilding(false);
    }
  };

  const drawn = drawnCharacters(glyphs).length;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Make a new font"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 dark:bg-black/70"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl dark:bg-slate-900">
        <header className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-3 dark:border-slate-700">
          <div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Make a new font</h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Draw each character once, then build it into a font you can use anywhere in InkFlow.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close font maker"
            className="rounded-md p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          <div className="flex flex-col gap-5 sm:flex-row">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                  Drawing <span className="font-mono text-sm text-slate-900 dark:text-slate-100">{activeCharacter}</span>
                </span>
                <span className="text-[11px] text-slate-400 dark:text-slate-500">{drawn} drawn</span>
              </div>

              <canvas
                ref={canvasRef}
                style={{ width: CANVAS_SIZE, height: CANVAS_SIZE, touchAction: "none" }}
                className="cursor-crosshair rounded-lg border border-slate-300 bg-white"
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerLeave={handlePointerUp}
              />

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={undoStroke}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-md border border-slate-300 bg-white px-2 py-1.5 text-[11px] font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                >
                  <Undo2 className="h-3.5 w-3.5" />
                  Undo stroke
                </button>
                <button
                  type="button"
                  onClick={clearCharacter}
                  className="flex-1 rounded-md border border-slate-300 bg-white px-2 py-1.5 text-[11px] font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                >
                  Clear letter
                </button>
              </div>
            </div>

            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <p className="text-[11px] leading-5 text-slate-500 dark:text-slate-400">
                Red line is the baseline, blue line is the x-height, grey lines are cap height and
                descender. Lowercase letters should sit between the blue and red lines.
              </p>

              <div className="grid max-h-72 grid-cols-8 gap-1 overflow-y-auto pr-1 sm:grid-cols-10">
                {GLYPH_CHARACTERS.map((character) => {
                  const isActive = character === activeCharacter;
                  const isDrawn = (glyphs[character] ?? []).length > 0;

                  return (
                    <button
                      key={character}
                      type="button"
                      aria-pressed={isActive}
                      onClick={() => setActiveCharacter(character)}
                      className={`relative grid h-7 place-items-center rounded border text-xs transition-colors ${
                        isActive
                          ? "border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900"
                          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                      }`}
                    >
                      {character}
                      {isDrawn ? (
                        <span
                          aria-hidden
                          className="absolute right-0.5 top-0.5 h-1 w-1 rounded-full bg-emerald-500"
                        />
                      ) : null}
                    </button>
                  );
                })}
              </div>

              <p className="text-[11px] leading-5 text-slate-500 dark:text-slate-400">
                Characters you leave blank fall back to the default handwriting font, so a partial
                alphabet still renders a full page.
              </p>
            </div>
          </div>

          {error ? (
            <p className="mt-3 text-xs text-red-600 dark:text-red-400">{error}</p>
          ) : null}
        </div>

        <footer className="flex items-center justify-end gap-2 border-t border-slate-200 px-5 py-3 dark:border-slate-700">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void createFont()}
            disabled={isBuilding}
            className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
          >
            {isBuilding ? "Building…" : "Create font"}
          </button>
        </footer>
      </div>
    </div>
  );
}
