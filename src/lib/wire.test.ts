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
} from "./wire";

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
