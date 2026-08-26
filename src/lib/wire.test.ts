import { describe, expect, it } from "vitest";
import { bytes } from "./figures";
import { everyState, everyTone } from "./state";
import {
  everyCondition,
  everyLink,
  everyServiceState,
  everyStall,
  everyStanding,
  figureOf,
  reasonOf,
  stateOfService,
  stateOfStall,
  stateOfStanding,
  toneOfStanding,
  wordOfCondition,
  wordOfLink,
  wordOfStall,
  wordOfStanding,
  type Health,
  type Measured,
  type Service,
  type Space,
  type Stack,
  type Stall,
} from "./wire";
import * as m from "../paraglide/messages.js";

/**
 * Words from a lemonfiber whose vocabulary is wider than this build's.
 *
 * The wire version stays one number while words are added under it, so a running
 * binary can answer with one the generated types do not name and the version
 * gate still passes. There is no way to write one but to say so.
 */
const unnamedServiceState = "paused" as unknown as Service["state"];
const unnamedStanding = "wedged" as unknown as Health["standing"];
const unnamedCondition = "draining" as unknown as Stack["condition"];
const unnamedStall = "throttled" as unknown as Stall["stall"];
const unnamedLink = "reflinking" as unknown as Space["hardlink"];
const unnamedReading = {
  reading: "guessed",
  value: 1024,
} as unknown as Measured;

describe("stateOfService", () => {
  it.each(everyServiceState)("gives %s a state the interface has", (state) => {
    expect(everyState).toContain(stateOfService(state));
  });

  it("trusts a service that is up and answering", () => {
    expect(stateOfService("healthy")).toBe("known");
    expect(stateOfService("running")).toBe("known");
  });

  // A service failing its own health check is still answering, and what it says
  // was true once. That is what "gone quiet" means everywhere else.
  it("reads a service failing its own check as one gone quiet", () => {
    expect(stateOfService("unhealthy")).toBe("quiet");
  });

  it("reads a service nothing here runs as one never measured", () => {
    expect(stateOfService("host-managed")).toBe("unknown");
  });

  it.each(["failed", "crash-looping", "stopped", "absent"] as const)(
    "reads %s as stopped",
    (state) => {
      expect(stateOfService(state)).toBe("stopped");
    },
  );
});

describe("reasonOf", () => {
  it("gives the source's own words where a panel could not be filled", () => {
    expect(
      reasonOf({
        panel: "unavailable",
        data: { reason: "The download client is not answering." },
      }),
    ).toBe("The download client is not answering.");
  });

  // A filled panel has no reason to give, and neither has one nothing has
  // delivered yet.
  it("gives none where there is nothing to explain", () => {
    expect(reasonOf({ panel: "ready", data: [] })).toBeUndefined();
    expect(reasonOf(undefined)).toBeUndefined();
  });
});

describe("figureOf", () => {
  it("writes a figure measured now in full", () => {
    expect(figureOf({ reading: "known", value: 1024 }, bytes)).toEqual({
      state: "known",
      figure: "1 KB",
    });
  });

  // The last figure a silent source gave is still the best answer there is, so
  // it is kept and marked rather than blanked.
  it("keeps the last figure a silent source gave", () => {
    expect(figureOf({ reading: "stale", value: 1024 }, bytes)).toEqual({
      state: "quiet",
      figure: "1 KB",
    });
  });

  // A zero and no answer mean opposite things, and this is the very figure the
  // difference is about.
  it("gives no figure at all where nothing was read", () => {
    expect(figureOf({ reading: "unknown" }, bytes)).toEqual({
      state: "unknown",
      figure: undefined,
    });
  });
});

describe("stateOfStanding", () => {
  it.each(everyStanding)("gives %s a state the interface has", (standing) => {
    expect(everyState).toContain(stateOfStanding(standing));
  });

  // A count of nothing wrong and no count at all must not look alike.
  it.each(["unknown", "unconfigured"] as const)(
    "gives %s no figure to show",
    (standing) => {
      expect(stateOfStanding(standing)).toBe("unknown");
    },
  );

  it("shows the count where something has graded the stack", () => {
    expect(stateOfStanding("healthy")).toBe("known");
    expect(stateOfStanding("critical")).toBe("known");
  });
});

describe("toneOfStanding", () => {
  it.each(everyStanding)(
    "gives %s a severity the interface has",
    (standing) => {
      expect(everyTone).toContain(toneOfStanding(standing));
    },
  );

  // A stack stopped on purpose and one nobody has set up are neither of them
  // emergencies, and giving them one would make them compete with one.
  it("keeps a stack that is well, unset or ungraded quiet", () => {
    expect(toneOfStanding("healthy")).toBe("calm");
    expect(toneOfStanding("unconfigured")).toBe("calm");
    expect(toneOfStanding("unknown")).toBe("calm");
  });

  it.each(["advisory", "degraded", "stopped"] as const)(
    "grades %s as worth watching",
    (standing) => {
      expect(toneOfStanding(standing)).toBe("watch");
    },
  );

  it.each(["broken", "critical"] as const)(
    "grades %s as wanting the operator",
    (standing) => {
      expect(toneOfStanding(standing)).toBe("alarm");
    },
  );
});

