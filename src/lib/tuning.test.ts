import { describe, expect, it } from "vitest";
import {
  changedTheQuality,
  everyTuning,
  givenForTune,
  isTuning,
  questionOfTune,
  standingCost,
  tuning,
} from "./tuning";
import type { Work } from "./work";
import { costed, fetched, reapplied } from "../api/qualities";
import * as m from "../paraglide/messages.js";

/** A record of one asking, answered with what it came to. */
const answered = (
  id: string,
  doing: Work["doing"],
  came: Extract<Work, { at: "done" }>["came"],
): Work => ({
  id,
  doing,
  scoped: false,
  given: {},
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

  it("sends nothing but the yes", () => {
    expect(givenForTune({ doing: "quality-reapply" })).toStrictEqual({});
    expect(givenForTune({ doing: "quality-upgrade" })).toStrictEqual({});
    expect(
      givenForTune({ doing: "quality-upgrade", confirm: true }),
    ).toStrictEqual({ confirm: true });
  });

  // Nothing comes back to read before the recorded preset replaces the edits
  // made by hand, so what is lost is said before the yes.
  it("asks before putting the recorded quality back, and not before a cost", () => {
    expect(questionOfTune({ doing: "quality-reapply" })).toStrictEqual({
      eyebrow: m.confirm_mend_eyebrow(),
      title: m.confirm_reapply_title(),
      prose: m.confirm_reapply_prose(),
      yes: m.action_reapply_yes(),
    });
    expect(questionOfTune({ doing: "quality-upgrade" })).toBeUndefined();
  });

  it("reads the choice again once it was put back, and not after a fetch", () => {
    expect(changedTheQuality({ kind: "quality", report: reapplied })).toBe(
      true,
    );
    expect(changedTheQuality({ kind: "upgrade", report: fetched })).toBe(false);
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
