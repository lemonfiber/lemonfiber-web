/**
 * The disk accounting, letting one download go, and taking back the room that
 * costs nothing, as a suite stands them in for a running lemonfiber.
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

/** Downloads nothing ever took, which cost nothing to take back. */
export const untaken: Reckoned["reclaimable"][number] = {
  category: { of: "orphaned" },
  reclaim: "the_easy_win",
  tally: {
    files: 3,
    logical: 2_147_483_648,
    physical: 2_147_483_648,
    shared: 0,
  },
};

/** Archives whose unpacked copy is the one in use. */
export const unpacked: Reckoned["reclaimable"][number] = {
  category: { of: "extracted" },
  reclaim: "already_have_it",
  tally: {
    files: 2,
    logical: 1_073_741_824,
    physical: 1_073_741_824,
    shared: 0,
  },
};

/** A download still being shared, which costs standing with its tracker. */
export const stillShared: Reckoned["reclaimable"][number] = {
  category: { of: "seeding" },
  reclaim: "at_the_cost_of_ratio",
  tally: { files: 1, logical: 1_073_741_824, physical: 0, shared: 1 },
};

/** The disk accounting, naming room that costs nothing and room that costs something. */
export const roomy: Reckoned = {
  ...reckoned,
  agreement: "space-7d41",
  reclaimable: [untaken, unpacked, stillShared],
};

/** Why one part could not be taken. */
export const busy = "The file is open in another program.";

/** What taking back the room that costs nothing took, all but one file of it. */
export const taken: NonNullable<Reckoned["reclaimed"]> = {
  rehearsed: false,
  bytes: 3_221_225_472,
  gone: ["/srv/downloads/stray.mkv", "/srv/downloads/film.rar"],
  left: [{ at: "/srv/downloads/open.mkv", why: busy }],
};

/** The room that costs nothing taken back. */
export const reclaimedRoom: Reckoned = { ...roomy, reclaimed: taken };
