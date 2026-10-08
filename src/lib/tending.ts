/**
 * The operator's acts on the household, and how the asking reads.
 *
 * Five requests, each named as the command line names it. Offering somebody
 * an account is asked for twice: unconfirmed it makes nothing and answers with
 * the invitation it would make, and the yes is the same offer, confirmed, on
 * the terms that were read. Letting somebody set a new password takes the one
 * they have off, and nothing comes back to read first, so it is asked about
 * before it is sent. Saying what somebody, or the whole house, may ask for is
 * made at once and answered with the household as it now stands, and so is
 * letting a request through or turning it down, which needs a reason.
 *
 * The words live in `messages/`. What lemonfiber writes into a report is its
 * own and is passed through unchanged.
 */
import type { Arguments } from "../api/acting";
import type { Asker, Family } from "./asker";
import type { Came } from "./came";
import type { Handoff } from "./handoff";
import { everyPolicy } from "./household";
import { linesTyped } from "./upkeep";
import type { Policy } from "./wire";
import type { Question, Requested, Tending, Work } from "./work";
import * as m from "../paraglide/messages.js";

/** Every request the household panel makes. */
export const everyTending: readonly Tending[] = [
  "invite",
  "reissue",
  "household-allow",
  "household-approve",
  "household-decline",
  "household-handoff",
];

/** Whether a record is of something the household panel asked for. */
export function isTending(doing: Requested): doing is Tending {
  const tending: readonly Requested[] = everyTending;
  return tending.includes(doing);
}

/** What an offered account lets somebody watch. */
export interface Terms {
  /** The highest rating they may watch, where there is a limit. */
  readonly ageLimit: number | undefined;
  /** Whether what nothing has rated is held back from them. */
  readonly holdUnrated: boolean;
}

/** What somebody, or the whole house, may ask for. */
export interface Limits {
  /** Whose limits, or nobody's in particular for the whole house. */
  readonly name: string | undefined;
  /** What happens to what they ask for. */
  readonly policy: Policy;
  /** How many requests a period allows, where a limit applies. */
  readonly quota:
    { readonly requests: number; readonly days: number } | undefined;
}

/**
 * The terms an offer is made on, as typed, or nothing where the age typed is
 * not one. Nothing typed is no limit, and with no limit nothing is said about
 * what has no rating.
 */
export function termsTyped(
  age: string,
  holdUnrated: boolean,
): Terms | undefined {
  if (age.trim() === "") return { ageLimit: undefined, holdUnrated };
  const ageLimit = linesTyped(age);
  return ageLimit === undefined ? undefined : { ageLimit, holdUnrated };
}

/** An offer as typed, or nothing where it names nobody or its terms are not whole. */
export function offerTyped(
  name: string,
  terms: Terms | undefined,
): Extract<Tend, { doing: "invite" }> | undefined {
  const named = name.trim();
  if (named === "" || terms === undefined) return undefined;
  return { doing: "invite", name: named, terms };
}

/** The policy a value names, or the one given where it names none. */
export function policyChosen(
  value: string | null | undefined,
  fallback: Policy,
): Policy {
  return everyPolicy.find((one) => one === value) ?? fallback;
}

/**
 * A limit as typed, or nothing where it is not one.
 *
 * The two numbers go together or not at all: half a limit is a figure over no
 * period, or a period with no figure, and lemonfiber refuses it. Neither typed
 * is a choice of policy that names no limit.
 */
export function quotaTyped(
  requests: string,
  days: string,
): { readonly quota: Limits["quota"] } | undefined {
  if (requests.trim() === "" && days.trim() === "") return { quota: undefined };
  const counted = linesTyped(requests);
  const lasting = linesTyped(days);
  if (counted === undefined || lasting === undefined) return undefined;
  return { quota: { requests: counted, days: lasting } };
}

/** One asking, with whatever it names. */
export type Tend =
  /** What offering somebody an account would make, with nothing made. */
  | { readonly doing: "invite"; readonly name: string; readonly terms: Terms }
  /** The account offered, on the terms that were read. */
  | {
      readonly doing: "invite";
      readonly name: string;
      readonly terms: Terms;
      readonly confirm: true;
    }
  /** Somebody's password taken off, so they can set a new one. */
  | { readonly doing: "reissue"; readonly name: string }
  /** What somebody, or the whole house, may ask for. */
  | { readonly doing: "household-allow"; readonly limits: Limits }
  /** One request let through. */
  | {
      readonly doing: "household-approve";
      readonly request: number;
      readonly title: string;
    }
  /** One request turned down, and why. */
  | {
      readonly doing: "household-decline";
      readonly request: number;
      readonly title: string;
      readonly reason: string;
    }
  /** A code for one person's device, or how far their sign-in has got. */
  | { readonly doing: "household-handoff"; readonly name: string };

