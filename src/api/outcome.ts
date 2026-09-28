/**
 * What a finished action's envelope came to, sorted by the kind it names.
 *
 * Work answered at once and work redeemed later both end in the envelope the
 * equivalent command renders, so both are read here, the one way. The generated
 * types are what know which payload goes with which kind, and a payload read
 * under the wrong one is fields with changed meanings — so an envelope naming a
 * kind nothing here reads is kept as unread rather than guessed at.
 */
import { isKind, type Envelope } from "@lemonfiber/sdk-ts";
import type { Came } from "../lib/came";

/**
 * What one envelope says a piece of work came to.
 */
export function outcomeOf(envelope: Envelope<unknown>): Came {
  if (isKind(envelope, "lifecycle")) {
    return { kind: "lifecycle", report: envelope.data };
  }
  if (isKind(envelope, "seed")) return { kind: "seed", report: envelope.data };
  return { kind: "unread" };
}
