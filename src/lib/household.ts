/**
 * What the household asked for, in the words this interface already has.
 *
 * Seven states, and no severity among them. Where a request stands is a stage
 * rather than a grading: nobody has said that a request turned down wants the
 * operator, or that one still waiting for approval is worse than one on its
 * way — so the word is the whole of what is shown, and a screen that tinted
 * these would be assigning a severity the server never assigned.
 *
 * The words live in `messages/`, so no screen holds one.
 */
import type {
  Allowed,
  Asked,
  Person,
  Policy,
  Request,
  RequestState,
  Restriction,
  Unrated,
} from "./wire";
import * as m from "../paraglide/messages.js";

/**
 * Every state a request can be in, in the order the contract declares them.
 *
 * A screen, a story and a test all walk this one list, as they do for states
 * and severities.
 */
export const everyRequestState: readonly RequestState[] = [
  "waiting-for-approval",
  "declined",
  "failed",
  "getting",
  "partly-here",
  "here",
  "gone",
];

/**
 * Where it stands, in the words the person who asked would use.
 */
export function wordOfRequestState(state: RequestState): string {
  switch (state) {
    case "waiting-for-approval":
      return m.request_state_waiting_for_approval();
    case "declined":
      return m.request_state_declined();
    case "failed":
      return m.request_state_failed();
    case "getting":
      return m.request_state_getting();
    case "partly-here":
      return m.request_state_partly_here();
    case "here":
      return m.request_state_here();
    case "gone":
      return m.request_state_gone();
    default:
      return m.request_state_unrecognised();
  }
}

/**
 * Where it stands, or that the request service reported something this build
 * has no word for.
 *
 * Two ways that happens. The service may say nothing at all, which the contract
 * allows; or it may say a word added to the vocabulary since this build's
 * contract was generated, which the wire version does not tell apart. Both read
 * as the same sentence, since both are the same thing to whoever is reading.
 */
export function standingOf(request: Request): string {
  const state = request.state ?? undefined;
  return state === undefined
    ? m.request_state_unrecognised()
    : wordOfRequestState(state);
}

/**
 * What to call it.
 *
 * A request no service holds yet has no title to show: one still waiting for
 * approval has been handed to nobody, so there is nothing to have been told a
 * name by. Naming it by what it is keeps the row honest rather than inventing
 * something to call it.
 */
export function nameOfRequest(request: Request): string {
  const title = request.title ?? undefined;
  if (title !== undefined) return title;

  const media = request.media ?? undefined;
  return media === undefined
    ? m.request_unnamed()
    : m.request_a_kind({ media });
}

/**
 * The kind of thing it is, set beside the name — or nothing, where the name is
 * already the kind or the request service named one this build does not know.
 */
export function kindOfRequest(request: Request): string | undefined {
  const media = request.media ?? undefined;
  const title = request.title ?? undefined;
  return title === undefined ? undefined : media;
}

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
 * The two states a request is in while it is waiting on the operator.
 *
 * One nobody has ruled on and one that failed after somebody did are the two
 * the person who asked cannot move on their own.
 */
export const waitingStates: readonly RequestState[] = [
  "waiting-for-approval",
  "failed",
];

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
 * An account nobody has set a password on is an invitation still open rather
 * than somebody who is here, and one that is switched off is held and unable
 * to sign in. Both outrank administering the media server, which is a standing
 * an account that cannot be used does not exercise.
 */
export function tagOfPerson(person: Person): string | undefined {
  if (person.access.disabled) return m.person_switched_off();
  if (!person.claimed) return m.person_not_taken_up();
  return person.access.administrator ? m.person_administers() : undefined;
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
      key: `${member.name}:${String(request.id)}`,
      who: member.name,
      what: nameOfRequest(request),
      kind: kindOfRequest(request),
      standing: standingOf(request),
      since: sinceOf(request),
    })),
  );
}
