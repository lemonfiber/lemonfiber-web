import { describe, expect, it } from "vitest";
import { finderOf, piecesOf } from "./terms";
import { hardlink, seed, vocabulary } from "../api/vocabularies";

const finder = finderOf(vocabulary);

describe("finding the terms in a line", () => {
  it("finds a word, its forms and other services' words for it, filed under the word", () => {
    expect(
      piecesOf(
        "Seeding stops once the seeding time is up; a hardlink stays.",
        finder,
      ),
    ).toStrictEqual([
      { text: "Seeding", word: "seed" },
      { text: " stops once the " },
      { text: "seeding time", word: "seed" },
      { text: " is up; a " },
      { text: "hardlink", word: "hardlink" },
      { text: " stays." },
    ]);
  });

  it("finds a term only whole, never inside a longer word", () => {
    expect(piecesOf("Reseeded hardlinks", finder)).toStrictEqual([
      { text: "Reseeded hardlinks" },
    ]);
  });

  it("finds a term that is the whole line, and leaves a line with none as it is", () => {
    expect(piecesOf("seed", finder)).toStrictEqual([
      { text: "seed", word: "seed" },
    ]);
    expect(piecesOf("Nothing to see.", finder)).toStrictEqual([
      { text: "Nothing to see." },
    ]);
    expect(piecesOf("", finder)).toStrictEqual([{ text: "" }]);
  });

  it("reads a spelling with expression syntax in it as written", () => {
    const odd = finderOf({
      words: [{ ...hardlink, word: "c++", forms: ["a.b"] }],
    });
    expect(piecesOf("use c++ or a.b, not axb", odd)).toStrictEqual([
      { text: "use " },
      { text: "c++", word: "c++" },
      { text: " or " },
      { text: "a.b", word: "c++" },
      { text: ", not axb" },
    ]);
  });

  it("files a spelling two entries share under the first, and passes over a blank one", () => {
    const shared = finderOf({
      words: [seed, { ...hardlink, also_called: ["seeded", " "] }],
    });
    expect(piecesOf("seeded", shared)).toStrictEqual([
      { text: "seeded", word: "seed" },
    ]);
  });

  it("finds nothing in a glossary with no words", () => {
    expect(piecesOf("seed", finderOf({ words: [] }))).toStrictEqual([
      { text: "seed" },
    ]);
  });
});

describe("code, and names that are not words", () => {
  it("hands code between backticks back as code, with no term found in it", () => {
    expect(piecesOf("Run `lemonfiber seed` to seed.", finder)).toStrictEqual([
      { text: "Run " },
      { text: "lemonfiber seed", code: true },
      { text: " to " },
      { text: "seed", word: "seed" },
      { text: "." },
    ]);
  });

  it("marks code even with explaining off, and leaves the rest as written", () => {
    expect(piecesOf("`seed` it", undefined)).toStrictEqual([
      { text: "seed", code: true },
      { text: " it" },
    ]);
    expect(piecesOf("seed", undefined)).toStrictEqual([{ text: "seed" }]);
    expect(piecesOf("run `up`", undefined)).toStrictEqual([
      { text: "run " },
      { text: "up", code: true },
    ]);
  });

  it("finds no term inside a setting's name, a path or an address", () => {
    expect(
      piecesOf("LEMONFIBER_REACH_SEED and docs/d1-seed/ then seed", finder),
    ).toStrictEqual([
      { text: "LEMONFIBER_REACH_SEED and docs/d1-seed/ then " },
      { text: "seed", word: "seed" },
    ]);
  });
});
