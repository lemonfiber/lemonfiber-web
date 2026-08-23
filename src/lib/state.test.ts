import { describe, expect, it } from "vitest";
import {
  everyState,
  everyTone,
  isCurrent,
  severityWord,
  showingFor,
  toneFor,
  wordFor,
} from "./state";

describe("wordFor", () => {
  it.each(everyState)("gives %s a plain word", (state) => {
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
    expect(everyState.filter((s) => s !== "known").some(isCurrent)).toBe(false);
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

describe("severityWord", () => {
  it.each(everyTone)("gives %s a plain word", (tone) => {
    const word = severityWord(tone);
    expect(word).toMatch(/^[A-Z]/);
    expect(word).not.toMatch(/severity|warning|critical|error/i);
  });

  it("gives each severity a word of its own", () => {
    expect(new Set(everyTone.map(severityWord)).size).toBe(everyTone.length);
  });
});

describe("showingFor", () => {
  it.each([
    ["known", "ink"],
    ["part", "ink"],
    ["quiet", "dim"],
    ["unknown", "words"],
    ["stopped", "words"],
  ] as const)("shows %s as %s", (state, showing) => {
    expect(showingFor(state)).toBe(showing);
  });

  // A numeral says something was measured. Where nothing was, the figure has
  // to leave the numeral behind entirely.
  it("gives a numeral only to a state that measured one", () => {
    const numerals = everyState.filter((s) => showingFor(s) !== "words");
    expect(numerals).toEqual(["known", "quiet", "part"]);
  });

  it("shows part way in full ink, because it is measured now", () => {
    expect(showingFor("part")).toBe(showingFor("known"));
  });
});
