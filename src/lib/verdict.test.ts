import { describe, expect, it } from "vitest";
import { everyTone } from "./state";
import {
  accountOf,
  everyCategory,
  everyOutcome,
  everyOverall,
  gradingOf,
  toneOfOutcome,
  toneOfOverall,
  wordOfCategory,
  wordOfOutcome,
} from "./verdict";
import type { Category, Outcome, Overall, Verdict } from "./wire";
import * as m from "../paraglide/messages.js";

/**
 * Words from a lemonfiber whose vocabulary is wider than this build's.
 *
 * The wire version stays one number while words are added under it, so a running
 * binary can answer with one the generated types do not name and the version
 * gate still passes. There is no way to write one but to say so.
 */
const unnamedOutcome = "inconclusive" as unknown as Outcome;
const unnamedCategory = "hardware" as unknown as Category;
const unnamedOverall = "inconclusive" as unknown as Overall;
const unnamedVerdict = { outcome: "inconclusive" } as unknown as Verdict;

describe("what a run of the checks came to", () => {
  it.each(everyOverall)("gives %s a severity the interface has", (overall) => {
    expect(everyTone).toContain(toneOfOverall(overall));
  });

  // Not knowing is not an emergency, and a severity here would make it compete
  // with one.
  it("is calm about a run that could not establish health", () => {
    expect(toneOfOverall("unknown")).toBe("calm");
  });

  it("asks for the operator only where something is broken", () => {
    expect(toneOfOverall("broken")).toBe("alarm");
    expect(toneOfOverall("degraded")).toBe("watch");
    expect(toneOfOverall("healthy")).toBe("calm");
  });

  it.each(everyOverall)("says what %s means for the screen", (overall) => {
    const grading = gradingOf(overall);
    expect(grading.lead).not.toBe("");
    expect(grading.prose).not.toBe("");
  });

  it("says a healthy run passed, rather than that nothing was found", () => {
    expect(gradingOf("healthy").lead).toBe(m.overall_healthy_lead());
    expect(gradingOf("degraded").lead).toBe(m.overall_degraded_lead());
    expect(gradingOf("broken").lead).toBe(m.overall_broken_lead());
    expect(gradingOf("unknown").lead).toBe(m.overall_unknown_lead());
  });
});

describe("how one check turned out", () => {
  it.each(everyOutcome)("gives %s a severity the interface has", (outcome) => {
    expect(everyTone).toContain(toneOfOutcome(outcome));
  });

  // A check that could not run is not a pass, and it is not an emergency
  // either. The word beside it is what tells the two apart.
  it("is calm about a check that could not run and one that did not apply", () => {
    expect(toneOfOutcome("unverified")).toBe("calm");
    expect(toneOfOutcome("skipped")).toBe("calm");
    expect(wordOfOutcome("unverified")).not.toBe(wordOfOutcome("skipped"));
  });

  it("reads a failure as the thing to act on", () => {
    expect(toneOfOutcome("fail")).toBe("alarm");
    expect(toneOfOutcome("warn")).toBe("watch");
    expect(toneOfOutcome("pass")).toBe("calm");
  });

  it.each(everyOutcome)("has a word for %s", (outcome) => {
    expect(wordOfOutcome(outcome)).not.toBe("");
  });

  it.each(everyCategory)("has a word for the %s family", (category) => {
    expect(wordOfCategory(category)).not.toBe("");
  });

  it("names every family differently", () => {
    const named = new Set(everyCategory.map(wordOfCategory));
    expect(named.size).toBe(everyCategory.length);
  });
});

describe("what a verdict said for itself", () => {
  it("carries the evidence behind a pass", () => {
    expect(accountOf({ outcome: "pass", note: "port 8080 is free" })).toEqual({
      summary: "port 8080 is free",
      meaning: undefined,
      remedies: [],
    });
  });

  it("says nothing for a pass that stated no evidence", () => {
    expect(accountOf({ outcome: "pass", note: null }).summary).toBeUndefined();
  });

  it("carries why a check did not apply", () => {
    expect(
      accountOf({ outcome: "skipped", reason: "No provider is set up." })
        .summary,
    ).toBe("No provider is set up.");
  });

  // A check that could not run says what to do about getting an answer, which
  // is the difference between "could not check" and "did not check".
  it("carries the way out of a check that could not run", () => {
    const account = accountOf({
      outcome: "unverified",
      reason: "The client would not say.",
      remedy: { action: "Start it and run the checks again.", detail: null },
    });

    expect(account.summary).toBe("The client would not say.");
    expect(account.remedies).toHaveLength(1);
  });

  // The wire carries a problem's fields beside the outcome, and the generated
  // types name every one of them — which is what this is written without a cast
  // to say. It would not compile against a contract that named the outcome
  // alone.
  it.each(["warn", "fail"] as const)(
    "reads what a %s carries beside its outcome",
    (outcome) => {
      const account = accountOf({
        outcome,
        code: "storage.headroom",
        severity: "warning",
        state: "actionable",
        summary: "The disk is nearly full.",
        meaning: "Imports will fail before downloads do.",
        remedies: [
          { action: "Delete what has been watched.", detail: "the library" },
        ],
      });

      expect(account.summary).toBe("The disk is nearly full.");
      expect(account.meaning).toBe("Imports will fail before downloads do.");
      expect(account.remedies).toEqual([
        { action: "Delete what has been watched.", detail: "the library" },
      ]);
    },
  );
});

// The wire version is one number and the vocabulary under it grows, so a
// running binary can answer with a word this build's contract does not name.
// Falling off the end of a switch hands back `undefined`, and the screen reads
// a field off what a verdict said.
describe("a word this build has no entry for", () => {
  it("gives an outcome it does not know a word of its own", () => {
    expect(wordOfOutcome(unnamedOutcome)).toBe(m.outcome_unrecognised());
    expect(everyOutcome.map(wordOfOutcome)).not.toContain(
      m.outcome_unrecognised(),
    );
  });

  it("draws an outcome it does not know without shouting about it", () => {
    expect(toneOfOutcome(unnamedOutcome)).toBe("calm");
  });

  it("gives a family it does not know a word rather than a blank tag", () => {
    expect(wordOfCategory(unnamedCategory)).toBe(m.category_unrecognised());
    expect(everyCategory.map(wordOfCategory)).not.toContain(
      m.category_unrecognised(),
    );
  });

  it("says a run it cannot grade came to a word it does not know", () => {
    const grading = gradingOf(unnamedOverall);

    expect(grading.lead).toBe(m.overall_unrecognised_lead());
    expect(grading.prose).toBe(m.overall_unrecognised_prose());
    expect(toneOfOverall(unnamedOverall)).toBe("calm");
  });

  // The screen reads `.summary` off whatever this hands back, so an account is
  // owed for every verdict rather than for the five that were named.
  it("reads a verdict it cannot place as one that said nothing", () => {
    expect(accountOf(unnamedVerdict)).toEqual({
      summary: undefined,
      meaning: undefined,
      remedies: [],
    });
  });
});
