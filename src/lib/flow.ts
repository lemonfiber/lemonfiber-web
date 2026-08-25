/**
 * What the live connection is doing, and what a screen drawn from it may claim.
 *
 * A screen fed by a stream has a fourth thing to say beyond what any one panel
 * says: whether what is on it is what is true now. That belongs to the page
 * rather than to a panel, and the words for it live here.
 */
import type { Tone } from "./state";
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
