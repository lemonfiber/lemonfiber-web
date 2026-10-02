/**
 * The disk accounting and letting one download go, as a suite stands them in
 * for a running lemonfiber.
 *
 * Declared as the payload the kind it names carries, so the compiler asks
 * whether each field is one the contract has rather than whoever wrote the
 * reader and the body agreeing with each other.
 */
import type { Candidate, Let, Reckoned } from "../lib/letting";

/** A download still being shared, whose tracker would notice it going. */
export const shared: Candidate = {
  name: "Big.Buck.Bunny.2008.1080p",
  bytes: 1_073_741_824,
  standing: { standing: "seeding", ratio: 150 },
  consequence:
    "Its tracker counts what you share, and this one has sent less than twice what it took.",
};

/** A download nobody put in the library. */
export const stray: Candidate = {
  name: "Sintel.2010.720p",
  bytes: 524_288_000,
  standing: { standing: "never_imported" },
};

/** A download the operator said to keep. */
export const kept: Candidate = {
  name: "Tears.of.Steel.2012",
  bytes: 734_003_200,
  standing: { standing: "left_alone" },
};

/** The disk accounting, naming three completed downloads. */
export const reckoned: Reckoned = {
  rehearsed: false,
  agreement: "space-9b2c",
  level: "advisory",
  halted: false,
  candidates: [shared, stray, kept],
  consumption: [],
  reclaimable: [],
  interrupted: [],
  outsized: [],
  volumes: [],
};

/** What letting the shared download go would cost, with nothing let go. */
export const letOffer: Let = {
  rehearsed: false,
  agreement: "let-go-4e11",
  download: shared,
  goes: "The client stops sharing it and deletes its files.",
};

/** The shared download let go. */
export const letGone: Let = {
  ...letOffer,
  gone: { name: shared.name, bytes: shared.bytes, rehearsed: false },
};
