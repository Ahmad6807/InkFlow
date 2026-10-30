"use client";

import { FileImage, FileText, Type } from "lucide-react";

import { AccordionSection } from "./accordion";
import { PaperSettings } from "./paper-settings";
import { TypographySettings } from "./typography-settings";

function ExportSettings() {
  return (
    <div className="flex flex-col gap-2 text-[11px] leading-5 text-slate-500 dark:text-slate-400">
      <p>
        Export runs entirely in the browser — nothing is uploaded.{" "}
        <span className="font-medium text-slate-700 dark:text-slate-200">Download PDF</span> renders
        every page with html2canvas and compiles them into one multi-page document;{" "}
        <span className="font-medium text-slate-700 dark:text-slate-200">Download images</span> saves
        one PNG per page.
      </p>
      <p>
        Press <span className="font-medium text-slate-700 dark:text-slate-200">Generate</span> under
        the preview and pick one of the two formats.
      </p>
    </div>
  );
}

export function SettingsPanel() {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto">
        <AccordionSection
          title="Typography"
          description="Font, ink and spacing"
          icon={<Type className="h-4 w-4" />}
          isOpenByDefault
        >
          <TypographySettings />
        </AccordionSection>

        <AccordionSection
          title="Paper Settings"
          description="Type, size, margins and color"
          icon={<FileText className="h-4 w-4" />}
        >
          <PaperSettings />
        </AccordionSection>

        <AccordionSection
          title="Export Settings"
          description="PDF and PNG output"
          icon={<FileImage className="h-4 w-4" />}
        >
          <ExportSettings />
        </AccordionSection>
      </div>
    </div>
  );
}
