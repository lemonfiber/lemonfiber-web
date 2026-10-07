/**
 * Everything that leaves this machine, as a suite stands it in for a running
 * lemonfiber.
 *
 * Declared as the payload the kind it names carries, so the compiler asks
 * whether each field is one the contract has rather than whoever wrote the
 * reader and the body agreeing with each other.
 */
import type { Leaving, Ours, Theirs } from "../lib/leaving";

/** lemonfiber asking whether a newer version came out, allowed. */
export const updates: Ours = {
  reach: "updates",
  purpose: "Whether a newer lemonfiber came out",
  destination: ["api.github.com"],
  sends: "nothing but the request itself.",
  allowed: true,
  switch: "updates.check",
  cost: "you are not told when a newer version comes out.",
};

/** lemonfiber telling the household, switched off and set up to reach nothing. */
export const household: Ours = {
  reach: "household",
  purpose: "Telling the household what arrived",
  destination: [],
  sends: "the words of the message.",
  allowed: false,
  switch: "notify.household",
  cost: "nobody is told when what they asked for arrives.",
};

/** A service the stack runs, reaching its indexers. */
export const indexing: Theirs = {
  service: "prowlarr",
  destination: "the indexers you added",
  purpose: "Searches for what was asked for.",
  origin: { origin: "bundled" },
  recorded: true,
};

/** A service a plugin brought, with no record shipped of what it reaches. */
export const stranger: Theirs = {
  service: "komga",
  destination: "",
  purpose: "Reads comic metadata.",
  origin: { origin: "plugin", named: "plugin-komga" },
  recorded: false,
};

/** Everything that leaves this machine. */
export const leaving: Leaving = {
  ours: [updates, household],
  theirs: [indexing, stranger],
};
