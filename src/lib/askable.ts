/**
 * What a household member's search found, in the words they read it in.
 *
 * Every title here is one lemonfiber offered under the member's own limits, and
 * where it stands in the house is lemonfiber's answer. Nothing is worked out
 * beside it: a title a limit hides was never sent, and whether an ask waits for
 * approval or what it leaves of an allowance is the sentence lemonfiber answered
 * the ask's rehearsal with.
 *
 * The words live in `messages/`, so no screen holds one.
 */
import type { ByKind } from "@lemonfiber/sdk-ts";
import type { State } from "./state";
import * as m from "../paraglide/messages.js";

/** One page of what a member's search found. */
export type Found = ByKind["askable"]["data"];

/** One title a member's search found. */
export type FoundTitle = Found["titles"][number];

/** Where a found title stands in the house. */
export type Stands = FoundTitle["stands"];

/** What asking for one title came to, or would come to. */
export type Asked = ByKind["asked"]["data"];

/**
 * What tells one found title from every other on the pages of one search.
 *
 * A series and a film may be filed under the same number, so the kind is part
 * of it.
 */
export function keyOf(title: FoundTitle): string {
  return `${title.kind}/${title.id}`;
}

/** Which title a key tells apart: its id, and whether it is a series or a film. */
export function foundBy(key: string): Pick<FoundTitle, "id" | "kind"> {
  const [kind, ...id] = key.split("/");
  return { kind: kind === "tv" ? "tv" : "movies", id: id.join("/") };
}

/** What kind of thing a found title is, in the household's words. */
export function kindOfFound(title: FoundTitle): string {
  return title.kind === "tv"
    ? m.member_medium_series()
    : m.member_medium_film();
}

/** What a found title is and when it came out, in a few words. */
export function captionOfFound(title: FoundTitle): string {
  const kind = kindOfFound(title);
  const year = title.year ?? undefined;
  return year === undefined ? kind : m.member_shelf_caption({ kind, year });
}

/** Where a found title stands, in the household's words. */
export function standsOf(stands: Stands): string {
  switch (stands) {
    case "here":
      return m.found_here();
    case "partly-here":
      return m.found_partly_here();
    case "on-its-way":
      return m.found_on_its_way();
    case "askable":
      return m.found_askable();
    default:
      return m.found_unrecognised();
  }
}

/**
 * Whether lemonfiber offered the title to be asked for.
 *
 * A series partly here is: asking names every season not already here or on
 * its way.
 */
export function mayAsk(title: FoundTitle): boolean {
  return title.stands === "askable" || title.stands === "partly-here";
}

/**
 * How a found title's tag is drawn, or nothing for one that may be asked for,
 * which carries what it is in place of a tag.
 */
export function stateOfFound(stands: Stands): State | undefined {
  switch (stands) {
    case "here":
      return "known";
    case "partly-here":
      return "part";
    case "on-its-way":
      return "quiet";
    case "askable":
    default:
      return undefined;
  }
}
