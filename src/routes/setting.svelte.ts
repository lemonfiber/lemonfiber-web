/**
 * The operator's first-run setup, as this tab holds it: where setup stands as
 * lemonfiber last said, whether a step is out, and what a refused step said.
 *
 * Nothing is kept here that lemonfiber does not keep: every step is answered
 * with where setup now stands, and that replaces whatever was held. The one
 * thing remembered is which credential was just sent, so what proving it came
 * to can name whose it was.
 */
import type { Reading } from "@lemonfiber/sdk-ts";
import { movedBy, standingOf } from "../api/setting";
import { turnedAway, type Reaching } from "../api/asking";
import type { Move, Proving, Wizard } from "../lib/wizard";

/** What setting up is handed: where to ask, and what a refused key asks for. */
export interface Handing {
  readonly reaching: () => Reaching;
  readonly onrefused: () => void;
}

export class Setting {
  /** Where setup stands as last read, or why it could not be read. */
  read = $state<Reading<Wizard> | undefined>(undefined);

  /** Whether a step is out, which silences every control. */
  busy = $state(false);

  /** What lemonfiber said refusing the last step, where it refused one. */
  said = $state<string | undefined>(undefined);

  /** The credential the last answer carried, where it carried one. */
  proving = $state<Proving | undefined>(undefined);

  /** Whether setup was written from this tab, which the next screen follows. */
  written = $state(false);

  readonly #handing: Handing;

  constructor(handing: Handing) {
    this.#handing = handing;
  }

  /** Where setup stands now. */
  readonly ask = async (): Promise<void> => {
    this.busy = true;
    const read = await standingOf(this.#handing.reaching());
    this.busy = false;
    if (turnedAway(read)) {
      this.#handing.onrefused();
      return;
    }
    this.read = read;
  };

  /**
   * Take one step. A refusal is said under the step and changes nothing else;
   * an answer replaces where setup stands.
   */
  readonly move = async (move: Move): Promise<void> => {
    this.busy = true;
    this.said = undefined;
    this.proving = provingOf(move);
    const walked = await movedBy(this.#handing.reaching(), move);
    this.busy = false;
    if (turnedAway(walked)) {
      this.#handing.onrefused();
      return;
    }
    if (!walked.ok) {
      this.said = walked.problem.message;
      return;
    }
    if (move.move === "apply" || move.move === "recover") {
      this.written = !walked.value.offered;
    }
    this.read = walked;
  };
}

/** The credential an answer carries, where it carries one. */
function provingOf(move: Move): Proving | undefined {
  if (move.move !== "answer") return undefined;
  const { answer } = move;
  if ("credentials" in answer && answer.credentials !== null)
    return "credentials";
  if ("provider" in answer && answer.provider !== null) return "provider";
  return undefined;
}
