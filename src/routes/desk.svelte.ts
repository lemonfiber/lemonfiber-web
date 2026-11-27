/**
 * Everything this tab has asked lemonfiber for, and the panels that ask.
 *
 * The records are one list, newest first, because a request is one request
 * whichever screen asked for it; each panel draws the part of the list that is
 * its own. Whether a request is in flight is one flag for the same reason, and
 * it silences every control that asks.
 *
 * A panel's asking awaiting a yes is the panel's own. It is withdrawn by the
 * answer no, and spent by the answer yes.
 *
 * Putting away the record of work that may still be running forgets the work's
 * name, so lemonfiber stops holding it for this page, and leaves the work
 * running.
 */
import type { Arguments } from "../api/acting";
import { forgetting } from "../api/redeeming";
import type { Asker, Asking, Family, Stopper } from "../lib/asker";
import { stoppingServices } from "../lib/inflight";
import { offeredStop } from "../lib/restarting";
import { runningUnder, type Work } from "../lib/work";
import { errands, type Holding, type Sender } from "./errands";
import { Interrupting } from "./interrupting.svelte";

/** What the desk is handed: where to ask, and what a finished record changes. */
export type Handed = Pick<
  Holding,
  "reaching" | "pausing" | "onrefused" | "here" | "settled"
>;

/** The records, whether a request is in flight, and the one way to send. */
export class Desk {
  /** Every record, newest first. */
  work = $state<readonly Work[]>([]);

  /** Whether a request is in flight. */
  busy = $state(false);

  /** Send one request, keep a record of it, and follow what it was named. */
  readonly send: Sender;

  /** What each act standing for a yes would interrupt. */
  readonly interrupting: Interrupting;

  readonly #handed: Handed;

  constructor(handed: Handed) {
    this.#handed = handed;
    this.interrupting = new Interrupting(handed);
    this.send = errands({
      ...handed,
      settled: (record) => {
        handed.settled(record);
        const stops = offeredStop(record)?.stops ?? [];
        if (stops.length > 0) {
          void this.interrupting.read(stoppingServices(stops));
        }
      },
      records: () => this.work,
      keep: (records) => {
        this.work = records;
      },
      busy: (sending) => {
        this.busy = sending;
      },
    });
  }

  /** Put one record away, forgetting the name of work that may still be running. */
  drop(id: string): void {
    const job = this.work
      .filter((one) => one.id === id)
      .map(runningUnder)
      .find((one) => one !== undefined);
    this.work = this.work.filter((one) => one.id !== id);
    if (job !== undefined) void this.#forget(job);
  }

  async #forget(job: string): Promise<void> {
    const handed = this.#handed;
    if ((await forgetting(handed.reaching(), job)) === "turned-away") {
      handed.onrefused();
    }
  }

  /**
   * Answer the offer one record stands for: put it away, and send the yes,
   * named as the asking it answers was, which is the record of what came of it
   * from then on.
   */
  async answer(
    record: Pick<Work, "id" | "scoped">,
    doing: Work["doing"],
    given: Arguments,
  ): Promise<void> {
    this.drop(record.id);
    await this.send(doing, record.scoped, given);
  }

  /** The records one family of requests owns. */
  of(owns: (doing: Work["doing"]) => boolean): readonly Work[] {
    return this.work.filter((one) => owns(one.doing));
  }
}

/** One family's asking awaiting a yes, and what its panel is handed. */
export class Asked<A extends Asking> {
  /** The asking awaiting a yes, where one is. */
  asked = $state<A | undefined>(undefined);

  readonly #desk: Desk;
  readonly #family: Family<A>;

  constructor(desk: Desk, family: Family<A>) {
    this.#desk = desk;
    this.#family = family;
  }

  /**
   * Ask for something, having asked about it first where nothing comes back
   * to read before agreeing. The same asking a second time is the yes.
   */
  async ask(asking: A): Promise<void> {
    const family = this.#family;
    const stopping = family.stops?.(asking);
    if (stopping !== undefined) void this.#desk.interrupting.read(stopping);
    if (
      family.question(asking) !== undefined &&
      !family.same(this.asked, asking)
    ) {
      this.asked = asking;
      return;
    }
    this.asked = undefined;
    await this.#desk.send(asking.doing, false, family.given(asking));
  }

  /** Everything the family's panel is given to act with. */
  get asker(): Asker<A> & Stopper {
    const desk = this.#desk;
    return {
      work: desk.of(this.#family.owns),
      asked: this.asked,
      busy: desk.busy,
      inflight: desk.interrupting.of,
      onask: (asking: A) => {
        void this.ask(asking);
      },
      onleave: () => {
        this.asked = undefined;
      },
      ondrop: (id: string) => {
        desk.drop(id);
      },
    };
  }
}
