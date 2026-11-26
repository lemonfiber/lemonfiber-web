/**
 * What each act standing for a yes would interrupt, as the stack last said.
 *
 * Each question that stops something asks again when it is put, so what it
 * names is what is coming down now. An answer is kept under what was asked
 * about, so two questions over different forms never read each other's.
 */
import type { Reading } from "@lemonfiber/sdk-ts";
import { SvelteMap } from "svelte/reactivity";
import { asked, turnedAway, type Handing } from "../api/asking";
import {
  stoppingKey,
  type InFlight,
  type InFlightOf,
  type Stopping,
} from "../lib/inflight";

export class Interrupting {
  readonly #readings = new SvelteMap<string, Reading<InFlight>>();

  readonly #asking: Handing;

  constructor(asking: Handing) {
    this.#asking = asking;
  }

  /** Ask what stopping this would interrupt, forgetting what was said before. */
  async read(stopping: Stopping): Promise<void> {
    const key = stoppingKey(stopping);
    this.#readings.delete(key);
    const answer = await asked(
      this.#asking.reaching(),
      "in-flight",
      "in-flight",
      {
        forms: [...stopping.forms],
        services: [...stopping.services],
      },
    );
    if (turnedAway(answer)) this.#asking.onrefused();
    this.#readings.set(key, answer);
  }

  /** What the stack said stopping this would interrupt, once it has answered. */
  readonly of: InFlightOf = (stopping) =>
    this.#readings.get(stoppingKey(stopping));
}
