/**
 * What one member can watch, as the operator is shown it, in lines a reader
 * can carry.
 *
 * The shelf is what the media server shows that member, with their limits
 * already applied by the server: a title a limit hides is never on it to be
 * hidden again, and nothing here decides that for itself. Each title is named
 * with the year it came out where the server knows one, and what kind of thing
 * it is. A shelf that could not be read says so, and never reads as one that
 * holds nothing; whatever lemonfiber found worth saying about it is said
 * either way.
 *
 * What lemonfiber writes into the reading is its own and is passed through
 * unchanged. The words around it live in `messages/`.
 */
import type { Holding, Medium, Shelf } from "./yours";
import * as m from "../paraglide/messages.js";

/** What kind of thing a title is, in a word. */
export function wordOfKind(medium: Medium): string {
  switch (medium) {
    case "film":
      return m.watch_film();
    case "series":
      return m.watch_series();
    case "other":
      return m.watch_other();
    default:
      return m.watch_kind_other();
  }
}

/** One title on the shelf, in a line. */
export function holdingLine(holding: Holding): string {
  const kind = wordOfKind(holding.medium);
  const { year } = holding;
  return year === undefined || year === null
    ? m.watch_title({ title: holding.title, kind })
    : m.watch_title_year({ title: holding.title, year, kind });
}

/**
 * What the shelf came to before its titles: that it could not be read, or that
 * it holds nothing, where either is so; then whatever lemonfiber found worth
 * saying about it.
 */
export function shelfLines(shelf: Shelf): readonly string[] {
  const lines: string[] = [];
  if (!shelf.available) {
    lines.push(m.watch_unread({ name: shelf.member }));
  } else if (shelf.holdings.length === 0) {
    lines.push(m.watch_none({ name: shelf.member }));
  }
  lines.push(...shelf.findings);
  return lines;
}
