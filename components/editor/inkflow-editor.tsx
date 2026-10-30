"use client";

import { Color } from "@tiptap/extension-color";
import { Highlight } from "@tiptap/extension-highlight";
import { Image } from "@tiptap/extension-image";
import { Table, TableCell, TableHeader, TableRow } from "@tiptap/extension-table";
import { TextAlign } from "@tiptap/extension-text-align";
import { FontSize, TextStyle } from "@tiptap/extension-text-style";
import { Underline } from "@tiptap/extension-underline";
import { EditorContent, useEditor, useEditorState } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useSyncExternalStore } from "react";

import { stripComplexPasteHtml } from "@/lib/sanitize-paste";
import { useAppStore } from "@/lib/store";

import { EditorToolbar } from "./editor-toolbar";
import { Shape } from "./shape-node";

function countWords(text: string): number {
  const trimmed = text.trim();
  return trimmed.length === 0 ? 0 : trimmed.split(/\s+/).length;
}

const subscribeToNothing = (): (() => void) => () => {};

/**
 * TipTap generates random instance ids while creating the editor, which Next 16's
 * prerender rejects as an unstable value. Rendering the editor only after hydration
 * keeps it out of the server render entirely.
 */
export function InkFlowEditor() {
  const isHydrated = useSyncExternalStore(
    subscribeToNothing,
    () => true,
    () => false,
  );

  if (!isHydrated) {
    return <div className="flex-1 bg-white dark:bg-slate-900" aria-hidden />;
  }

  return <EditorSurface />;
}

function EditorSurface() {
  const setEditorContent = useAppStore((state) => state.setEditorContent);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        // Registered explicitly below so the editor uses @tiptap/extension-underline.
        underline: false,
        heading: { levels: [1, 2, 3] },
      }),
      Underline,
      TextStyle,
      FontSize,
      Color,
      Image.configure({ allowBase64: true, inline: false }),
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Table.configure({ resizable: false }),
      TableRow,
      TableHeader,
      TableCell,
      Shape,
    ],
    content: useAppStore.getState().editorContent,
    editorProps: {
      attributes: {
        class: "tiptap min-h-[65vh] text-[15px] leading-7 text-slate-800 focus:outline-none dark:text-slate-200",
      },
      transformPastedHTML: stripComplexPasteHtml,
    },
    onUpdate: ({ editor: activeEditor }) => {
      setEditorContent(activeEditor.getHTML());
    },
  });

  const wordCount = useEditorState({
    editor,
    selector: ({ editor: activeEditor }) =>
      activeEditor ? countWords(activeEditor.getText()) : 0,
  });

  return (
    <div className="flex h-full min-h-0 flex-col">
      {editor ? <EditorToolbar editor={editor} /> : null}

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div
          className="mx-auto w-full max-w-3xl px-8 py-6 [&_.tiptap_a]:text-blue-700 [&_.tiptap_a]:dark:text-blue-400 [&_.tiptap_a]:underline [&_.tiptap_blockquote]:my-3 [&_.tiptap_blockquote]:border-l-4 [&_.tiptap_blockquote]:border-slate-300 [&_.tiptap_blockquote]:dark:border-slate-600 [&_.tiptap_blockquote]:pl-4 [&_.tiptap_blockquote]:italic [&_.tiptap_blockquote]:text-slate-600 [&_.tiptap_blockquote]:dark:text-slate-400 [&_.tiptap_h1]:mt-4 [&_.tiptap_h1]:mb-2 [&_.tiptap_h1]:text-2xl [&_.tiptap_h1]:font-semibold [&_.tiptap_h2]:mt-4 [&_.tiptap_h2]:mb-2 [&_.tiptap_h2]:text-xl [&_.tiptap_h2]:font-semibold [&_.tiptap_h3]:mt-3 [&_.tiptap_h3]:mb-2 [&_.tiptap_h3]:text-lg [&_.tiptap_h3]:font-semibold [&_.tiptap_li]:my-0.5 [&_.tiptap_ol]:my-2 [&_.tiptap_ol]:list-decimal [&_.tiptap_ol]:pl-6 [&_.tiptap_p]:my-2 [&_.tiptap_table]:my-3 [&_.tiptap_table]:w-full [&_.tiptap_table]:border-collapse [&_.tiptap_td]:border [&_.tiptap_td]:border-slate-300 [&_.tiptap_td]:dark:border-slate-600 [&_.tiptap_td]:p-2 [&_.tiptap_th]:border [&_.tiptap_th]:border-slate-300 [&_.tiptap_th]:dark:border-slate-600 [&_.tiptap_th]:bg-slate-100 [&_.tiptap_th]:dark:bg-slate-800 [&_.tiptap_th]:p-2 [&_.tiptap_th]:text-left [&_.tiptap_ul]:my-2 [&_.tiptap_ul]:list-disc [&_.tiptap_ul]:pl-6 [&_.selectedCell]:bg-blue-50 [&_.selectedCell]:dark:bg-blue-950 [&_.tiptap_img]:my-3 [&_.tiptap_img]:block [&_.tiptap_img]:h-auto [&_.tiptap_img]:max-w-full [&_.tiptap_img]:rounded-md"
        >
          <EditorContent editor={editor} />
        </div>
      </div>

      <footer className="flex shrink-0 items-center justify-between border-t border-slate-200 bg-white px-4 py-2 text-xs text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
        <span>{wordCount ?? 0} words</span>
        <span className="text-slate-400 dark:text-slate-500">
          Paste keeps bold, italic, underline and lists only
        </span>
      </footer>
    </div>
  );
}
