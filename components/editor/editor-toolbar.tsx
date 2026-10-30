"use client";

import type { ChainedCommands, Editor } from "@tiptap/react";
import { useEditorState } from "@tiptap/react";
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  ArrowRight,
  Bold,
  ChevronDown,
  Circle,
  Columns3,
  Columns4,
  Diamond,
  Highlighter,
  ImagePlus,
  Italic,
  List,
  ListOrdered,
  Minus,
  Palette,
  Plus,
  Quote,
  Rows3,
  Shapes,
  Squircle,
  Square,
  Strikethrough,
  Table as TableIcon,
  Trash2,
  Triangle,
  Underline as UnderlineIcon,
} from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type ReactNode,
} from "react";

import { useAppStore } from "@/lib/store";

import { ToolbarButton, ToolbarDivider } from "./toolbar-button";
import { SHAPE_OPTIONS, type ShapeKind } from "./shape-node";

export interface EditorToolbarProps {
  editor: Editor;
}

const MIN_FONT_SIZE = 8;
const MAX_FONT_SIZE = 96;
const FONT_SIZE_STEP = 2;
const MAX_TABLE_ROWS = 20;
const MAX_TABLE_COLUMNS = 12;

const SHAPE_ICONS: Record<ShapeKind, typeof Square> = {
  rectangle: Square,
  rounded: Squircle,
  ellipse: Circle,
  triangle: Triangle,
  diamond: Diamond,
  arrow: ArrowRight,
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * Font size for the current selection. With nothing selected the size applies to
 * the text typed next, which is how marks behave in the editor.
 */
function FontSizeControl({ editor }: { editor: Editor }) {
  const documentFontSize = useAppStore((state) => state.fontSize);
  const [draft, setDraft] = useState<string | null>(null);

  const markedSize = useEditorState({
    editor,
    selector: ({ editor: activeEditor }) => {
      const raw = activeEditor.getAttributes("textStyle").fontSize as string | undefined;
      const parsed = raw ? Math.round(Number.parseFloat(raw)) : Number.NaN;
      return Number.isFinite(parsed) ? parsed : null;
    },
  });

  const current = markedSize ?? documentFontSize;

  const apply = (size: number): void => {
    const next = clamp(Math.round(size), MIN_FONT_SIZE, MAX_FONT_SIZE);
    editor.chain().focus().setFontSize(`${next}px`).run();
  };

  const commit = (): void => {
    if (draft === null) {
      return;
    }

    const parsed = Number.parseFloat(draft);
    if (Number.isFinite(parsed)) {
      apply(parsed);
    }
    setDraft(null);
  };

  return (
    <div
      className="flex h-8 items-center gap-0.5 rounded-md border border-slate-200 pl-1 dark:border-slate-700"
      title="Font size for the selected text"
    >
      <button
        type="button"
        aria-label="Decrease font size"
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => apply(current - FONT_SIZE_STEP)}
        className="grid h-6 w-6 place-items-center rounded text-[11px] font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
      >
        A-
      </button>
      <input
        value={draft ?? String(current)}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            event.currentTarget.blur();
          }
        }}
        inputMode="numeric"
        aria-label="Font size for selection"
        className="h-6 w-8 rounded border-0 bg-transparent text-center text-xs text-slate-700 focus:bg-slate-100 focus:outline-none dark:text-slate-300 dark:focus:bg-slate-800"
      />
      <button
        type="button"
        aria-label="Increase font size"
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => apply(current + FONT_SIZE_STEP)}
        className="grid h-6 w-6 place-items-center rounded text-[11px] font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
      >
        A+
      </button>
    </div>
  );
}

interface TableMenuItemProps {
  label: string;
  onPress: () => void;
  isDisabled?: boolean;
  icon: ReactNode;
}

function TableMenuItem({ label, onPress, isDisabled = false, icon }: TableMenuItemProps) {
  return (
    <button
      type="button"
      onMouseDown={(event) => event.preventDefault()}
      onClick={onPress}
      disabled={isDisabled}
      className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:text-slate-300 dark:hover:bg-slate-700"
    >
      {icon}
      {label}
    </button>
  );
}

