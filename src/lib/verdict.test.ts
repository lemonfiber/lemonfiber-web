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
import type { Verdict } from "./wire";
import * as m from "../paraglide/messages.js";

/** A verdict as the wire renders it, which the generated types do not declare. */
const answered = (held: Record<string, unknown>): Verdict =>
  held as unknown as Verdict;

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
  // types for those two verdicts hold the outcome alone.
  it.each(["warn", "fail"] as const)(
    "reads what a %s carries beside its outcome",
    (outcome) => {
      const account = accountOf(
        answered({
          outcome,
          summary: "The disk is nearly full.",
          meaning: "Imports will fail before downloads do.",
          remedies: [
            { action: "Delete what has been watched.", detail: "the library" },
          ],
        }),
      );

      expect(account.summary).toBe("The disk is nearly full.");
      expect(account.meaning).toBe("Imports will fail before downloads do.");
      expect(account.remedies).toEqual([
        { action: "Delete what has been watched.", detail: "the library" },
      ]);
    },
  );

  // A verdict carrying something other than what is expected reads as one that
  // said nothing, which is a finding with its title and its outcome rather than
  // one with an empty sentence under it.
  it("says nothing where the fields are not the ones named", () => {
    expect(
      accountOf(answered({ outcome: "warn", summary: 12, meaning: null })),
    ).toEqual({ summary: undefined, meaning: undefined, remedies: [] });
  });

  it("keeps no remedy from a list that is not one", () => {
    expect(
      accountOf(answered({ outcome: "fail", remedies: "do something" }))
        .remedies,
    ).toEqual([]);
  });

  it.each([[null], [7], [{ detail: "nothing to do" }]])(
    "drops %s from a list of remedies",
    (held) => {
      expect(
        accountOf(answered({ outcome: "fail", remedies: [held] })).remedies,
      ).toEqual([]);
    },
  );
});
