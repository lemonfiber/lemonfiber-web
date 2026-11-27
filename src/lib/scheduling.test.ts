import { describe, expect, it } from "vitest";
import {
  everyScheduling,
  givenForRun,
  isScheduling,
  scheduling,
  standingRun,
} from "./scheduling";
import { ranLines } from "./ran";
import type { Scheduled } from "./scheduled";
import type { Work } from "./work";
import { heldBack, wentNow, wouldRun } from "../api/runs";
import * as m from "../paraglide/messages.js";

const configarr: Scheduled = {
  id: "configarr",
  name: "Configarr",
  fired: true,
  health: "succeeded",
  running: false,
  skipped: 0,
};

/** A record of a run asked for, answered with what it came to. */
const answered = (
  id: string,
  came: Extract<Work, { at: "done" }>["came"],
): Work => ({
  id,
  doing: "run",
  scoped: false,
  given: { service: "configarr", now: true, dry_run: true },
  at: "done",
  job: undefined,
  came,
});

describe("what the scheduled panel asks for", () => {
  it("is the one request it makes, and nothing else", () => {
    expect(everyScheduling.every(isScheduling)).toBe(true);
    expect(isScheduling("update")).toBe(false);
  });

  it("rehearses running one now first, and runs it on a yes", () => {
    expect(scheduling.question({ doing: "run", service: "configarr" })).toBe(
      undefined,
    );
    expect(givenForRun({ doing: "run", service: "configarr" })).toStrictEqual({
      service: "configarr",
      now: true,
      dry_run: true,
    });
    expect(
      givenForRun({ doing: "run", service: "configarr", agreed: true }),
    ).toStrictEqual({ service: "configarr", now: true });
  });
});

describe("the rehearsal standing on the screen", () => {
  it("is the newest rehearsal, named, with what it found and a yes", () => {
    expect(
      standingRun(
        [answered("3", { kind: "ran", report: wouldRun })],
        [configarr],
      ),
    ).toStrictEqual({
      id: "3",
      service: "configarr",
      name: "Configarr",
      said: m.scheduled_rehearsal_prose(),
      lines: ranLines(wouldRun),
      ready: true,
    });
  });

  it("offers no yes where something held it back, or no run was due", () => {
    const held = [answered("4", { kind: "ran", report: heldBack })];
    expect(standingRun(held, [configarr])?.ready).toBe(false);
    expect(standingRun(held, [configarr])?.said).toBe(
      m.scheduled_rehearsal_held(),
    );
    const undue = { ...wouldRun, due: false };
    expect(
      standingRun([answered("5", { kind: "ran", report: undue })], [])?.ready,
    ).toBe(false);
  });

  it("names the service by its id where the panel no longer lists it", () => {
    expect(
      standingRun([answered("6", { kind: "ran", report: wouldRun })], [])?.name,
    ).toBe("configarr");
  });

  it("is gone once it ran, while one is under way, or where none answered", () => {
    expect(
      standingRun([answered("7", { kind: "ran", report: wentNow })], []),
    ).toBeUndefined();
    expect(
      standingRun([answered("8", { kind: "unread" })], []),
    ).toBeUndefined();
    const going: Work = {
      id: "9",
      doing: "run",
      scoped: false,
      given: {},
      at: "under-way",
      job: "5c63",
    };
    expect(standingRun([going], [])).toBeUndefined();
    expect(standingRun([], [])).toBeUndefined();
  });
});
