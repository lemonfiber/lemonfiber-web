/**
 * What the stack wires to what, in lines a reader can carry.
 *
 * Every link runs from the service that asked. Most ask for a capability and
 * reach whatever fills it: the one service that claims it, every claimant where
 * the link asks for all of them, the one chosen where several claim it and a
 * choice is recorded, or nothing, where several claim it and nobody has chosen
 * or nothing claims it at all. A claimant a plugin brought is named as one. A
 * few links are kept to a named service, and say why. Every ask nothing fills
 * is named with what asked, under the links.
 *
 * What lemonfiber writes into the reading is its own and is passed through
 * unchanged. The words around it live in `messages/`.
 */
import type { ByKind } from "@lemonfiber/sdk-ts";
import { listed } from "./listed";
import * as m from "../paraglide/messages.js";

/** What the stack wires to what, and what nothing fills. */
export type Wiring = ByKind["wiring"]["data"];

/** One link, answered. */
export type Link = Wiring["wired"][number];

/** An ask nothing fills. */
export type Unfilled = Wiring["unfilled"][number];

/** An ask for a capability, and how it was settled. */
type Asked = Extract<Link["reaches"], { how: "asked" }>;

/** How an ask was settled, in a sentence. */
function settledLine(asked: Asked): string {
  const { settled } = asked;
  const services = listed(asked.services);
  switch (settled.settled) {
    case "outright":
      return m.wiring_outright({ services });
    case "each":
      return m.wiring_each({ services });
    case "contested":
      return m.wiring_contested({ claimants: listed(settled.claimants) });
    case "chosen":
      return settled.whose === "operator"
        ? m.wiring_chosen_by_you({ services, over: listed(settled.over) })
        : m.wiring_chosen_by_stack({ services, over: listed(settled.over) });
    case "unfilled":
      return m.wiring_unfilled();
    default:
      return m.wiring_settled_other();
  }
}

/** The claimants of an ask that a plugin brought, one sentence each. */
function broughtLines(asked: Asked): readonly string[] {
  const lines: string[] = [];
  for (const [service, origin] of Object.entries(asked.origins)) {
    if (
      origin.origin === "plugin" ||
      origin.origin === "overridden" ||
      origin.origin === "orphaned"
    ) {
      lines.push(m.wiring_brought({ service, named: origin.named }));
    }
  }
  return lines;
}

/** One link, line by line. */
export function linkLines(link: Link): readonly string[] {
  const { reaches } = link;
  if (reaches.how === "by-name") {
    return [m.wiring_by_name({ service: reaches.service, why: reaches.why })];
  }
  const lines = [
    m.wiring_asks({ capability: reaches.capability }),
    settledLine(reaches),
  ];
  if (reaches.settled.settled === "chosen") {
    const { why } = reaches.settled;
    if (why !== undefined && why !== null) lines.push(why);
  }
  lines.push(...broughtLines(reaches));
  return lines;
}

/** An ask nothing fills, in a sentence. */
export function unfilledLine(unfilled: Unfilled): string {
  return m.wiring_nothing_fills({
    by: unfilled.by,
    capability: unfilled.capability,
  });
}
