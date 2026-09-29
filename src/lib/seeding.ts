/**
 * Letting one completed download go, and how the asking reads.
 *
 * One request, named as the command line names it, asked for twice about one
 * download the disk accounting names. Without an offer it removes nothing and
 * answers with what letting it go costs, what goes with it, and a name for
 * that offer. There is no bare yes: the yes is the same request carrying that
 * name, so the client is asked to let go of what was read or lemonfiber
 * refuses.
 */
import type { Arguments } from "../api/acting";
import { sameDoing, type Asker, type Family } from "./asker";
import type { Came } from "./came";
import type { Requested, Seeding, Work } from "./work";

/** Every request the letting panel makes. */
export const everySeeding: readonly Seeding[] = ["stop-seeding"];

/** Whether a record is of something the letting panel asked for. */
export function isSeeding(doing: Requested): doing is Seeding {
  const letting: readonly Requested[] = everySeeding;
  return letting.includes(doing);
}

/** One asking, about one completed download. */
export type Letting =
  /** What letting it go would cost, with nothing let go. */
  | { readonly doing: "stop-seeding"; readonly download: string }
  /** It let go, agreed to under the offer that named itself. */
  | {
      readonly doing: "stop-seeding";
      readonly download: string;
      readonly offer: string;
    };

/** What to send for one asking. */
export function givenForLetting(letting: Letting): Arguments {
  return "offer" in letting
    ? { download: letting.download, offer: letting.offer }
    : { download: letting.download };
}

/** How the letting panel's request is asked for. */
export const lettingGo: Family<Letting> = {
  owns: isSeeding,
  question: () => undefined,
  given: givenForLetting,
  same: sameDoing,
};

/**
 * Whether what a piece of work came to let a download go, which changes what
 * the disk screen reads. An offer and a rehearsal let nothing go.
 */
export function changedBySeeding(came: Came): boolean {
  if (came.kind !== "stop-seeding") return false;
  const { gone } = came.report;
  return gone !== undefined && gone !== null && !gone.rehearsed;
}

/** An offer standing for a yes, and the record it came on. */
export interface Offered {
  /** The record, which is what putting the offer away puts away. */
  readonly id: string;
  /** Which download it is about, by the name both sides use. */
  readonly download: string;
  /** The name the offer gave itself, which the yes carries. */
  readonly offer: string;
}

/**
 * The offer standing on the screen, where one is: the newest letting go asked
 * for, answered with what it costs and nothing let go.
 */
export function standingOffer(work: readonly Work[]): Offered | undefined {
  const newest = work.find((one) => one.doing === "stop-seeding");
  if (newest?.at !== "done" || newest.came.kind !== "stop-seeding") {
    return undefined;
  }
  const { report } = newest.came;
  if (report.gone !== undefined && report.gone !== null) return undefined;
  return {
    id: newest.id,
    download: report.download.name,
    offer: report.agreement,
  };
}

/**
 * Everything the letting panel is given to act with, and what pressing its
 * controls asks for.
 */
export type Letter = Asker<Letting>;
