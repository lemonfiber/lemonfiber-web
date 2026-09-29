import { describe, expect, it } from "vitest";
import {
  changedTheDisk,
  everyRemoving,
  givenForRemove,
  isRemoving,
  removing,
  standingForget,
  standingRemoval,
  tierChosen,
} from "./removing";
import type { Work } from "./work";
import {
  forgotten,
  partlyRemoved,
  rehearsedRemoval,
  removed,
  settledSurvey,
  stored,
  surveyed,
} from "../api/removals";

/** A record of a removal panel request, answered with what it came to. */
const answered = (
  id: string,
  doing: "forget" | "uninstall",
  came: Extract<Work, { at: "done" }>["came"],
): Work => ({
  id,
  doing,
  scoped: false,
  given: {},
  at: "done",
  job: undefined,
  came,
});

describe("what the removal panel asks for", () => {
  it("is the two requests it makes, and nothing else", () => {
    expect(everyRemoving.every(isRemoving)).toBe(true);
    expect(isRemoving("update")).toBe(false);
  });

  // Unconfirmed, each request is itself the listing read before the yes.
  it("lists first, with nothing asked about and nothing agreed", () => {
    expect(removing.question({ doing: "forget" })).toBeUndefined();
    expect(givenForRemove({ doing: "forget" })).toStrictEqual({});
    expect(
      givenForRemove({ doing: "uninstall", tier: "services" }),
    ).toStrictEqual({ tier: "services" });
  });

  // The yes under a removal's listing names that listing, so lemonfiber
  // removes what was read or refuses.
  it("agrees under the listing, a removal naming the listing it was read in", () => {
    expect(givenForRemove({ doing: "forget", confirm: true })).toStrictEqual({
      confirm: true,
    });
    expect(
      givenForRemove({
        doing: "uninstall",
        tier: "services",
        offer: "services-4f1a",
        wait: true,
      }),
    ).toStrictEqual({
      tier: "services",
      confirm: true,
      offer: "services-4f1a",
      wait: true,
    });
  });

  it("chooses a removal by its name, and keeps the choice for a name it does not know", () => {
    expect(tierChosen("media", "stop")).toBe("media");
    expect(tierChosen("everything", "stop")).toBe("stop");
  });
});

describe("the listing standing for a yes", () => {
  it("is the newest forget listed and not agreed to", () => {
    expect(
      standingForget([
        answered("1", "forget", { kind: "stored", report: stored }),
      ]),
    ).toStrictEqual({ id: "1" });
  });

  it("is gone once forgotten, or where something else came back", () => {
    expect(
      standingForget([
        answered("2", "forget", { kind: "stored", report: forgotten }),
      ]),
    ).toBeUndefined();
    expect(
      standingForget([answered("3", "forget", { kind: "unread" })]),
    ).toBeUndefined();
    expect(standingForget([])).toBeUndefined();
  });

  it("is the newest removal listed, with its name and what is coming down", () => {
    expect(
      standingRemoval([
        answered("4", "uninstall", { kind: "uninstall", report: surveyed }),
      ]),
    ).toStrictEqual({
      id: "4",
      tier: "services",
      offer: "services-4f1a",
      coming: ["Big Buck Bunny"],
      bytes: 2_147_483_648,
    });
    expect(
      standingRemoval([
        answered("5", "uninstall", {
          kind: "uninstall",
          report: settledSurvey,
        }),
      ])?.coming,
    ).toStrictEqual([]);
  });

  it("is gone once the removal was carried out or rehearsed", () => {
    for (const report of [removed, rehearsedRemoval]) {
      expect(
        standingRemoval([
          answered("6", "uninstall", { kind: "uninstall", report }),
        ]),
      ).toBeUndefined();
    }
    expect(
      standingRemoval([answered("7", "uninstall", { kind: "unread" })]),
    ).toBeUndefined();
    expect(standingRemoval([])).toBeUndefined();
  });
});

describe("what took something off the disk", () => {
  it("is a forget carried out, or a removal that took something", () => {
    expect(changedTheDisk({ kind: "stored", report: forgotten })).toBe(true);
    expect(changedTheDisk({ kind: "uninstall", report: removed })).toBe(true);
    expect(changedTheDisk({ kind: "uninstall", report: partlyRemoved })).toBe(
      true,
    );
  });

  it("is not a listing, a rehearsal, or anything else", () => {
    expect(changedTheDisk({ kind: "stored", report: stored })).toBe(false);
    expect(changedTheDisk({ kind: "uninstall", report: surveyed })).toBe(false);
    expect(
      changedTheDisk({ kind: "uninstall", report: rehearsedRemoval }),
    ).toBe(false);
    expect(changedTheDisk({ kind: "unread" })).toBe(false);
  });
});
