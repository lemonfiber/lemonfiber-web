import { describe, expect, it } from "vitest";
import {
  linesOf,
  type Checked,
  type Lifecycle,
  type Repaired,
  type Seeded,
  type Undone,
} from "./came";
import { gradingOf } from "./verdict";
import { carried, offer, undone } from "../api/reports";
import * as m from "../paraglide/messages.js";

/** A run of the checks in which nothing was found. */
const allWell: Checked = { rehearsed: false, overall: "healthy", findings: [] };

/** A start that did what it was asked and nothing else worth saying. */
const plain: Lifecycle = {
  action: "up",
  command: ["docker", "compose", "up", "-d"],
  plan: {
    dropped: [],
    filtered: [],
    footprint: { estimated_mib: 64, unestimated: [] },
    forms: ["core"],
    profiles: ["core"],
    services: ["gluetun"],
  },
  rehearsed: false,
  services: [],
  stack_edits: [],
};

const said = (over: Partial<Lifecycle>): readonly string[] =>
  linesOf({ kind: "lifecycle", report: { ...plain, ...over } });

/** One service, doing what it is doing. */
const service = (
  name: string,
  state: Lifecycle["services"][number]["state"],
): Lifecycle["services"][number] => ({
  criticality: "core",
  depends_on: [],
  describes: "What it is for",
  forms: ["core"],
  id: name,
  name,
  profile: "core",
  state,
});

describe("what a start, stop, switch, restart or fetch came to", () => {
  it("always says what ran, so it is never a matter of trust", () => {
    expect(said({})).toStrictEqual([
      m.came_command({ command: "docker compose up -d" }),
    ]);
  });

  it("says a rehearsal changed nothing", () => {
    expect(said({ rehearsed: true })).toContain(m.came_rehearsed());
  });

  // Why nothing was run is lemonfiber's sentence, and passes through as it is.
  it("says why nothing was run, in lemonfiber's words", () => {
    const held = "The stack was stopped on purpose, so nothing was started.";
    expect(said({ held })).toContain(held);
  });

  it("says nothing of why where nothing was held back", () => {
    expect(said({ held: null })).toHaveLength(1);
  });

  it("names a status that is not the one everything going through gives", () => {
    expect(said({ status: 1 })).toContain(m.came_exit({ status: "1" }));
  });

  it("says nothing of a status that says everything went through", () => {
    expect(said({ status: 0 })).toHaveLength(1);
    expect(said({ status: null })).toHaveLength(1);
  });

  it.each([
    ["active", m.came_condition_active()],
    ["partial", m.came_condition_partial()],
    ["degraded", m.came_condition_degraded()],
    ["inactive", m.came_condition_inactive()],
  ] as const)("says what %s services amount to", (condition, words) => {
    expect(said({ condition })).toContain(words);
  });

  // A running lemonfiber can be wider than the contract this build knows.
  it("says so of a word for the services it does not know", () => {
    const wider = "resting" as unknown as NonNullable<Lifecycle["condition"]>;
    expect(said({ condition: wider })).toContain(m.came_condition_unknown());
  });

  it("says nothing of how the services stand where it was not said", () => {
    expect(said({ condition: null })).toHaveLength(1);
  });

  it("names what a switch started, stopped and left running", () => {
    const lines = said({
      switched: { started: ["radarr"], stopped: ["lidarr"], kept: ["gluetun"] },
    });

    expect(lines).toContain(m.came_started({ names: "radarr" }));
    expect(lines).toContain(m.came_stopped({ names: "lidarr" }));
    expect(lines).toContain(m.came_kept({ names: "gluetun" }));
  });

  it("says nothing of a switch that moved nothing", () => {
    expect(
      said({ switched: { started: [], stopped: [], kept: [] } }),
    ).toHaveLength(1);
    expect(said({ switched: null })).toHaveLength(1);
  });

  it("names the services that were not running when it finished", () => {
    const lines = said({
      services: [
        service("gluetun", "healthy"),
        service("sonarr", "failed"),
        service("radarr", "stopped"),
        service("jellyfin", "starting"),
        service("plex", "host-managed"),
        service("lidarr", "running"),
      ],
    });

    expect(lines).toContain(m.came_not_up({ names: "sonarr, radarr" }));
    expect(lines).toContain(m.came_still_starting({ names: "jellyfin" }));
    expect(lines).toHaveLength(3);
  });

  it("names a port another project already answers on", () => {
    expect(
      said({
        port_conflicts: [{ port: 8989, held_by: "media", wanted_by: "sonarr" }],
      }),
    ).toContain(
      m.came_port_held({ port: "8989", holder: "media", wanter: "sonarr" }),
    );
  });

  it("passes on what it did about the forwarded port, in lemonfiber's words", () => {
    const forwarding = "The client was moved to port 51413.";
    expect(said({ forwarding })).toContain(forwarding);
    expect(said({ forwarding: null })).toHaveLength(1);
  });

  it("names a stack file that was changed by hand and left as it was", () => {
    expect(
      said({ stack_edits: [{ path: "compose.yaml", diff: "" }] }),
    ).toContain(m.came_edited({ path: "compose.yaml" }));
  });
});

