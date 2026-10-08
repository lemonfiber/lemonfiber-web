/**
 * The items whose downloads are stuck, across the services that fetch them, in
 * lines a reader can carry.
 *
 * Each item is named with the service whose queue holds it and the stage it is
 * stuck at, so the reader can follow that one item rather than a count. A queue
 * that could not be read leaves the list short, and says so rather than
 * reading as nothing stuck; a service whose queue lemonfiber cannot read at all
 * is named with why.
 *
 * What lemonfiber writes into the reading is its own and is passed through
 * unchanged. The words around it live in `messages/`.
 */
import type { ByKind } from "@lemonfiber/sdk-ts";
import { wordOfStage } from "./traced";
import * as m from "../paraglide/messages.js";

/** The stuck items, and whether the list may be short. */
export type Stuck = ByKind["stuck"]["data"];

/** One stuck item. */
export type Held = Stuck["items"][number];

/** Where one stuck item is held, in a sentence. */
export function heldLine(item: Held): string {
  return m.stuck_held({
    service: item.service,
    stage: wordOfStage(item.stage),
  });
}

/** What may be missing from the list, line by line. */
export function shortLines(stuck: Stuck): readonly string[] {
  const lines = stuck.incomplete ? [m.stuck_incomplete()] : [];
  for (const one of stuck.unsupported ?? []) {
    lines.push(m.stuck_unread({ what: one.what, because: one.because }));
  }
  return lines;
}
