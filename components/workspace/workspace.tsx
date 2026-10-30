"use client";

import { useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";

import { InkFlowEditor } from "@/components/editor/inkflow-editor";
import { PagePreview } from "@/components/preview/page-preview";
import { SettingsPanel } from "@/components/settings/settings-panel";

const DEFAULT_LEFT_RATIO = 0.5;
const DEFAULT_PREVIEW_RATIO = 0.42;
const MIN_LEFT_RATIO = 0.25;
const MAX_LEFT_RATIO = 0.75;
const MIN_PREVIEW_RATIO = 0.18;
const MAX_PREVIEW_RATIO = 0.8;

function clampRatio(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * Three panes with drag handles: editor | settings, and settings over preview.
 * Double-clicking a handle restores the default split.
 */
export function Workspace() {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const rightPaneRef = useRef<HTMLDivElement | null>(null);

  const [leftRatio, setLeftRatio] = useState<number>(DEFAULT_LEFT_RATIO);
  const [previewRatio, setPreviewRatio] = useState<number>(DEFAULT_PREVIEW_RATIO);

  const startLeftDrag = (event: ReactPointerEvent<HTMLDivElement>): void => {
    event.preventDefault();
    const root = rootRef.current;

    if (!root) {
      return;
    }

    const rect = root.getBoundingClientRect();

    const handleMove = (moveEvent: PointerEvent): void => {
      setLeftRatio(
        clampRatio(
          (moveEvent.clientX - rect.left) / rect.width,
          MIN_LEFT_RATIO,
          MAX_LEFT_RATIO,
        ),
      );
    };

    const stop = (): void => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", stop);
    };

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", stop);
  };

  const startPreviewDrag = (event: ReactPointerEvent<HTMLDivElement>): void => {
    event.preventDefault();
    const pane = rightPaneRef.current;

    if (!pane) {
      return;
    }

    const rect = pane.getBoundingClientRect();

    const handleMove = (moveEvent: PointerEvent): void => {
      setPreviewRatio(
        clampRatio(
          (rect.bottom - moveEvent.clientY) / rect.height,
          MIN_PREVIEW_RATIO,
          MAX_PREVIEW_RATIO,
        ),
      );
    };

    const stop = (): void => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", stop);
    };

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", stop);
  };

  return (
    <div
      ref={rootRef}
      style={
        {
          "--pane-left": `${leftRatio * 100}%`,
          "--pane-preview": `${previewRatio * 100}%`,
        } as CSSProperties
      }
      className="flex min-h-0 flex-1 flex-col lg:flex-row"
    >
      <section className="flex min-h-[60vh] w-full flex-col bg-white lg:min-h-0 lg:w-[var(--pane-left)] lg:shrink-0 dark:bg-slate-900">
        <InkFlowEditor />
      </section>

      <div
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize editor and settings panes"
        onPointerDown={startLeftDrag}
        onDoubleClick={() => setLeftRatio(DEFAULT_LEFT_RATIO)}
        className="hidden w-1.5 shrink-0 cursor-col-resize touch-none bg-slate-200 transition-colors hover:bg-slate-400 lg:block dark:bg-slate-700 dark:hover:bg-slate-500"
      />

      <div
        ref={rightPaneRef}
        className="flex min-h-[60vh] w-full min-w-0 flex-1 flex-col bg-white lg:min-h-0 dark:bg-slate-900"
      >
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <SettingsPanel />
        </div>

        <div
          role="separator"
          aria-orientation="horizontal"
          aria-label="Resize settings and preview areas"
          onPointerDown={startPreviewDrag}
          onDoubleClick={() => setPreviewRatio(DEFAULT_PREVIEW_RATIO)}
          className="hidden h-1.5 shrink-0 cursor-row-resize touch-none bg-slate-200 transition-colors hover:bg-slate-400 lg:block dark:bg-slate-700 dark:hover:bg-slate-500"
        />

        <div className="h-[45vh] min-h-[220px] shrink-0 lg:h-[var(--pane-preview)] lg:min-h-0">
          <PagePreview />
        </div>
      </div>
    </div>
  );
}
