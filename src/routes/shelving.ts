/**
 * What one member can watch, asked of lemonfiber for the operator.
 *
 * Asked each time it is opened and kept by nobody here: a shelf is what the
 * media server shows that member now, and a limit changed a moment ago changes
 * it. Being turned away is passed on as every other refusal of the key.
 */
import type { Reading } from "@lemonfiber/sdk-ts";
import { asked, turnedAway, type Handing } from "../api/asking";
import type { Shelf } from "../lib/yours";

/** Asking what one member can watch. */
export type Shelving = (member: string) => Promise<Reading<Shelf>>;

/** A way of asking what one member can watch. */
export function shelving(handing: Handing): Shelving {
  return async (member: string) => {
    const answer = await asked(handing.reaching(), "held", "held", { member });
    if (turnedAway(answer)) handing.onrefused();
    return answer;
  };
}
