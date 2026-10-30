import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Workspace } from "@/components/workspace/workspace";

export default function Home() {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-200 bg-white px-5 py-2.5 dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            InkFlow
          </span>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">Text to handwriting</span>
        </div>
        <ThemeToggle />
      </header>

      <main className="flex min-h-0 flex-1 flex-col overflow-y-auto lg:overflow-hidden">
        <Workspace />
      </main>
    </div>
  );
}
