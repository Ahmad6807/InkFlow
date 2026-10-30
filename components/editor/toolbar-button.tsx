"use client";

import type { ReactNode } from "react";

export interface ToolbarButtonProps {
  label: string;
  onPress: () => void;
  isActive?: boolean;
  isDisabled?: boolean;
  children: ReactNode;
}

export function ToolbarButton({
  label,
  onPress,
  isActive = false,
  isDisabled = false,
  children,
}: ToolbarButtonProps) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={isActive}
      disabled={isDisabled}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onPress}
      className={`grid h-8 w-8 place-items-center rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 dark:focus-visible:ring-slate-500 disabled:cursor-not-allowed disabled:opacity-40 ${
        isActive
          ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
      }`}
    >
      {children}
    </button>
  );
}

export function ToolbarDivider() {
  return (
    <span aria-hidden className="mx-1 h-5 w-px shrink-0 bg-slate-200 dark:bg-slate-700" />
  );
}
