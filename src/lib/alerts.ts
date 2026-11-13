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
import { listed } from "./listed";
import * as m from "../paraglide/messages.js";

/** What the operator is told about. */
export type Alerts = ByKind["alerts"]["data"];

/** One kind of event set apart from the preset. */
export type Exception = Alerts["exceptions"][number];

/** What sort of thing an alert tells the operator. */
export type Notification = Alerts["kinds"][number];

/** What sort of thing an alert tells, in a few words. */
function notificationWords(kind: Notification): string {
  switch (kind) {
    case "problem":
      return m.alerts_kind_problem();
    case "completion":
      return m.alerts_kind_completion();
    case "update":
      return m.alerts_kind_update();
    case "backup":
      return m.alerts_kind_backup();
    case "request":
      return m.alerts_kind_request();
    case "member":
      return m.alerts_kind_member();
    case "ready":
      return m.alerts_kind_ready();
    default:
      return m.alerts_kind_other();
  }
}

/** Which sorts of thing this stack tells about as it is set up, in a sentence. */
export function raisedLine(alerts: Alerts): string {
  return alerts.kinds.length === 0
    ? m.alerts_raised_none()
    : m.alerts_raised({ kinds: listed(alerts.kinds.map(notificationWords)) });
}

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
