import { describe, expect, it } from "vitest";
import { holdingLine, shelfLines, wordOfKind } from "./watchable";
import type { Medium } from "./yours";
import { film, kitsShelf, series, unreadShelf } from "../api/shelves";
import * as m from "../paraglide/messages.js";

describe("one title a member can watch", () => {
  it("is named with its year where the server knows one, and its kind", () => {
    expect(holdingLine(film)).toBe(
      m.watch_title_year({
        title: "The Iron Giant",
        year: 1999,
        kind: m.watch_film(),
      }),
    );
    expect(holdingLine(series)).toBe(
      m.watch_title({ title: "Bluey", kind: m.watch_series() }),
    );
    expect(holdingLine({ id: "s2", medium: "series", title: "Bluey" })).toBe(
      m.watch_title({ title: "Bluey", kind: m.watch_series() }),
    );
  });

  it("has a word for every kind, and for one it does not know", () => {
    expect(wordOfKind("other")).toBe(m.watch_other());
    expect(wordOfKind("music" as Medium)).toBe(m.watch_kind_other());
  });
});

describe("what a shelf came to", () => {
  it("says only what lemonfiber found where the shelf holds something", () => {
    expect(shelfLines(kitsShelf)).toStrictEqual(kitsShelf.findings);
  });

  it("says it could not be read, rather than that it holds nothing", () => {
    expect(shelfLines(unreadShelf)).toStrictEqual([
      m.watch_unread({ name: "Kit" }),
      ...unreadShelf.findings,
    ]);
  });

  it("says the member can watch nothing where the shelf was read and is empty", () => {
    expect(
      shelfLines({ ...kitsShelf, holdings: [], findings: [] }),
    ).toStrictEqual([m.watch_none({ name: "Kit" })]);
  });
});