/** What an offer's terms send. */
function termsGiven(terms: Terms): Arguments {
  if (terms.ageLimit === undefined) return {};
  return {
    age_limit: terms.ageLimit,
    unrated: terms.holdUnrated ? "block" : "allow",
  };
}

/** What a limit sends. */
function limitsGiven(limits: Limits): Arguments {
  const named = limits.name === undefined ? {} : { name: limits.name };
  const quota =
    limits.quota === undefined
      ? {}
      : { requests: limits.quota.requests, days: limits.quota.days };
  return { ...named, policy: limits.policy, ...quota };
}

/** What to send for one asking. */
export function givenForTend(tend: Tend): Arguments {
  switch (tend.doing) {
    case "invite":
      return {
        name: tend.name,
        ...termsGiven(tend.terms),
        ...("confirm" in tend ? { confirm: true } : {}),
      };
    case "reissue":
      return { name: tend.name };
    case "household-allow":
      return limitsGiven(tend.limits);
    case "household-approve":
      return { request: tend.request };
    case "household-decline":
      return { request: tend.request, reason: tend.reason };
    case "household-handoff":
      return { name: tend.name };
  }
}

/**
 * What has to be agreed before an asking is sent, or nothing where what comes
 * back is the thing to read before agreeing, or the asking is the agreeing.
 */
export function questionOfTend(tend: Tend): Question | undefined {
  if (tend.doing !== "reissue") return undefined;
  return {
    eyebrow: m.confirm_mend_eyebrow(),
    title: m.confirm_reissue_title({ name: tend.name }),
    prose: m.confirm_reissue_prose(),
    yes: m.action_reissue_yes(),
  };
}

/**
 * Whether two askings are the same request about the same person. A new
 * password for somebody else is a different question, and a yes to one is no
 * yes to the other.
 */
export function sameTend(one: Tend | undefined, other: Tend): boolean {
  if (one?.doing !== "reissue" || other.doing !== "reissue") {
    return one?.doing === other.doing;
  }
  return one.name === other.name;
}

/** How the household panel's requests are asked for. */
export const tending: Family<Tend> = {
  owns: isTending,
  question: questionOfTend,
  given: givenForTend,
  same: sameTend,
};

/**
 * Whether what a piece of work came to changed the household, which is what
 * the requests screen draws.
 */
export function changedTheHousehold(came: Came): boolean {
  if (came.kind === "household") return true;
  return came.kind === "invitation" && !came.report.rehearsed;
}

/** An account described and not yet offered, and the record it came on. */
export interface Described {
  /** The record, which is what putting the description away puts away. */
  readonly id: string;
  /** Who it is for. */
  readonly name: string;
  /** The terms it was read on, which the yes sends again. */
  readonly terms: Terms;
}

/**
 * The invitation described on the screen, where one is.
 *
 * Only the newest offer counts, and only one that made nothing.
 */
export function standingInvitation(
  work: readonly Work[],
): Described | undefined {
  const newest = work.find((one) => one.doing === "invite");
  if (newest?.at !== "done") return undefined;
  const { came, given } = newest;
  if (came.kind !== "invitation" || !came.report.rehearsed) return undefined;
  const ageLimit = given.age_limit;
  return {
    id: newest.id,
    name: came.report.name,
    terms: { ageLimit, holdUnrated: given.unrated !== "allow" },
  };
}

/**
 * The newest hand-off answered for one person, where one has been: what the
 * panel draws their code and steps from.
 */
export function standingHandoff(
  work: readonly Work[],
  name: string,
): Handoff | undefined {
  for (const one of work) {
    if (one.doing !== "household-handoff" || one.given.name !== name) continue;
    if (one.at !== "done" || one.came.kind !== "handoff") return undefined;
    return one.came.report;
  }
  return undefined;
}

/**
 * Everything the household panel is given to act with, and what pressing its
 * controls asks for.
 */
export type Tender = Asker<Tend>;
