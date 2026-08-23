import { describe, expect, it } from "vitest";
import { isCurrent, toneFor, wordFor, type State } from "./state";

const every: State[] = ["known", "quiet", "unknown", "stopped", "part"];

describe("wordFor", () => {
  it.each(every)("gives %s a plain word", (state) => {
    const word = wordFor(state);
    expect(word).toMatch(/^[A-Z]/);
    expect(word).not.toMatch(/stale|null|undefined|error/i);
  });

  it("distinguishes never-measured from working", () => {
    expect(wordFor("unknown")).not.toBe(wordFor("known"));
  });
});

describe("isCurrent", () => {
  it("is true only for a figure measured now", () => {
    expect(isCurrent("known")).toBe(true);
    expect(every.filter((s) => s !== "known").some(isCurrent)).toBe(false);
  });
});

describe("toneFor", () => {
  it.each([
    ["known", "calm"],
    ["unknown", "calm"],
    ["quiet", "watch"],
    ["part", "watch"],
    ["stopped", "alarm"],
  ] as const)("gives %s the tone %s", (state, tone) => {
    expect(toneFor(state)).toBe(tone);
  });

  // Not knowing is an absence, not a severity: giving it one would make it
  // compete with an actual problem.
  it("does not treat never-measured as a problem", () => {
    expect(toneFor("unknown")).toBe("calm");
  });
});
