import { describe, expect, it } from "vitest";
import {
  everyFinding,
  givenForFind,
  isFinding,
  questionOfFind,
  sameFind,
  soughtTyped,
} from "./finding";
import * as m from "../paraglide/messages.js";

describe("what the finding panels ask for", () => {
  it("is every request they make, and nothing else", () => {
    expect(everyFinding.every(isFinding)).toBe(true);
    expect(isFinding("update")).toBe(false);
  });
});

describe("an item as typed", () => {
  it("names it, trimmed, in every season where none is typed", () => {
    expect(soughtTyped(" The Expanse ", " ")).toStrictEqual({
      term: "The Expanse",
      season: undefined,
    });
  });

  it("narrows it to the season typed", () => {
    expect(soughtTyped("The Expanse", "2")).toStrictEqual({
      term: "The Expanse",
      season: 2,
    });
  });

  it("is nothing where it names nothing or the season is not a number", () => {
    expect(soughtTyped("  ", "2")).toBeUndefined();
    expect(soughtTyped("The Expanse", "two")).toBeUndefined();
  });
});

describe("what each asking sends", () => {
  it("walks the thing named, or asks for something likely to work", () => {
    expect(
      givenForFind({ doing: "walkthrough", item: "Big Buck Bunny" }),
    ).toStrictEqual({ item: "Big Buck Bunny" });
    expect(
      givenForFind({ doing: "walkthrough", item: undefined }),
    ).toStrictEqual({});
  });

  // A search is the reading of where it is, widened, so it names the widening.
  it("searches for the item named, with the word that widens the reading", () => {
    expect(
      givenForFind({
        doing: "search",
        sought: { term: "The Expanse", season: undefined },
      }),
    ).toStrictEqual({ term: "The Expanse", disruptive: true });
    expect(
      givenForFind({
        doing: "search",
        sought: { term: "The Expanse", season: 2 },
      }),
    ).toStrictEqual({ term: "The Expanse", season: 2, disruptive: true });
  });
});

describe("what is asked before anything is sent", () => {
  it("asks before a walk, naming what it walks", () => {
    expect(
      questionOfFind({ doing: "walkthrough", item: "Sintel" }),
    ).toStrictEqual({
      eyebrow: m.confirm_keep_eyebrow(),
      title: m.confirm_walk_title({ item: "Sintel" }),
      prose: m.confirm_walk_prose(),
      yes: m.action_walk_yes(),
    });
    expect(
      questionOfFind({ doing: "walkthrough", item: undefined })?.title,
    ).toBe(m.confirm_walk_any_title());
  });

  it("asks nothing before a search", () => {
    expect(
      questionOfFind({
        doing: "search",
        sought: { term: "Sintel", season: undefined },
      }),
    ).toBeUndefined();
  });

  it("takes a yes only for the walk it asked about", () => {
    const sintel = { doing: "walkthrough", item: "Sintel" } as const;
    expect(sameFind(sintel, sintel)).toBe(true);
    expect(sameFind(sintel, { doing: "walkthrough", item: undefined })).toBe(
      false,
    );
    expect(sameFind(undefined, sintel)).toBe(false);
    expect(
      sameFind(
        { doing: "search", sought: { term: "a", season: undefined } },
        { doing: "search", sought: { term: "b", season: undefined } },
      ),
    ).toBe(true);
  });
});
