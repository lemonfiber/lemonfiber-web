/**
 * Choosing a quality, putting the recorded choice back, and fetching the
 * library again at it, and how the asking reads.
 *
 * Three requests, each named as the command line names it, and each read
 * before it is agreed to.
 *
 * A choice is a preset for everything or for one kind of media, or a format
 * for music, taken from what the reading offers and nothing else. Asked as a
 * rehearsal it records nothing and answers with what the choice means; where
 * this machine would have to transcode it in software the stack holds it, and
 * the yes then says it is chosen anyway.
 *
 * Putting the recorded preset back over a config edited by hand is rehearsed
 * too, and the rehearsal names each file it would replace with the lines that
 * go and the lines that land. The yes is the same request, not rehearsed.
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
import type { Tuned, Upgraded } from "./tuned";
import type { Requested, Tuning, Work } from "./work";

/** Every request the quality panel makes. */
export const everyTuning: readonly Tuning[] = [
  "quality-set",
  "quality-reapply",
  "quality-upgrade",
];

/**
 * The kind of media a choice is made in formats rather than presets for, as
 * the contract names the scope of the music choice.
 */
export const MUSIC = "music";

/** Whether a record is of something the quality panel asked for. */
export function isTuning(doing: Requested): doing is Tuning {
  const tuning: readonly Requested[] = everyTuning;
  return tuning.includes(doing);
}

/** A quality chosen: a preset or a format, and what it is for. */
export interface Choice {
  /** The preset, or the music format, as the reading offers it. */
  readonly preset: string;
  /** The kind of media it is for, or nothing where it is for everything. */
  readonly media_type: string | undefined;
}

/** One asking. */
export type Tune =
  /** What a choice would come to, with nothing recorded. */
  | ({ readonly doing: "quality-set"; readonly rehearse: true } & Choice)
  /** The choice recorded, agreed to after reading it, anyway where it was held. */
  | ({ readonly doing: "quality-set"; readonly confirm: boolean } & Choice)
  /** Which edits putting the recorded preset back would replace, with none replaced. */
  | { readonly doing: "quality-reapply"; readonly rehearse: true }
  /** The recorded preset, put back over the edits made by hand. */
  | { readonly doing: "quality-reapply" }
  /** What fetching the library again would cost, with nothing fetched. */
  | { readonly doing: "quality-upgrade" }
  /** The library fetched again, agreed to after reading what it costs. */
  | { readonly doing: "quality-upgrade"; readonly confirm: true };

/** What to send for a choice. */
function givenForChoice(choice: Choice): Arguments {
  return choice.media_type === undefined
    ? { preset: choice.preset }
    : { preset: choice.preset, media_type: choice.media_type };
}

/** What to send for one asking. */
export function givenForTune(tune: Tune): Arguments {
  const rehearsing = "rehearse" in tune ? { dry_run: true } : {};
  if (tune.doing === "quality-set") {
    const agreed = "confirm" in tune && tune.confirm ? { confirm: true } : {};
    return { ...givenForChoice(tune), ...agreed, ...rehearsing };
  }
  return "confirm" in tune ? { confirm: true } : rehearsing;
}

/** How the quality panel's requests are asked for. */
export const tuning: Family<Tune> = {
  owns: isTuning,
  question: () => undefined,
  given: givenForTune,
  same: sameDoing,
};

/**
 * Whether what a piece of work came to changed the choice in force, which is
 * what the quality panel draws. A rehearsal changed nothing.
 */
export function changedTheQuality(came: Came): boolean {
  return came.kind === "quality" && !came.report.rehearsed;
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

/** The newest rehearsal of one request, and what it answered. */
function rehearsalOf(
  work: readonly Work[],
  doing: Tuning,
):
  | { readonly id: string; readonly report: Tuned; readonly given: Arguments }
  | undefined {
  const newest = work.find((one) => one.doing === doing);
  if (newest?.at !== "done") return undefined;
  const { came } = newest;
  if (came.kind !== "quality" || !came.report.rehearsed) return undefined;
  return { id: newest.id, report: came.report, given: newest.given };
}

/** A choice read and standing for a yes, and the record it came on. */
export interface Weighed extends Choice {
  /** The record, which is what putting the choice away puts away. */
  readonly id: string;
  /** Whether the stack held it, so that the yes says it is chosen anyway. */
  readonly held: boolean;
}

/**
 * The choice standing on the screen, where one is: the newest one asked for,
 * answered with what it would come to and nothing recorded.
 */
export function standingChoice(work: readonly Work[]): Weighed | undefined {
  const read = rehearsalOf(work, "quality-set");
  if (read === undefined) return undefined;
  return {
    id: read.id,
    preset: read.given.preset ?? "",
    media_type: read.given.media_type,
    held: read.report.disposition === "held",
  };
}

/**
 * Putting the recorded preset back, read and standing for a yes, where it is:
 * the record it came on.
 */
export function standingReapply(work: readonly Work[]): string | undefined {
  return rehearsalOf(work, "quality-reapply")?.id;
}

/**
 * Everything the quality panel is given to act with, and what pressing its
 * controls asks for.
 */
export type Tuner = Asker<Tune>;
