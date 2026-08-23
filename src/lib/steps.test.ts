import { describe, expect, it } from "vitest";
import { everyStanding, standingAt, type Standing } from "./steps";

describe("where a step stands in the run", () => {
  it("puts a step before the one being done behind you", () => {
    expect(standingAt(1, 3)).toBe("done");
    expect(standingAt(2, 3)).toBe("done");
  });

  it("puts the step being done under way", () => {
    expect(standingAt(3, 3)).toBe("now");
  });

  it("leaves every step after it still to come", () => {
    expect(standingAt(4, 3)).toBe("later");
    expect(standingAt(7, 3)).toBe("later");
  });

  it("gives a run of any length exactly one step being done", () => {
    const run = [1, 2, 3, 4, 5, 6, 7];
    const standings: Standing[] = run.map((position) =>
      standingAt(position, 3),
    );
    expect(standings.filter((one) => one === "now")).toHaveLength(1);
  });

  it("names every standing a step can take", () => {
    expect(everyStanding).toStrictEqual(["done", "now", "later"]);
  });
});
