/**
 * The places the console has, and the addresses they are at.
 *
 * A place is an address rather than something the page remembers. The binary
 * answers a path naming no file with the app itself, so every screen can be
 * typed in, bookmarked, opened in a second tab and left behind by the back
 * button — none of which a screen held in a variable can do.
 *
 * The words live in `messages/`, so no screen holds one.
 */
import type { IconName } from "./icons";
import * as m from "../paraglide/messages.js";

/**
 * Somewhere the console can be.
 *
 * One per question the read endpoints answer, with the two readings of what is
 * running kept together: the whole stack and each service in it are one screen,
 * not two.
 */
export type Place = "overview" | "checks" | "storage" | "logs" | "requests";

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
 * What a place is called.
 */
export function nameOf(place: Place): string {
  switch (place) {
    case "overview":
      return m.nav_overview();
    case "checks":
      return m.nav_checks();
    case "storage":
      return m.nav_storage();
    case "logs":
      return m.nav_logs();
    case "requests":
      return m.nav_requests();
  }
}

/**
 * The drawing that stands for a place.
 */
export function iconOf(place: Place): IconName {
  switch (place) {
    case "overview":
      return "overview";
    case "checks":
      return "checks";
    case "storage":
      return "storage";
    case "logs":
      return "logs";
    case "requests":
      return "requests";
  }
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
