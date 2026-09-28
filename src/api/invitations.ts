/**
 * What offering somebody an account is answered with, as a suite stands them
 * in for a running lemonfiber.
 *
 * Declared as the payload the kind it names carries, so the compiler asks
 * whether each field is one the contract has rather than whoever wrote the
 * reader and the body agreeing with each other.
 */
import type { Invited } from "../lib/invited";

/** The one address an offer is claimed at. */
export const claimAt = [
  "http:",
  "",
  "lemonfiber.local:5055",
  "join",
  "7f3a",
].join("/");

/** What a limit is and is not, as lemonfiber says it on every one it sets. */
export const filtering =
  "A limit decides what is offered to somebody signed in as themselves. It is not a lock.";

/** What offering Sam an account would make, with nothing made. */
export const wouldOffer: Invited = {
  address: claimAt,
  applied: {
    filtering,
    libraries: [],
    limit: "12 and under",
    requesting: "made",
    unrated: "held-back",
  },
  caution: null,
  hours: 72,
  linked: "not-tried",
  name: "Sam",
  rehearsed: true,
  standing: "made",
  suspended: [],
  withdrawn: [],
};

/** The account made, on the terms that were read. */
export const offered: Invited = {
  ...wouldOffer,
  linked: "made",
  rehearsed: false,
};

/** Kit's password taken off, with the address to set a new one at. */
export const reissued: Invited = {
  ...offered,
  applied: null,
  name: "Kit",
  standing: "reset",
};
