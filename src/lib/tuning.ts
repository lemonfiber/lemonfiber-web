/**
 * Putting the recorded quality choice back, and fetching the library again at
 * it, and how the asking reads.
 *
 * Two requests, each named as the command line names it. Putting the recorded
 * preset back over a config edited by hand replaces those edits, and the core
 * takes no argument that would show which lines go before they do, so it is
 * asked about before it is sent and the record afterwards lists what went.
 *
 * Fetching the library again is asked for twice. Unconfirmed it fetches
 * nothing and answers with what each kind of media would be fetched at and what
 * an hour of it takes; the yes is the same request, confirmed.
 *
 * The words live in `messages/`. What lemonfiber writes into a report is its
 * own and is passed through unchanged.
 */
import type { Arguments } from "../api/acting";
import { sameDoing, type Asker, type Family } from "./asker";
import type { Came } from "./came";
import type { Upgraded } from "./tuned";
import type { Question, Requested, Tuning, Work } from "./work";
import * as m from "../paraglide/messages.js";

/** Every request the quality panel makes. */
export const everyTuning: readonly Tuning[] = [
  "quality-reapply",
  "quality-upgrade",
];

/** Whether a record is of something the quality panel asked for. */
export function isTuning(doing: Requested): doing is Tuning {
  const tuning: readonly Requested[] = everyTuning;
  return tuning.includes(doing);
}

/** One asking, with whatever it names. */
export type Tune =
  /** The recorded preset, put back over the edits made by hand. */
  | { readonly doing: "quality-reapply" }
  /** What fetching the library again would cost, with nothing fetched. */
  | { readonly doing: "quality-upgrade" }
  /** The library fetched again, agreed to after reading what it costs. */
  | { readonly doing: "quality-upgrade"; readonly confirm: true };

/** What to send for one asking. */
export function givenForTune(tune: Tune): Arguments {
  return "confirm" in tune ? { confirm: true } : {};
}

/**
 * What has to be agreed before an asking is sent, or nothing where what comes
 * back is the thing to read before agreeing, or is itself the agreeing.
 */
export function questionOfTune(tune: Tune): Question | undefined {
  if (tune.doing !== "quality-reapply") return undefined;
  return {
    eyebrow: m.confirm_mend_eyebrow(),
    title: m.confirm_reapply_title(),
    prose: m.confirm_reapply_prose(),
    yes: m.action_reapply_yes(),
  };
}

/** How the quality panel's requests are asked for. */
export const tuning: Family<Tune> = {
  owns: isTuning,
  question: questionOfTune,
  given: givenForTune,
  same: sameDoing,
};

/**
 * Whether what a piece of work came to changed the choice in force, which is
 * what the quality panel draws.
 */
export function changedTheQuality(came: Came): boolean {
  return came.kind === "quality";
}

/** What fetching the library again would cost, and the record it came on. */
export interface Costed {
  /** The record, which is what putting the cost away puts away. */
  readonly id: string;
  /** Each kind of media, and what it would be fetched at. */
  readonly media: Upgraded["media"];
}

/**
 * The cost standing on the screen, where one is.
 *
 * Only the newest request to fetch again counts, and only one that fetched
 * nothing: a confirmed one is an outcome, not a cost to agree to.
 */
export function standingCost(work: readonly Work[]): Costed | undefined {
  const newest = work.find((one) => one.doing === "quality-upgrade");
  if (newest?.at !== "done") return undefined;
  const { came } = newest;
  if (came.kind !== "upgrade" || came.report.confirmed) return undefined;
  return { id: newest.id, media: came.report.media };
}

/**
 * Everything the quality panel is given to act with, and what pressing its
 * controls asks for.
 */
export type Tuner = Asker<Tune>;
