/**
 * Which of a member's own requests changed since this browser last showed them.
 *
 * What was shown is kept in this browser alone: where each request stood when
 * the member last saw the list here. Nothing about what a member looked at is
 * sent anywhere or kept on the stack, so another browser, or this one with its
 * storage cleared, starts again with nothing marked.
 *
 * A list this browser never showed marks nothing: there is nothing it changed
 * from. After that, a request not shown before, or standing somewhere else
 * than when it was shown, is marked as new.
 */
import type { Keeping } from "./keeping";
import type { Household } from "./wire";

/** Where each request stood when it was shown, by its id. */
export type Shown = Readonly<Record<string, string>>;

/** Where this browser keeps what one member was shown. */
export function keptAt(member: string): string {
  return `lemonfiber.shown.${member}`;
}

/** Where each of the member's own requests stands now, by its id. */
export function shownOf(household: Household): Shown {
  const shown: Record<string, string> = {};
  for (const one of household.members) {
    for (const request of one.requests) shown[request.id] = request.state ?? "";
  }
  return shown;
}

/** The requests that changed since `before`, or none where nothing was shown before. */
export function newlyOf(
  before: Shown | undefined,
  now: Shown,
): readonly string[] {
  if (before === undefined) return [];
  return Object.keys(now).filter((id) => before[id] !== now[id]);
}

/** Whether what storage held is a record of what was shown. */
function isShown(held: unknown): held is Shown {
  return (
    typeof held === "object" &&
    held !== null &&
    !Array.isArray(held) &&
    Object.values(held).every((state) => typeof state === "string")
  );
}

/** What this browser kept of what the member was shown, or nothing it can read. */
export function keptShown(
  keeping: Keeping | undefined,
  member: string,
): Shown | undefined {
  try {
    const held = keeping?.getItem(keptAt(member));
    if (held === null || held === undefined) return undefined;
    const read: unknown = JSON.parse(held);
    return isShown(read) ? read : undefined;
  } catch {
    return undefined;
  }
}

/** Keep what the member was just shown, where this browser keeps anything. */
export function keepShown(
  keeping: Keeping | undefined,
  member: string,
  shown: Shown,
): void {
  try {
    keeping?.setItem(keptAt(member), JSON.stringify(shown));
  } catch {
    return;
  }
}
