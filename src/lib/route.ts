/**
 * What the console's places are called and drawn as, and the console's menu.
 *
 * The words live in `messages/`, so no screen holds one.
 */
import type { IconName } from "./icons";
import { everyPlace, pathOf, type Menu, type Place } from "./places";
import * as m from "../paraglide/messages.js";

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
    case "settings":
      return m.nav_settings();
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
    case "settings":
      return "settings";
  }
}

/** The operator's console, as its menu sets it out. */
export const consoleMenu: Menu<Place> = {
  named: () => m.nav_console(),
  places: everyPlace,
  pathOf,
  nameOf,
  iconOf,
};
