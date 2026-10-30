import type { CSSProperties } from "react";

export interface PaginateOptions {
  html: string;
  contentWidth: number;
  contentHeight: number;
  /** Layout-affecting typography, measured with exactly the values used to render. */
  style: CSSProperties;
}

/** Sub-pixel slack when comparing a caret position with the content height. */
const TOLERANCE = 0.5;

/**
 * The page box is fractional (mm converted to px) while the browser rounds the
 * rendered box, so a spare pixel keeps the last line from being clipped.
 */
const FIT_PADDING_PX = 1;

/**
 * Splits editor HTML into one HTML string per page (PRD §5B).
 *
 * A hidden container the width of the page's content box is filled block by
 * block. A block that does not fit is split into the space still left on the
 * page (table rows / list items / text at a measured caret position), and the
 * remainder continues on the next page.
 */
export function paginateHtml(options: PaginateOptions): string[] {
  if (typeof document === "undefined") {
    return [options.html];
  }

  const measure = createMeasureContainer(options);
  document.body.appendChild(measure);

  try {
    return paginateBlocks(measure, options.html, Math.max(0, options.contentHeight - FIT_PADDING_PX));
  } finally {
    measure.remove();
  }
}

function createMeasureContainer({ contentWidth, style }: PaginateOptions): HTMLDivElement {
  const measure = document.createElement("div");
  measure.className = "inkflow-content";
  measure.setAttribute("aria-hidden", "true");

  const inline = measure.style;
  inline.position = "fixed";
  inline.top = "0";
  inline.left = "-10000px";
  inline.width = `${contentWidth}px`;
  // Natural height, so blocks appended here grow the box and can be measured
  // exactly the way they will land on a real page.
  inline.height = "auto";
  inline.overflow = "hidden";
  inline.visibility = "hidden";
  inline.pointerEvents = "none";

  applyInlineStyle(inline, style);

  return measure;
}

function applyInlineStyle(target: CSSStyleDeclaration, values: CSSProperties): void {
  for (const [key, value] of Object.entries(values)) {
    if (value === undefined || value === null) {
      continue;
    }

    const property = key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
    target.setProperty(property, String(value));
  }
}

function paginateBlocks(measure: HTMLDivElement, html: string, maxHeight: number): string[] {
  const template = document.createElement("template");
  template.innerHTML = html;

  const blocks: HTMLElement[] = [];
  template.content.childNodes.forEach((node) => {
    if (node.nodeType === Node.ELEMENT_NODE) {
      blocks.push((node as HTMLElement).cloneNode(true) as HTMLElement);
      return;
    }

    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent ?? "";
      if (text.trim().length > 0) {
        const paragraph = document.createElement("p");
        paragraph.textContent = text;
        blocks.push(paragraph);
      }
    }
  });

  const pages: string[] = [];

  const flush = (): void => {
    pages.push(measure.innerHTML);
    measure.replaceChildren();
  };

  for (const block of blocks) {
    let pending: HTMLElement | null = block;

    while (pending) {
      measure.appendChild(pending);

      if (filledHeight(measure) <= maxHeight) {
        pending = null;
        break;
      }

      measure.removeChild(pending);

      // Splitting is measured against whatever is already on the page, so a long
      // block fills the remaining space instead of leaving a gap.
      const parts = splitBlock(pending, measure, maxHeight);

      if (parts) {
        const [head, tail] = parts;
        measure.appendChild(head);
        flush();
        pending = tail;
        continue;
      }

      // Nothing fits here: start a new page and retry.
      if (measure.childNodes.length > 0) {
        flush();
        continue;
      }

      // Nothing left to split — keep the block and let the page clip the overflow.
      measure.appendChild(pending);
      flush();
      pending = null;
    }
  }

  if (measure.childNodes.length > 0) {
    flush();
  }

  return pages.length > 0 ? pages : [""];
}

function splitBlock(
  element: HTMLElement,
  container: HTMLElement,
  maxHeight: number,
): [HTMLElement, HTMLElement] | null {
  // A shape is one outline with text inside it: splitting it would leave half
  // a shape on each page, so it moves to the next page whole.
  if (element.dataset.shape) {
    return null;
  }

  if (element.tagName === "TABLE") {
    return splitTable(element, container, maxHeight);
  }

  if (element.tagName === "UL" || element.tagName === "OL") {
    return splitList(element, container, maxHeight);
  }

  return splitByTextRange(element, container, maxHeight);
}

/**
 * Height actually occupied on the page. Measured from the last block's border box
 * so a trailing margin does not waste the space left at the bottom of a page.
 */
function filledHeight(container: HTMLElement): number {
  const last = container.lastElementChild;

  if (!last) {
    return 0;
  }

  return last.getBoundingClientRect().bottom - container.getBoundingClientRect().top;
}

function fitsPage(element: HTMLElement, container: HTMLElement, maxHeight: number): boolean {
  container.appendChild(element);
  const fits = filledHeight(container) <= maxHeight;
  container.removeChild(element);
  return fits;
}

/** Largest count in [1, high] that still fits, or 0 when none do. */
function largestFittingCount(high: number, fits: (count: number) => boolean): number {
  let low = 1;
  let best = 0;
  let upper = high;

  while (low <= upper) {
    const mid = Math.floor((low + upper) / 2);

    if (fits(mid)) {
      best = mid;
      low = mid + 1;
    } else {
      upper = mid - 1;
    }
  }

  return best;
}

