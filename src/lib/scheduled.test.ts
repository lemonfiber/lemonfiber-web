import { describe, expect, it } from "vitest";
import { whenOf } from "./instant";
import {
  linesOfScheduled,
  saidOfScheduled,
  stateOfScheduled,
  wordOfScheduled,
  type Scheduled,
} from "./scheduled";
import * as m from "../paraglide/messages.js";

const ended = 1_790_000_000;

const one = (over: Partial<Scheduled> = {}): Scheduled => ({
  id: "configarr",
  name: "Configarr",
  fired: true,
  health: "succeeded",
  running: false,
  skipped: 0,
  last: { started: ended - 30, ended, exit: 0, log: ["synced"] },
  ...over,
});

const failed = one({
  health: "failed",
  last: { started: ended - 30, ended, exit: 2, log: ["first", "last"] },
});

describe("where a run-and-exit service stands", () => {
  it.each([
    ["succeeded", "known", m.scheduled_succeeded()],
    ["failed", "stopped", m.scheduled_failed()],
    ["not-run", "quiet", m.scheduled_not_run()],
  ] as const)("reads %s as %s", (health, state, word) => {
    expect(stateOfScheduled(one({ health }))).toBe(state);
    expect(wordOfScheduled(one({ health }))).toBe(word);
  });

  it("reads a run going now as part way, whatever the last one did", () => {
    expect(stateOfScheduled({ ...failed, running: true })).toBe("part");
    expect(wordOfScheduled({ ...failed, running: true })).toBe(
      m.scheduled_running(),
    );
  });

  it("reads a health this build has no word for as unknown", () => {
    const strange = one({ health: "paused" as Scheduled["health"] });
    expect(stateOfScheduled(strange)).toBe("unknown");
    expect(wordOfScheduled(strange)).toBe(m.scheduled_unrecognised());
  });
});

describe("how its last run ended", () => {
  it("says when it ended and the exit code", () => {
    expect(saidOfScheduled(failed)).toBe(
      m.scheduled_ended({ when: whenOf(ended), exit: 2 }),
    );
  });

  it("says a run a signal ended has no exit code", () => {
    const signalled = one({ last: { started: 1, ended, exit: null, log: [] } });
    expect(saidOfScheduled(signalled)).toBe(
      m.scheduled_ended_unexited({ when: whenOf(ended) }),
    );
  });

  it("says it has not run where it never has", () => {
    expect(saidOfScheduled(one({ health: "not-run", last: null }))).toBe(
      m.scheduled_never_ran(),
    );
  });

  it("adds the times skipped and a scheduler not holding its job", () => {
    const said = saidOfScheduled(one({ skipped: 3, fired: false }));
    expect(said).toContain(m.scheduled_skipped({ count: 3 }));
    expect(said).toContain(m.scheduled_unfired());
  });
});

describe("the last lines a run wrote", () => {
  it("hands over the lines of a failed run, oldest first", () => {
    expect(linesOfScheduled(failed)).toEqual(["first", "last"]);
  });

  it("hands over nothing for a run that went fine", () => {
    expect(linesOfScheduled(one())).toBeUndefined();
  });

  it("hands over nothing for a failed run that wrote nothing", () => {
    const quiet = one({
      health: "failed",
      last: { started: 1, ended, exit: 1, log: [] },
    });
    expect(linesOfScheduled(quiet)).toBeUndefined();
  });

  it("hands over nothing for a service that has never run", () => {
    expect(
      linesOfScheduled(one({ health: "not-run", last: null })),
    ).toBeUndefined();
  });
});
