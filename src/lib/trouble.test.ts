import { describe, expect, it } from "vitest";
import { everyTone } from "./state";
import {
  everyFixing,
  everySeverity,
  everyWay,
  isSetAside,
  toneOfAlert,
  toneOfSeverity,
  wordOfFixing,
  wordOfSeverity,
  wordOfWay,
  type Fixing,
  type Severity,
  type Way,
} from "./trouble";
import type { Alert } from "./wire";
import * as m from "../paraglide/messages.js";

/**
 * Words from a lemonfiber whose vocabulary is wider than this build's.
 *
 * The wire version stays one number while words are added under it, so a running
 * binary can answer with one the generated types do not name and the version
 * gate still passes. There is no way to write one but to say so.
 */
const unnamedSeverity = "catastrophic" as unknown as Severity;
const unnamedFixing = "deferred" as unknown as Fixing;
const unnamedWay = "worsened" as unknown as Way;

/** One interruption, as the stream delivers it. */
const alert: Alert = {
  check: "vpn.egress-match",
  kind: "vpn-egress",
  moment: "onset",
  severity: "critical",
  summary: "Downloading left this machine outside the tunnel.",
  remedies: ["Stop the download client, then start the tunnel again."],
  affected: ["vpn.egress-match"],
};

describe("how much something wrong matters", () => {
  it.each(everySeverity)("gives %s a severity the interface has", (weight) => {
    expect(everyTone).toContain(toneOfSeverity(weight));
  });

  it.each(everySeverity)("has a word for %s", (weight) => {
    expect(wordOfSeverity(weight)).not.toBe("");
  });

  it("gives each weight a word of its own", () => {
    expect(new Set(everySeverity.map(wordOfSeverity)).size).toBe(
      everySeverity.length,
    );
  });

  // Something broken and something whose consequences reach outside the machine
  // both want the operator now, and the interface has one weight for that.
  it("asks for the operator for what is broken and what is urgent", () => {
    expect(toneOfSeverity("critical")).toBe("alarm");
    expect(toneOfSeverity("error")).toBe("alarm");
    expect(toneOfSeverity("warning")).toBe("watch");
    expect(toneOfSeverity("advisory")).toBe("calm");
  });
});

describe("where something wrong stands with being fixed", () => {
  it.each(everyFixing)("has a word for %s", (fixing) => {
    expect(wordOfFixing(fixing)).not.toBe("");
  });

  it("gives each standing a word of its own", () => {
    expect(new Set(everyFixing.map(wordOfFixing)).size).toBe(
      everyFixing.length,
    );
  });

  // A finding the operator answered is the one standing a screen draws
  // differently, so the vocabulary says which it is rather than each screen
  // comparing against the word itself.
  it("knows which standing the operator has already answered", () => {
    expect(isSetAside("suppressed")).toBe(true);
    for (const fixing of everyFixing.filter((one) => one !== "suppressed")) {
      expect(isSetAside(fixing)).toBe(false);
    }
  });
});

describe("which way an interruption went", () => {
  it.each(everyWay)("has a word for %s", (way) => {
    expect(wordOfWay(way)).not.toBe("");
  });

  it("tells one that started from one that is over", () => {
    expect(wordOfWay("onset")).not.toBe(wordOfWay("resolved"));
  });

  it("draws one that is running at the weight it carries", () => {
    expect(toneOfAlert(alert)).toBe("alarm");
    expect(toneOfAlert({ ...alert, severity: "warning" })).toBe("watch");
  });

  // What it reports has stopped being true, and a red row for it would send an
  // operator after a condition that is already gone.
  it("draws one that is over calmly, whatever it carried", () => {
    expect(toneOfAlert({ ...alert, moment: "resolved" })).toBe("calm");
  });
});

// The wire version is one number and the vocabulary under it grows, so a
// running binary can answer with a word this build's contract does not name.
// Falling off the end of a switch hands back `undefined`, and a screen reads a
// field off what it was given.
describe("a word this build has no entry for", () => {
  it("gives a weight it does not know a word rather than a blank tag", () => {
    expect(wordOfSeverity(unnamedSeverity)).toBe(m.severity_unrecognised());
    expect(everySeverity.map(wordOfSeverity)).not.toContain(
      m.severity_unrecognised(),
    );
  });

  it("draws a weight it does not know without shouting about it", () => {
    expect(toneOfSeverity(unnamedSeverity)).toBe("calm");
  });

  it("gives a standing it does not know a word of its own", () => {
    expect(wordOfFixing(unnamedFixing)).toBe(m.fixing_unrecognised());
    expect(everyFixing.map(wordOfFixing)).not.toContain(
      m.fixing_unrecognised(),
    );
  });

  it("does not read a standing it cannot place as one set aside", () => {
    expect(isSetAside(unnamedFixing)).toBe(false);
  });

  it("gives a way it does not know a word of its own", () => {
    expect(wordOfWay(unnamedWay)).toBe(m.told_unrecognised());
    expect(everyWay.map(wordOfWay)).not.toContain(m.told_unrecognised());
  });

  // A way this build cannot place is not a resolution, so the row keeps the
  // weight the condition was raised with.
  it("keeps the weight of an interruption whose way it cannot place", () => {
    expect(toneOfAlert({ ...alert, moment: unnamedWay })).toBe("alarm");
  });
});