function splitList(
  list: HTMLElement,
  container: HTMLElement,
  maxHeight: number,
): [HTMLElement, HTMLElement] | null {
  const items = Array.from(list.children).filter(
    (child): child is HTMLElement => child.tagName === "LI",
  );

  if (items.length < 2) {
    return splitByTextRange(list, container, maxHeight);
  }

  const build = (from: number, to: number): HTMLElement => {
    const clone = list.cloneNode(false) as HTMLElement;

    for (let index = from; index < to; index += 1) {
      clone.appendChild(items[index].cloneNode(true));
    }

    return clone;
  };

  const fitting = largestFittingCount(items.length - 1, (count) =>
    fitsPage(build(0, count), container, maxHeight),
  );

  if (fitting < 1) {
    return splitByTextRange(list, container, maxHeight);
  }

  return [build(0, fitting), build(fitting, items.length)];
}

function splitTable(
  table: HTMLElement,
  container: HTMLElement,
  maxHeight: number,
): [HTMLElement, HTMLElement] | null {
  const headerRows = Array.from(table.querySelectorAll("thead tr"));
  const bodyRows = Array.from(table.querySelectorAll("tr")).filter(
    (row) => !headerRows.includes(row),
  );

  if (bodyRows.length < 2) {
    return null;
  }

  const build = (from: number, to: number): HTMLElement => {
    const clone = table.cloneNode(false) as HTMLElement;

    if (headerRows.length > 0) {
      const thead = document.createElement("thead");
      headerRows.forEach((row) => thead.appendChild(row.cloneNode(true)));
      clone.appendChild(thead);
    }

    const tbody = document.createElement("tbody");
    for (let index = from; index < to; index += 1) {
      tbody.appendChild(bodyRows[index].cloneNode(true));
    }
    clone.appendChild(tbody);

    return clone;
  };

  const fitting = largestFittingCount(bodyRows.length - 1, (count) =>
    fitsPage(build(0, count), container, maxHeight),
  );

  if (fitting < 1) {
    return null;
  }

  return [build(0, fitting), build(fitting, bodyRows.length)];
}

/**
 * Splits a text block at the last character that still fits, measured with a
 * DOM Range so inline formatting is preserved. The cut is nudged back to a word
 * boundary whenever the text has one.
 */
function splitByTextRange(
  element: HTMLElement,
  container: HTMLElement,
  maxHeight: number,
): [HTMLElement, HTMLElement] | null {
  const textNodes: Text[] = [];
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);

  let current = walker.nextNode();
  while (current) {
    const text = current as Text;
    if (text.data.trim().length > 0) {
      textNodes.push(text);
    }
    current = walker.nextNode();
  }

  if (textNodes.length === 0) {
    return null;
  }

  const combined = textNodes.map((node) => node.data).join("");
  const total = combined.length;

  if (total < 2) {
    return null;
  }

  container.appendChild(element);
  const containerTop = container.getBoundingClientRect().top;

  const bottomAt = (offset: number): number => {
    const position = locateOffset(textNodes, offset);
    const range = document.createRange();
    range.setStart(element, 0);
    range.setEnd(position.node, position.offset);
    return range.getBoundingClientRect().bottom - containerTop;
  };

  let low = 1;
  let high = total - 1;
  let best = 0;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);

    if (bottomAt(mid) <= maxHeight + TOLERANCE) {
      best = mid;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  container.removeChild(element);

  if (best < 1) {
    return null;
  }

  const cut = snapToWhitespace(combined, best);
  if (cut < 1) {
    return null;
  }

  const position = locateOffset(textNodes, cut);

  const headRange = document.createRange();
  headRange.setStart(element, 0);
  headRange.setEnd(position.node, position.offset);

  const tailRange = document.createRange();
  tailRange.setStart(position.node, position.offset);
  tailRange.setEnd(element, element.childNodes.length);

  const head = element.cloneNode(false) as HTMLElement;
  head.appendChild(headRange.cloneContents());

  const tail = element.cloneNode(false) as HTMLElement;
  tail.appendChild(tailRange.cloneContents());

  const headIsEmpty = (head.textContent ?? "").trim().length === 0 && head.children.length === 0;
  const tailIsEmpty = (tail.textContent ?? "").trim().length === 0 && tail.children.length === 0;

  if (headIsEmpty || tailIsEmpty) {
    return null;
  }

  return [head, tail];
}

function locateOffset(nodes: Text[], offset: number): { node: Text; offset: number } {
  let remaining = offset;

  for (const node of nodes) {
    if (remaining <= node.data.length) {
      return { node, offset: remaining };
    }
    remaining -= node.data.length;
  }

  const last = nodes[nodes.length - 1];
  return { node: last, offset: last.data.length };
}

/** Moves a cut position back to just after the nearest preceding whitespace. */
function snapToWhitespace(text: string, cut: number): number {
  for (let index = Math.min(cut, text.length) - 1; index >= 0; index -= 1) {
    if (/\s/.test(text[index])) {
      return index + 1;
    }
  }

  return cut;
}
