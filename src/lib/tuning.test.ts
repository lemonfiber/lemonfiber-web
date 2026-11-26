import { describe, expect, it } from "vitest";
import {
  changedTheQuality,
  everyTuning,
  givenForTune,
  isTuning,
  standingChoice,
  standingCost,
  standingReapply,
  tuning,
} from "./tuning";
import type { Work } from "./work";
import {
  costed,
  fetched,
  heldBack,
  reapplied,
  wouldChoose,
  wouldReapply,
} from "../api/qualities";

/** A record of one asking, answered with what it came to. */
const answered = (
  id: string,
  doing: Work["doing"],
  came: Extract<Work, { at: "done" }>["came"],
  given: Work["given"] = {},
): Work => ({
  id,
  doing,
  scoped: false,
  given,
  at: "done",
  job: undefined,
  came,
});

describe("what the quality panel asks for", () => {
  it("is every request it makes, and nothing else", () => {
    expect(everyTuning.every(isTuning)).toBe(true);
    expect(isTuning("backup")).toBe(false);
    expect(tuning.owns("quality-upgrade")).toBe(true);
  });

  it("sends a rehearsal first, then the yes", () => {
    expect(
      givenForTune({ doing: "quality-reapply", rehearse: true }),
    ).toStrictEqual({ dry_run: true });
    expect(givenForTune({ doing: "quality-reapply" })).toStrictEqual({});
    expect(givenForTune({ doing: "quality-upgrade" })).toStrictEqual({});
    expect(
      givenForTune({ doing: "quality-upgrade", confirm: true }),
    ).toStrictEqual({ confirm: true });
  });

  it("sends a choice as it was made, rehearsed first, and anyway where it was held", () => {
    const movies = { preset: "maximum", media_type: "movies" };
    expect(
      givenForTune({ doing: "quality-set", rehearse: true, ...movies }),
    ).toStrictEqual({ ...movies, dry_run: true });
    expect(
      givenForTune({ doing: "quality-set", confirm: false, ...movies }),
    ).toStrictEqual(movies);
    expect(
      givenForTune({
        doing: "quality-set",
        confirm: true,
        preset: "balanced",
        media_type: undefined,
      }),
    ).toStrictEqual({ preset: "balanced", confirm: true });
  });

  it("asks nothing before sending, since every yes stands under what was read", () => {
    expect(tuning.question({ doing: "quality-reapply" })).toBeUndefined();
  });

  it("reads the choice again once it changed, and not after a rehearsal or a fetch", () => {
    expect(changedTheQuality({ kind: "quality", report: reapplied })).toBe(
      true,
    );
    expect(changedTheQuality({ kind: "quality", report: wouldReapply })).toBe(
      false,
    );
    expect(changedTheQuality({ kind: "upgrade", report: fetched })).toBe(false);
  });
});

describe("a choice standing on the screen", () => {
  const movies = { preset: "maximum", media_type: "movies" };

  it("is the newest choice read, with what it was and whether it was held", () => {
    const read = answered(
      "6",
      "quality-set",
      { kind: "quality", report: wouldChoose },
      movies,
    );
    expect(standingChoice([read])).toStrictEqual({
      id: "6",
      ...movies,
      held: false,
    });
    const held = answered(
      "7",
      "quality-set",
      { kind: "quality", report: heldBack },
      { preset: "maximum" },
    );
    expect(standingChoice([held])).toStrictEqual({
      id: "7",
      preset: "maximum",
      media_type: undefined,
      held: true,
    });
    expect(
      standingChoice([
        answered("8", "quality-set", { kind: "quality", report: heldBack }),
      ])?.preset,
    ).toBe("");
  });

  it("is gone once the choice was recorded, and nothing where none was read", () => {
    const recorded = answered("9", "quality-set", {
      kind: "quality",
      report: reapplied,
    });
    expect(standingChoice([recorded])).toBeUndefined();
    expect(
      standingChoice([answered("10", "quality-set", { kind: "unread" })]),
    ).toBeUndefined();
    expect(standingChoice([])).toBeUndefined();
  });
});

describe("putting the recorded preset back, standing on the screen", () => {
  it("is the record of the newest rehearsal, and gone once it was put back", () => {
    const read = answered("11", "quality-reapply", {
      kind: "quality",
      report: wouldReapply,
    });
    expect(standingReapply([read])).toBe("11");
    const done = answered("12", "quality-reapply", {
      kind: "quality",
      report: reapplied,
    });
    expect(standingReapply([done, read])).toBeUndefined();
  });
});

describe("the cost standing on the screen", () => {
  const read = answered("2", "quality-upgrade", {
    kind: "upgrade",
    report: costed,
  });

  it("is the newest cost read, with each kind of media", () => {
    expect(standingCost([read])).toStrictEqual({
      id: "2",
      media: costed.media,
    });
  });

  it("is gone once the library was fetched again", () => {
    const done = answered("3", "quality-upgrade", {
      kind: "upgrade",
      report: fetched,
    });
    expect(standingCost([done, read])).toBeUndefined();
  });

  it("is nothing where no cost was read, or the answer is not one", () => {
    const other = answered("4", "quality-reapply", {
      kind: "quality",
      report: reapplied,
    });
    const unread = answered("5", "quality-upgrade", { kind: "unread" });
    expect(standingCost([other])).toBeUndefined();
    expect(standingCost([unread])).toBeUndefined();
  });
});
