/**
 * Ending a third-party plugin's grant of another service's credential, and how
 * the asking reads.
 *
 * One request, named as the endpoint names it, asked for twice. Asked bare it
 * ends nothing and answers with its reading: the grant it would end, what would
 * restart, and the name that reading goes by. There is no bare yes. The yes is
 * the same request carrying that name, so what ends is what was read, or
 * lemonfiber refuses and says what moved.
 */
import type { Arguments } from "../api/acting";
import { sameDoing, type Asker, type Family } from "./asker";
import type { Came } from "./came";
import type { Inventory } from "./credentials";
import type { Revoked } from "./revoked";
import type { Revoking } from "./requested";
import type { Requested, Work } from "./work";

/** Every request the credentials panel makes. */
export const everyRevoking: readonly Revoking[] = ["credentials-revoke"];

/** Whether a record is of something the credentials panel asked for. */
export function isRevoking(doing: Requested): doing is Revoking {
  const revoking: readonly Requested[] = everyRevoking;
  return revoking.includes(doing);
}

/** The grant asked about: the plugin that holds it, and the credential it is of. */
interface Grant {
  readonly doing: "credentials-revoke";
  readonly plugin: string;
  readonly credential: string;
}

/** One asking. */
export type Revoke =
  /** What ending the grant would come to, with nothing ended. */
  | Grant
  /** The grant ended, agreed to under the reading that named itself. */
  | (Grant & { readonly offer: string });

/** What to send for one asking. */
export function givenForRevoke(revoke: Revoke): Arguments {
  const named = { plugin: revoke.plugin, credential: revoke.credential };
  return "offer" in revoke ? { ...named, offer: revoke.offer } : named;
}

/** How the credentials panel's requests are asked for. */
export const revoking: Family<Revoke> = {
  owns: isRevoking,
  question: () => undefined,
  given: givenForRevoke,
  same: sameDoing,
};

/**
 * Whether what a piece of work came to changed the grants, which changes what
 * the settings screen reads. A reading ended nothing.
 */
export function changedByRevoking(came: Came): boolean {
  return came.kind === "credentials" && !came.report.rehearsed;
}

/** A reading standing for a yes, and the record it came on. */
export interface Offered {
  /** The record, which is what putting the reading away puts away. */
  readonly id: string;
  /** The name the reading gave itself, which the yes carries. */
  readonly offer: string;
  /** The plugin that holds the grant. */
  readonly plugin: string;
  /** The credential the grant is of. */
  readonly credential: string;
  /** What ending it would come to. */
  readonly revoked: Revoked;
}

/** The reading a report holds for the grant asked about, where it holds one. */
function offeredOf(
  id: string,
  given: Work["given"],
  report: Inventory,
): Offered | undefined {
  const { revoked } = report;
  const { plugin, credential } = given;
  if (revoked === undefined || revoked === null) return undefined;
  if (plugin === undefined || credential === undefined) return undefined;
  return { id, offer: revoked.agreement, plugin, credential, revoked };
}

/**
 * The reading standing on the screen, where one is: the newest revoke asked
 * for, answered with its reading and nothing ended.
 */
export function standingRevoke(work: readonly Work[]): Offered | undefined {
  const newest = work.find((one) => isRevoking(one.doing));
  if (newest?.at !== "done" || newest.came.kind !== "credentials") {
    return undefined;
  }
  const { report } = newest.came;
  if (!report.rehearsed) return undefined;
  return offeredOf(newest.id, newest.given, report);
}

/**
 * Everything the credentials panel is given to act with, and what pressing
 * its controls asks for.
 */
export type Revoker = Asker<Revoke>;
