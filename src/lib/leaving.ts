/**
 * Everything that leaves this machine, in lines a reader can carry.
 *
 * Two accounts in one reading. lemonfiber's own requests come in a fixed set,
 * each with where it goes as this machine is configured, exactly what travels,
 * whether the settings allow it, the setting that switches it off and what
 * stops working once it is off. The stack's services' requests come attributed
 * to the service, with where they go and what they ask for. A service
 * lemonfiber ships no record for is listed anyway and says so, because a short
 * list that looks complete is the wrong answer to this question.
 *
 * What lemonfiber writes into the reading is its own and is passed through
 * unchanged. The words around it live in `messages/`.
 */
import type { ByKind } from "@lemonfiber/sdk-ts";
import { listed } from "./listed";
import * as m from "../paraglide/messages.js";

/** Everything that leaves this machine. */
export type Leaving = ByKind["outbound"]["data"];

/** One request lemonfiber makes on its own account. */
export type Ours = Leaving["ours"][number];

/** One request a service the stack runs makes. */
export type Theirs = Leaving["theirs"][number];

/** One of lemonfiber's own requests, line by line. */
export function oursLines(one: Ours): readonly string[] {
  return [
    one.destination.length === 0
      ? m.outbound_ours_nowhere()
      : m.outbound_ours_goes({ destination: listed(one.destination) }),
    m.outbound_sends({ sends: one.sends }),
    one.allowed
      ? m.outbound_allowed({ setting: one.switch })
      : m.outbound_off({ setting: one.switch }),
    m.outbound_cost({ cost: one.cost }),
  ];
}

/** Whose request a service's is, in a few words. */
export function wordOfWhose(origin: Theirs["origin"]): string {
  switch (origin.origin) {
    case "bundled":
    case "operator":
      return m.outbound_whose_stack();
    case "plugin":
    case "overridden":
    case "orphaned":
      return m.outbound_whose_plugin({ named: origin.named });
    case "unknown":
      return m.outbound_whose_unknown({ why: origin.why });
    default:
      return m.outbound_whose_other();
  }
}

/** One request a service the stack runs makes, line by line. */
export function theirsLines(one: Theirs): readonly string[] {
  const lines = [
    one.destination === ""
      ? m.outbound_theirs_nowhere()
      : m.outbound_theirs_goes({ destination: one.destination }),
    one.purpose,
    wordOfWhose(one.origin),
  ];
  if (!one.recorded) lines.push(m.outbound_unrecorded());
  return lines;
}

/** The value a reach setting takes to let its request leave the machine. */
const REACH_ON = "on";

/** The value a reach setting takes to keep its request on the machine. */
const REACH_OFF = "off";

/** The setting that switches one of lemonfiber's own requests, and the value that flips it. */
export function flipOf(one: Ours): {
  readonly key: string;
  readonly value: string;
} {
  return { key: one.switch, value: one.allowed ? REACH_OFF : REACH_ON };
}
