import { describe, expect, it } from "vitest";
import {
  changedByReclaiming,
  everyReclaiming,
  givenForReclaim,
  isReclaiming,
  reclaiming,
} from "./reclaiming";
import { reclaimedRoom, roomy, taken } from "../api/spaces";

describe("what the room panel asks for", () => {
  it("is the one request it makes, and nothing else", () => {
    expect(everyReclaiming.every(isReclaiming)).toBe(true);
    expect(isReclaiming("stop-seeding")).toBe(false);
  });

  // The accounting is what is read before the yes, so nothing is asked first.
  it("asks nothing before it is sent", () => {
    expect(
      reclaiming.question({ doing: "space", offer: "space-7d41" }),
    ).toBeUndefined();
  });

  it("sends the name of the offer it was read in, and nothing else", () => {
    expect(
      givenForReclaim({ doing: "space", offer: "space-7d41" }),
    ).toStrictEqual({ offer: "space-7d41" });
  });
});

describe("whether the disk has changed", () => {
  it("has once room was taken back", () => {
    expect(changedByReclaiming({ kind: "space", report: reclaimedRoom })).toBe(
      true,
    );
  });

  it("has not where nothing was taken, the run was a rehearsal, or it was something else", () => {
    expect(changedByReclaiming({ kind: "space", report: roomy })).toBe(false);
    expect(
      changedByReclaiming({
        kind: "space",
        report: { ...roomy, reclaimed: { ...taken, rehearsed: true } },
      }),
    ).toBe(false);
    expect(changedByReclaiming({ kind: "unread" })).toBe(false);
  });
});
