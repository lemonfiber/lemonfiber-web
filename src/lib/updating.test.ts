import { describe, expect, it } from "vitest";
import {
  everyUpdating,
  givenForUpdate,
  isUpdating,
  movesApart,
  standingPlan,
  stoppingOfUpdate,
  titleOfPlan,
  titleOfUpdate,
  updating,
  yesTo,
} from "./updating";
import { stoppingServices, wholeStack } from "./inflight";
import type { Work } from "./work";
import { moved, plan } from "../api/lines";
import * as m from "../paraglide/messages.js";

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
      givenForUpdate({
        doing: "update",
        confirm: true,
        wait: true,
        offer: "update-offer-1",
      }),
    ).toStrictEqual({ confirm: true, wait: true, offer: "update-offer-1" });
  });

  it("names the one service it moves, asked and agreed to alike", () => {
    expect(
      givenForUpdate({ doing: "update", service: "sonarr" }),
    ).toStrictEqual({ service: "sonarr" });
    expect(
      givenForUpdate({
        doing: "update",
        service: "sonarr",
        confirm: true,
        wait: false,
        offer: "update:sonarr",
      }),
    ).toStrictEqual({
      service: "sonarr",
      confirm: true,
      wait: false,
      offer: "update:sonarr",
    });
  });

  it("reads what is downloading for what it would stop, before the yes alone", () => {
    expect(updating.stops?.({ doing: "update" })).toStrictEqual(wholeStack);
    expect(
      updating.stops?.({ doing: "update", service: "sonarr" }),
    ).toStrictEqual(stoppingServices(["sonarr"]));
    expect(
      updating.stops?.({
        doing: "update",
        service: "sonarr",
        confirm: true,
        wait: true,
        offer: "update:sonarr",
      }),
    ).toBeUndefined();
    expect(stoppingOfUpdate(undefined)).toStrictEqual(wholeStack);
  });
});

describe("the plan standing on the screen", () => {
  it("is the newest one read, with its steps and what is coming down", () => {
    expect(
      standingPlan([answered("7", { kind: "update", report: plan })]),
    ).toStrictEqual({
      id: "7",
      steps: plan.changes,
      offer: plan.offer,
      service: undefined,
    });
  });

  it("names the one service it moves, where it was asked for one", () => {
    const one: Work = {
      ...answered("12", { kind: "update", report: plan }),
      given: { service: "sonarr" },
    };
    expect(standingPlan([one])?.service).toBe("sonarr");
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

describe("a plan read for a yes", () => {
  const whole = {
    id: "7",
    steps: plan.changes,
    offer: plan.offer,
    service: undefined,
  };
  const alone = {
    ...whole,
    steps: plan.changes.slice(0, 1),
    service: "sonarr",
  };

  it("is agreed to under its offer, naming the service where it moves one", () => {
    expect(yesTo(whole, true)).toStrictEqual({
      doing: "update",
      confirm: true,
      wait: true,
      offer: plan.offer,
    });
    expect(yesTo(alone, false)).toStrictEqual({
      doing: "update",
      confirm: true,
      wait: false,
      offer: plan.offer,
      service: "sonarr",
    });
  });

  it("is headed by the whole stack's versions, or by the service it moves", () => {
    expect(titleOfPlan(whole)).toBe(m.update_plan_title());
    expect(titleOfPlan(alone)).toBe(m.update_one_title({ service: "sonarr" }));
  });

  it("offers moving each step alone only where the whole stack has several", () => {
    expect(movesApart(whole)).toBe(true);
    expect(movesApart(alone)).toBe(false);
    expect(movesApart({ ...whole, steps: plan.changes.slice(0, 1) })).toBe(
      false,
    );
  });
});

describe("a record of an update", () => {
  it("is headed by the service it moved, where it moved one alone", () => {
    const record = answered("13", { kind: "update", report: moved });
    expect(titleOfUpdate(record)).toBe(m.doing_update_title());
    expect(titleOfUpdate({ ...record, given: { service: "sonarr" } })).toBe(
      m.doing_update_one_title({ service: "sonarr" }),
    );
  });
});
