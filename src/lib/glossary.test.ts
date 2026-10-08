import { describe, expect, it } from "vitest";
import { entryLines } from "./glossary";
import { hardlink, seed } from "../api/vocabularies";
import * as m from "../paraglide/messages.js";

describe("one word lemonfiber explains", () => {
  it("says what it is for, more, what other services call it, and its other forms", () => {
    expect(entryLines(seed)).toStrictEqual([
      seed.short,
      seed.deep,
      m.glossary_also({ words: "seeding time" }),
      m.glossary_forms({ forms: "seeding, seeded" }),
    ]);
  });

  it("says only what it is for where there is nothing more", () => {
    expect(entryLines(hardlink)).toStrictEqual([hardlink.short]);
    expect(entryLines({ ...hardlink, deep: "" })).toStrictEqual([
      hardlink.short,
    ]);
    expect(
      entryLines({ word: "hardlink", short: "s", also_called: [], forms: [] }),
    ).toStrictEqual(["s"]);
  });
});
