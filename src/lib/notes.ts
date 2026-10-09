/**
 * Release notes, as lemonfiber passes them on from the release: Markdown, read
 * into headings, items and lines so a screen can draw them as a list rather
 * than as one paragraph of markup.
 *
 * Only what release notes use is read: a heading, an item, and a link, which
 * keeps its words and drops its address. Nothing in the notes is drawn as
 * markup, so they can say nothing to the page but text. Code between backticks
 * is left for the line's own drawing to set as code.
 */

/** One block of release notes. */
export type Note =
  | { readonly kind: "heading"; readonly text: string }
  | { readonly kind: "item"; readonly text: string }
  | { readonly kind: "line"; readonly text: string };

/**
 * A line with every link read as its words, without its address. Read by hand
 * rather than by an expression, which would go back over a line with many
 * brackets once for every one of them.
 */
function unlinked(line: string): string {
  let read = "";
  let from = 0;
  for (;;) {
    const open = line.indexOf("[", from);
    const shut = open === -1 ? -1 : line.indexOf("]", open);
    if (shut === -1) return read + line.slice(from);
    const address = line.startsWith("(", shut + 1)
      ? line.indexOf(")", shut)
      : -1;
    if (address === -1) {
      read += line.slice(from, shut + 1);
    } else {
      read += line.slice(from, open) + line.slice(open + 1, shut);
    }
    from = address === -1 ? shut + 1 : address + 1;
  }
}

/** A heading's marks. */
const HEADING = /^#{1,6}\s+/u;

/** An item's mark. */
const ITEM = /^[-*]\s+/u;

/**
 * The notes, block by block, with every link read as its words, or nothing
 * where the release passed no notes on or only blank ones.
 */
export function notesOf(
  markdown: string | null | undefined,
): readonly Note[] | undefined {
  const notes: Note[] = [];
  for (const raw of (markdown ?? "").split("\n")) {
    const line = unlinked(raw.trim());
    if (line === "") continue;
    if (HEADING.test(line)) {
      notes.push({ kind: "heading", text: line.replace(HEADING, "") });
    } else if (ITEM.test(line)) {
      notes.push({ kind: "item", text: line.replace(ITEM, "") });
    } else {
      notes.push({ kind: "line", text: line });
    }
  }
  return notes.length > 0 ? notes : undefined;
}
