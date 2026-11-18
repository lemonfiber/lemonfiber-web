import { describe, expect, it } from "vitest";
import { everyPlace } from "./places";
import { iconOf, nameOf } from "./route";
import { everyIcon } from "./icons";

describe("nameOf", () => {
  it.each(everyPlace)("gives %s a plain word", (place) => {
    expect(nameOf(place)).toMatch(/^[A-Z]/);
  });

  it("gives no two places the same name", () => {
    expect(new Set(everyPlace.map(nameOf)).size).toBe(everyPlace.length);
  });
});

describe("iconOf", () => {
  it.each(everyPlace)("draws %s with a drawing the set has", (place) => {
    expect(everyIcon).toContain(iconOf(place));
  });

  it("gives no two places the same drawing", () => {
    expect(new Set(everyPlace.map(iconOf)).size).toBe(everyPlace.length);
  });
});
