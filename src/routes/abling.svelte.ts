/**
 * What the signed-in key can use, read once for the session.
 *
 * Read on the way into the console and held for as long as it is open. A key
 * turned away is passed on as every other refusal of the key. Until it is read,
 * and where it could not be, nothing is silenced.
 */
import type { Reading } from "@lemonfiber/sdk-ts";
import { ableOf } from "../api/abilities";
import { turnedAway, type Handing } from "../api/asking";
import type { Able } from "../lib/able";

/** What the signed-in key can use, once read. */
export class Abling {
  answer = $state<Reading<Able> | undefined>(undefined);

  readonly #handing: Handing;

  constructor(handing: Handing) {
    this.#handing = handing;
  }

  /** What was said of the key, or nothing where nothing was. */
  get able(): Able | undefined {
    return this.answer?.ok === true ? this.answer.value : undefined;
  }

  /** Ask what the signed-in key can use. */
  async read(): Promise<void> {
    const answer = await ableOf(this.#handing.reaching());
    if (turnedAway(answer)) this.#handing.onrefused();
    this.answer = answer;
  }
}
