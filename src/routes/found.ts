/**
 * What one household member's search found, and what asking came to, as
 * lemonfiber answers them for that member.
 *
 * Written against the generated contract rather than invented, and set in the
 * household the console's fixtures describe.
 */
import type { Asked, Found, FoundTitle } from "../lib/askable";

/** A film nobody has asked for yet. */
export const dune: FoundTitle = {
  id: "438631",
  kind: "movies",
  title: "Dune",
  year: 2021,
  stands: "askable",
};

/** A series the house holds some of. */
export const severance: FoundTitle = {
  id: "95396",
  kind: "tv",
  title: "Severance",
  year: 2022,
  stands: "partly-here",
};

/** A film somebody already asked for. */
export const duneTwo: FoundTitle = {
  id: "693134",
  kind: "movies",
  title: "Dune: Part Two",
  year: 2024,
  stands: "on-its-way",
};

/** A film the house already holds, filed under the number a series is too. */
export const arrivalFound: FoundTitle = {
  id: "95396",
  kind: "movies",
  title: "Arrival",
  stands: "here",
};

/** The first page of a search for "dune", with a page after it. */
export const firstPage: Found = {
  member: "Kit",
  term: "dune",
  kinds: ["movies", "tv"],
  approval:
    "What you ask for needs nobody's approval while you have allowance left.",
  asking: {
    films: { used: 2, limit: 5, remaining: 3, period: "a month" },
    television: { used: 1, limit: 5, remaining: 4, period: "a month" },
    policy: "within-a-limit",
    standing: "within-quota",
  },
  titles: [dune, severance, duneTwo],
  next: "page-2",
};

/** The page after it, the last. */
export const lastPage: Found = {
  ...firstPage,
  titles: [arrivalFound],
  next: null,
};

/** A search that found nothing. */
export const nothingFound: Found = {
  ...firstPage,
  term: "zzqx",
  titles: [],
  next: null,
};

/** What asking for Dune would come to. */
export const wouldAsk: Asked = {
  member: "Kit",
  title: dune.id,
  kind: "movies",
  outcome: "asked",
  rehearsed: true,
  released: true,
  seasons: [],
  leaves: { films: 2, television: 4 },
  said: "Asking for Dune needs nobody's approval, and leaves you 2 films this month.",
};

/** What asking for Dune came to. */
export const didAsk: Asked = {
  ...wouldAsk,
  rehearsed: false,
  said: "Dune is on its way. You have 2 films left this month.",
};
