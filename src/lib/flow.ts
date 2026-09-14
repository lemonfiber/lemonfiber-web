/**
 * What the live connection is doing, and what a screen drawn from it may claim.
 *
 * A screen fed by a stream has a fourth thing to say beyond what any one panel
 * says: whether what is on it is what is true now. That belongs to the page
 * rather than to a panel, and the words for it live here.
 */
import type { Tone } from "./state";
import type { Telemetry } from "./wire";
import * as m from "../paraglide/messages.js";

/**
 * The four states one connection passes through.
 *
 * `opening` is the moment before anything has arrived, which is not the same as
 * a connection that failed. `stale` is a connection that carried figures and
 * then stopped: what is on the screen was true once. `lost` is one that never
 * carried any.
 */
export type Flow = "opening" | "live" | "stale" | "lost";

/**
 * Every state there is, in the order the type declares them.
 *
 * A screen, a story and a test all walk this one list, as they do for states
 * and severities.
 */
export const everyFlow: readonly Flow[] = ["opening", "live", "stale", "lost"];

/** What the page has to be told about its own connection. */
export interface Said {
  /** What happened, in one clause. */
  readonly lead: string;
  /** What it means for everything below it. */
  readonly prose: string;
}

/**
 * How badly the connection's own state wants the operator.
 *
 * Opening is neither good nor bad news; a screen that has stopped being current
 * is worth watching; one that never became current is the thing to act on.
 */
export function toneOfFlow(flow: Flow): Tone {
  switch (flow) {
    case "opening":
    case "live":
      return "calm";
    case "stale":
      return "watch";
    case "lost":
      return "alarm";
  }
}

/**
 * What the connection has to be told, or nothing where it is carrying.
 */
export function saidOfFlow(flow: Flow): Said | undefined {
  switch (flow) {
    case "live":
      return undefined;
    case "opening":
      return { lead: m.flow_opening_lead(), prose: m.flow_opening_prose() };
    case "stale":
      return { lead: m.flow_stale_lead(), prose: m.flow_stale_prose() };
    case "lost":
      return { lead: m.banner_contact_lead(), prose: m.banner_contact_prose() };
  }
}

/**
 * How badly lemonfiber's own reach wants the operator.
 *
 * A screen filled from a source that could read some of what it was asked for
 * is worth watching; one whose figures nothing is refreshing is the thing to
 * act on. A machine with nothing running and one with nothing set up are each
 * an ordinary place to be, and neither is a fault.
 */
export function toneOfTelemetry(telemetry: Telemetry): Tone {
  switch (telemetry) {
    case "live":
    case "no-stack":
    case "unconfigured":
      return "calm";
    case "degraded":
      return "watch";
    case "disconnected":
      return "alarm";
    default:
      return "calm";
  }
}

/**
 * What lemonfiber's own reach has to be told, or nothing where it has it all.
 *
 * The connection above this one is between the page and lemonfiber; this one is
 * between lemonfiber and what it reads the figures off. Both can be carrying
 * and only one of them can be, so a screen that says the live connection is
 * fine and nothing else would be current and wrong at the same time.
 */
export function saidOfTelemetry(telemetry: Telemetry): Said | undefined {
  switch (telemetry) {
    case "live":
      return undefined;
    case "degraded":
      return {
        lead: m.telemetry_degraded_lead(),
        prose: m.telemetry_degraded_prose(),
      };
    case "disconnected":
      return {
        lead: m.telemetry_disconnected_lead(),
        prose: m.telemetry_disconnected_prose(),
      };
    case "no-stack":
      return {
        lead: m.telemetry_none_lead(),
        prose: m.telemetry_none_prose(),
      };
    case "unconfigured":
      return {
        lead: m.telemetry_unset_lead(),
        prose: m.telemetry_unset_prose(),
      };
    default:
      return {
        lead: m.telemetry_unrecognised_lead(),
        prose: m.telemetry_unrecognised_prose(),
      };
  }
}
