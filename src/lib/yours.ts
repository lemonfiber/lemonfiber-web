/**
 * What a household member is told about themselves, in the words they read it in.
 *
 * Everything here is a reading of what lemonfiber answered about the member who
 * asked. Nothing is worked out beside it: whether asking needs approval is the
 * policy the request service is in, what is left is the count it keeps, and what
 * they may watch is what the media server holds them to. A field that did not
 * arrive is said as unread rather than filled with the answer it most often
 * has, since an unread limit and no limit are opposite facts.
 *
 * The words live in `messages/`, so no screen holds one.
 */
import type { ByKind } from "@lemonfiber/sdk-ts";
import type { Access, Allowance, Request } from "./wire";
import { getLocale } from "../paraglide/runtime.js";
import { listed } from "./listed";
import * as m from "../paraglide/messages.js";

/** What one member can watch, as the shelf read answers it for them. */
export type Shelf = ByKind["held"]["data"];

/** One thing on the shelf. */
export type Holding = Shelf["holdings"][number];

/** Which kind of thing one holding is. */
export type Medium = Holding["medium"];

/** One of the two counts a period keeps. */
export type Counted = Allowance["films"];

/**
 * Whether what they ask for waits for somebody to approve it.
 */
export function approvalOf(asking: Allowance): string {
  switch (asking.policy) {
    case "trusted":
      return m.member_approval_none();
    case "within-a-limit":
      return m.member_approval_within();
    case "everything-waits":
      return m.member_approval_needed();
    default:
      return m.member_approval_unrecognised();
  }
}

/**
 * Whether they have allowance left, and how much.
 *
 * Films and television are counted apart and television a season at a time, so
 * both counts are said rather than folded into one figure.
 */
export function leftOf(asking: Allowance): string {
  switch (asking.standing) {
    case "unlimited":
      return m.member_allowance_unlimited();
    case "within-quota":
    case "near-quota":
      return m.member_allowance_left({
        films: countOf(asking.films, m.member_what_films()),
        television: countOf(asking.television, m.member_what_seasons()),
      });
    case "quota-exhausted":
      return [m.member_allowance_spent(), freesUp(asking)].join(" ");
    default:
      return m.member_allowance_unrecognised();
  }
}

/**
 * When a member with nothing left can next ask for one more thing.
 */
function freesUp(asking: Allowance): string {
  const when = asking.frees_up ?? undefined;
  return when === undefined
    ? m.member_allowance_frees_unknown()
    : m.member_allowance_frees({ day: dayOf(when) });
}

/**
 * One count, as the part of a sentence that says what is left of it.
 *
 * No limit is said as that. A limit whose remainder did not arrive is said as
 * unread rather than as the limit untouched.
 */
export function countOf(counted: Counted, what: string): string {
  const limit = counted.limit ?? undefined;
  if (limit === undefined) return m.member_count_unlimited({ what });

  const remaining = counted.remaining ?? undefined;
  if (remaining === undefined) return m.member_count_unread({ what });

  const period = counted.period ?? undefined;
  return period === undefined
    ? m.member_count_left({ remaining, limit, what })
    : m.member_count_left_in({ remaining, limit, what, period });
}

/**
 * The day an instant falls on, in the reader's own calendar.
 *
 * An instant that does not read as one is shown as it arrived rather than as a
 * day nobody named.
 */
export function dayOf(instant: string): string {
  const at = new Date(instant);
  if (Number.isNaN(at.getTime())) return instant;
  return new Intl.DateTimeFormat(getLocale(), { dateStyle: "long" }).format(at);
}

/**
 * What they may watch, one sentence a line.
 *
 * What they are held to comes first. The certificates a rating limit lets
 * through and holds back come next where the media server named them, and the
 * bare figure where it did not. Content with no rating is said for anybody a
 * rating holds, and the libraries for anybody held to some of them.
 */
export function watchOf(access: Access): readonly string[] {
  const said = [restrictionOf(access.restriction)];
  const rated = access.rated ?? undefined;
  const age = access.age_limit ?? undefined;

  if (rated !== undefined) {
    if (rated.allows.length > 0)
      said.push(m.member_watch_allows({ certificates: listed(rated.allows) }));
    if (rated.holds_back.length > 0)
      said.push(
        m.member_watch_holds({ certificates: listed(rated.holds_back) }),
      );
  } else if (age !== undefined) {
    said.push(m.member_watch_age({ age }));
  }

  if (access.restriction !== "unrestricted") said.push(unratedOf(access));
  if (!access.every_library && access.libraries.length > 0)
    said.push(m.member_watch_in({ libraries: listed(access.libraries) }));

  return said;
}

/** What they are held to, in one sentence. */
function restrictionOf(restriction: Access["restriction"]): string {
  switch (restriction) {
    case "unrestricted":
      return m.member_watch_unrestricted();
    case "rating-limited":
      return m.member_watch_rating();
    case "library-limited":
      return m.member_watch_libraries();
    case "both":
      return m.member_watch_both();
    case "inconsistent":
      return m.member_watch_inconsistent();
    default:
      return m.member_watch_unrecognised();
  }
}

/** What becomes of content the media server has no rating for. */
function unratedOf(access: Access): string {
  switch (access.unrated) {
    case "held-back":
      return m.unrated_held_back();
    case "let-through":
      return m.unrated_let_through();
    default:
      return m.unrated_unrecognised();
  }
}

/** What kind of thing one holding is, in the household's words. */
export function mediumOf(medium: Medium): string {
  switch (medium) {
    case "film":
      return m.member_medium_film();
    case "series":
      return m.member_medium_series();
    case "other":
      return m.member_medium_other();
    default:
      return m.member_medium_unrecognised();
  }
}

/**
 * What is said beneath where a request stands, or nothing.
 *
 * One that did not work tells them the operator has been told, and nothing of
 * why: the reason is the stack's, and it is the operator's to read. One that was
 * turned down carries the reason it was turned down with, where one was kept.
 * One still waiting says how long, where the request service dated it.
 */
export function besideOf(request: Request): string | undefined {
  if (request.state === "failed") return m.member_failed_told();

  const reason = request.refused?.reason;
  if (reason !== undefined) return reason;

  const days = request.waiting_days ?? undefined;
  return days === undefined ? undefined : m.waiting_days({ days });
}

/** What a title on the shelf is and when it came out, in a few words. */
export function captionOf(holding: Holding): string {
  const kind = mediumOf(holding.medium);
  const year = holding.year ?? undefined;
  return year === undefined ? kind : m.member_shelf_caption({ kind, year });
}
