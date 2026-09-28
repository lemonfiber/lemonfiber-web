import { describe, expect, it } from "vitest";
import { linesOf } from "./came";
import {
  guardLines,
  traceLines,
  walkthroughLines,
  type Traced,
  type Walked,
} from "./traced";
import { guarded, stoppedWalk, traced, unmatched, walked } from "../api/found";
import * as m from "../paraglide/messages.js";

describe("where one item is", () => {
  it("says how far it got, why it stopped, how sure, what is here, and what happened", () => {
    expect(traceLines(traced)).toStrictEqual([
      m.trace_furthest({ item: "The Expanse", stage: m.stage_downloading() }),
      traced.stall,
      m.trace_uncertain(),
      m.trace_coverage({ have: "12", wanted: "24" }),
      m.trace_stage({ stage: m.stage_monitored(), service: "sonarr" }),
      m.trace_stage_at({
        stage: m.stage_grabbed(),
        service: "sonarr",
        at: "2026-09-20 21:04",
      }),
      ...traced.findings,
      m.trace_grabbed({ at: "2026-09-20 21:04" }),
      m.trace_download_failed({ at: "2026-09-21 03:10" }),
    ]);
  });

  // Nobody asking for it is itself the answer.
  it("says nobody asked for it where nothing matched", () => {
    expect(traceLines(unmatched)).toStrictEqual([
      m.trace_unmatched({ item: "Arrival" }),
    ]);
  });

  it("has words for every stage and every moment", () => {
    const stages = [
      "not-monitored",
      "monitored",
      "searching",
      "found",
      "grabbed",
      "downloading",
      "downloaded",
      "importing",
      "imported",
      "available",
      "somewhere",
    ] as const;
    const quiet: Traced = {
      ...traced,
      stall: null,
      confidence: "certain",
      coverage: null,
      findings: [],
      history: [],
      stages: [],
    };
    const said = stages.map(
      (stage) =>
        traceLines({ ...quiet, furthest: stage } as unknown as Traced)[0],
    );
    expect(new Set(said).size).toBe(stages.length);
    expect(said.at(-1)).toContain(m.stage_unrecognised());

    const moments = ["imported", "removed", "lost"] as const;
    const history = moments.map((outcome) => ({ outcome, at: "then" }));
    expect(
      traceLines({ ...quiet, history } as unknown as Traced).slice(1),
    ).toStrictEqual([
      m.trace_imported({ at: "then" }),
      m.trace_removed({ at: "then" }),
      m.trace_other({ at: "then" }),
    ]);
  });

  it("is what a record of a search carries", () => {
    expect(linesOf({ kind: "trace", report: traced })).toStrictEqual(
      traceLines(traced),
    );
  });
});

describe("what walking one thing through came to", () => {
  it("says it finished, what it proved, each step, and what to do next", () => {
    expect(walkthroughLines(walked)).toStrictEqual([
      m.walk_complete(),
      walked.proves,
      "Asking the indexers.",
      "3 answered.",
      "It is ready to watch.",
      m.walk_hardlinked(),
      m.walk_next_more(),
      m.walk_next_household(),
    ]);
  });

  it("says where it stopped, what the services said, and the one thing to try", () => {
    expect(walkthroughLines(stoppedWalk)).toStrictEqual([
      m.walk_failed(),
      walked.proves,
      "Prowlarr: no indexers are configured.",
      "Add an indexer in Prowlarr, then walk it through again.",
    ]);
  });

  it("offers what is likely to work where nothing was named", () => {
    const offered: Walked = {
      ...stoppedWalk,
      state: "offered",
      stopped: null,
      suggestions: ["Big Buck Bunny", "Sintel"],
    };
    expect(walkthroughLines(offered)).toStrictEqual([
      m.walk_offered(),
      walked.proves,
      m.walk_suggestions({ names: "Big Buck Bunny, Sintel" }),
    ]);
  });

  it("says it was already here, and has words for every ending", () => {
    const here: Walked = { ...walked, already_here: true, lines: [] };
    expect(walkthroughLines(here)).toContain(m.walk_already_here());
    expect(walkthroughLines({ ...here, link: "copied" })).toContain(
      m.walk_copied(),
    );

    const endings = [
      "skipped",
      "searching",
      "grabbing",
      "downloading",
      "importing",
      "abandoned",
      "vanished",
    ] as const;
    const said = endings.map(
      (state) =>
        walkthroughLines({ ...stoppedWalk, state } as unknown as Walked)[0],
    );
    expect(said).toStrictEqual([
      m.walk_skipped(),
      m.walk_under_way(),
      m.walk_under_way(),
      m.walk_under_way(),
      m.walk_under_way(),
      m.walk_abandoned(),
      m.walk_unrecognised(),
    ]);

    const onward = {
      ...walked,
      lines: [],
      handover: { next: ["client-apps", "later"] },
    } as unknown as Walked;
    expect(walkthroughLines(onward).slice(-2)).toStrictEqual([
      m.walk_next_apps(),
      m.walk_next_other(),
    ]);
  });

  it("is what a record of a walk carries", () => {
    expect(linesOf({ kind: "walkthrough", report: walked })).toStrictEqual(
      walkthroughLines(walked),
    );
  });
});

describe("how a guard over the data location ended", () => {
  it("says why, and which forms it stopped", () => {
    expect(guardLines(guarded)).toStrictEqual([
      guarded.reason,
      m.guard_stopped({ names: "media" }),
    ]);
  });

  it("says where it could not stop them, or had none to stop", () => {
    expect(guardLines({ ...guarded, stopped: false })).toContain(
      m.guard_not_stopped({ names: "media" }),
    );
    expect(guardLines({ ...guarded, forms: [] })).toStrictEqual([
      guarded.reason,
    ]);
  });

  it("is what a record of a guard carries", () => {
    expect(linesOf({ kind: "watch", report: guarded })).toStrictEqual(
      guardLines(guarded),
    );
  });
});
