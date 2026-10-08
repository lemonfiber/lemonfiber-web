/**
 * Everything lemonfiber changed, newest first, in lines a reader can carry.
 *
 * Each change says what it did, the operation that made it and what it was
 * made to, when, and how far it could be put back: whole, in part, or not at
 * all, with why and what to do instead where lemonfiber says. A change one
 * operation made together with others says how many go with it, because
 * putting back half of what somebody agreed to leaves a machine nobody chose.
 * How far back the record goes is said above it rather than left to be read
 * off the oldest entry.
 *
 * What lemonfiber writes into the record is its own and is passed through
 * unchanged. The words around it live in `messages/`.
 */
import type { ByKind } from "@lemonfiber/sdk-ts";
import * as m from "../paraglide/messages.js";
import { getLocale } from "../paraglide/runtime.js";

/** Everything lemonfiber changed, and how far back the record goes. */
export type History = ByKind["history"]["data"];

/** One change lemonfiber made. */
export type Change = History["changes"][number];

/** The stamp a change carries when the clock would not answer. */
const UNREAD_CLOCK = "0";

/**
 * When a change was made, in the reader's own calendar.
 *
 * A change stamped while the clock would not answer says so, rather than
 * being shown as made at the epoch, and a stamp that does not read as a count
 * of seconds is shown as it arrived.
 */
export function whenOf(at: string): string {
  if (at === UNREAD_CLOCK) return m.history_when_unread();
  const seconds = Number(at);
  if (!/^\d+$/.test(at) || !Number.isSafeInteger(seconds)) return at;
  return new Intl.DateTimeFormat(getLocale(), {
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date(seconds * 1000));
}

/** How far a change could be put back, in a sentence. */
export function wordOfReversal(reversal: Change["reversal"]): string {
  switch (reversal) {
    case "whole":
      return m.history_back_whole();
    case "partial":
      return m.history_back_partial();
    case "none":
      return m.history_back_none();
    default:
      return m.history_back_other();
  }
}

/** One change, line by line. */
export function changeLines(change: Change): readonly string[] {
  const lines = [
    m.history_made({ operation: change.operation, target: change.target }),
    m.history_when({ when: whenOf(change.at) }),
    wordOfReversal(change.reversal),
  ];
  const { because, instead } = change;
  if (because !== undefined && because !== null) lines.push(because);
  if (instead !== undefined && instead !== null) lines.push(instead);
  if (change.alongside > 1) {
    lines.push(m.history_alongside({ count: change.alongside }));
  }
  return lines;
}
