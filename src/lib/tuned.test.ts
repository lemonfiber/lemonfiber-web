import { describe, expect, it } from "vitest";
import { linesOf } from "./came";
import { qualityLines, upgradeLines, type Tuned, type Upgraded } from "./tuned";
import {
  costed,
  fetched,
  inForce,
  reapplied,
  recyclarr,
} from "../api/qualities";
import * as m from "../paraglide/messages.js";

describe("what putting the recorded quality back came to", () => {
  it("says it is in force again, and lists what it replaced", () => {
    expect(qualityLines(reapplied)).toStrictEqual([
      m.came_quality_reapplied(),
      m.came_quality_overwritten({ path: recyclarr }),
      "- min_score: 10\n+ min_score: 0",
    ]);
  });

  it("says nothing of a file where nothing was replaced", () => {
    const clean: Tuned = { ...reapplied, overwritten: null };
    expect(qualityLines(clean)).toStrictEqual([m.came_quality_reapplied()]);
    expect(qualityLines(inForce)).toStrictEqual([m.came_quality_shown()]);
  });

  it.each([
    ["would-reapply", m.came_quality_would_reapply()],
    ["recorded", m.came_quality_recorded()],
    ["held", m.came_quality_held()],
    ["rehearsed", m.came_rehearsed()],
  ] as const)("says what %s means", (disposition, said) => {
    expect(qualityLines({ ...inForce, disposition })).toStrictEqual([said]);
  });

  // A disposition a newer lemonfiber adds is said to be one, rather than
  // dropped.
  it("says so of a disposition wider than this build's contract", () => {
    const wider = {
      ...inForce,
      disposition: "elsewhere",
    } as unknown as Tuned;
    expect(qualityLines(wider)).toStrictEqual([m.came_quality_other()]);
  });

  it("is what a record of one lists", () => {
    expect(linesOf({ kind: "quality", report: reapplied })).toStrictEqual(
      qualityLines(reapplied),
    );
  });
});

describe("what fetching the library again costs, or started", () => {
  it("states what each kind of media would be fetched at, and that nothing was", () => {
    expect(upgradeLines(costed)).toStrictEqual([
      m.came_upgrade_cost({ kind: "tv", preset: "balanced", size: "2 GB" }),
      m.came_upgrade_cost({
        kind: "movies",
        preset: "maximum",
        size: "30 GB",
      }),
      m.came_upgrade_unconfirmed(),
    ]);
  });

  it("says what each search came to, in the service's words where it failed", () => {
    expect(upgradeLines(fetched)).toStrictEqual([
      m.came_upgrade_started({ kind: "tv", preset: "balanced" }),
      m.came_upgrade_failed({
        kind: "movies",
        detail: "Radarr did not answer.",
      }),
    ]);
  });

  it("says a search that did not start did not", () => {
    const unstarted: Upgraded = {
      confirmed: true,
      media: [
        {
          media_type: "tv",
          outcome: { state: "not-started" },
          preset: "balanced",
          size_per_hour: "2 GB",
        },
      ],
    };
    expect(upgradeLines(unstarted)).toStrictEqual([
      m.came_upgrade_not_started({ kind: "tv" }),
    ]);
  });

  it("says so of an outcome wider than this build's contract", () => {
    const wider = {
      confirmed: true,
      media: [
        {
          media_type: "tv",
          outcome: { state: "elsewhere" },
          preset: "balanced",
          size_per_hour: "2 GB",
        },
      ],
    } as unknown as Upgraded;
    expect(upgradeLines(wider)).toStrictEqual([
      m.came_upgrade_other({ kind: "tv" }),
    ]);
  });

  it("is what a record of one lists", () => {
    expect(linesOf({ kind: "upgrade", report: costed })).toStrictEqual(
      upgradeLines(costed),
    );
  });
});