/** A wiring pass that attempted nothing. */
const quiet: Seeded = { assessment: "assessed", rehearsed: false, wirings: [] };

const wiring = (
  state: Seeded["wirings"][number]["state"],
  connection = "SABnzbd into Sonarr",
): Seeded["wirings"][number] => ({
  connection,
  severity: { severity: "informational" },
  state,
});

const seeded = (over: Partial<Seeded>): readonly string[] =>
  linesOf({ kind: "seed", report: { ...quiet, ...over } });

describe("what wiring the programs to each other came to", () => {
  it("says nothing where nothing was attempted", () => {
    expect(seeded({})).toStrictEqual([]);
  });

  it("says a rehearsal changed nothing", () => {
    expect(seeded({ rehearsed: true })).toStrictEqual([m.came_rehearsed()]);
  });

  it("says a change by hand could not be told apart without the record", () => {
    expect(seeded({ assessment: "unassessable" })).toStrictEqual([
      m.came_unassessable(),
    ]);
  });

  it("says a connection that breaks the stack is broken, in its own words", () => {
    const lines = seeded({
      wirings: [
        {
          connection: "Prowlarr into Sonarr",
          severity: {
            severity: "warning",
            breakage: "Sonarr cannot search.",
            remediation: "Run the wiring again once Prowlarr answers.",
          },
          state: { state: "failed", detail: "401 Unauthorized" },
        },
      ],
    });

    expect(lines).toStrictEqual([
      m.came_wiring_broken({
        connection: "Prowlarr into Sonarr",
        breakage: "Sonarr cannot search.",
        remediation: "Run the wiring again once Prowlarr answers.",
      }),
      m.came_wiring_failed({
        connection: "Prowlarr into Sonarr",
        detail: "401 Unauthorized",
      }),
    ]);
  });

  it("puts both values of a conflict beside each other, and leaves it", () => {
    expect(
      seeded({
        wirings: [wiring({ state: "conflicted", yours: "8080", ours: "8989" })],
      }),
    ).toStrictEqual([
      m.came_wiring_conflicted({
        connection: "SABnzbd into Sonarr",
        yours: "8080",
        ours: "8989",
      }),
    ]);
  });

  it("says a value cleared by hand was cleared", () => {
    expect(
      seeded({
        wirings: [wiring({ state: "conflicted", yours: null, ours: "8989" })],
      }),
    ).toStrictEqual([
      m.came_wiring_conflicted({
        connection: "SABnzbd into Sonarr",
        yours: m.came_value_cleared(),
        ours: "8989",
      }),
    ]);
  });

  it.each([
    [
      { state: "observed", reason: "I run this one" },
      m.came_wiring_observed({
        connection: "SABnzbd into Sonarr",
        reason: "I run this one",
      }),
    ],
    [
      { state: "skipped", reason: "Sonarr is not up yet" },
      m.came_wiring_skipped({
        connection: "SABnzbd into Sonarr",
        reason: "Sonarr is not up yet",
      }),
    ],
    [
      { state: "refused", reason: "Two services share one folder" },
      m.came_wiring_refused({
        connection: "SABnzbd into Sonarr",
        reason: "Two services share one folder",
      }),
    ],
    [
      { state: "unmatched", reason: "NZBGet names no adapter" },
      m.came_wiring_unmatched({
        connection: "SABnzbd into Sonarr",
        reason: "NZBGet names no adapter",
      }),
    ],
  ] as const)("says why %j, in the words given", (state, words) => {
    expect(seeded({ wirings: [wiring(state)] })).toStrictEqual([words]);
  });

  it.each([
    ["drifted", m.came_wiring_drifted],
    ["stale", m.came_wiring_stale],
    ["wired", m.came_wiring_wired],
    ["would-wire", m.came_wiring_would],
    ["would-adopt", m.came_wiring_would_adopt],
    ["adopted", m.came_wiring_adopted],
    ["already-wired", m.came_wiring_already],
    ["unmanaged", m.came_wiring_unmanaged],
  ] as const)(
    "names every connection that came out %s at once",
    (state, words) => {
      expect(
        seeded({
          wirings: [
            wiring({ state }, "A into B"),
            wiring({ state }, "C into D"),
          ],
        }),
      ).toStrictEqual([words({ connections: "A into B, C into D" })]);
    },
  );

  // A running lemonfiber can be wider than the contract this build knows.
  it("names a connection that turned out in a way it has no words for", () => {
    const wider = {
      state: "pondered",
    } as unknown as Seeded["wirings"][number]["state"];

    expect(seeded({ wirings: [wiring(wider)] })).toStrictEqual([
      m.came_wiring_other({ connections: "SABnzbd into Sonarr" }),
    ]);
  });

  it("names what it could not speak to, and why", () => {
    expect(
      seeded({
        unsupported: [{ what: "readarr", because: "It speaks an older API." }],
      }),
    ).toStrictEqual([
      m.came_unsupported({
        what: "readarr",
        because: "It speaks an older API.",
      }),
    ]);
  });
});

