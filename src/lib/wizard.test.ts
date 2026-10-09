import { describe, expect, it } from "vitest";
import {
  chosenFrom,
  entryOf,
  everyAppetite,
  everyLibrary,
  everyRecovery,
  everyStep,
  folderTyped,
  asks,
  MOST_PORT,
  plannedLine,
  proofLine,
  proseOfRecovery,
  proseOfStep,
  stepsAhead,
  titleOfRecovery,
  titleOfStep,
  unproven,
  wholeTyped,
  wordOfAppetite,
  wordOfLibrary,
  type Proof,
} from "./wizard";
import { fresh, interrupted, reviewing, setUp } from "../api/setups";
import { originWords } from "./configured";
import * as m from "../paraglide/messages.js";

describe("which screen the operator's page opens on", () => {
  it("waits for an answer, and says an unreadable one as that", () => {
    expect(entryOf(undefined)).toBe("waiting");
    expect(
      entryOf({ ok: false, problem: { kind: "unreachable", message: "No." } }),
    ).toBe("unknown");
  });

  it("opens the console on a set-up machine, the wizard on a fresh one, and recovery on a stopped apply", () => {
    expect(entryOf({ ok: true, value: setUp })).toBe("console");
    expect(entryOf({ ok: true, value: fresh })).toBe("wizard");
    expect(entryOf({ ok: true, value: reviewing })).toBe("wizard");
    expect(entryOf({ ok: true, value: interrupted })).toBe("recovery");
  });
});

describe("what each step says", () => {
  it.each(everyStep)("gives %s a title and what it is for", (step) => {
    expect(titleOfStep(step)).not.toBe("");
    expect(proseOfStep(step)).not.toBe("");
  });

  it("tells the steps that only inform from the ones that ask", () => {
    expect(everyStep.filter((step) => !asks(step))).toStrictEqual([
      "welcome",
      "preflight",
      "prerequisites",
      "review",
    ]);
  });

  it("lists the step it is on, every question left in order, and the review", () => {
    expect(
      stepsAhead({
        ...fresh,
        at: "library",
        unanswered: ["autostart", "library"],
      }),
    ).toStrictEqual(["library", "autostart", "review"]);
    expect(stepsAhead(reviewing)).toStrictEqual(["review"]);
  });
});

describe("what proving a credential came to", () => {
  const proofs: readonly [Proof, string, string][] = [
    [
      { outcome: "valid", observed: "it searched" },
      m.wizard_proof_indexer_valid({ observed: "it searched" }),
      m.wizard_proof_provider_valid({ observed: "it searched" }),
    ],
    [
      { outcome: "rejected", detail: "bad key" },
      m.wizard_proof_indexer_rejected({ detail: "bad key" }),
      m.wizard_proof_provider_rejected({ detail: "bad key" }),
    ],
    [
      { outcome: "unreachable", detail: "timed out" },
      m.wizard_proof_unreachable({ detail: "timed out" }),
      m.wizard_proof_unreachable({ detail: "timed out" }),
    ],
    [
      { outcome: "degraded", detail: "it is out of grabs" },
      m.wizard_proof_degraded({ detail: "it is out of grabs" }),
      m.wizard_proof_degraded({ detail: "it is out of grabs" }),
    ],
  ];

  it.each(proofs)(
    "says %o naming whose credential it was",
    (proof, indexer, provider) => {
      expect(proofLine(proof, "credentials")).toBe(indexer);
      expect(proofLine(proof, "provider")).toBe(provider);
      expect(unproven(proof)).toBe(proof.outcome !== "valid");
    },
  );

  it("says an outcome it has no words for as that", () => {
    const odd = { outcome: "expired" } as unknown as Proof;
    expect(proofLine(odd, "credentials")).toBe(m.wizard_proof_other());
  });
});

describe("what review lists", () => {
  it("shows a value with whose it is, and withholds a secret", () => {
    const [root, key] = reviewing.plan;
    if (root === undefined || key === undefined)
      throw new Error("two settings");
    expect(plannedLine(root)).toBe(
      m.wizard_planned({
        key: "DATA_ROOT",
        value: "/srv/media",
        origin: originWords(root.origin),
      }),
    );
    expect(plannedLine(key)).toBe(
      m.wizard_planned_secret({
        key: "INDEXER_KEY",
        origin: originWords(key.origin),
      }),
    );
  });
});

describe("the ways out of a stopped apply", () => {
  it.each(everyRecovery)("names %s and says what it does", (choice) => {
    expect(titleOfRecovery(choice)).not.toBe("");
    expect(proseOfRecovery(choice)).not.toBe("");
  });
});

describe("what a form takes", () => {
  it("takes a data folder only as a full path, trimmed", () => {
    expect(folderTyped(" /srv/media ")).toBe("/srv/media");
    expect(folderTyped("media")).toBeUndefined();
    expect(folderTyped("/")).toBeUndefined();
  });

  it("takes a whole number only within its bounds", () => {
    expect(wholeTyped(" 563 ", 1, MOST_PORT)).toBe(563);
    expect(wholeTyped("0", 1, MOST_PORT)).toBeUndefined();
    expect(wholeTyped("70000", 1, MOST_PORT)).toBeUndefined();
    expect(wholeTyped("5.5", 1, MOST_PORT)).toBeUndefined();
  });

  it("chooses the one a control names, or keeps the one held", () => {
    expect(chosenFrom(everyLibrary, "none", "jellyfin-docker")).toBe("none");
    expect(chosenFrom(everyLibrary, "plex", "jellyfin-docker")).toBe(
      "jellyfin-docker",
    );
  });

  it("names every way to serve the library and every amount to be told", () => {
    expect(new Set(everyLibrary.map((one) => wordOfLibrary(one))).size).toBe(3);
    expect(new Set(everyAppetite.map((one) => wordOfAppetite(one))).size).toBe(
      3,
    );
  });
});
