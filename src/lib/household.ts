/**
 * The household as the operator sees it: its policy, its people and what each
 * may ask for, in the words this interface already has.
 *
 * The words live in `messages/`, so no screen holds one.
 */
import type {
  Allowed,
  Asked,
  Membership,
  Person,
  Policy,
  Restriction,
  Unrated,
} from "./wire";
import {
  kindOfRequest,
  nameOfRequest,
  standingOf,
  waitingStates,
} from "./standing";
import * as m from "../paraglide/messages.js";

/** Every policy a house can be in, in the order the contract declares them. */
export const everyPolicy: readonly Policy[] = [
  "trusted",
  "within-a-limit",
  "everything-waits",
];

/** Every standing a person can have against what their period allows. */
export const everyAllowed: readonly Allowed[] = [
  "unlimited",
  "within-quota",
  "near-quota",
  "quota-exhausted",
];

/** Every place an account can stand, in the order the contract declares them. */
export const everyMembership: readonly Membership[] = [
  "invited",
  "expired",
  "declined",
  "active",
  "suspended",
];

/** Everything one person can be held to, in one word. */
export const everyRestriction: readonly Restriction[] = [
  "unrestricted",
  "rating-limited",
  "library-limited",
  "both",
  "inconsistent",
];

/** Both answers to what becomes of content nothing has rated. */
export const everyUnrated: readonly Unrated[] = ["held-back", "let-through"];

/**
 * What happens to what the house asks for, as a sentence.
 *
 * A policy the request service could not be asked for is said as that rather
 * than as a house nobody limits, which is the opposite reading.
 */
export function saidOfPolicy(policy: Policy | null | undefined): string {
  if (policy === null || policy === undefined)
    return m.household_policy_unread();

  switch (policy) {
    case "trusted":
      return m.household_policy_trusted();
    case "within-a-limit":
      return m.household_policy_within_a_limit();
    case "everything-waits":
      return m.household_policy_everything_waits();
    default:
      return m.household_policy_unrecognised();
  }
}

/** What a policy is called where it is one choice among the others. */
export function labelOfPolicy(policy: Policy): string {
  switch (policy) {
    case "trusted":
      return m.policy_label_trusted();
    case "within-a-limit":
      return m.policy_label_within_a_limit();
    case "everything-waits":
      return m.policy_label_everything_waits();
    default:
      return m.policy_label_other();
  }
}

/**
 * Where one person stands against what their period allows them.
 */
export function wordOfAllowed(standing: Allowed): string {
  switch (standing) {
    case "unlimited":
      return m.quota_no_limit();
    case "within-quota":
      return m.quota_within();
    case "near-quota":
      return m.quota_near();
    case "quota-exhausted":
      return m.quota_exhausted();
    default:
      return m.quota_unrecognised();
  }
}

/**
 * What one person is held to, in one phrase.
 */
export function wordOfRestriction(restriction: Restriction): string {
  switch (restriction) {
    case "unrestricted":
      return m.held_unrestricted();
    case "rating-limited":
      return m.held_rating_limited();
    case "library-limited":
      return m.held_library_limited();
    case "both":
      return m.held_both();
    case "inconsistent":
      return m.held_inconsistent();
    default:
      return m.held_unrecognised();
  }
}

/**
 * What becomes of content the media server has no rating for.
 */
export function wordOfUnrated(unrated: Unrated): string {
  switch (unrated) {
    case "held-back":
      return m.unrated_held_back();
    case "let-through":
      return m.unrated_let_through();
    default:
      return m.unrated_unrecognised();
  }
}

/**
 * What is said beside one person's name, or nothing where there is nothing to
 * say.
 *
 * Read from where the account stands rather than put together from the
 * fields beside it. An account the media server switched off after too many
 * wrong passwords reads, on every other field, like one that works, and an
 * invitation that ran out reads like one still open. Anything but an account
 * that can sign in outranks administering the media server, which is a
 * standing an account that cannot be used does not exercise.
 */
