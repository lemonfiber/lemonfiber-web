import { describe, expect, it } from "vitest";
import { linesOf } from "./came";
import { bytes } from "./figures";
import {
  offered,
  offeredBytes,
  partLine,
  reclaimedLines,
  wordOfCategory,
  wordOfCost,
  type Cost,
  type Part,
} from "./reclaimed";
import {
  busy,
  reckoned,
  reclaimedRoom,
  roomy,
  stillShared,
  taken,
  unpacked,
  untaken,
} from "../api/spaces";
import * as m from "../paraglide/messages.js";

describe("a part of the disk that could be got back", () => {
  it("says what it is, what it takes up, and what getting it back costs", () => {
    expect(partLine(untaken)).toBe(
      m.reclaim_part({
        part: m.reclaim_orphaned(),
        size: bytes(2_147_483_648),
        cost: m.reclaim_cost_untaken(),
      }),
    );
  });

  it("is offered only where getting it back costs nothing", () => {
    expect(offered(untaken)).toBe(true);
    expect(offered(unpacked)).toBe(true);
    expect(offered(stillShared)).toBe(false);
  });

  it("has a word for every part, naming a directory as the operator named it", () => {
    const parts: readonly [Part["category"], string][] = [
      [{ of: "tree", name: "films" }, "films"],
      [{ of: "landing" }, m.reclaim_landing()],
      [{ of: "seeding" }, m.reclaim_seeding()],
      [{ of: "orphaned" }, m.reclaim_orphaned()],
      [{ of: "extracted" }, m.reclaim_extracted()],
      [{ of: "services" }, m.reclaim_services()],
      [{ of: "unmanaged" }, m.reclaim_unmanaged()],
    ];
    for (const [category, word] of parts) {
      expect(wordOfCategory(category)).toBe(word);
    }
    const strange = { of: "elsewhere" } as unknown as Part["category"];
    expect(wordOfCategory(strange)).toBe(m.reclaim_unrecognised());
  });

  it("has a word for every cost, and says so of one it has none for", () => {
    const costs: readonly [Cost, string][] = [
      ["by_losing_content", m.reclaim_cost_losing()],
      ["in_progress", m.reclaim_cost_landing()],
      ["at_the_cost_of_ratio", m.reclaim_cost_tracker()],
      ["the_easy_win", m.reclaim_cost_untaken()],
      ["already_have_it", m.reclaim_cost_unpacked()],
      ["marginally", m.reclaim_cost_little()],
      ["you_said_not", m.reclaim_cost_refused()],
    ];
    for (const [cost, word] of costs) expect(wordOfCost(cost)).toBe(word);
    expect(wordOfCost("someday" as unknown as Cost)).toBe(
      m.reclaim_cost_unrecognised(),
    );
  });
});

describe("what is on offer", () => {
  it("adds up only the parts that cost nothing, as the volume lost them", () => {
    expect(offeredBytes(roomy)).toBe(3_221_225_472);
    expect(offeredBytes(reckoned)).toBe(0);
  });
});

describe("what taking back what costs nothing came to", () => {
  it("says how much it gave back, and each thing it could not take", () => {
    expect(reclaimedLines(reclaimedRoom)).toStrictEqual([
      m.came_reclaim_taken({ size: bytes(3_221_225_472) }),
      m.came_reclaim_left({ at: "/srv/downloads/open.mkv", why: busy }),
    ]);
  });

  it("says a rehearsal changed nothing", () => {
    const rehearsed = {
      ...roomy,
      reclaimed: { ...taken, rehearsed: true, left: [] },
    };
    expect(reclaimedLines(rehearsed)).toStrictEqual([
      m.came_rehearsed(),
      m.came_reclaim_taken({ size: bytes(3_221_225_472) }),
    ]);
  });

  it("says nothing was taken where the answer took nothing", () => {
    expect(reclaimedLines(roomy)).toStrictEqual([m.came_reclaim_untaken()]);
  });

  it("is what a record of it carries", () => {
    expect(linesOf({ kind: "space", report: reclaimedRoom })).toStrictEqual(
      reclaimedLines(reclaimedRoom),
    );
  });
});