describe("wordOfStanding", () => {
  it.each(everyStanding)("gives %s a plain phrase", (standing) => {
    const word = wordOfStanding(standing);
    expect(word).toMatch(/^[A-Z]/);
    expect(word).not.toMatch(/unconfigured|advisory|critical/i);
  });

  it("gives each grading a phrase of its own", () => {
    expect(new Set(everyStanding.map(wordOfStanding)).size).toBe(
      everyStanding.length,
    );
  });
});

describe("wordOfCondition", () => {
  it.each(everyCondition)("gives %s a clause", (condition) => {
    expect(wordOfCondition(condition)).toMatch(/^[a-z]/);
  });

  it("gives each reading a clause of its own", () => {
    expect(new Set(everyCondition.map(wordOfCondition)).size).toBe(
      everyCondition.length,
    );
  });
});

describe("stateOfStall", () => {
  it.each(everyStall)("gives %s a state the interface has", (stall) => {
    expect(everyState).toContain(stateOfStall(stall));
  });

  // Slowly is still happening; the rest have stopped and will not start again
  // on their own.
  it.each(["slow", "waiting-indefinitely"] as const)(
    "reads %s as under way",
    (stall) => {
      expect(stateOfStall(stall)).toBe("part");
    },
  );

  it.each([
    "redownload-loop",
    "repeated-import-failure",
    "completed-not-imported",
    "orphaned",
    "stalled-download",
  ] as const)("reads %s as stopped", (stall) => {
    expect(stateOfStall(stall)).toBe("stopped");
  });
});

describe("wordOfStall", () => {
  it.each(everyStall)("says what %s means in a sentence", (stall) => {
    const said = wordOfStall(stall);
    expect(said).toMatch(/^[A-Z]/);
    expect(said).not.toMatch(/orphan|import|stall/i);
  });

  it("gives each stall a sentence of its own", () => {
    expect(new Set(everyStall.map(wordOfStall)).size).toBe(everyStall.length);
  });
});

describe("wordOfLink", () => {
  it.each(everyLink)("says what %s did with the file", (link) => {
    expect(wordOfLink(link)).toMatch(/[a-z]/);
  });

  // One copy of a file and two are the difference this phrase exists to carry.
  it("tells linking and copying apart", () => {
    expect(wordOfLink("linking")).not.toBe(wordOfLink("copying"));
  });
});

// The wire version is one number and the vocabulary under it grows, so a
// running binary can answer with a word this build's contract does not name.
// Falling off the end of a switch hands back `undefined`, which reaches a screen
// as a blank where a word was owed.
describe("a word this build has no entry for", () => {
  it("reads a service state it does not know as one it has not measured", () => {
    expect(stateOfService(unnamedServiceState)).toBe("unknown");
  });

  it("shows no count for a grading it does not know", () => {
    expect(stateOfStanding(unnamedStanding)).toBe("unknown");
  });

  it("draws a grading it does not know without shouting about it", () => {
    expect(toneOfStanding(unnamedStanding)).toBe("calm");
  });

  it("gives a grading it does not know a phrase of its own", () => {
    expect(wordOfStanding(unnamedStanding)).toBe(m.standing_unrecognised());
    expect(everyStanding.map(wordOfStanding)).not.toContain(
      m.standing_unrecognised(),
    );
  });

  it("gives a reading of what is running that it does not know a clause", () => {
    expect(wordOfCondition(unnamedCondition)).toBe(m.condition_unrecognised());
  });

  it("reads a stall it does not know as one it cannot grade", () => {
    expect(stateOfStall(unnamedStall)).toBe("unknown");
  });

  it("gives a stall it does not know a sentence of its own", () => {
    expect(wordOfStall(unnamedStall)).toBe(m.stall_unrecognised());
    expect(everyStall.map(wordOfStall)).not.toContain(m.stall_unrecognised());
  });

  it("gives an import it does not know a phrase rather than a blank", () => {
    expect(wordOfLink(unnamedLink)).toBe(m.link_unrecognised());
  });

  // A figure whose reading is a word this build cannot place is not a figure it
  // may put on the screen: the reading is what says how far to trust it.
  it("shows no figure for a reading it does not know", () => {
    expect(figureOf(unnamedReading, bytes)).toEqual({
      state: "unknown",
      figure: undefined,
    });
  });
});
