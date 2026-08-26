import { describe, expect, it } from "vitest";
import {
  answeredAt,
  silentSince,
  spanFor,
  stampFor,
  stateFor,
  type Freshness,
} from "./freshness";

/** One instant, and the same clock a minute later. */
const at = 1_700_000_000_000;
const aMinuteOn = at + 60_000;

describe("spanFor", () => {
  it("counts seconds up to a minute", () => {
    expect(spanFor(0)).toBe("0s");
    expect(spanFor(4)).toBe("4s");
    expect(spanFor(59)).toBe("59s");
  });

  it("turns a minute into minutes", () => {
    expect(spanFor(60)).toBe("1m");
    expect(spanFor(260)).toBe("4m");
    expect(spanFor(3599)).toBe("59m");
  });

  it("turns an hour into hours", () => {
    expect(spanFor(3600)).toBe("1h");
    expect(spanFor(36_000)).toBe("10h");
  });

  // A span rounds down, so it never claims more time has passed than has.
  it("never rounds a span up", () => {
    expect(spanFor(119)).toBe("1m");
    expect(spanFor(7199)).toBe("1h");
    expect(spanFor(4.9)).toBe("4s");
  });

  // Two machines' clocks disagreeing is ordinary. "-3s ago" is not.
  it("says just now rather than something impossible", () => {
    expect(spanFor(-3)).toBe("0s");
  });
});

// A stamp is a span rather than a moment: what it says goes on being true only
// for as long as it takes to say it, so the span is worked out against the clock
// each time rather than written down when the source answered.
describe("dating a source against the clock", () => {
  it("says how long ago a source answered", () => {
    expect(answeredAt(at, at)).toEqual({ kind: "answered", secondsAgo: 0 });
    expect(answeredAt(at, aMinuteOn)).toEqual({
      kind: "answered",
      secondsAgo: 60,
    });
  });

  it("says how long a source has been silent", () => {
    expect(silentSince(at, aMinuteOn)).toEqual({
      kind: "silent",
      secondsAgo: 60,
    });
  });

  // Two clocks disagreeing is ordinary, and the words a span is read as floor
  // at nothing rather than claiming something impossible.
  it("hands a clock that runs backwards to the words to settle", () => {
    expect(stampFor(answeredAt(aMinuteOn, at))).toBe(
      stampFor({ kind: "answered", secondsAgo: 0 }),
    );
  });
});

describe("stateFor", () => {
  it.each([
    [{ kind: "answered", secondsAgo: 4 }, "known"],
    [{ kind: "silent", secondsAgo: 240 }, "stopped"],
    [{ kind: "never" }, "unknown"],
  ] as const)("gives %o the state %s", (freshness, state) => {
    expect(stateFor(freshness)).toBe(state);
  });

  // A silent source is showing nothing, which is not the same as showing the
  // last figure it gave.
  it("does not call an unreachable source quiet", () => {
    expect(stateFor({ kind: "silent", secondsAgo: 1 })).not.toBe("quiet");
  });
});

describe("stampFor", () => {
  it("says when a source answered", () => {
    expect(stampFor({ kind: "answered", secondsAgo: 4 })).toBe(
      "Checked 4s ago",
    );
  });

  it("says how long a source has been silent", () => {
    expect(stampFor({ kind: "silent", secondsAgo: 240 })).toBe("Quiet for 4m");
  });

  it("says plainly when a source never answered", () => {
    expect(stampFor({ kind: "never" })).toBe("Never checked");
  });

  it("never leaves a stamp empty", () => {
    const every: Freshness[] = [
      { kind: "answered", secondsAgo: 0 },
      { kind: "silent", secondsAgo: 7200 },
      { kind: "never" },
    ];
    for (const freshness of every) {
      expect(stampFor(freshness)).toMatch(/[A-Za-z]/);
    }
  });
});