describe("an outcome nothing here reads", () => {
  it("says so, rather than reading as though the work came to nothing", () => {
    expect(linesOf({ kind: "unread" })).toStrictEqual([m.came_unread()]);
  });
});

describe("what a run of the checks came to", () => {
  it("says the run's own grading, and where its findings are", () => {
    expect(linesOf({ kind: "doctor", report: allWell })).toStrictEqual([
      gradingOf("healthy").lead,
      m.came_checks_shown(),
    ]);
  });
});

/** What a repair came to, with every list empty unless said otherwise. */
const repaired = (over: Partial<Repaired>): readonly string[] =>
  linesOf({
    kind: "repair",
    report: {
      acted: true,
      agreement: "offer-1",
      beyond: [],
      mended: [],
      offered: [],
      rehearsed: false,
      ...over,
    },
  });

/** One repair carried out, turned out as given. */
const mendedAs = (
  outcome: Repaired["mended"][number]["outcome"],
): Repaired["mended"][number] => ({
  outcome,
  repair: {
    check: "services.health",
    does: "Restart prowlarr.",
    effects: [],
    reversible: false,
  },
});

describe("what could be put right, or what putting it right came to", () => {
  // The offer is what is read before agreeing, so each repair in it is said
  // with what it would do.
  it("says each repair an offer holds, and what it would do", () => {
    expect(linesOf({ kind: "repair", report: offer })).toStrictEqual(
      offer.offered.map((one) =>
        m.came_repair_offered({ check: one.check, does: one.does }),
      ),
    );
  });

  it("says nothing of an offer once the repairs were carried out", () => {
    expect(repaired({ acted: true, offered: offer.offered })).toStrictEqual([
      m.came_repair_nothing(),
    ]);
  });

  it.each([
    [{ outcome: "fixed" }, m.came_repair_fixed({ check: "services.health" })],
    [
      { outcome: "fix_failed" },
      m.came_repair_fix_failed({ check: "services.health" }),
    ],
    [
      { outcome: "stopped", leaving: "prowlarr is stopped." },
      m.came_repair_stopped({
        check: "services.health",
        leaving: "prowlarr is stopped.",
      }),
    ],
    [
      { outcome: "declined" },
      m.came_repair_declined({ check: "services.health" }),
    ],
    [
      { outcome: "would_overwrite" },
      m.came_repair_would_overwrite({ check: "services.health" }),
    ],
    [
      { outcome: "unmanaged" },
      m.came_repair_unmanaged({ check: "services.health" }),
    ],
  ] as const)(
    "says what a repair that came out %j came to",
    (outcome, words) => {
      expect(repaired({ mended: [mendedAs(outcome)] })).toStrictEqual([words]);
    },
  );

  // A running lemonfiber can be wider than the contract this build knows.
  it("says so of a repair that turned out in a way it has no words for", () => {
    const wider = {
      outcome: "pondered",
    } as unknown as Repaired["mended"][number]["outcome"];

    expect(repaired({ mended: [mendedAs(wider)] })).toStrictEqual([
      m.came_repair_unknown({ check: "services.health" }),
    ]);
  });

  it("says what has been tried too often, with what is left to do", () => {
    expect(carried.beyond).toHaveLength(1);
    expect(linesOf({ kind: "repair", report: carried })).toContain(
      m.came_repair_beyond({
        check: "network.tunnel",
        action: "Check the provider's account is still active.",
      }),
    );
  });

  it("says there was nothing to put right, rather than nothing at all", () => {
    expect(repaired({ acted: false })).toStrictEqual([m.came_repair_nothing()]);
  });
});