export function EditorToolbar({ editor }: EditorToolbarProps) {
  const [isTableMenuOpen, setIsTableMenuOpen] = useState<boolean>(false);
  const [isShapeMenuOpen, setIsShapeMenuOpen] = useState<boolean>(false);
  const [textColor, setTextColor] = useState<string>("#1e293b");
  const [highlightColor, setHighlightColor] = useState<string>("#fef08a");
  const [tableRows, setTableRows] = useState<string>("3");
  const [tableColumns, setTableColumns] = useState<string>("3");
  const tableMenuRef = useRef<HTMLDivElement | null>(null);
  const shapeMenuRef = useRef<HTMLDivElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);

  const state = useEditorState({
    editor,
    selector: ({ editor: activeEditor }) => ({
      bold: activeEditor.isActive("bold"),
      italic: activeEditor.isActive("italic"),
      underline: activeEditor.isActive("underline"),
      strike: activeEditor.isActive("strike"),
      bulletList: activeEditor.isActive("bulletList"),
      orderedList: activeEditor.isActive("orderedList"),
      blockquote: activeEditor.isActive("blockquote"),
      alignLeft: activeEditor.isActive({ textAlign: "left" }),
      alignCenter: activeEditor.isActive({ textAlign: "center" }),
      alignRight: activeEditor.isActive({ textAlign: "right" }),
      alignJustify: activeEditor.isActive({ textAlign: "justify" }),
      inTable: activeEditor.isActive("table"),
      inShape: activeEditor.isActive("shape"),
    }),
  });

  useEffect(() => {
    if (!isTableMenuOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent): void => {
      if (tableMenuRef.current && !tableMenuRef.current.contains(event.target as Node)) {
        setIsTableMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [isTableMenuOpen]);

  useEffect(() => {
    if (!isShapeMenuOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent): void => {
      if (shapeMenuRef.current && !shapeMenuRef.current.contains(event.target as Node)) {
        setIsShapeMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [isShapeMenuOpen]);

  const runTableCommand = (build: (chain: ChainedCommands) => ChainedCommands): void => {
    build(editor.chain().focus()).run();
    setIsTableMenuOpen(false);
  };

  const insertTable = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();

    const rows = clamp(Number.parseInt(tableRows, 10) || 1, 1, MAX_TABLE_ROWS);
    const columns = clamp(Number.parseInt(tableColumns, 10) || 1, 1, MAX_TABLE_COLUMNS);

    editor.chain().focus().insertTable({ rows, cols: columns, withHeaderRow: true }).run();
    setIsTableMenuOpen(false);
  };

  const insertShape = (kind: ShapeKind): void => {
    const insertAt = editor.state.selection.from;

    editor
      .chain()
      .focus()
      .insertContent({
        type: "shape",
        attrs: { kind },
        content: [{ type: "paragraph" }],
      })
      .run();

    // insertContent leaves the caret after the new block. Find the shape closest
    // to where it was inserted and step inside it, so typing starts in the shape.
    let shapePos = -1;

    editor.state.doc.descendants((node, pos) => {
      if (
        node.type.name === "shape" &&
        (shapePos < 0 || Math.abs(pos - insertAt) < Math.abs(shapePos - insertAt))
      ) {
        shapePos = pos;
      }
    });

    if (shapePos >= 0) {
      editor.commands.setTextSelection(shapePos + 2);
    }

    setIsShapeMenuOpen(false);
  };

  const removeShape = (): void => {
    const { $from } = editor.state.selection;

    for (let depth = $from.depth; depth > 0; depth -= 1) {
      const node = $from.node(depth);

      if (node.type.name === "shape") {
        const start = $from.before(depth);
        editor.chain().focus().deleteRange({ from: start, to: start + node.nodeSize }).run();
        break;
      }
    }

    setIsShapeMenuOpen(false);
  };

  const handleImageSelected = (event: ChangeEvent<HTMLInputElement>): void => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const src = typeof reader.result === "string" ? reader.result : null;
      if (src) {
        editor.chain().focus().setImage({ src, alt: file.name }).run();
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 backdrop-blur dark:border-slate-700 dark:bg-slate-900/95">
      <div className="flex flex-wrap items-center gap-1 px-3 py-2">
        <FontSizeControl editor={editor} />

        <ToolbarDivider />

        <ToolbarButton
          label="Bold"
          isActive={state.bold}
          onPress={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Italic"
          isActive={state.italic}
          onPress={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Underline"
          isActive={state.underline}
          onPress={() => editor.chain().focus().toggleUnderline().run()}
        >
          <UnderlineIcon className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Strikethrough"
          isActive={state.strike}
          onPress={() => editor.chain().focus().toggleStrike().run()}
        >
          <Strikethrough className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarDivider />

        <label
          title="Text color"
          className="relative grid h-8 w-8 cursor-pointer place-items-center rounded-md text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
        >
          <Palette className="h-4 w-4" />
          <span
            aria-hidden
            className="absolute bottom-1 h-1 w-4 rounded-sm"
            style={{ backgroundColor: textColor }}
          />
          <input
            type="color"
            aria-label="Text color"
            value={textColor}
            onChange={(event) => {
              setTextColor(event.target.value);
              editor.chain().focus().setColor(event.target.value).run();
            }}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          />
        </label>
        <label
          title="Highlight color"
          className="relative grid h-8 w-8 cursor-pointer place-items-center rounded-md text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
        >
          <Highlighter className="h-4 w-4" />
          <span
            aria-hidden
            className="absolute bottom-1 h-1 w-4 rounded-sm"
            style={{ backgroundColor: highlightColor }}
          />
          <input
            type="color"
            aria-label="Highlight color"
            value={highlightColor}
            onChange={(event) => {
              setHighlightColor(event.target.value);
              editor.chain().focus().setHighlight({ color: event.target.value }).run();
            }}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          />
        </label>

        <ToolbarDivider />

        <ToolbarButton
          label="Align left"
          isActive={state.alignLeft}
          onPress={() => editor.chain().focus().setTextAlign("left").run()}
        >
          <AlignLeft className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Align center"
          isActive={state.alignCenter}
          onPress={() => editor.chain().focus().setTextAlign("center").run()}
        >
          <AlignCenter className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Align right"
          isActive={state.alignRight}
          onPress={() => editor.chain().focus().setTextAlign("right").run()}
        >
          <AlignRight className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Justify"
          isActive={state.alignJustify}
          onPress={() => editor.chain().focus().setTextAlign("justify").run()}
        >
          <AlignJustify className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarDivider />

        <ToolbarButton
          label="Bullet list"
          isActive={state.bulletList}
          onPress={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Ordered list"
          isActive={state.orderedList}
          onPress={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Blockquote"
          isActive={state.blockquote}
          onPress={() => editor.chain().focus().toggleBlockquote().run()}
        >
          <Quote className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarDivider />

        <div ref={tableMenuRef} className="relative">
          <button
            type="button"
            title="Table"
            aria-label="Table"
            aria-haspopup="menu"
            aria-expanded={isTableMenuOpen}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => setIsTableMenuOpen((open) => !open)}
            className="flex h-8 items-center gap-0.5 rounded-md px-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
          >
            <TableIcon className="h-4 w-4" />
            <ChevronDown className="h-3 w-3" />
          </button>

          {isTableMenuOpen ? (
            <div
              role="menu"
              className="absolute left-0 top-full z-20 mt-1 w-60 rounded-lg border border-slate-200 bg-white p-1 shadow-lg dark:border-slate-700 dark:bg-slate-800"
            >
              <form onSubmit={insertTable} className="flex flex-col gap-2 px-1.5 py-1.5">
                <div className="flex gap-2">
                  <label className="flex flex-1 flex-col gap-0.5 text-[10px] font-medium text-slate-500 dark:text-slate-400">
                    Rows
                    <input
                      type="number"
                      min={1}
                      max={MAX_TABLE_ROWS}
                      value={tableRows}
                      aria-label="Table rows"
                      onChange={(event) => setTableRows(event.target.value)}
                      className="w-full rounded border border-slate-200 px-1.5 py-1 text-xs text-slate-800 focus:border-slate-400 focus:outline-none dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-slate-400"
                    />
                  </label>
                  <label className="flex flex-1 flex-col gap-0.5 text-[10px] font-medium text-slate-500 dark:text-slate-400">
                    Columns
                    <input
                      type="number"
                      min={1}
                      max={MAX_TABLE_COLUMNS}
                      value={tableColumns}
                      aria-label="Table columns"
                      onChange={(event) => setTableColumns(event.target.value)}
                      className="w-full rounded border border-slate-200 px-1.5 py-1 text-xs text-slate-800 focus:border-slate-400 focus:outline-none dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-slate-400"
                    />
                  </label>
                </div>
                <button
                  type="submit"
                  className="flex items-center justify-center gap-1.5 rounded bg-slate-900 px-2 py-1.5 text-[11px] font-medium text-white hover:bg-slate-700 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
                >
                  <Plus className="h-3 w-3" />
                  Insert table
                </button>
              </form>

              <div className="my-1 h-px bg-slate-100 dark:bg-slate-700" />
              <TableMenuItem
                label="Row above"
                icon={<Rows3 className="h-3.5 w-3.5" />}
                isDisabled={!state.inTable}
                onPress={() => runTableCommand((chain) => chain.addRowBefore())}
              />
              <TableMenuItem
                label="Row below"
                icon={<Rows3 className="h-3.5 w-3.5" />}
                isDisabled={!state.inTable}
                onPress={() => runTableCommand((chain) => chain.addRowAfter())}
              />
              <TableMenuItem
                label="Delete row"
                icon={<Minus className="h-3.5 w-3.5" />}
                isDisabled={!state.inTable}
                onPress={() => runTableCommand((chain) => chain.deleteRow())}
              />
              <div className="my-1 h-px bg-slate-100 dark:bg-slate-700" />
              <TableMenuItem
                label="Column left"
                icon={<Columns3 className="h-3.5 w-3.5" />}
                isDisabled={!state.inTable}
                onPress={() => runTableCommand((chain) => chain.addColumnBefore())}
              />
              <TableMenuItem
                label="Column right"
                icon={<Columns4 className="h-3.5 w-3.5" />}
                isDisabled={!state.inTable}
                onPress={() => runTableCommand((chain) => chain.addColumnAfter())}
              />
              <TableMenuItem
                label="Delete column"
                icon={<Minus className="h-3.5 w-3.5" />}
                isDisabled={!state.inTable}
                onPress={() => runTableCommand((chain) => chain.deleteColumn())}
              />
              <div className="my-1 h-px bg-slate-100 dark:bg-slate-700" />
              <TableMenuItem
                label="Toggle header row"
                icon={<TableIcon className="h-3.5 w-3.5" />}
                isDisabled={!state.inTable}
                onPress={() => runTableCommand((chain) => chain.toggleHeaderRow())}
              />
              <TableMenuItem
                label="Delete table"
                icon={<Trash2 className="h-3.5 w-3.5" />}
                isDisabled={!state.inTable}
                onPress={() => runTableCommand((chain) => chain.deleteTable())}
              />
            </div>
          ) : null}
        </div>

        <div ref={shapeMenuRef} className="relative">
          <button
            type="button"
            title="Shapes"
            aria-label="Shapes"
            aria-haspopup="menu"
            aria-expanded={isShapeMenuOpen}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => setIsShapeMenuOpen((open) => !open)}
            className="flex h-8 items-center gap-0.5 rounded-md px-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
          >
            <Shapes className="h-4 w-4" />
            <ChevronDown className="h-3 w-3" />
          </button>

          {isShapeMenuOpen ? (
            <div
              role="menu"
              aria-label="Shapes"
              className="absolute left-0 top-full z-20 mt-1 w-52 rounded-lg border border-slate-200 bg-white p-1 shadow-lg dark:border-slate-700 dark:bg-slate-800"
            >
              {SHAPE_OPTIONS.map((option) => {
                const Icon = SHAPE_ICONS[option.kind];

                return (
                  <button
                    key={option.kind}
                    type="button"
                    role="menuitem"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => insertShape(option.kind)}
                    className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0 text-slate-500 dark:text-slate-400" />
                    {option.label}
                  </button>
                );
              })}

              <div className="my-1 h-px bg-slate-100 dark:bg-slate-700" />
              <button
                type="button"
                role="menuitem"
                disabled={!state.inShape}
                onMouseDown={(event) => event.preventDefault()}
                onClick={removeShape}
                className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                <Trash2 className="h-3.5 w-3.5 shrink-0 text-slate-500 dark:text-slate-400" />
                Delete shape
              </button>
            </div>
          ) : null}
        </div>

        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageSelected}
        />
        <ToolbarButton label="Insert image" onPress={() => imageInputRef.current?.click()}>
          <ImagePlus className="h-4 w-4" />
        </ToolbarButton>
      </div>
    </div>
  );
}
