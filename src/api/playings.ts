/**
 * What the media server is playing now, as a suite stands it in for a running
 * lemonfiber.
 *
 * Declared as the payload the kind it names carries, so the compiler asks
 * whether each field is one the contract has rather than whoever wrote the
 * reader and the body agreeing with each other.
 */
import type { Playing, Session } from "../lib/playing";

/** A film playing in the living room. */
export const film: Session = {
  member: "Kit",
  member_id: "a1",
  medium: "film",
  title: "Big Buck Bunny",
  device: "Living room TV",
  paused: false,
};

/** An episode paused on a phone, numbered. */
export const episode: Session = {
  member: "Sam",
  member_id: "b2",
  medium: "series",
  series: "The Expanse",
  season: 2,
  episode: 5,
  title: "Home",
  device: "Sam's phone",
  paused: true,
};

/** Two sessions across the house. */
export const playing: Playing = {
  available: true,
  findings: [],
  member: "",
  sessions: [film, episode],
};
