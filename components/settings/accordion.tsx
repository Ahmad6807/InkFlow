"use client";

import { ChevronDown } from "lucide-react";
import { useState, type ReactNode } from "react";

export interface AccordionSectionProps {
  title: string;
  description: string;
  icon: ReactNode;
  isOpenByDefault?: boolean;
  children: ReactNode;
}

/** One collapsible settings panel (PRD §3 "Accordion-style menus"). */
export function AccordionSection({
  title,
  description,
  icon,
  isOpenByDefault = false,
  children,
}: AccordionSectionProps) {
  const [isOpen, setIsOpen] = useState<boolean>(isOpenByDefault);

  return (
    <section className="border-b border-slate-200 last:border-b-0 dark:border-slate-700">
      <button
        type="button"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
        className="flex w-full items-center gap-2 px-4 py-3 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800"
      >
        <span className="text-slate-500 dark:text-slate-400">{icon}</span>
        <span className="flex-1">
          <span className="block text-sm font-semibold text-slate-800 dark:text-slate-100">
            {title}
          </span>
          <span className="block text-[11px] text-slate-500 dark:text-slate-400">
            {description}
          </span>
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-slate-400 transition-transform dark:text-slate-500 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen ? <div className="flex flex-col gap-4 px-4 pb-5 pt-1">{children}</div> : null}
    </section>
  );
}
