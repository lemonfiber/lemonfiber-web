/**
 * The places the console has, the addresses they are at, and what a menu of
 * places is.
 *
 * A place is an address rather than something the page remembers. The binary
 * answers a path naming no file with the app itself, so every screen can be
 * typed in, bookmarked, opened in a second tab and left behind by the back
 * button — none of which a screen held in a variable can do.
 *
 * Nothing here holds a word, so a member's screens reach it without carrying
 * the console's.
 */
import type { IconName } from "./icons";

/**
 * Somewhere the console can be.
 *
 * One per question the read endpoints answer, with the two readings of what is
 * running kept together: the whole stack and each service in it are one screen,
 * not two.
 */
export type Place =
  "overview" | "checks" | "storage" | "logs" | "requests" | "settings";

/**
 * Every place there is, in the order the menu shows them.
 *
 * A screen, a story and a test all walk this one list, as they do for states
 * and severities.
 */
export const everyPlace: readonly Place[] = [
  "overview",
  "checks",
  "storage",
  "logs",
  "requests",
  "settings",
];

/**
 * The address a place is at. The overview is the root.
 */
export function pathOf(place: Place): string {
  return place === "overview" ? "/" : `/${place}`;
}

/**
 * The place an address names. An address naming none is the overview.
 */
export function placeAt(path: string): Place {
  const first = path.split("/").find((part) => part !== "");
  return everyPlace.find((place) => place === first) ?? "overview";
}

/**
 * What a menu leads to: its places in order, and the address, name and drawing
 * of each.
 *
 * The console and a household member are given different menus in the same
 * chrome, so the chrome is handed one rather than knowing either.
 */
export interface Menu<P extends string> {
  /** Every place it leads to, in the order it shows them. */
  readonly places: readonly P[];
  /** What the menu is called, so it is reachable on its own. */
  named(): string;
  /** The address a place is at. */
  pathOf(place: P): string;
  /** What a place is called. */
  nameOf(place: P): string;
  /** The drawing that stands for a place. */
  iconOf(place: P): IconName;
}

/**
 * Whether a click on a link is one the page should answer itself.
 *
 * A modified click, or one from any button but the first, is asking the browser
 * for something the page cannot give: a second tab, a saved file, a menu. Those
 * are the reason the menu is built from links, so they are left alone.
 */
export function ours(event: MouseEvent): boolean {
  return (
    event.button === 0 &&
    !event.metaKey &&
    !event.ctrlKey &&
    !event.shiftKey &&
    !event.altKey
  );
}
