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

/** The link the companion app opens Sam's offer at. */
export const joinAt =
  "lemonfiber://join?address=https%3A%2F%2Flemonfiber.local%3A8443&fingerprint=00&stack=c1d2e3f4a5b6&name=Sam&expires=1790000000&claim=9c1e";

/** The one address Sam's offer is turned down at. */
export const declineAt = [
  "http:",
  "",
  "lemonfiber.local:5056",
  "decline",
  "4b2d",
].join("/");

/** Why an offer came without a join link, in lemonfiber's words. */
export const noJoin =
  "There is no join link, because the web interface has not been served encrypted on your network.";

/** The account made, with the link the app opens it at and where it is turned down. */
export const joinable: Invited = {
  ...offered,
  decline: declineAt,
  join: joinAt,
};

/** The account made with no join link, and why. */
export const unjoinable: Invited = {
  ...offered,
  decline: declineAt,
  join: null,
  unjoinable: noJoin,
};
