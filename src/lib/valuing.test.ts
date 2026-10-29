import { describe, expect, it } from "vitest";
import {
  changedByValuing,
  everyValuing,
  givenForValue,
  isValuing,
  standingValue,
  valuing,
} from "./valuing";
import type { Work } from "./work";
import {
  clearingCountries,
  clearOffer,
  madeSet,
  movingTunnel,
  setOffer,
  values,
  wouldClear,
  wouldSet,
} from "../api/values";

/** Moving the guard's tunnel, as the panel asks about it. */
const moving = {
  doing: "settings-set",
  values: { "gluetun:vpn-type": "wireguard" },
} as const;

/** Clearing the guard's countries, as the panel asks about it. */
const clearing = {
  doing: "settings-clear",
  settings: ["gluetun:countries"],
} as const;

/** A record of what moving the tunnel would come to. */
const setRead: Work = {
  id: "81",
  doing: "settings-set",
  scoped: false,
  given: { values: moving.values, dry_run: true },
  at: "done",
  job: undefined,
  came: { kind: "settings", report: wouldSet },
};

/** A record of what clearing the countries would come to. */
const clearRead: Work = {
  ...setRead,
  id: "83",
  doing: "settings-clear",
  given: { settings: clearing.settings, dry_run: true },
  came: { kind: "settings", report: wouldClear },
};

describe("what the settings panel asks for", () => {
  it("is every request it makes, and nothing else", () => {
    expect(everyValuing.every(isValuing)).toBe(true);
    expect(isValuing("config-set")).toBe(false);
    expect(valuing.owns("settings-clear")).toBe(true);
  });

  it("asks nothing before a reading, which is itself the question", () => {
    expect(valuing.question(moving)).toBeUndefined();
    expect(valuing.same(undefined, moving)).toBe(false);
  });
});

describe("what each asking sends", () => {
  it("rehearses a move or a clearing first, naming the settings as each request takes them", () => {
    expect(givenForValue(moving)).toStrictEqual({
      values: { "gluetun:vpn-type": "wireguard" },
      dry_run: true,
    });
    expect(givenForValue(clearing)).toStrictEqual({
      settings: ["gluetun:countries"],
      dry_run: true,
    });
  });

  it("carries the reading's name on the yes, and no rehearsal", () => {
    expect(givenForValue({ ...moving, offer: setOffer })).toStrictEqual({
      values: { "gluetun:vpn-type": "wireguard" },
      offer: setOffer,
    });
    expect(givenForValue({ ...clearing, offer: clearOffer })).toStrictEqual({
      settings: ["gluetun:countries"],
      offer: clearOffer,
    });
  });
});

describe("what changed the settings", () => {
  it("is a change made, not its reading nor a plain read", () => {
    expect(changedByValuing({ kind: "settings", report: madeSet })).toBe(true);
    expect(changedByValuing({ kind: "settings", report: wouldSet })).toBe(
      false,
    );
    expect(changedByValuing({ kind: "settings", report: values })).toBe(false);
    expect(changedByValuing({ kind: "unread" })).toBe(false);
  });
});

describe("the reading standing for a yes", () => {
  it("is the newest change read, with the settings it was asked about and the overlay", () => {
    expect(standingValue([setRead])).toStrictEqual({
      ...moving,
      id: "81",
      offer: setOffer,
      change: movingTunnel,
      unvetted: wouldSet.unvetted,
    });
    expect(standingValue([clearRead, setRead])).toStrictEqual({
      ...clearing,
      id: "83",
      offer: clearOffer,
      change: clearingCountries,
      unvetted: undefined,
    });
  });

  it("is nothing once the newest change was made or went elsewhere", () => {
    expect(standingValue([])).toBeUndefined();
    expect(
      standingValue([
        { ...setRead, came: { kind: "settings", report: madeSet } },
      ]),
    ).toBeUndefined();
    expect(
      standingValue([
        { ...setRead, came: { kind: "settings", report: values } },
      ]),
    ).toBeUndefined();
    expect(
      standingValue([{ ...setRead, came: { kind: "unread" } }]),
    ).toBeUndefined();
    expect(
      standingValue([
        {
          id: "85",
          doing: "settings-set",
          scoped: false,
          given: setRead.given,
          at: "declined",
          said: "gluetun:vpn-type takes wireguard or openvpn.",
        },
      ]),
    ).toBeUndefined();
  });

  it("is nothing where the record does not name the settings it asked about", () => {
    expect(standingValue([{ ...setRead, given: {} }])).toBeUndefined();
    expect(standingValue([{ ...clearRead, given: {} }])).toBeUndefined();
  });
});
