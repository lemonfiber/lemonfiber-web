import { describe, expect, it } from "vitest";
import {
  choicesOf,
  nounOfKind,
  nounOfUnit,
  pickedOf,
  WATCHED,
  wordOfKind,
  wordOfUnit,
  type Kinds,
  type TitleKind,
  type TitleUnit,
} from "./kinds";
import * as m from "../paraglide/messages.js";

const member = "b41c9e";

const every: Kinds = {
  member,
  kinds: [
    { kind: "tv", units: [] },
    { kind: "movies", units: [] },
    { kind: "music", units: ["album", "artist"] },
    { kind: "books", units: ["book", "author", "series"] },
  ],
};

const unknownUnit = "chapter" as TitleUnit;
const unknownKind = "comics" as TitleKind;

describe("what a member may ask for now", () => {
  it("offers series and films as one choice, then each unit of music and books", () => {
    expect(choicesOf(every)).toEqual([
      { key: WATCHED, label: m.found_kind_watched() },
      {
        key: "music/album",
        label: m.found_kind_albums(),
        kind: "music",
        unit: "album",
      },
      {
        key: "music/artist",
        label: m.found_kind_artists(),
        kind: "music",
        unit: "artist",
      },
      {
        key: "books/book",
        label: m.found_kind_books(),
        kind: "books",
        unit: "book",
      },
      {
        key: "books/author",
        label: m.found_kind_authors(),
        kind: "books",
        unit: "author",
      },
      {
        key: "books/series",
        label: m.found_kind_book_series(),
        kind: "books",
        unit: "series",
      },
    ]);
  });

  it("names the one choice by which of series and films is listed", () => {
    const only = (kind: "tv" | "movies"): string | undefined =>
      choicesOf({ member, kinds: [{ kind, units: [] }] }).at(0)?.label;
    expect(only("tv")).toBe(m.found_kind_series());
    expect(only("movies")).toBe(m.found_kind_films());
  });

  it("offers no kind the read does not list", () => {
    expect(
      choicesOf({ member, kinds: [{ kind: "books", units: ["book"] }] }).map(
        (one) => one.key,
      ),
    ).toEqual(["books/book"]);
    expect(choicesOf({ member, kinds: [] })).toEqual([]);
  });

  it("searches in the choice picked, or the first where none of them was", () => {
    const choices = choicesOf(every);
    expect(pickedOf(choices, "books/author")?.unit).toBe("author");
    expect(pickedOf(choices, undefined)?.key).toBe(WATCHED);
    expect(pickedOf(choices, "music/single")?.key).toBe(WATCHED);
    expect(pickedOf([], undefined)).toBeUndefined();
  });

  it("has words for a unit this page does not know", () => {
    expect(wordOfUnit(unknownUnit)).toBe(m.found_kind_unrecognised());
    expect(nounOfUnit(unknownUnit)).toBe(m.member_medium_unrecognised());
  });

  // Audiobooks and podcasts are asked for in no unit, so each is a choice of
  // its own rather than part of the one that searches series and films.
  it("offers audiobooks and podcasts as choices of their own, after series and films", () => {
    expect(
      choicesOf({
        member,
        kinds: [
          { kind: "audiobooks", units: [] },
          { kind: "tv", units: [] },
          { kind: "podcasts", units: [] },
        ],
      }),
    ).toEqual([
      { key: WATCHED, label: m.found_kind_series() },
      {
        key: "audiobooks",
        label: m.found_kind_audiobooks(),
        kind: "audiobooks",
      },
      { key: "podcasts", label: m.found_kind_podcasts(), kind: "podcasts" },
    ]);
  });

  it("names each kind asked for in no unit, many of them", () => {
    expect(
      (
        ["tv", "movies", "music", "books", "audiobooks", "podcasts"] as const
      ).map(wordOfKind),
    ).toEqual([
      m.found_kind_series(),
      m.found_kind_films(),
      m.found_kind_music(),
      m.found_kind_books(),
      m.found_kind_audiobooks(),
      m.found_kind_podcasts(),
    ]);
    expect(wordOfKind(unknownKind)).toBe(m.found_kind_unrecognised());
  });

  it("names one title of each kind found in no unit", () => {
    expect(
      (
        ["tv", "movies", "music", "books", "audiobooks", "podcasts"] as const
      ).map(nounOfKind),
    ).toEqual([
      m.member_medium_series(),
      m.member_medium_film(),
      m.member_medium_album(),
      m.member_medium_book(),
      m.member_medium_audiobook(),
      m.member_medium_podcast(),
    ]);
    expect(nounOfKind(unknownKind)).toBe(m.member_medium_unrecognised());
  });

  it("names one title of each unit", () => {
    expect(
      (["album", "artist", "book", "author", "series"] as const).map(
        nounOfUnit,
      ),
    ).toEqual([
      m.member_medium_album(),
      m.member_medium_artist(),
      m.member_medium_book(),
      m.member_medium_author(),
      m.member_medium_book_series(),
    ]);
  });
});
