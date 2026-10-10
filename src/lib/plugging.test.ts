import { describe, expect, it } from "vitest";
import {
  approvables,
  changedByPlugging,
  everyPlugging,
  givenForPlug,
  installOf,
  isPlugging,
  plugging,
  standingPlug,
  type Offered,
} from "./plugging";
import type { Work } from "./work";
import {
  guarding,
  installed,
  installOffer,
  madeInstall,
  readInstall,
  released,
  signIn,
  wouldInstall,
  wouldInstallGuarded,
  wouldRemove,
  wouldUpdate,
} from "../api/plugs";
import { plugins, subtitles } from "../api/installs";

/** A record of one act on a plugin, answered with what it came to. */
const answered = (
  id: string,
  doing: Work["doing"],
  given: Work["given"],
  came: Extract<Work, { at: "done" }>["came"],
): Work => ({
  id,
  doing,
  scoped: false,
  given,
  at: "done",
  job: undefined,
  came,
});

describe("what the plugins panel asks for", () => {
  it("is every request it makes, and nothing else", () => {
    expect(everyPlugging.every(isPlugging)).toBe(true);
    expect(isPlugging("wiring-fill")).toBe(false);
    expect(plugging.owns("plugin-remove")).toBe(true);
  });

  it("asks nothing before a reading, which is itself the question", () => {
    expect(
      plugging.question({ doing: "plugin-install", source: "komga" }),
    ).toBeUndefined();
  });
});

describe("what each asking sends", () => {
  it("reads an install from its source, and an update or a removal by the plugin", () => {
    expect(
      givenForPlug({ doing: "plugin-install", source: "komga" }),
    ).toStrictEqual({
      source: "komga",
    });
    expect(
      givenForPlug({ doing: "plugin-update", plugin: "komga" }),
    ).toStrictEqual({
      plugin: "komga",
    });
    expect(
      givenForPlug({ doing: "plugin-remove", plugin: "komga" }),
    ).toStrictEqual({
      plugin: "komga",
    });
  });

  it("carries the reading's name as the yes, with every value approved", () => {
    expect(
      givenForPlug({
        doing: "plugin-install",
        source: "komga",
        offer: installOffer,
        approved: ["api_key@opensubtitles"],
      }),
    ).toStrictEqual({
      source: "komga",
      offer: installOffer,
      approved: ["api_key@opensubtitles"],
    });
    expect(
      givenForPlug({
        doing: "plugin-remove",
        plugin: "komga",
        offer: "plugin-remove:1",
      }),
    ).toStrictEqual({ plugin: "komga", offer: "plugin-remove:1" });
  });
});

describe("whether what is installed has changed", () => {
  it("has once an act ran, and not while it was only read", () => {
    expect(changedByPlugging({ kind: "plugins", report: madeInstall })).toBe(
      true,
    );
    expect(changedByPlugging({ kind: "plugins", report: readInstall })).toBe(
      false,
    );
    expect(changedByPlugging({ kind: "unread" })).toBe(false);
  });
});

