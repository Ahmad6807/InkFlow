"use client";

import { Loader2, PenTool, Upload } from "lucide-react";
import { useState } from "react";
import { useDropzone } from "react-dropzone";

import { getFontStack, GOOGLE_FONTS } from "@/lib/fonts";
import { useAppStore } from "@/lib/store";

import { FontMaker } from "./font-maker";
import { ColorField, SelectField, SliderField, SubHeading } from "./inputs";

type UploadStatus =
  | { kind: "idle" }
  | { kind: "loading"; fileName: string }
  | { kind: "ready"; fileName: string }
  | { kind: "error"; message: string };

/** Module 2 "Custom Font Upload" — .ttf/.otf through the CSS Font Loading API. */
function CustomFontUpload() {
  const loadCustomFont = useAppStore((state) => state.loadCustomFont);
  const [status, setStatus] = useState<UploadStatus>({ kind: "idle" });

  const acceptFile = async (file: File): Promise<void> => {
    setStatus({ kind: "loading", fileName: file.name });

    try {
      await loadCustomFont(file);
      setStatus({ kind: "ready", fileName: file.name });
    } catch (error) {
      setStatus({
        kind: "error",
        message: error instanceof Error ? error.message : "That font could not be loaded.",
      });
    }
  };

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    accept: {
      "font/ttf": [".ttf"],
      "font/otf": [".otf"],
    },
    multiple: false,
    noClick: true,
    noKeyboard: true,
    onDrop: (acceptedFiles: File[]) => {
      const [file] = acceptedFiles;
      if (file) {
        void acceptFile(file);
      }
    },
    onDropRejected: () => {
      setStatus({ kind: "error", message: "Only .ttf and .otf font files are supported." });
    },
  });

  return (
    <div
      {...getRootProps()}
      className={`flex flex-col gap-2 rounded-lg border border-dashed p-3 transition-colors ${
        isDragActive
          ? "border-slate-500 bg-slate-100 dark:border-slate-400 dark:bg-slate-800"
          : "border-slate-300 bg-slate-50 dark:border-slate-600 dark:bg-slate-800/60"
      }`}
    >
      <input {...getInputProps()} />

      <button
        type="button"
        onClick={() => open()}
        className="flex items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
      >
        <Upload className="h-3.5 w-3.5" />
        Upload Custom Font
      </button>

      <p className="text-center text-[11px] text-slate-500 dark:text-slate-400">
        {isDragActive ? "Drop the font file to load it." : "Drag a .ttf or .otf file here."}
      </p>

      {status.kind === "loading" ? (
        <p className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
          <Loader2 className="h-3 w-3 animate-spin" />
          Loading {status.fileName}…
        </p>
      ) : null}

      {status.kind === "ready" ? (
        <p className="text-center text-[11px] text-emerald-700 dark:text-emerald-400">
          {status.fileName} loaded as “CustomUserFont”.
        </p>
      ) : null}

      {status.kind === "error" ? (
        <p className="text-center text-[11px] text-red-600 dark:text-red-400">{status.message}</p>
      ) : null}
    </div>
  );
}

export function TypographySettings() {
  const [isFontMakerOpen, setIsFontMakerOpen] = useState<boolean>(false);
  const selectedFont = useAppStore((state) => state.selectedFont);
  const customFontName = useAppStore((state) => state.customFontName);
  const inkColor = useAppStore((state) => state.inkColor);
  const inkOpacity = useAppStore((state) => state.inkOpacity);
  const fontSize = useAppStore((state) => state.fontSize);
  const letterSpacing = useAppStore((state) => state.letterSpacing);
  const lineHeight = useAppStore((state) => state.lineHeight);
  const realismEnabled = useAppStore((state) => state.realismEnabled);
  const updateTypography = useAppStore((state) => state.updateTypography);

  const fontOptions = [
    ...GOOGLE_FONTS.map((font) => ({ value: font, label: font })),
    ...(customFontName ? [{ value: customFontName, label: "Custom font (uploaded)" }] : []),
  ];

  return (
    <>
      <SubHeading>Handwriting</SubHeading>

      <SelectField
        label="Font"
        value={selectedFont}
        options={fontOptions}
        onChange={(value) => updateTypography("selectedFont", value)}
      />

      <p
        aria-live="polite"
        className="truncate rounded-md bg-slate-50 px-3 py-2 text-base leading-7 text-slate-800 dark:bg-slate-800 dark:text-slate-100"
        style={{ fontFamily: getFontStack(selectedFont) }}
      >
        The quick brown fox jumps over the lazy dog.
      </p>

      <CustomFontUpload />

      <button
        type="button"
        onClick={() => setIsFontMakerOpen(true)}
        className="flex items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
      >
        <PenTool className="h-3.5 w-3.5" />
        Make New Font
      </button>

      {isFontMakerOpen ? <FontMaker onClose={() => setIsFontMakerOpen(false)} /> : null}

      <SubHeading>Ink</SubHeading>

      <ColorField
        label="Ink color"
        value={inkColor}
        onChange={(value) => updateTypography("inkColor", value)}
      />

      <SliderField
        label="Ink opacity"
        value={inkOpacity}
        min={0.6}
        max={1}
        step={0.05}
        format={(value) => `${Math.round(value * 100)}%`}
        onChange={(value) => updateTypography("inkOpacity", value)}
      />

      <SubHeading>Metrics</SubHeading>

      <SliderField
        label="Font size"
        value={fontSize}
        min={10}
        max={48}
        step={1}
        format={(value) => `${value}px`}
        onChange={(value) => updateTypography("fontSize", value)}
      />

      <SliderField
        label="Letter spacing"
        value={Number.parseFloat(letterSpacing)}
        min={-2}
        max={5}
        step={0.5}
        format={(value) => `${value}px`}
        onChange={(value) => updateTypography("letterSpacing", `${value}px`)}
      />

      <SliderField
        label="Line height"
        value={lineHeight}
        min={1.2}
        max={3}
        step={0.1}
        format={(value) => value.toFixed(1)}
        onChange={(value) => updateTypography("lineHeight", value)}
      />

      <label className="flex cursor-pointer items-start gap-2 rounded-md border border-slate-200 p-2.5 dark:border-slate-700">
        <input
          type="checkbox"
          checked={realismEnabled}
          onChange={(event) => updateTypography("realismEnabled", event.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 accent-slate-900 dark:accent-slate-100"
        />
        <span>
          <span className="block text-xs font-medium text-slate-700 dark:text-slate-200">
            Realism mode
          </span>
          <span className="block text-[11px] leading-4 text-slate-500 dark:text-slate-400">
            Tilts and jitters individual characters slightly so the page looks handwritten.
          </span>
        </span>
      </label>
    </>
  );
}
