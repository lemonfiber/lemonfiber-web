/**
 * What the operator is told about, in lines a reader can carry.
 *
 * One preset decides for every kind of event that has no exception of its own,
 * and lemonfiber says what that preset means. Each exception names the kind of
 * event and whether it is told whatever the preset says, or never told.
 *
 * What lemonfiber writes into the reading is its own and is passed through
 * unchanged. The words around it live in `messages/`.
 */
import type { ByKind } from "@lemonfiber/sdk-ts";
import * as m from "../paraglide/messages.js";

/** What the operator is told about. */
export type Alerts = ByKind["alerts"]["data"];

/** One kind of event set apart from the preset. */
export type Exception = Alerts["exceptions"][number];

/** The preset in force and what it means, line by line. */
export function presetLines(alerts: Alerts): readonly string[] {
  return [m.alerts_preset({ preset: alerts.preset }), alerts.means];
}

/** One kind of event set apart, in a sentence. */
export function exceptionLine(exception: Exception): string {
  return exception.wanted
    ? m.alerts_wanted({ kind: exception.kind })
    : m.alerts_unwanted({ kind: exception.kind });
}
