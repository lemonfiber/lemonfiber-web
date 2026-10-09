/**
 * One title on a member's shelf, in the words a person deciding whether to
 * watch it reads it in.
 *
 * What the title read answers is what a viewer wants and nothing about how it
 * is stored or served: where it streams from and the door it is reached
 * through are the server's, and are never said here. A fact that did not
 * arrive is left out rather than guessed.
 *
 * The words live in `messages/`, so no screen holds one.
 */
import type { ByKind } from "@lemonfiber/sdk-ts";
import { getLocale } from "../paraglide/runtime.js";
import { listed } from "./listed";
import { mediumOf } from "./yours";
import * as m from "../paraglide/messages.js";

/** What the title read answers for one title. */
export type Told = ByKind["title"]["data"];

/** The title itself, where it is still on the member's shelf. */
export type Title = NonNullable<Told["title"]>;

/** One season of a series. */
export type Season = Title["seasons"][number];

/** One episode of a season. */
export type Episode = Season["episodes"][number];

/** A length in minutes, in the reader's own words for one. */
function minutesOf(minutes: number): string {
  return new Intl.NumberFormat(getLocale(), {
    style: "unit",
    unit: "minute",
    unitDisplay: "long",
  }).format(minutes);
}

/** A value the server may leave out, as nothing where it did. */
function known<T>(value: T | null | undefined): T | undefined {
  return value ?? undefined;
}

/**
 * What it is, at a glance: its kind, its year, how long it runs and its
 * certificate, each where the server knows it.
 */
export function factsOf(title: Title): string {
  const year = known(title.year);
  const minutes = known(title.minutes);
  const certificate = known(title.certificate);
  return [
    mediumOf(title.medium),
    year === undefined ? undefined : String(year),
    minutes === undefined ? undefined : minutesOf(minutes),
    certificate,
  ]
    .filter((fact) => fact !== undefined)
    .join(" · ");
}

/** The genres it is filed under, or nothing where it is filed under none. */
export function genresOf(title: Title): string | undefined {
  return title.genres.length === 0 ? undefined : listed(title.genres);
}

/** A season's heading: its name, and how many episodes it holds. */
export function seasonOf(season: Season): string {
  return m.member_title_season({
    name: season.name,
    count: season.episodes.length,
  });
}

/** An episode's line: its number where it has one, then its name. */
export function episodeOf(episode: Episode): string {
  const number = known(episode.number);
  return number === undefined
    ? episode.title
    : m.member_title_episode({ number, title: episode.title });
}

/** How long an episode runs, where the server knows. */
export function runsOf(episode: Episode): string | undefined {
  const minutes = known(episode.minutes);
  return minutes === undefined ? undefined : minutesOf(minutes);
}
