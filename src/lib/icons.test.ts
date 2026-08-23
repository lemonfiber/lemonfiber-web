import { describe, expect, it } from "vitest";
import { drawings, everyIcon, everyIconSize, type IconName } from "./icons";

describe("everyIcon", () => {
  // The list and the record are written out separately, so nothing but this
  // stops a drawing being added to one and forgotten in the other.
  it("names every drawing the set holds, and no other", () => {
    expect([...everyIcon].sort()).toEqual(Object.keys(drawings).sort());
  });

  it("names each drawing once", () => {
    expect(new Set(everyIcon).size).toBe(everyIcon.length);
  });

  // A state has a shape of its own, drawn by the mark rather than from here.
  it("keeps the state shapes out of it", () => {
    const states: readonly string[] = ["ok", "stopped", "part", "unknown"];
    expect(everyIcon.filter((name) => states.includes(name))).toEqual([]);
  });
});

describe("drawings", () => {
  it.each(everyIcon)("builds %s from at least one shape", (name) => {
    expect(drawings[name].length).toBeGreaterThan(0);
  });

  it("gives every name a drawing of its own", () => {
    const drawn = everyIcon.map((name) => JSON.stringify(drawings[name]));
    expect(new Set(drawn).size).toBe(everyIcon.length);
  });

  // A rounded rectangle and a circle are not paths, and half the set needs one.
  it("draws with paths, rectangles and circles", () => {
    const kinds = everyIcon.flatMap((name) =>
      drawings[name].map((shape) => shape.kind),
    );
    expect(new Set(kinds)).toEqual(new Set(["path", "rect", "circle"]));
  });

  it.each(everyIcon)("keeps %s inside the 24 grid", (name) => {
    for (const shape of drawings[name]) {
      if (shape.kind === "rect") {
        expect(shape.x).toBeGreaterThanOrEqual(0);
        expect(shape.y).toBeGreaterThanOrEqual(0);
        expect(shape.x + shape.width).toBeLessThanOrEqual(24);
        expect(shape.y + shape.height).toBeLessThanOrEqual(24);
      }
      if (shape.kind === "circle") {
        expect(shape.cx - shape.r).toBeGreaterThanOrEqual(0);
        expect(shape.cy - shape.r).toBeGreaterThanOrEqual(0);
        expect(shape.cx + shape.r).toBeLessThanOrEqual(24);
        expect(shape.cy + shape.r).toBeLessThanOrEqual(24);
      }
    }
  });

  it("turns the one drawing set on a diagonal", () => {
    expect(drawings.setup).toContainEqual({
      kind: "rect",
      x: 13.6,
      y: 4.6,
      width: 5,
      height: 5,
      rx: 1.2,
      transform: "rotate(45 16.1 7.1)",
    });
  });

  // A broken edge says what the state shapes say with one: what is drawn is an
  // absence rather than a thing.
  it("breaks the edge of the drawing that means nothing is arriving", () => {
    expect(drawings.quiet).toContainEqual({
      kind: "rect",
      x: 3,
      y: 5,
      width: 18,
      height: 14,
      rx: 2,
      dash: "3 3",
    });
  });

  it("leaves every other rectangle square to the grid and unbroken", () => {
    const turned: readonly IconName[] = ["setup", "quiet"];
    const rest = everyIcon
      .filter((name) => !turned.includes(name))
      .flatMap((name) => drawings[name])
      .filter((shape) => shape.kind === "rect");

    expect(rest.length).toBeGreaterThan(0);
    for (const shape of rest) {
      expect([...Object.keys(shape)].sort()).toEqual([
        "height",
        "kind",
        "rx",
        "width",
        "x",
        "y",
      ]);
    }
  });
});

describe("everyIconSize", () => {
  it("offers two sizes and no third", () => {
    expect(everyIconSize).toEqual(["small", "regular"]);
  });
});
