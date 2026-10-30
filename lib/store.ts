"use client";

import { create } from "zustand";

export type PaperType = "blank" | "lined" | "margin-lined" | "grid";

/** The typography slice of the store (PRD §5A). */
export type TypographyValues = {
  selectedFont: string;
  customFontName: string | null;
  inkColor: string;
  inkOpacity: number;
  fontSize: number;
  letterSpacing: string;
  lineHeight: number;
  realismEnabled: boolean;
};

/** The paper slice of the store (PRD §5A). */
export type PaperValues = {
  paperType: PaperType;
  pageWidth: number;
  pageHeight: number;
  marginTop: number;
  marginBottom: number;
  marginLeft: number;
  marginRight: number;
  paperColor: string;
};

export interface AppState extends TypographyValues, PaperValues {
  // Editor
  editorContent: string; // HTML string from TipTap

  // Actions
  setEditorContent: (html: string) => void;
  updateTypography: <K extends keyof TypographyValues>(
    key: K,
    value: TypographyValues[K],
  ) => void;
  updatePaper: <K extends keyof PaperValues>(key: K, value: PaperValues[K]) => void;
  loadCustomFont: (file: File) => Promise<void>;
}

/** The family name required by PRD §5C for uploaded fonts. */
export const CUSTOM_FONT_NAME = "CustomUserFont";

const ACCEPTED_FONT_EXTENSIONS = [".ttf", ".otf"] as const;

export const useAppStore = create<AppState>()((set) => ({
  // Editor
  editorContent: "",

  // Typography
  selectedFont: "Caveat",
  customFontName: null,
  inkColor: "#00008B",
  inkOpacity: 1,
  fontSize: 20,
  letterSpacing: "0px",
  lineHeight: 1.5,
  realismEnabled: false,

  // Paper
  paperType: "blank",
  pageWidth: 210, // A4 width in mm
  pageHeight: 297, // A4 height in mm
  marginTop: 20,
  marginBottom: 20,
  marginLeft: 20,
  marginRight: 20,
  paperColor: "#FDFBF7",

  setEditorContent: (html: string) => set({ editorContent: html }),

  updateTypography: (key, value) =>
    set((state) => ({ ...state, [key]: value }) as AppState),

  updatePaper: (key, value) =>
    set((state) => ({ ...state, [key]: value }) as AppState),

  loadCustomFont: async (file: File) => {
    const lowerName = file.name.toLowerCase();
    const isAccepted = ACCEPTED_FONT_EXTENSIONS.some((ext) => lowerName.endsWith(ext));

    if (!isAccepted) {
      throw new Error("Only .ttf and .otf font files are supported.");
    }

    // Re-uploading a font must replace the previous face with the same family name.
    document.fonts.forEach((face) => {
      if (face.family === CUSTOM_FONT_NAME) {
        document.fonts.delete(face);
      }
    });

    const objectUrl = URL.createObjectURL(file);

    try {
      const fontFace = new FontFace(CUSTOM_FONT_NAME, `url(${objectUrl})`);
      await fontFace.load();
      document.fonts.add(fontFace);
    } finally {
      URL.revokeObjectURL(objectUrl);
    }

    set({ customFontName: CUSTOM_FONT_NAME, selectedFont: CUSTOM_FONT_NAME });
  },
}));
