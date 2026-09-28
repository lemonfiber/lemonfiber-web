/**
 * Walking one thing through, and searching for one item, and how the asking
 * reads.
 *
 * Two requests, each named as the command line names it. A walkthrough
 * searches for something, fetches it and puts it in the library, saying each
 * step; nothing comes back to read before it starts, so it is asked about
 * first. Naming nothing asks lemonfiber to pick something likely to work. A
 * search follows one item with the indexers asked, which is the reading of
 * where it is widened, so it carries the word that widens it.
 */
import type { Arguments } from "../api/acting";
import type { Asker, Family } from "./asker";
import { linesTyped } from "./upkeep";
import type { Finding, Question, Requested } from "./work";
import * as m from "../paraglide/messages.js";

/** Every request the finding panels make. */
export const everyFinding: readonly Finding[] = ["walkthrough", "search"];

/** Whether a record is of something the finding panels asked for. */
export function isFinding(doing: Requested): doing is Finding {
  const finding: readonly Requested[] = everyFinding;
  return finding.includes(doing);
}

/** One item, as it was typed: what it is called, and which season. */
export interface Sought {
  /** What it is called, as a person would name it. */
  readonly term: string;
  /** Which season to narrow to, where one is named. */
  readonly season: number | undefined;
}

/**
 * An item as typed, or nothing where it names nothing or the season is not a
 * whole number. No season typed is every season.
 */
export function soughtTyped(term: string, season: string): Sought | undefined {
  const named = term.trim();
  if (named === "") return undefined;
  if (season.trim() === "") return { term: named, season: undefined };
  const numbered = linesTyped(season);
  return numbered === undefined ? undefined : { term: named, season: numbered };
}

/** One asking, with whatever it names. */
export type Find =
  /** One thing walked through, or something likely to work where none is named. */
  | { readonly doing: "walkthrough"; readonly item: string | undefined }
  /** One item followed, with the indexers asked. */
  | { readonly doing: "search"; readonly sought: Sought };

/** What to send for one asking. */
export function givenForFind(find: Find): Arguments {
  if (find.doing === "walkthrough") {
    return find.item === undefined ? {} : { item: find.item };
  }
  const { term, season } = find.sought;
  return season === undefined
    ? { term, disruptive: true }
    : { term, season, disruptive: true };
}

/** What has to be agreed before an asking is sent. */
export function questionOfFind(find: Find): Question | undefined {
  if (find.doing !== "walkthrough") return undefined;
  return {
    eyebrow: m.confirm_keep_eyebrow(),
    title:
      find.item === undefined
        ? m.confirm_walk_any_title()
        : m.confirm_walk_title({ item: find.item }),
    prose: m.confirm_walk_prose(),
    yes: m.action_walk_yes(),
  };
}

/** Whether two askings are the same walk, which is what a yes is to. */
export function sameFind(one: Find | undefined, other: Find): boolean {
  if (one?.doing !== "walkthrough" || other.doing !== "walkthrough") {
    return one?.doing === other.doing;
  }
  return one.item === other.item;
}

/** How the finding panels' requests are asked for. */
export const finding: Family<Find> = {
  owns: isFinding,
  question: questionOfFind,
  given: givenForFind,
  same: sameFind,
};

/**
 * Everything the finding panels are given to act with, and what pressing
 * their controls asks for.
 */
export type Finder = Asker<Find>;
