import { describe, expect, it } from "vitest";
import {
  everyPlace,
  iconOf,
  nameOf,
  ours,
  pathOf,
  placeAt,
  type Place,
} from "./route";
import { everyIcon } from "./icons";

/** A click as a browser reports one, before any key is held down. */
const pressed = (over: Partial<MouseEvent> = {}): MouseEvent =>
  ({
    button: 0,
    metaKey: false,
    ctrlKey: false,
    shiftKey: false,
    altKey: false,
    ...over,
  }) as MouseEvent;

describe("pathOf", () => {
  it("puts the overview at the root", () => {
    expect(pathOf("overview")).toBe("/");
  });

  it("gives every other place an address of its own", () => {
    const rest = everyPlace.filter((place) => place !== "overview");
    expect(rest.map(pathOf)).toEqual(rest.map((place) => `/${place}`));
  });

  it("gives no two places the same address", () => {
    expect(new Set(everyPlace.map(pathOf)).size).toBe(everyPlace.length);
  });
});

describe("placeAt", () => {
  it.each(everyPlace)("reads back the address it gives %s", (place) => {
    expect(placeAt(pathOf(place))).toBe(place);
  });

  it("reads an address the binary served with a trailing slash", () => {
    expect(placeAt("/logs/")).toBe("logs");
  });

  // A path naming no screen is the app itself, which opens on the overview.
  it("falls back to the overview for an address it does not know", () => {
    expect(placeAt("/nothing-here")).toBe("overview");
    expect(placeAt("")).toBe("overview");
  });
});

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

describe("ours", () => {
  it("answers a plain press", () => {
    expect(ours(pressed())).toBe(true);
  });

  // Each of these is the browser being asked for something the page cannot
  // give: a second tab, a window, a saved file, a menu.
  it.each([
    ["a second button", { button: 1 }],
    ["the command key", { metaKey: true }],
    ["the control key", { ctrlKey: true }],
    ["the shift key", { shiftKey: true }],
    ["the option key", { altKey: true }],
  ] as const)("leaves %s to the browser", (_what, held) => {
    expect(ours(pressed(held))).toBe(false);
  });
});

describe("everyPlace", () => {
  it("opens on the overview", () => {
    expect(everyPlace[0]).toBe<Place>("overview");
  });
});
