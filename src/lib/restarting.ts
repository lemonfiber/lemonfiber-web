/**
 * Restarting the forms chosen, read first.
 *
 * A restart takes every service it reaches away from whoever is using it while
 * it comes back, so it is not sent at once. Pressing it rehearses it: lemonfiber
 * changes nothing and answers with the services it would restart, under an
 * offer naming them. The yes is the restart itself, carrying that offer back,
 * so lemonfiber restarts exactly the services that were read, or refuses before
 * anything restarts where they have changed since.
 */
import type { Arguments } from "../api/acting";
import type { Work } from "./work";

/** A rehearsed restart standing for a yes, and the record it came on. */
export interface Offered {
  /** The record, which is what answering the offer puts away. */
  readonly id: string;
  /** Whether it named forms, which the yes is named by as well. */
  readonly scoped: boolean;
  /** The forms it was rehearsed against, which the yes names again. */
  readonly forms: readonly string[];
  /** Every service it would restart, in the order the stack declares them. */
  readonly services: readonly string[];
  /** The name the offer gave itself, which the yes carries. */
  readonly offer: string;
}

/** What pressing restart sends: the forms chosen, rehearsed. */
export function rehearsingRestart(chosen: readonly string[]): Arguments {
  return { forms: chosen, dry_run: true };
}

/**
 * The restart a record offers, where it is one: a rehearsal that came back with
 * the services it would restart, under an offer.
 */
export function offeredRestart(work: Work): Offered | undefined {
  if (work.doing !== "restart" || work.at !== "done") return undefined;
  if (work.came.kind !== "lifecycle") return undefined;
  const { report } = work.came;
  const offer = report.offer ?? undefined;
  if (!report.rehearsed || offer === undefined) return undefined;
  return {
    id: work.id,
    scoped: work.scoped,
    forms: report.plan.forms,
    services: report.plan.services,
    offer,
  };
}

/** What the yes sends: the forms it was read against, and the offer read. */
export function agreedRestart(offered: Offered): Arguments {
  return { forms: offered.forms, offer: offered.offer };
}
