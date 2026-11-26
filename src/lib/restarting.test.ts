import { describe, expect, it } from "vitest";
import {
  agreedStop,
  offeredStop,
  rehearsalTitle,
  rehearsingStop,
  stopQuestion,
} from "./restarting";
import * as m from "../paraglide/messages.js";
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

const switchOffered: Work = {
  ...restartOffered,
  id: "8",
  doing: "switch",
  came: {
    kind: "lifecycle",
    report: {
      ...report,
      action: "switch",
      offer: null,
      switched: {
        kept: ["gluetun"],
        started: ["sonarr"],
        stopped: ["qbittorrent"],
      },
    },
  },
};

const finished: Work = {
  ...restartOffered,
  id: "2",
  doing: "up",
  came: { kind: "lifecycle", report: { ...report, rehearsed: false } },
};

describe("pressing restart", () => {
  it("rehearses the forms chosen rather than restarting them", () => {
    expect(rehearsingStop(["usenet"])).toStrictEqual({
      forms: ["usenet"],
      dry_run: true,
    });
  });
});

describe("a restart standing for a yes", () => {
  it("is a rehearsal that came back with what it would restart, under an offer", () => {
    expect(offeredStop(restartOffered)).toStrictEqual({
      doing: "restart",
      id: "7",
      scoped: true,
      forms: [chosenForm],
      stops: ["gluetun", "sonarr"],
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
    expect(offeredStop(work)).toBeUndefined();
  });

  it("is answered with the forms it was read against, and the offer read", () => {
    const offered = offeredStop(restartOffered);
    expect(offered && agreedStop(offered)).toStrictEqual({
      forms: [chosenForm],
      offer: "restart:gluetun,sonarr",
    });
  });
});

describe("a switch standing for a yes", () => {
  it("is a rehearsal that came back with what it would stop", () => {
    expect(offeredStop(switchOffered)).toStrictEqual({
      doing: "switch",
      id: "8",
      scoped: true,
      forms: [chosenForm],
      stops: ["qbittorrent"],
      offer: undefined,
    });
  });

  it("is not a switch rehearsal that said nothing of what it moves", () => {
    expect(
      offeredStop({ ...restartOffered, id: "9", doing: "switch" }),
    ).toBeUndefined();
  });

  it("is answered with the forms it was read against, and no offer where none was made", () => {
    const offered = offeredStop(switchOffered);
    expect(offered && agreedStop(offered)).toStrictEqual({
      forms: [chosenForm],
    });
  });
});

describe("what a restart or a switch asks", () => {
  it("names what a switch stops, and offers its yes even where nothing stops", () => {
    const offered = offeredStop(switchOffered);
    const asked = offered && stopQuestion(offered);
    expect(asked?.prose).toBe(m.confirm_switch_prose());
    expect(asked?.yes).toBe(m.action_switch_these());
    expect(offered && stopQuestion({ ...offered, stops: [] }).prose).toBe(
      m.confirm_switch_nothing(),
    );
  });

  it("offers a restart's yes only where something would restart", () => {
    const offered = offeredStop(restartOffered);
    expect(offered && stopQuestion(offered).yes).toBe(m.action_restart_these());
    expect(offered && stopQuestion({ ...offered, stops: [] })).toMatchObject({
      prose: m.confirm_restart_nothing(),
      yes: undefined,
    });
  });

  it("names the reading after what is being read", () => {
    expect(rehearsalTitle("switch")).toBe(m.doing_switch_reading());
    expect(rehearsalTitle("restart")).toBe(m.doing_restart_reading());
  });
});
