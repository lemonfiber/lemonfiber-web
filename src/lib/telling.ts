/**
 * The ways a member may be told that something they asked for is ready, as the
 * operator offered them, and which of them this member is told on.
 */
import type { ByKind } from "@lemonfiber/sdk-ts";
import * as m from "../paraglide/messages.js";

/** The ways offered, which of them the member is told on, and whether their phone is set up. */
export type Telling = ByKind["notify-mine"]["data"];

/** One way offered. */
export type Offered = Telling["offered"][number];

/** Every way the member is told on once `id` is switched the other way. */
export function toggled(
  offered: readonly Offered[],
  id: string,
): readonly string[] {
  return offered
    .filter((one) => (one.id === id ? !one.receiving : one.receiving))
    .map((one) => one.id);
}

/** Whether the member's own phone is set up to be told, in their words. */
export function phoneOf(telling: Telling): string {
  return telling.phone ? m.member_tell_phone() : m.member_tell_no_phone();
}
