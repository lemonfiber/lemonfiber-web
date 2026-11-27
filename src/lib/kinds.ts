/**
 * What a member may ask for now, as the choices Find offers.
 *
 * Series and films are searched together and are one choice; each unit of music
 * and books a kind lists is a choice of its own, and carries the kind and the
 * unit it is searched and asked in. A kind the read does not list is no choice.
 */
import type { ByKind } from "@lemonfiber/sdk-ts";
import * as m from "../paraglide/messages.js";

/** Which kinds a member may ask for now, with the units each is asked in. */
export type Kinds = ByKind["askable-kinds"]["data"];

/** A kind of title: a series, a film, music or books. */
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

/** The choices the read offers, series and films first. */
export function choicesOf(kinds: Kinds): readonly Asking[] {
  const watched = kinds.kinds
    .filter((one) => one.units.length === 0)
    .map((one) => one.kind);
  const units = kinds.kinds.flatMap((one) =>
    one.units.map((unit): Asking => ({
      key: `${one.kind}/${unit}`,
      label: wordOfUnit(unit),
      kind: one.kind,
      unit,
    })),
  );
  if (watched.length === 0) return units;
  return [{ key: WATCHED, label: wordOfWatched(watched) }, ...units];
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
