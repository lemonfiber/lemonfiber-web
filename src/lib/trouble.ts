/**
 * What something wrong weighs, where it stands with being fixed, and which way
 * it went.
 *
 * Three vocabularies the server uses about trouble wherever trouble appears: on
 * a check's verdict, on an item the one-line grading expands to, and on an
 * interruption the operator has already been told about. One reading of each,
 * so a warning on a finding and a warning on an alert cannot be drawn with
 * different weights on one screen.
 *
 * Nothing here decides anything. The word is the server's; what this chooses is
 * how loudly it is drawn and which sentence it reads as.
 *
 * Each of these reads a word off the wire, and a running lemonfiber's vocabulary
 * can be wider than the contract this build was generated against: the wire
 * version stays one number while words are added under it, so the version gate
 * passes and a word arrives that is not in the union. Every one of them says so
 * rather than falling off the end of its switch.
 */
import type { Affected, Alert, Verdict } from "./wire";
import type { Tone } from "./state";
import * as m from "../paraglide/messages.js";

/** How much something wrong matters. */
export type Severity = Affected["severity"];

/** Where something wrong stands with respect to being fixed. */
export type Fixing = Extract<Verdict, { outcome: "fail" }>["state"];

/** Which way an interruption went. */
export type Way = Alert["moment"];

/** Every weight there is, in the order the contract declares them. */
export const everySeverity: readonly Severity[] = [
  "advisory",
  "warning",
  "error",
  "critical",
];

/** Every standing there is, in the order the contract declares them. */
export const everyFixing: readonly Fixing[] = [
  "actionable",
  "guided",
  "remediable",
  "unknown",
  "suppressed",
];

/** Every way an interruption can go, in the order the contract declares them. */
export const everyWay: readonly Way[] = ["onset", "resolved"];

/**
 * How badly a weight wants the operator.
 *
 * Something broken and something whose consequences reach outside the machine
 * both want the operator now, and the interface has one weight for that. What
 * tells them apart is the word beside the mark, which says which of the two it
 * is.
 */
export function toneOfSeverity(severity: Severity): Tone {
  switch (severity) {
    case "advisory":
      return "calm";
    case "warning":
      return "watch";
    case "error":
    case "critical":
      return "alarm";
    default:
      return "calm";
  }
}

/**
 * How much it matters, in one word.
 */
export function wordOfSeverity(severity: Severity): string {
  switch (severity) {
    case "advisory":
      return m.severity_advisory();
    case "warning":
      return m.severity_warning();
    case "error":
      return m.severity_error();
    case "critical":
      return m.severity_critical();
    default:
      return m.severity_unrecognised();
  }
}

/**
 * Where it stands with being fixed, in one phrase.
 */
export function wordOfFixing(fixing: Fixing): string {
  switch (fixing) {
    case "actionable":
      return m.fixing_actionable();
    case "guided":
      return m.fixing_guided();
    case "remediable":
      return m.fixing_remediable();
    case "unknown":
      return m.fixing_unknown();
    case "suppressed":
      return m.fixing_suppressed();
    default:
      return m.fixing_unrecognised();
  }
}

/**
 * Whether a standing is one the operator has already set aside.
 *
 * A finding they declined is still unresolved, so it stays on the screen; what
 * it stops doing is competing with the ones nobody has answered yet. Read here
 * rather than compared against the word in a screen, so the one place that
 * knows the vocabulary is the one place that knows which of it is quiet.
 */
export function isSetAside(fixing: Fixing): boolean {
  return fixing === "suppressed";
}

/**
 * Which way it went, in one word.
 */
export function wordOfWay(way: Way): string {
  switch (way) {
    case "onset":
      return m.told_onset();
    case "resolved":
      return m.told_resolved();
    default:
      return m.told_unrecognised();
  }
}

/**
 * How loudly an interruption is drawn.
 *
 * A resolution carries the weight of what resolved, which is what makes "the
 * critical thing is over" worth the attention the critical thing had. It is
 * drawn calm all the same: the reading is about something that has stopped
 * being true, and a red row for it would send an operator after a condition
 * that is already gone.
 */
export function toneOfAlert(alert: Alert): Tone {
  return alert.moment === "resolved" ? "calm" : toneOfSeverity(alert.severity);
}
