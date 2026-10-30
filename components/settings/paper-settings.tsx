"use client";

import { useAppStore, type PaperType } from "@/lib/store";

import { ColorField, NumberField, SelectField, SubHeading } from "./inputs";

type PagePresetId = "A4" | "Letter" | "Legal" | "custom";

interface PagePreset {
  id: Exclude<PagePresetId, "custom">;
  label: string;
  width: number;
  height: number;
}

const PAGE_PRESETS: readonly PagePreset[] = [
  { id: "A4", label: "A4 — 210 × 297 mm", width: 210, height: 297 },
  { id: "Letter", label: "Letter — 8.5 × 11 in", width: 215.9, height: 279.4 },
  { id: "Legal", label: "Legal — 8.5 × 14 in", width: 215.9, height: 355.6 },
];

const PRESET_OPTIONS: readonly { value: PagePresetId; label: string }[] = [
  ...PAGE_PRESETS.map((preset) => ({ value: preset.id, label: preset.label })),
  { value: "custom", label: "Custom size" },
];

const PAPER_OPTIONS: readonly { value: PaperType; label: string }[] = [
  { value: "blank", label: "Blank" },
  { value: "lined", label: "Lined" },
  { value: "margin-lined", label: "Margin-lined" },
  { value: "grid", label: "Grid" },
];

const SIZE_TOLERANCE = 0.1;
const MIN_SIZE_MM = 50;
const MAX_SIZE_MM = 1000;
const MAX_MARGIN_MM = 80;

export function PaperSettings() {
  const paperType = useAppStore((state) => state.paperType);
  const pageWidth = useAppStore((state) => state.pageWidth);
  const pageHeight = useAppStore((state) => state.pageHeight);
  const marginTop = useAppStore((state) => state.marginTop);
  const marginBottom = useAppStore((state) => state.marginBottom);
  const marginLeft = useAppStore((state) => state.marginLeft);
  const marginRight = useAppStore((state) => state.marginRight);
  const paperColor = useAppStore((state) => state.paperColor);
  const updatePaper = useAppStore((state) => state.updatePaper);

  // The store only holds millimetres, so the preset is derived from the size.
  const matchedPreset = PAGE_PRESETS.find(
    (preset) =>
      Math.abs(preset.width - pageWidth) < SIZE_TOLERANCE &&
      Math.abs(preset.height - pageHeight) < SIZE_TOLERANCE,
  );
  const activePreset: PagePresetId = matchedPreset?.id ?? "custom";

  const applyPreset = (value: PagePresetId): void => {
    const preset = PAGE_PRESETS.find((candidate) => candidate.id === value);
    if (!preset) {
      return;
    }

    updatePaper("pageWidth", preset.width);
    updatePaper("pageHeight", preset.height);
  };

  return (
    <>
      <SubHeading>Paper</SubHeading>

      <SelectField
        label="Paper type"
        value={paperType}
        options={PAPER_OPTIONS}
        onChange={(value) => updatePaper("paperType", value)}
      />

      <ColorField
        label="Paper color"
        value={paperColor}
        onChange={(value) => updatePaper("paperColor", value)}
      />

      <SubHeading>Page size</SubHeading>

      <SelectField
        label="Preset"
        value={activePreset}
        options={PRESET_OPTIONS}
        onChange={applyPreset}
      />

      <div className="grid grid-cols-2 gap-3">
        <NumberField
          label="Width"
          value={pageWidth}
          min={MIN_SIZE_MM}
          max={MAX_SIZE_MM}
          step={0.1}
          onChange={(value) => updatePaper("pageWidth", value)}
        />
        <NumberField
          label="Height"
          value={pageHeight}
          min={MIN_SIZE_MM}
          max={MAX_SIZE_MM}
          step={0.1}
          onChange={(value) => updatePaper("pageHeight", value)}
        />
      </div>

      <SubHeading>Margins</SubHeading>

      <div className="grid grid-cols-2 gap-3">
        <NumberField
          label="Top"
          value={marginTop}
          min={0}
          max={MAX_MARGIN_MM}
          onChange={(value) => updatePaper("marginTop", value)}
        />
        <NumberField
          label="Bottom"
          value={marginBottom}
          min={0}
          max={MAX_MARGIN_MM}
          onChange={(value) => updatePaper("marginBottom", value)}
        />
        <NumberField
          label="Left"
          value={marginLeft}
          min={0}
          max={MAX_MARGIN_MM}
          onChange={(value) => updatePaper("marginLeft", value)}
        />
        <NumberField
          label="Right"
          value={marginRight}
          min={0}
          max={MAX_MARGIN_MM}
          onChange={(value) => updatePaper("marginRight", value)}
        />
      </div>
    </>
  );
}
