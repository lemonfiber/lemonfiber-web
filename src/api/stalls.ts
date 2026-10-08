/**
 * The items whose downloads are stuck, as a suite stands them in for a running
 * lemonfiber.
 *
 * Declared as the payload the kind it names carries, so the compiler asks
 * whether each field is one the contract has rather than whoever wrote the
 * reader and the body agreeing with each other.
 */
import type { Held, Stuck } from "../lib/stuck";

/** A film stuck downloading. */
export const stalledFilm: Held = {
  title: "Big Buck Bunny",
  service: "radarr",
  stage: "downloading",
};

/** A series stuck going into the library. */
export const stalledSeries: Held = {
  title: "The Expanse",
  service: "sonarr",
  stage: "importing",
};

/** Two stuck items, with one queue unread and one unreadable here. */
export const stalled: Stuck = {
  incomplete: true,
  items: [stalledFilm, stalledSeries],
  unsupported: [
    { what: "readarr", because: "It speaks an API this build does not." },
  ],
};
