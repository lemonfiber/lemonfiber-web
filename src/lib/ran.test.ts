import { describe, expect, it } from "vitest";
import { ranLines } from "./ran";
import { whenOf } from "./instant";
import { heldBack, wentNow, wouldRun } from "../api/runs";
import * as m from "../paraglide/messages.js";

const ended = whenOf(1_790_000_030);

describe("what running a service now came to", () => {
  it("says a rehearsal ran nothing, and that a run would go", () => {
    expect(ranLines(wouldRun)).toStrictEqual([
      m.came_rehearsed(),
      m.came_ran_would(),
    ]);
  });

  it("says what held it back, in lemonfiber's words, and nothing else", () => {
    expect(ranLines(heldBack)).toStrictEqual([
      m.came_rehearsed(),
      "A run of configarr is already going.",
    ]);
  });

  it("says no run was due, where none was and nothing held it", () => {
    expect(
      ranLines({ ...wouldRun, rehearsed: false, due: false }),
    ).toStrictEqual([m.came_ran_not_due()]);
  });

  it("says nothing ran, where a run was due and none went", () => {
    expect(ranLines({ ...wouldRun, rehearsed: false })).toStrictEqual([
      m.came_ran_none(),
    ]);
  });

  it("says how the run ended, and how many of its times were skipped", () => {
    expect(ranLines(wentNow)).toStrictEqual([
      m.came_ran_ended({ when: ended, exit: 0 }),
      m.came_ran_skipped({ count: 2 }),
    ]);
  });

  it("says a run stopped from outside ended without an exit code", () => {
    const run = { ...wentNow.ran, exit: null } as NonNullable<
      typeof wentNow.ran
    >;
    expect(ranLines({ ...wentNow, skipped: 0, ran: run })).toStrictEqual([
      m.came_ran_unexited({ when: ended }),
    ]);
  });

  it("never shows the lines the run wrote", () => {
    expect(ranLines(wentNow).join("\n")).not.toContain("profile sync");
  });
});