describe("the reading standing on the screen", () => {
  const read = (
    doing: Work["doing"],
    given: Work["given"],
    report = readInstall,
  ): Work => answered("7", doing, given, { kind: "plugins", report });

  it("is the newest install read, from the source it was read from", () => {
    expect(
      standingPlug([read("plugin-install", { source: "komga" })]),
    ).toStrictEqual({
      id: "7",
      offer: installOffer,
      doing: "plugin-install",
      source: "komga",
      install: wouldInstall,
    });
  });

  it("is an update or a removal read, for the plugin it was read for", () => {
    const updating = { ...readInstall, install: null, update: wouldUpdate };
    expect(
      standingPlug([read("plugin-update", { plugin: "komga" }, updating)]),
    ).toStrictEqual({
      id: "7",
      offer: installOffer,
      doing: "plugin-update",
      plugin: "komga",
      update: wouldUpdate,
    });
    const removing = { ...readInstall, install: null, removal: wouldRemove };
    expect(
      standingPlug([read("plugin-remove", { plugin: "komga" }, removing)]),
    ).toStrictEqual({
      id: "7",
      offer: installOffer,
      doing: "plugin-remove",
      plugin: "komga",
      removal: wouldRemove,
    });
  });

  it("is nothing once the act ran, while it is under way, or where it came to no reading", () => {
    const going: Work = {
      id: "8",
      doing: "plugin-install",
      scoped: false,
      given: { source: "komga" },
      at: "under-way",
      job: "5c63",
    };
    expect(standingPlug([going])).toBeUndefined();
    expect(
      standingPlug([read("plugin-install", { source: "komga" }, madeInstall)]),
    ).toBeUndefined();
    expect(
      standingPlug([
        answered(
          "9",
          "plugin-install",
          { source: "komga" },
          { kind: "unread" },
        ),
      ]),
    ).toBeUndefined();
    expect(
      standingPlug([answered("9", "wiring-fill", {}, { kind: "unread" })]),
    ).toBeUndefined();
    expect(standingPlug([])).toBeUndefined();
  });

  it("is nothing where the reading names itself nothing, or lacks what it was asked for", () => {
    const unnamed = { ...readInstall, agreement: "" };
    expect(
      standingPlug([read("plugin-install", { source: "komga" }, unnamed)]),
    ).toBeUndefined();
    const unnamedAtAll = { ...readInstall, agreement: null };
    expect(
      standingPlug([read("plugin-install", { source: "komga" }, unnamedAtAll)]),
    ).toBeUndefined();
    expect(standingPlug([read("plugin-install", {})])).toBeUndefined();
    expect(
      standingPlug([
        read(
          "plugin-install",
          { source: "komga" },
          { ...readInstall, install: null },
        ),
      ]),
    ).toBeUndefined();
    expect(standingPlug([read("plugin-update", {})])).toBeUndefined();
    expect(
      standingPlug([read("plugin-update", { plugin: "komga" })]),
    ).toBeUndefined();
    expect(
      standingPlug([read("plugin-remove", { plugin: "komga" })]),
    ).toBeUndefined();
    const bare = { ...plugins, rehearsed: true, agreement: installOffer };
    expect(
      standingPlug([read("plugin-update", { plugin: "komga" }, bare)]),
    ).toBeUndefined();
    expect(
      standingPlug([read("plugin-remove", { plugin: "komga" }, bare)]),
    ).toBeUndefined();
  });
});

describe("what a reading asks to be approved", () => {
  it("is every value its recipes would carry elsewhere, each as its approval is written", () => {
    expect(approvables(wouldInstall)).toStrictEqual([
      {
        recipe: signIn.title,
        pair: released,
        approval: "api_key@opensubtitles",
      },
    ]);
    expect(approvables({ ...installed, would: subtitles })).toStrictEqual([]);
  });

  it("is then every privileged shape a service of it would take", () => {
    expect(
      approvables({ ...wouldInstallGuarded, would: subtitles }),
    ).toStrictEqual([{ taking: guarding, approval: "egress-guard@tunnel" }]);
    expect(
      approvables(wouldInstallGuarded).map((one) => one.approval),
    ).toStrictEqual(["api_key@opensubtitles", "egress-guard@tunnel"]);
  });

  it("is read from the install a reading would make, the new version's for an update", () => {
    const base = { id: "1", offer: installOffer };
    const install: Offered = {
      ...base,
      doing: "plugin-install",
      source: "komga",
      install: wouldInstall,
    };
    const update: Offered = {
      ...base,
      doing: "plugin-update",
      plugin: "komga",
      update: wouldUpdate,
    };
    const removal: Offered = {
      ...base,
      doing: "plugin-remove",
      plugin: "komga",
      removal: wouldRemove,
    };
    expect(installOf(install)).toBe(wouldInstall);
    expect(installOf(update)).toBe(wouldInstall);
    expect(installOf(removal)).toBeUndefined();
  });
});
