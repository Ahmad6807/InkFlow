"use client";

import { useState, type ReactNode } from "react";

export interface FieldProps {
  label: string;
  hint?: string;
  children: ReactNode;
}

function Field({ label, hint, children }: FieldProps) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="flex items-baseline justify-between gap-2">
        <span className="text-xs font-medium text-slate-600 dark:text-slate-300">{label}</span>
        {hint ? (
          <span className="font-mono text-[11px] text-slate-400 dark:text-slate-500">{hint}</span>
        ) : null}
      </span>
      {children}
    </label>
  );
}

export interface SliderFieldProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  format: (value: number) => string;
  onChange: (value: number) => void;
}

export function SliderField({
  label,
  value,
  min,
  max,
  step,
  format,
  onChange,
}: SliderFieldProps) {
  return (
    <Field label={label} hint={format(value)}>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-label={label}
        onChange={(event) => onChange(Number(event.target.value))}
        className="w-full cursor-pointer accent-slate-900 dark:accent-slate-100"
      />
    </Field>
  );
}

export interface ColorFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

export function ColorField({ label, value, onChange }: ColorFieldProps) {
  return (
    <Field label={label}>
      <span className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-2 py-1.5 dark:border-slate-700 dark:bg-slate-800">
        <input
          type="color"
          value={value}
          aria-label={label}
          onChange={(event) => onChange(event.target.value)}
          className="h-6 w-8 cursor-pointer rounded border-0 bg-transparent p-0"
        />
        <span className="font-mono text-xs uppercase text-slate-500 dark:text-slate-400">
          {value}
        </span>
      </span>
    </Field>
  );
}

export interface NumberFieldProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
}

/**
 * Numeric input that keeps the raw text while typing and commits a clamped
 * number on blur or Enter, so half-typed values never hit the store.
 */
export function NumberField({ label, value, min, max, step = 1, onChange }: NumberFieldProps) {
  const [draft, setDraft] = useState<string | null>(null);

  const commit = (): void => {
    if (draft === null) {
      return;
    }

    const parsed = Number(draft);
    if (Number.isFinite(parsed)) {
      onChange(Math.min(max, Math.max(min, parsed)));
    }
    setDraft(null);
  };

  return (
    <Field label={label} hint="mm">
      <input
        type="number"
        inputMode="decimal"
        min={min}
        max={max}
        step={step}
        value={draft ?? String(value)}
        aria-label={label}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.currentTarget.blur();
          }
        }}
        className="w-full rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-slate-800 focus:border-slate-400 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-slate-500"
      />
    </Field>
  );
}

export interface SelectOption<T extends string> {
  value: T;
  label: string;
}

export interface SelectFieldProps<T extends string> {
  label: string;
  value: T;
  options: readonly SelectOption<T>[];
  onChange: (value: T) => void;
}

export function SelectField<T extends string>({
  label,
  value,
  options,
  onChange,
}: SelectFieldProps<T>) {
  return (
    <Field label={label}>
      <select
        value={value}
        aria-label={label}
        onChange={(event) => onChange(event.target.value as T)}
        className="w-full rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-slate-800 focus:border-slate-400 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-slate-500"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </Field>
  );
}

export interface SubHeadingProps {
  children: ReactNode;
}

export function SubHeading({ children }: SubHeadingProps) {
  return (
    <h3 className="mt-1 border-t border-slate-100 pt-4 text-[11px] font-semibold uppercase tracking-wide text-slate-400 first:mt-0 first:border-t-0 first:pt-0 dark:border-slate-800 dark:text-slate-500">
      {children}
    </h3>
  );
}