/** What putting back came to, with every list empty unless said otherwise. */
const putBackAs = (over: Partial<Undone>): readonly string[] =>
  linesOf({
    kind: "undo",
    report: { rehearsed: false, reversed: [], left: [], ...over },
  });

describe("what putting the last repair back came to", () => {
  it("says what went back and what did not, in the words given", () => {
    expect(linesOf({ kind: "undo", report: undone })).toStrictEqual([
      m.came_undo_reversed({ target: "sonarr", does: m.came_undo_restore() }),
      m.came_undo_left({
        target: "radarr",
        because: "Radarr is not answering, so nothing could be put back there.",
      }),
    ]);
  });

  it("says a rehearsal changed nothing", () => {
    expect(putBackAs({ rehearsed: true })).toStrictEqual([m.came_rehearsed()]);
  });

  it("says what went back and still left something behind", () => {
    expect(
      putBackAs({
        noted: [{ target: "data root", because: "The library stays moved." }],
      }),
    ).toStrictEqual([
      m.came_undo_noted({
        target: "data root",
        because: "The library stays moved.",
      }),
    ]);
  });

  it.each([
    [{ does: "remove", id: "7", resource: "indexer" }, m.came_undo_remove()],
    [
      { does: "restore", key: "k", value: null, wrote: "w" },
      m.came_undo_restore(),
    ],
    [{ does: "delete", path: "/tmp/x" }, m.came_undo_delete()],
    [
      { does: "withdraw", key: "k", owner: "o", path: "p", written: 1 },
      m.came_undo_withdraw(),
    ],
    [{ does: "repin", current: "2", previous: "1" }, m.came_undo_repin()],
    [
      {
        does: "reconfigure",
        field: "f",
        id: "1",
        resource: "r",
        value: null,
      },
      m.came_undo_reconfigure(),
    ],
    [
      { does: "rewind", path: "p", previous: "old", written: 1 },
      m.came_undo_rewind(),
    ],
    [{ does: "revoke", name: "ha" }, m.came_undo_revoke()],
    [{ does: "reinstate", name: "ha" }, m.came_undo_reinstate()],
    [
      { does: "pondered" } as unknown as Undone["reversed"][number]["action"],
      m.came_undo_other(),
    ],
  ] as const)("says what putting back %j did", (action, does) => {
    expect(
      putBackAs({ reversed: [{ target: "sonarr", action }] }),
    ).toStrictEqual([m.came_undo_reversed({ target: "sonarr", does })]);
  });

  it("says there was nothing to put back, rather than nothing at all", () => {
    expect(putBackAs({})).toStrictEqual([m.came_undo_nothing()]);
  });
});
