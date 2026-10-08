import { describe, expect, it } from "vitest";
import { heldLine, shortLines } from "./stuck";
import { stalled, stalledFilm } from "../api/stalls";
import * as m from "../paraglide/messages.js";

describe("one stuck item", () => {
  it("names the service holding it and the stage it stopped at", () => {
    expect(heldLine(stalledFilm)).toBe(
      m.stuck_held({ service: "radarr", stage: m.stage_downloading() }),
    );
  });
});

describe("what may be missing from the list", () => {
  it("says a queue could not be read, and names each one that cannot be here", () => {
    expect(shortLines(stalled)).toStrictEqual([
      m.stuck_incomplete(),
      m.stuck_unread({
        what: "readarr",
        because: "It speaks an API this build does not.",
      }),
    ]);
  });

  it("says nothing where every queue was read", () => {
    expect(
      shortLines({ incomplete: false, items: stalled.items }),
    ).toStrictEqual([]);
  });
});
