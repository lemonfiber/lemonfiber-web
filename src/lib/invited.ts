/**
 * What offering somebody an account came to, and the household as an act on
 * it left it, in lines a record can carry.
 *
 * An invitation answers with the name they sign in as, the one address to send
 * them, how long the offer stands, and what it wrote on the account, including
 * whether the request service could be held to the same limit yet; unclaimed
 * offers withdrawn and reset accounts switched off on the way past are named
 * rather than done quietly. Saying what somebody may ask for, and letting a
 * request through or turning it down, answer with the household as it now
 * stands.
 *
 * What lemonfiber writes into a report, such as an address, a caution or what a
 * limit is and is not, is its own and is passed through unchanged. The words
 * around them live in `messages/`.
 */
import type { ByKind } from "@lemonfiber/sdk-ts";
import { saidOfPolicy, wordOfUnrated } from "./household";
import { listed } from "./listed";
import * as m from "../paraglide/messages.js";

/** An account offered to somebody, or what offering one would make. */
export type Invited = ByKind["invitation"]["data"];

/** The household as an act on it left it. */
export type Housed = ByKind["household"]["data"];

/** What was found where an offer was going. */
type Standing = Invited["standing"];

/** Whether the request service knows about somebody. */
type Linked = Invited["linked"];

/** What was found where an offer was going, in one line. */
function standingWords(name: string, standing: Standing): string {
  switch (standing) {
    case "made":
      return m.came_invite_made({ name });
    case "waiting":
      return m.came_invite_waiting({ name });
    case "joined":
      return m.came_invite_joined({ name });
    case "reset":
      return m.came_invite_reset({ name });
    default:
      return m.came_invite_other({ name });
  }
}

/** Whether the request service knows about them, where it does not yet. */
function linkedWords(linked: Linked): string | undefined {
  switch (linked) {
    case "made":
      return undefined;
    case "not-yet":
      return m.came_invite_unlinked();
    case "not-tried":
      return m.came_invite_untried();
    default:
      return m.came_invite_link_other();
  }
}

/** What offering somebody an account came to, line by line. */
export function invitationLines(report: Invited): readonly string[] {
  const lines = report.rehearsed
    ? [m.came_invite_would({ name: report.name })]
    : [standingWords(report.name, report.standing)];
  lines.push(
    m.came_invite_address({
      address: report.address,
      hours: String(report.hours),
    }),
  );
  if (report.caution !== undefined && report.caution !== null) {
    lines.push(report.caution);
  }
  const { applied } = report;
  if (applied !== undefined && applied !== null) {
    if (applied.limit !== undefined && applied.limit !== null) {
      lines.push(m.came_invite_limit({ limit: applied.limit }));
    }
    lines.push(wordOfUnrated(applied.unrated), applied.filtering);
    if (applied.requesting === "not-yet") {
      lines.push(m.came_invite_unheld());
    }
  }
  const linked = linkedWords(report.linked);
  if (linked !== undefined) lines.push(linked);
  if (report.withdrawn.length > 0) {
    lines.push(m.came_invite_withdrawn({ names: listed(report.withdrawn) }));
  }
  if (report.suspended.length > 0) {
    lines.push(m.came_invite_suspended({ names: listed(report.suspended) }));
  }
  return lines;
}

/** The household as an act on it left it, line by line. */
export function householdLines(report: Housed): readonly string[] {
  const lines = [saidOfPolicy(report.policy)];
  if (report.allows !== undefined && report.allows !== null) {
    lines.push(report.allows);
  }
  lines.push(...report.findings);
  return lines;
}
