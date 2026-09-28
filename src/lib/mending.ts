/**
 * Putting right what the checks found, and how the asking reads.
 *
 * Four requests, each named as the command line names it. Seeing what can be
 * put right costs nothing, so it is asked for at once, and what comes back is
 * the offer: what each repair would do, what else it changes, and whether it
 * can be put back. Only then is anything agreed to, and the agreement names
 * the offer it was read in and the repairs chosen from it, so lemonfiber can
 * refuse to spend it on an offer that has since moved on.
 *
 * The other three change something with nothing to read first, so each is
 * asked about on this screen before it is sent: the checks that take the
 * tunnel away to prove it comes back, accepting a warning as a deliberate
 * choice, and putting back the last repair.
 *
 * The words live in `messages/`. What lemonfiber writes into an offer is its
 * own and is passed through unchanged.
 */
import type { Arguments } from "../api/acting";
import type { Asker, Family } from "./asker";
import type { Came, Offered } from "./came";
import type { Mending, Question, Requested, Work } from "./work";
import * as m from "../paraglide/messages.js";

/** Every request the checks screen makes, in the order its controls show them. */
export const everyMending: readonly Mending[] = [
  "repair",
  "diagnose",
  "accept",
  "undo",
];

/** Whether a record is of something the checks screen asked for. */
export function isMending(doing: Requested): doing is Mending {
  const mending: readonly Requested[] = everyMending;
  return mending.includes(doing);
}

/** One asking, with whatever it names. */
export type Mend =
  /** What can be put right, with nothing changed. */
  | { readonly doing: "repair" }
  /** The repairs chosen from the offer they were read in. */
  | {
      readonly doing: "repair";
      readonly offer: string;
      readonly agreed: readonly string[];
    }
  /** The checks that disturb a running stack. */
  | { readonly doing: "diagnose" }
  /** One warning, accepted as a deliberate choice. */
  | { readonly doing: "accept"; readonly check: string; readonly title: string }
  /** The last repair, put back. */
  | { readonly doing: "undo" };

/**
 * What to send for one asking.
 *
 * Each field is one the named action's command takes. A field it has nowhere
 * to put is refused rather than dropped, so nothing else goes with it.
 */
export function givenForMend(mend: Mend): Arguments {
  switch (mend.doing) {
    case "repair":
      return "offer" in mend
        ? { confirm: true, offer: mend.offer, agreed: mend.agreed }
        : {};
    case "diagnose":
      return { disruptive: true };
    case "accept":
      return { check: mend.check };
    case "undo":
      return {};
  }
}

/**
 * What has to be agreed before an asking is sent, or nothing where what comes
 * back is the thing to read before agreeing.
 */
export function questionOfMend(mend: Mend): Question | undefined {
  switch (mend.doing) {
    case "repair":
      return undefined;
    case "diagnose":
      return {
        eyebrow: m.confirm_mend_eyebrow(),
        title: m.confirm_diagnose_title(),
        prose: m.confirm_diagnose_prose(),
        yes: m.action_diagnose_yes(),
      };
    case "accept":
      return {
        eyebrow: m.confirm_mend_eyebrow(),
        title: m.confirm_accept_title({ check: mend.title }),
        prose: m.confirm_accept_prose(),
        yes: m.action_accept_yes(),
      };
    case "undo":
      return {
        eyebrow: m.confirm_mend_eyebrow(),
        title: m.confirm_undo_title(),
        prose: m.confirm_undo_prose(),
        yes: m.action_undo_yes(),
      };
  }
}

/**
 * Whether two askings are the same request, which is what a yes has to be
 * about to be a yes to it.
 */
export function sameMend(one: Mend | undefined, other: Mend): boolean {
  if (one?.doing !== other.doing) return false;
  if (one.doing === "accept" && other.doing === "accept") {
    return one.check === other.check;
  }
  return true;
}

/**
 * Whether what a piece of work came to changed what the checks would find.
 *
 * An offer changes nothing, and neither does a run of the checks, which is a
 * finding in its own right. A repair carried out and a repair put back do.
 */
export function changedTheChecks(came: Came): boolean {
  if (came.kind === "undo") return true;
  return came.kind === "repair" && came.report.acted;
}

/** A standing offer, and the record it came back on. */
export interface Standing {
  /** The record, which is what putting the offer away puts away. */
  readonly id: string;
  /** What the offer named itself, which the agreement names back. */
  readonly agreement: string;
  /** What could be put right. */
  readonly offered: readonly Offered[];
}

/**
 * The offer standing on the screen, where one is.
 *
 * Only the newest repair counts. An offer asked for again replaces the one
 * before it, and one that has been answered — or is being answered — is no
 * longer an offer anybody can agree to.
 */
export function standingOffer(work: readonly Work[]): Standing | undefined {
  const newest = work.find((one) => one.doing === "repair");
  if (newest?.at !== "done") return undefined;
  const came = newest.came;
  if (came.kind !== "repair" || came.report.acted) return undefined;
  if (came.report.offered.length === 0) return undefined;
  return {
    id: newest.id,
    agreement: came.report.agreement,
    offered: came.report.offered,
  };
}

/** How the checks screen's requests are asked for. */
export const mending: Family<Mend> = {
  owns: isMending,
  question: questionOfMend,
  given: givenForMend,
  same: sameMend,
};

/**
 * Everything the checks screen is given to act with, and what pressing its
 * controls asks for.
 */
export interface Mender extends Asker<Mend> {
  /** The repairs chosen from the standing offer, by the check each answers. */
  readonly picked: readonly string[];
  /** What choosing a repair, or putting it back down, asks for. */
  readonly onpick: (check: string) => void;
}
