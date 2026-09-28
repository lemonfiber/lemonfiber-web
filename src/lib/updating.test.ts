import { describe, expect, it } from "vitest";
import {
  everyUpdating,
  givenForUpdate,
  isUpdating,
  standingPlan,
  updating,
} from "./updating";
import type { Work } from "./work";
import { moved, plan } from "../api/lines";

/** A record of an update asked for, answered with what it came to. */
const answered = (
  id: string,
  came: Extract<Work, { at: "done" }>["came"],
): Work => ({
  id,
  doing: "update",
  scoped: false,
  given: {},
  at: "done",
  job: undefined,
  came,
});

describe("what the updates panel asks for", () => {
  it("is the one request it makes, and nothing else", () => {
    expect(everyUpdating.every(isUpdating)).toBe(true);
    expect(isUpdating("bandwidth")).toBe(false);
  });

  // Unconfirmed, the request is itself what is read before the yes.
  it("reads what would change first, and moves on a yes under it", () => {
    expect(updating.question({ doing: "update" })).toBeUndefined();
    expect(givenForUpdate({ doing: "update" })).toStrictEqual({});
    expect(
      givenForUpdate({ doing: "update", confirm: true, wait: true }),
    ).toStrictEqual({ confirm: true, wait: true });
  });
});

describe("the plan standing on the screen", () => {
  it("is the newest one read, with its steps and what is coming down", () => {
    expect(
      standingPlan([answered("7", { kind: "update", report: plan })]),
    ).toStrictEqual({
      id: "7",
      steps: plan.changes,
      inFlight: plan.in_flight,
    });
  });

  it("is gone once it was taken, or where there is nothing to take", () => {
    const current = { ...plan, state: "current" as const, changes: [] };
    expect(
      standingPlan([answered("8", { kind: "update", report: moved })]),
    ).toBeUndefined();
    expect(
      standingPlan([answered("9", { kind: "update", report: current })]),
    ).toBeUndefined();
  });

  it("is nothing while the newest is under way, or came to no plan", () => {
    const going: Work = {
      id: "10",
      doing: "update",
      scoped: false,
      given: {},
      at: "under-way",
      job: "5c63",
    };
    expect(standingPlan([going])).toBeUndefined();
    expect(standingPlan([answered("11", { kind: "unread" })])).toBeUndefined();
    expect(standingPlan([])).toBeUndefined();
  });
});
