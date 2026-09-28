/**
 * Asking lemonfiber to do something, and following it to what it came to.
 *
 * Every screen that acts asks the same way: one request, one record of it, and
 * where the work outlives the request, a name asked about until there is
 * something to say. The records and whether a request is in flight belong to
 * the console, which draws them; this is the asking and the following, handed
 * the console's own ways of reading and writing what it holds.
 *
 * The asking stops when the record it belongs to is put away, and when the
 * screen is. Neither is a reason to keep a request going, and a page nobody is
 * looking at must not be one of the reasons lemonfiber is asked anything.
 */
import { acting, type Arguments } from "../api/acting";
import type { Reaching } from "../api/asking";
import { BETWEEN_ASKS, redeeming, type Pausing } from "../api/redeeming";
import { recordAfter, recordOf, type Requested, type Work } from "../lib/work";

/** What the asking is handed: where to ask, and the console's own records. */
export interface Holding {
  /** Where to ask, as the console holds it now. */
  readonly reaching: () => Reaching;
  /** How a wait between two askings is taken. */
  readonly pausing: () => Pausing;
  /** What a refusal of the key asks for. */
  readonly onrefused: () => void;
  /** Whether the screen is still being looked at. */
  readonly here: () => boolean;
  /** The records, newest first. */
  readonly records: () => readonly Work[];
  /** Replace the records. */
  readonly keep: (work: readonly Work[]) => void;
  /** Say whether a request is in flight. */
  readonly busy: (busy: boolean) => void;
  /** What a record that came to an end changes elsewhere on the screen. */
  readonly settled: (record: Work) => void;
}

/** Sending one request, keeping a record of it and following it. */
export type Sender = (
  doing: Requested,
  scoped: boolean,
  given: Arguments,
) => Promise<void>;

/**
 * A way of asking for something that keeps a record and follows it.
 */
export function errands(holding: Holding): Sender {
  let counted = 0;

  const kept = (id: string): boolean =>
    holding.records().some((one) => one.id === id);

  async function follow(id: string, job: string): Promise<void> {
    let came = await redeeming(holding.reaching(), job);
    while (came.at === "running") {
      await holding.pausing()(BETWEEN_ASKS);
      if (!holding.here() || !kept(id)) return;
      came = await redeeming(holding.reaching(), job);
    }
    if (came.at === "turned-away") {
      holding.onrefused();
      return;
    }
    const after = came;
    holding.keep(
      holding
        .records()
        .map((one) => (one.id === id ? recordAfter(one, job, after) : one)),
    );
    holding
      .records()
      .filter((one) => one.id === id)
      .forEach(holding.settled);
  }

  return async (doing, scoped, given) => {
    holding.busy(true);
    const came = await acting(holding.reaching(), doing, given);
    holding.busy(false);
    if (came.at === "turned-away") {
      holding.onrefused();
      return;
    }
    counted += 1;
    const id = String(counted);
    const record = recordOf(id, doing, scoped, given, came);
    holding.keep([record, ...holding.records()]);
    if (came.at === "started") void follow(id, came.job);
    else holding.settled(record);
  };
}
