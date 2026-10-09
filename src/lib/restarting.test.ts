import { describe, expect, it } from "vitest";
import { agreedRestart, offeredRestart, rehearsingRestart } from "./restarting";
import type { Work } from "./work";
import type { Lifecycle } from "./came";

const chosenForm = "media";

/** A restart of one form, rehearsed: what it would restart, under an offer. */
const report: Lifecycle = {
  action: "restart",
  command: [],
  plan: {
    dropped: [],
    filtered: [],
    footprint: { estimated_mib: 64, unestimated: [] },
    forms: [chosenForm],
    profiles: [chosenForm],
    services: ["gluetun", "sonarr"],
  },
  rehearsed: true,
  services: [],
  stack_edits: [],
  offer: "restart:gluetun,sonarr",
};

const restartOffered: Work = {
  id: "7",
  doing: "restart",
  scoped: true,
  given: { forms: [chosenForm], dry_run: true },
  at: "done",
  job: undefined,
  came: { kind: "lifecycle", report },
};

const finished: Work = {
  ...restartOffered,
  id: "2",
  doing: "up",
  came: { kind: "lifecycle", report: { ...report, rehearsed: false } },
};

describe("pressing restart", () => {
  it("rehearses the forms chosen rather than restarting them", () => {
    expect(rehearsingRestart(["usenet"])).toStrictEqual({
      forms: ["usenet"],
      dry_run: true,
    });
  });
});

describe("a restart standing for a yes", () => {
  it("is a rehearsal that came back with what it would restart, under an offer", () => {
    expect(offeredRestart(restartOffered)).toStrictEqual({
      id: "7",
      scoped: true,
      forms: [chosenForm],
      services: ["gluetun", "sonarr"],
      offer: "restart:gluetun,sonarr",
    });
  });

  it.each<[string, Work]>([
    ["anything other than a restart", finished],
    [
      "a restart still under way",
      { ...restartOffered, at: "under-way", job: "5c63" },
    ],
    [
      "a restart that came to something other than a run",
      { ...restartOffered, came: { kind: "unread" } },
    ],
    [
      "a restart carried out rather than rehearsed",
      {
        ...restartOffered,
        came: { kind: "lifecycle", report: { ...report, rehearsed: false } },
      },
    ],
    [
      "a rehearsal that named no offer",
      {
        ...restartOffered,
        came: { kind: "lifecycle", report: { ...report, offer: null } },
      },
    ],
  ])("is not %s", (_what, work) => {
    expect(offeredRestart(work)).toBeUndefined();
  });

  it("is answered with the forms it was read against, and the offer read", () => {
    const offered = offeredRestart(restartOffered);
    expect(offered && agreedRestart(offered)).toStrictEqual({
      forms: [chosenForm],
      offer: "restart:gluetun,sonarr",
    });
  });
});
