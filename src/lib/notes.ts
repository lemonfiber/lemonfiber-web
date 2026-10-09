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

/** A link's words, without its address. */
const LINK = /\[([^\]]*)\]\([^)]*\)/gu;

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
    const line = raw.trim().replaceAll(LINK, "$1");
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
