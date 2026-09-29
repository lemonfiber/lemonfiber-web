/**
 * Taking lemonfiber's own things off this machine, and how the asking reads.
 *
 * Two requests, each named as the command line names it, and each asked for
 * twice. Forgetting, unconfirmed, removes nothing and answers with everything
 * lemonfiber keeps and where; the yes is the same request, confirmed, under
 * that listing. A removal is one of four, from stopping the stack to taking
 * the media with it. Unconfirmed it removes nothing and answers with every line
 * it reaches, what it keeps and why, and a name for that listing; the yes is
 * the same removal, confirmed, carrying that name, so what is agreed to is
 * what was read. Where something is still coming down, the yes also carries
 * whether it is let finish first.
 */
import type { Arguments } from "../api/acting";
import { sameDoing, type Asker, type Family } from "./asker";
import type { Came } from "./came";
import { everyTier, type Tier } from "./removed";
import type { Removing, Requested, Work } from "./work";

/** Every request the removal panel makes. */
export const everyRemoving: readonly Removing[] = ["forget", "uninstall"];

/** Whether a record is of something the removal panel asked for. */
export function isRemoving(doing: Requested): doing is Removing {
  const removing: readonly Requested[] = everyRemoving;
  return removing.includes(doing);
}

/** The removal a value names, or the one given where it names none. */
export function tierChosen(value: string, fallback: Tier): Tier {
  return everyTier.find((one) => one === value) ?? fallback;
}

/** One asking. */
export type Remove =
  /** Everything lemonfiber keeps, with nothing removed. */
  | { readonly doing: "forget" }
  /** All of it removed, agreed to under that listing. */
  | { readonly doing: "forget"; readonly confirm: true }
  /** What one removal would reach, with nothing removed. */
  | { readonly doing: "uninstall"; readonly tier: Tier }
  /** That removal carried out, agreed to under the listing it named. */
  | {
      readonly doing: "uninstall";
      readonly tier: Tier;
      readonly offer: string;
      readonly wait: boolean;
    };

/** What to send for one asking. */
export function givenForRemove(remove: Remove): Arguments {
  if (remove.doing === "forget") {
    return "confirm" in remove ? { confirm: true } : {};
  }
  if (!("offer" in remove)) return { tier: remove.tier };
  return {
    tier: remove.tier,
    confirm: true,
    offer: remove.offer,
    wait: remove.wait,
  };
}

/** How the removal panel's requests are asked for. */
export const removing: Family<Remove> = {
  owns: isRemoving,
  question: () => undefined,
  given: givenForRemove,
  same: sameDoing,
};

/**
 * Whether what a piece of work came to took something off the disk, which
 * changes what the disk screen reads.
 */
export function changedTheDisk(came: Came): boolean {
  if (came.kind === "stored") return came.report.removal.state === "done";
  if (came.kind !== "uninstall") return false;
  const { state } = came.report.removal;
  return state === "complete" || state === "partial";
}

/** A listing standing for a yes, and the record it came on. */
export interface Listed {
  /** The record, which is what putting the listing away puts away. */
  readonly id: string;
}

/**
 * The listing of what forgetting would remove, where one stands: the newest
 * forget asked for, answered with nothing removed for want of a yes.
 */
export function standingForget(work: readonly Work[]): Listed | undefined {
  const newest = work.find((one) => one.doing === "forget");
  if (newest?.at !== "done" || newest.came.kind !== "stored") return undefined;
  if (newest.came.report.removal.state !== "unconfirmed") return undefined;
  return { id: newest.id };
}

/** A removal's listing standing for a yes. */
export interface Surveyed extends Listed {
  /** Which removal it lists. */
  readonly tier: Tier;
  /** The name the listing gave itself, which the yes carries. */
  readonly offer: string;
  /** What is still coming down, which the removal would interrupt. */
  readonly coming: readonly string[];
  /** What everything going takes up, in bytes. */
  readonly bytes: number;
}

/**
 * The listing of what a removal would reach, where one stands: the newest
 * removal asked for, answered with nothing removed.
 */
export function standingRemoval(work: readonly Work[]): Surveyed | undefined {
  const newest = work.find((one) => one.doing === "uninstall");
  if (newest?.at !== "done" || newest.came.kind !== "uninstall") {
    return undefined;
  }
  const { manifest, removal } = newest.came.report;
  if (removal.state !== "surveyed") return undefined;
  return {
    id: newest.id,
    tier: manifest.tier,
    offer: manifest.agreement,
    coming: manifest.coming.map((one) => one.name),
    bytes: manifest.bytes,
  };
}

/**
 * Everything the removal panel is given to act with, and what pressing its
 * controls asks for.
 */
export type Remover = Asker<Remove>;
