"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useEffect, useSyncExternalStore } from "react";

export type ThemePreference = "light" | "dark" | "system";

/** Persisted outside React so the boot script in the layout can honour it. */
export const THEME_STORAGE_KEY = "inkflow-theme";

const OPTIONS: { value: ThemePreference; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
];

const listeners = new Set<() => void>();

function notifyListeners(): void {
  for (const listener of listeners) {
    listener();
  }
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function readPreference(): ThemePreference {
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    return stored === "light" || stored === "dark" ? stored : "system";
  } catch {
    // Storage can be unavailable (private mode); the system setting still applies.
    return "system";
  }
}

function applyPreference(preference: ThemePreference): void {
  const useDark =
    preference === "dark" ||
    (preference === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", useDark);
}

export function ThemeToggle() {
  // The server render cannot know the stored value, so it assumes "system";
  // useSyncExternalStore swaps in the real preference after hydration.
  const preference = useSyncExternalStore<ThemePreference>(
    subscribe,
    readPreference,
    () => "system",
  );

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handleSystemChange = (): void => {
      if (readPreference() === "system") {
        applyPreference("system");
      }
    };

    media.addEventListener("change", handleSystemChange);
    return () => media.removeEventListener("change", handleSystemChange);
  }, []);

  const select = (next: ThemePreference): void => {
    applyPreference(next);

    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Nothing to persist to; the theme still applies for this session.
    }

    notifyListeners();
  };

  return (
    <div
      role="group"
      aria-label="Theme"
      className="flex items-center gap-0.5 rounded-full border border-slate-200 bg-slate-100 p-0.5 dark:border-slate-700 dark:bg-slate-800"
    >
      {OPTIONS.map((option) => {
        const isActive = option.value === preference;
        const Icon = option.icon;

        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={isActive}
            onClick={() => select(option.value)}
            className={`flex items-center gap-1 rounded-full px-2 py-1 text-[11px] transition-colors ${
              isActive
                ? "bg-white text-slate-900 shadow-sm dark:bg-slate-600 dark:text-white"
                : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
