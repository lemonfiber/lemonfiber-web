/**
 * What choosing a service to fill a capability came to, or would come to, in
 * lines a reader can carry.
 *
 * A choice is worked out before anything is written. Asked for without an
 * offer, it writes nothing and answers with what would fill the capability,
 * what fills it now, every service that asks for it, the setting it writes,
 * what the operator said about it, and, most of all, anything it would leave with
 * nothing filling it: a service filling two capabilities that is replaced for
 * one stops filling the other. The same lines are said in the past once the
 * choice is written.
 *
 * What lemonfiber writes into the report is its own and is passed through
 * unchanged. The words around it live in `messages/`.
 */
import type { ByKind } from "@lemonfiber/sdk-ts";
import { listed } from "./listed";
import * as m from "../paraglide/messages.js";

/** What a choice of filler came to, or would come to. */
export type Substituted = ByKind["substitution"]["data"];

/** The change itself. */
export type Substitution = Substituted["substitution"];

/** A choice of filler, line by line, said in the tense its report calls for. */
export function substitutedLines(report: Substituted): readonly string[] {
  const change = report.substitution;
  const done = report.applied;
  const { capability, now, was, why } = change;
  const lines = [
    done
      ? m.fill_did({ capability, service: now })
      : m.fill_would({ capability, service: now }),
    was === undefined || was === null
      ? m.fill_was_nothing()
      : m.fill_was({ service: was }),
  ];
  if (change.asked_by.length > 0) {
    lines.push(m.fill_asked_by({ services: listed(change.asked_by) }));
  }
  for (const left of change.leaves_unfilled) {
    const said = { by: left.by, capability: left.capability };
    lines.push(done ? m.fill_left(said) : m.fill_leaves(said));
  }
  lines.push(m.fill_setting({ setting: change.setting }));
  if (why !== undefined && why !== null && why !== "") {
    lines.push(m.fill_why({ why }));
  }
  return lines;
}