export function tagOfPerson(person: Person): string | undefined {
  switch (person.standing) {
    case "invited":
      return m.person_not_taken_up();
    case "expired":
      return m.person_ran_out();
    case "declined":
      return m.person_declined();
    case "suspended":
      return m.person_switched_off();
    case "active":
      return person.access.administrator ? m.person_administers() : undefined;
    default:
      return m.person_unrecognised();
  }
}

/**
 * What one person may watch, and whether anybody has ever arrived as them.
 *
 * What becomes of content nothing has rated is said for everybody a limit
 * touches: a restricted member missing half the library is either that setting
 * or a defect, and an operator cannot tell which from silence.
 *
 * When the media server last saw them is carried unparsed and is not read out
 * as a span. The media server keeps its own clock, and a span worked out
 * against the wrong one says something this page cannot stand behind.
 */
export function saidOfAccess(person: Person): string {
  const held = person.access.restriction;
  const said = [wordOfRestriction(held)];

  if (held !== "unrestricted") said.push(wordOfUnrated(person.access.unrated));
  if ((person.last_seen ?? undefined) === undefined)
    said.push(m.person_never_seen());

  return said.join(" ");
}

/**
 * What one person's period has left of what it allows them.
 *
 * The request service keeps films and television apart, and television is
 * counted a season at a time, so the two counts are never folded into one
 * figure here. Where they stand over both is the answer the contract carries
 * for exactly this, and it is what a row shows.
 */
export function allowanceOf(person: Person): string {
  const asking = person.asking ?? undefined;
  return asking === undefined
    ? m.quota_not_read()
    : wordOfAllowed(asking.standing);
}

/** One person in the house, as the row that stands for them sets it out. */
export interface Shown {
  /** Who they are. */
  readonly name: string;
  /** A word beside the name, where there is one to say. */
  readonly tag: string | undefined;
  /** What they may watch, and whether anybody has arrived as them. */
  readonly prose: string;
  /** Where they stand against what their period allows. */
  readonly quota: string;
}

/**
 * One person, and everything the row that stands for them sets out.
 */
export function shownOf(person: Person): Shown {
  return {
    name: person.name,
    tag: tagOfPerson(person),
    prose: saidOfAccess(person),
    quota: allowanceOf(person),
  };
}

/** One thing the house asked for that nobody has finished ruling on. */
export interface Outstanding {
  /** Tells this row from the others. Never shown. */
  readonly key: string;
  /** Who asked for it. */
  readonly who: string;
  /** What they asked for. */
  readonly what: string;
  /** The kind of thing it is, where the name is not already the kind. */
  readonly kind: string | undefined;
  /** Where it stands, in the words the person who asked would use. */
  readonly standing: string;
  /** How long it has been waiting on somebody, where the service dated it. */
  readonly since: string | undefined;
}

/**
 * Whether a request is one nobody in the house can move on their own.
 */
function waits(request: Asked): boolean {
  const state = request.state ?? undefined;
  return state !== undefined && waitingStates.includes(state);
}

/**
 * How long one request has been waiting on somebody, where it was dated.
 */
function sinceOf(request: Asked): string | undefined {
  const days = request.waiting_days ?? undefined;
  return days === undefined ? undefined : m.waiting_days({ days });
}

/**
 * Everything the house asked for that is waiting on the operator, member by
 * member and newest first within each.
 *
 * A request nobody has ruled on and one that failed after somebody did are the
 * two nobody in the house can move, and they are what this panel exists to put
 * in front of the operator before somebody comes to complain.
 */
export function waitingOn(members: readonly Person[]): readonly Outstanding[] {
  return members.flatMap((member) =>
    member.requests.filter(waits).map((request): Outstanding => ({
      key: `${member.name}:${request.id}`,
      who: member.name,
      what: nameOfRequest(request),
      kind: kindOfRequest(request),
      standing: standingOf(request),
      since: sinceOf(request),
    })),
  );
}
