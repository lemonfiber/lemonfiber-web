/**
 * The services held back until the operator gives what they need to start,
 * said the one way status, the doctor and every rehearsal say them: each
 * service and everything it waits for, never with a value, and where in this
 * console a setting is given.
 */
import type { ByKind } from "@lemonfiber/sdk-ts";
import { nameOf } from "./route";
import * as m from "../paraglide/messages.js";

/** A service held back, with everything it waits for. */
export type Waiting = ByKind["status"]["data"]["waiting"][number];

/** One thing a service waits for. */
type Wanted = Waiting["wants"][number];

/** What one thing a service waits for is, never with its value. */
function wantedWords(wanted: Wanted): string {
  switch (wanted.kind) {
    case "setting": {
      const { setting, choices } = wanted;
      if (choices === undefined || choices === null) {
        return m.waits_setting({ setting });
      }
      return choices.length === 0
        ? m.waits_setting_no_choice({ setting })
        : m.waits_setting_choices({ setting, choices: choices.join(", ") });
    }
    case "secret":
      return m.waits_secret({ secret: wanted.secret });
    case "service":
      return m.waits_through({ service: wanted.service });
  }
}

/** The service and everything it waits for, as one sentence names them. */
export function waitingWords(one: Waiting): string {
  return m.waits_service({
    service: one.service,
    wants: one.wants.map(wantedWords).join("; "),
  });
}

/**
 * Where a setting is given, where one of `held` waits for one; nothing
 * otherwise.
 */
export function givingLine(held: readonly Waiting[]): string | undefined {
  return held.some((one) => one.wants.some((want) => want.kind === "setting"))
    ? m.waits_give_setting({
        panel: m.values_title(),
        screen: nameOf("settings"),
      })
    : undefined;
}

/**
 * Each service held back, then where to give a setting where one of them
 * waits for one; nothing where none is held back.
 */
export function waitingLines(held: readonly Waiting[]): readonly string[] {
  const giving = givingLine(held);
  return [...held.map(waitingWords), ...(giving === undefined ? [] : [giving])];
}

/**
 * What a record of an act says of what it left held back: the heading status
 * says it under, then each service and where to give a setting; nothing where
 * nothing is held back.
 */
export function heldLines(held: readonly Waiting[]): readonly string[] {
  return held.length === 0 ? [] : [m.waits_heading(), ...waitingLines(held)];
}

/**
 * What the settings view says of what a change leaves held back: the heading
 * status says it under, then each service, with no pointer to where a setting
 * is given, since that is where it is said; nothing where nothing is held
 * back.
 */
export function stillHeldLines(held: readonly Waiting[]): readonly string[] {
  return held.length === 0
    ? []
    : [m.waits_heading(), ...held.map(waitingWords)];
}
