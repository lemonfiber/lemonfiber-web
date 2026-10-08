/**
 * Asking where one item is, named as a person would name it.
 *
 * A trace is a reading rather than an action: it changes nothing, so it is
 * asked for as soon as it is named, and what it answered is kept until the
 * next one. Being turned away is passed on as every other refusal of the key.
 */
import type { Reading } from "@lemonfiber/sdk-ts";
import { asked, turnedAway, type Handing } from "../api/asking";
import type { Sought } from "../lib/finding";
import type { Traced } from "../lib/traced";

/** What the trace panel is handed to look something up with. */
export interface Tracer {
  /** Where the item looked up last is, or why that could not be read. */
  readonly reading: Reading<Traced> | undefined;
  /** Whether an item is being looked up, which silences the control. */
  readonly busy: boolean;
  /** What looking one item up asks for. */
  readonly onlook: (sought: Sought) => void;
}

/** Where the item looked up last is, and whether one is being looked up. */
export class Tracing {
  /** Where the item looked up last is, or why that could not be read. */
  reading = $state<Reading<Traced> | undefined>(undefined);

  /** Whether an item is being looked up. */
  busy = $state(false);

  readonly #asking: Handing;

  constructor(asking: Handing) {
    this.#asking = asking;
  }

  /** Ask where one item is. */
  async look(sought: Sought): Promise<void> {
    this.busy = true;
    const answer = await asked(this.#asking.reaching(), "trace", "trace", {
      term: sought.term,
      season: sought.season,
    });
    this.busy = false;
    if (turnedAway(answer)) this.#asking.onrefused();
    this.reading = answer;
  }

  /** What the trace panel is handed. */
  get tracer(): Tracer {
    return {
      reading: this.reading,
      busy: this.busy,
      onlook: (sought: Sought) => {
        void this.look(sought);
      },
    };
  }
}
