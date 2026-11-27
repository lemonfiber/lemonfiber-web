/**
 * What a member may ask for now, as the choices Find offers.
 *
 * Series and films are searched together and are one choice; each unit of music
 * and books a kind lists is a choice of its own, and carries the kind and the
 * unit it is searched and asked in. Audiobooks and podcasts are asked for in no
 * unit, and each is a choice of its own. A kind the read does not list is no
 * choice.
 */
import type { ByKind } from "@lemonfiber/sdk-ts";
import * as m from "../paraglide/messages.js";

/** Which kinds a member may ask for now, with the units each is asked in. */
export type Kinds = ByKind["askable-kinds"]["data"];

/** A kind of title: a series, a film, music, books, audiobooks or podcasts. */
export type TitleKind = Kinds["kinds"][number]["kind"];

/** What music or books are asked for as. */
export type TitleUnit = Kinds["kinds"][number]["units"][number];

/** One choice of what to search for and ask in. */
export interface Asking {
  readonly key: string;
  readonly label: string;
  readonly kind?: TitleKind | undefined;
  readonly unit?: TitleUnit | undefined;
}

/** The key of the one choice that searches series and films together. */
export const WATCHED = "watched";

/** The kinds searched together as that one choice. */
const WATCHED_KINDS: readonly TitleKind[] = ["tv", "movies"];

/** The choices the read offers, series and films first. */
export function choicesOf(kinds: Kinds): readonly Asking[] {
  const watched = kinds.kinds
    .map((one) => one.kind)
    .filter((kind) => WATCHED_KINDS.includes(kind));
  const rest = kinds.kinds.flatMap((one): readonly Asking[] => {
    if (WATCHED_KINDS.includes(one.kind)) return [];
    if (one.units.length === 0) {
      return [{ key: one.kind, label: wordOfKind(one.kind), kind: one.kind }];
    }
    return one.units.map((unit) => ({
      key: `${one.kind}/${unit}`,
      label: wordOfUnit(unit),
      kind: one.kind,
      unit,
    }));
  });
  if (watched.length === 0) return rest;
  return [{ key: WATCHED, label: wordOfWatched(watched) }, ...rest];
}

/** The choice picked, or the first offered where none of them was. */
export function pickedOf(
  choices: readonly Asking[],
  picked: string | undefined,
): Asking | undefined {
  return choices.find((one) => one.key === picked) ?? choices.at(0);
}

/** What series and films are called together, by which of them is listed. */
function wordOfWatched(kinds: readonly TitleKind[]): string {
  const series = kinds.includes("tv");
  const films = kinds.includes("movies");
  if (series && films) return m.found_kind_watched();
  return series ? m.found_kind_series() : m.found_kind_films();
}

/** What each kind asked for in no unit is called as a choice, many of them. */
const KIND_WORDS: Readonly<Record<TitleKind, () => string>> = {
  tv: m.found_kind_series,
  movies: m.found_kind_films,
  music: m.found_kind_music,
  books: m.found_kind_books,
  audiobooks: m.found_kind_audiobooks,
  podcasts: m.found_kind_podcasts,
};

/** What a kind asked for in no unit is called as a choice, many of them. */
export function wordOfKind(kind: TitleKind): string {
  return Object.hasOwn(KIND_WORDS, kind)
    ? KIND_WORDS[kind]()
    : m.found_kind_unrecognised();
}

/** What one title of a kind is called, where it was found in no unit. */
export function nounOfKind(kind: TitleKind): string {
  switch (kind) {
    case "tv":
      return m.member_medium_series();
    case "movies":
      return m.member_medium_film();
    case "music":
      return m.member_medium_album();
    case "books":
      return m.member_medium_book();
    case "audiobooks":
      return m.member_medium_audiobook();
    case "podcasts":
      return m.member_medium_podcast();
    default:
      return m.member_medium_unrecognised();
  }
}

/** What a unit is called as a choice, many of them. */
export function wordOfUnit(unit: TitleUnit): string {
  switch (unit) {
    case "album":
      return m.found_kind_albums();
    case "artist":
      return m.found_kind_artists();
    case "book":
      return m.found_kind_books();
    case "author":
      return m.found_kind_authors();
    case "series":
      return m.found_kind_book_series();
    default:
      return m.found_kind_unrecognised();
  }
}

/** What one title of a unit is called. */
export function nounOfUnit(unit: TitleUnit): string {
  switch (unit) {
    case "album":
      return m.member_medium_album();
    case "artist":
      return m.member_medium_artist();
    case "book":
      return m.member_medium_book();
    case "author":
      return m.member_medium_author();
    case "series":
      return m.member_medium_book_series();
    default:
      return m.member_medium_unrecognised();
  }
}
