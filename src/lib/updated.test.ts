import { describe, expect, it } from "vitest";
import { linesOf } from "./came";
import { stepLine, updateLines, type Step, type Updated } from "./updated";
import { moved, plan } from "../api/lines";
import * as m from "../paraglide/messages.js";

const [sonarr, jellyfin] = plan.changes as [Step, Step];

describe("one step an update would take", () => {
  it("says the versions, how large the step is, and why", () => {
    expect(stepLine(sonarr)).toBe(
      m.came_update_step({
        service: "sonarr",
        from: "4.0.8",
        to: "4.0.9",
        jump: m.came_update_patch(),
        because: sonarr.because,
      }),
    );
  });

  it("says where nothing walks a step back", () => {
    expect(stepLine(jellyfin)).toBe(
      m.came_update_one_way({
        service: "jellyfin",
        from: "10.10.3",
        to: "10.11.0",
        jump: m.came_update_minor(),
        because: jellyfin.because,
      }),
    );
  });

  it("says where lemonfiber refuses a step", () => {
    const refused: Step = { ...sonarr, jump: "major", refused: true };
    expect(stepLine(refused)).toBe(
      m.came_update_refused({
        service: "sonarr",
        from: "4.0.8",
        to: "4.0.9",
        because: sonarr.because,
      }),
    );
  });

  it("says a step of unknown size as that", () => {
    const untold: Step = { ...sonarr, jump: "untellable" };
    const later = { ...sonarr, jump: "leap" } as unknown as Step;
    expect(stepLine(untold)).toContain(m.came_update_untellable());
    expect(stepLine(later)).toContain(m.came_update_untellable());
  });
});

describe("what an update would change, or changed", () => {
  it("lists each step before anything moves, and what is still coming down", () => {
    expect(updateLines(plan)).toStrictEqual([
      m.came_update_available(),
      stepLine(sonarr),
      stepLine(jellyfin),
      m.came_update_in_flight({ names: "A film still coming down" }),
    ]);
  });

  it("says how each service ended once it moved, with the backup and the halt", () => {
    expect(updateLines(moved)).toStrictEqual([
      m.came_update_partial(),
      m.came_update_ended_updated({
        service: "sonarr",
        from: "4.0.8",
        to: "4.0.9",
      }),
      m.came_update_rollback({ service: "sonarr" }),
      m.came_update_ended_unstarted({
        service: "jellyfin",
        to: "10.11.0",
      }),
      m.came_update_restore({ service: "jellyfin" }),
      "It exited while migrating its library.",
      m.came_update_in_flight({ names: "A film still coming down" }),
      moved.backup,
      moved.halted,
    ]);
  });

  it("has words for every standing and every ending", () => {
    const quiet: Updated = { ...plan, changes: [], in_flight: [] };
    const states = ["current", "updated", "failed", "later"] as const;
    const said = states.map(
      (state) =>
        updateLines({ ...quiet, state } as unknown as Updated)[0] ?? "",
    );
    expect(said).toStrictEqual([
      m.came_update_current(),
      m.came_update_updated(),
      m.came_update_failed(),
      m.came_update_unrecognised(),
    ]);

    const [first] = moved.applied;
    const ended = (ending: string): string =>
      updateLines({
        ...quiet,
        confirmed: true,
        applied: [
          { ...first, ending } as unknown as Updated["applied"][number],
        ],
      })[1] ?? "";
    const said2 = { service: "sonarr", from: "4.0.8", to: "4.0.9" };
    expect(ended("not-fetched")).toBe(m.came_update_ended_unfetched(said2));
    expect(ended("not-reached")).toBe(m.came_update_ended_unreached(said2));
    expect(ended("vanished")).toBe(m.came_update_ended_other(said2));
  });

  it("says how a service it has no words for could be put back as that", () => {
    const [first] = moved.applied;
    const later = {
      ...moved,
      applied: [{ ...first, reversal: "rebuild" }],
    } as unknown as Updated;
    expect(updateLines(later)).toContain(
      m.came_update_reversal_other({ service: "sonarr" }),
    );
  });

  it("names the files edited by hand it left as they were", () => {
    const edited: Updated = {
      ...plan,
      changes: [],
      in_flight: [],
      stack_edits: [{ path: "compose.yaml", diff: "-a\n+b" }],
    };
    expect(updateLines(edited)).toContain(
      m.came_edited({ path: "compose.yaml" }),
    );
  });

  it("is what a record of an update carries", () => {
    expect(linesOf({ kind: "update", report: plan })).toStrictEqual(
      updateLines(plan),
    );
  });
});
