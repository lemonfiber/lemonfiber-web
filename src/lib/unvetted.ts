/**
 * The operator's own overlay, said wherever it changes a service: merged last
 * over what lemonfiber writes, and named as unvetted because nothing in it was
 * held to the model every plugin's entry is written from.
 */
import type { ByKind } from "@lemonfiber/sdk-ts";
import { listed } from "./listed";
import * as m from "../paraglide/messages.js";

/** The overlay, and every service it changes. */
export type Unvetted = NonNullable<ByKind["settings"]["data"]["unvetted"]>;

/** The overlay and every service it changes, in a line; nothing where none does. */
export function unvettedLines(
  unvetted: Unvetted | null | undefined,
): readonly string[] {
  if (unvetted === undefined || unvetted === null) return [];
  return [
    m.overlay_unvetted({
      overlay: unvetted.overlay,
      services: listed(unvetted.services),
    }),
  ];
}
