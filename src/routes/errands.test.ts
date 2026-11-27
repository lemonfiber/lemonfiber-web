import { describe, expect, it } from "vitest";
import { keptOf } from "./errands";

describe("what a record keeps of what was sent", () => {
  it("is everything but the values given for a recipe's inputs", () => {
    expect(
      keptOf({
        plugin: "subtitle-fetch",
        recipe: "refresh",
        offer: "plugin-run:3c4d",
        inputs: ["account=household"],
      }),
    ).toStrictEqual({
      plugin: "subtitle-fetch",
      recipe: "refresh",
      offer: "plugin-run:3c4d",
    });
  });

  it("is all of it where no input was given", () => {
    const given = { plugin: "subtitle-fetch" };
    expect(keptOf(given)).toBe(given);
  });
});
