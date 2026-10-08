/**
 * What one member can watch, as a suite stands it in for a running lemonfiber.
 *
 * Declared as the payload the kind it names carries, so the compiler asks
 * whether each field is one the contract has rather than whoever wrote the
 * reader and the body agreeing with each other.
 */
import type { Holding, Shelf } from "../lib/yours";

/** A film the server knows the year of. */
export const film: Holding = {
  id: "f1",
  medium: "film",
  title: "The Iron Giant",
  year: 1999,
};

/** A series the server holds no year for. */
export const series: Holding = {
  id: "s1",
  medium: "series",
  title: "Bluey",
  year: null,
};

/** What Kit can watch: two titles, and one thing worth saying about them. */
export const kitsShelf: Shelf = {
  id: "kit-1",
  member: "Kit",
  available: true,
  rehearsed: false,
  holdings: [film, series],
  findings: ["Titles with no rating are held back from Kit."],
};

/** A shelf the media server would not give up. */
export const unreadShelf: Shelf = {
  id: "kit-1",
  member: "Kit",
  available: false,
  rehearsed: false,
  holdings: [],
  findings: ["The media server did not answer."],
};
