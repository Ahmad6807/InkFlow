/**
 * Clipboard sanitizer for the editor (PRD Module 1).
 *
 * Pasted HTML is reduced to the basic formatting the handwriting renderer
 * understands: bold, italic, underline and lists. Everything else (tables,
 * inline styles, Word/Google Docs wrappers, scripts, media) is stripped, while
 * the plain text inside those elements is preserved.
 */

const ALLOWED_TAGS = new Set([
  "P",
  "BR",
  "STRONG",
  "B",
  "EM",
  "I",
  "U",
  "UL",
  "OL",
  "LI",
]);

/** Elements whose entire subtree is discarded (text included). */
const DROPPED_TAGS = new Set([
  "SCRIPT",
  "STYLE",
  "IFRAME",
  "OBJECT",
  "EMBED",
  "SVG",
  "MATH",
  "LINK",
  "META",
  "TITLE",
  "HEAD",
  "NOSCRIPT",
]);

/** Block-level elements that should keep a visual line break when unwrapped. */
const BLOCK_TAGS = new Set([
  "DIV",
  "SECTION",
  "ARTICLE",
  "HEADER",
  "FOOTER",
  "H1",
  "H2",
  "H3",
  "H4",
  "H5",
  "H6",
  "BLOCKQUOTE",
  "PRE",
  "TABLE",
  "THEAD",
  "TBODY",
  "TFOOT",
  "TR",
  "TD",
  "TH",
  "FIGURE",
  "ADDRESS",
  "HR",
]);

/**
 * Strips complex markup from pasted HTML. Returns the input unchanged when
 * there is no DOM (server render) so the function stays safe to import anywhere.
 */
export function stripComplexPasteHtml(html: string): string {
  if (typeof window === "undefined" || html.length === 0) {
    return html;
  }

  const source = new DOMParser().parseFromString(html, "text/html");
  const output = document.createElement("div");

  const visit = (node: Node, parent: HTMLElement): void => {
    if (node.nodeType === Node.TEXT_NODE) {
      parent.appendChild(document.createTextNode(node.textContent ?? ""));
      return;
    }

    if (node.nodeType !== Node.ELEMENT_NODE) {
      return;
    }

    const element = node as HTMLElement;
    const tag = element.tagName.toUpperCase();

    if (DROPPED_TAGS.has(tag)) {
      return;
    }

    if (ALLOWED_TAGS.has(tag)) {
      // Copy the tag but drop every attribute (classes, inline styles, data-*).
      const clean = document.createElement(tag.toLowerCase());
      element.childNodes.forEach((child) => visit(child, clean));
      parent.appendChild(clean);
      return;
    }

    if (BLOCK_TAGS.has(tag)) {
      if (parent.lastChild !== null) {
        parent.appendChild(document.createElement("br"));
      }
      element.childNodes.forEach((child) => visit(child, parent));
      parent.appendChild(document.createElement("br"));
      return;
    }

    element.childNodes.forEach((child) => visit(child, parent));
  };

  source.body.childNodes.forEach((child) => {
    if (child.nodeType === Node.ELEMENT_NODE) {
      visit(child, output);
    } else if (child.nodeType === Node.TEXT_NODE && child.textContent?.trim()) {
      output.appendChild(document.createTextNode(child.textContent));
    }
  });

  return output.innerHTML;
}
