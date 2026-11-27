import { describe, expect, it } from "vitest";
import {
  demandRecipes,
  demandedLines,
  inputsGiven,
  inputsOf,
  installRecipes,
  isReading,
  reproofLines,
  reprovedLines,
} from "./proving";
import {
  carriedBy,
  changedByPlugging,
  givenForPlug,
  standingPlug,
} from "./plugging";
import { pluggedLines } from "./plugged";
import type { Work } from "./work";
import {
  proveOffer,
  proved,
  ran,
  ranBadly,
  readProve,
  readRun,
  refresh,
  runOffer,
  failedProof,
  heldProof,
  ranWell,
  wouldProve,
  wouldRun,
} from "../api/proofs";
import { readInstall, released, signIn } from "../api/plugs";
import { plugins } from "../api/installs";
import * as m from "../paraglide/messages.js";

/** A record of one act on a plugin, answered with this report. */
const read = (
  doing: Work["doing"],
  given: Work["given"],
  report: typeof readProve,
): Work => ({
  id: "7",
  doing,
  scoped: false,
  given,
  at: "done",
  job: undefined,
  came: { kind: "plugins", report },
});

describe("whether a report is a reading", () => {
  it("is where it is marked one, a proof asked nothing, or a recipe ran nothing", () => {
    expect(isReading(readInstall)).toBe(true);
    expect(isReading(readProve)).toBe(true);
    expect(isReading(readRun)).toBe(true);
    expect(
      isReading({
        ...readRun,
        demand: { plugin: wouldRun.plugin, recipe: refresh },
      }),
    ).toBe(true);
  });

  it("is not once a proof asked, a recipe ran, or anything else was done", () => {
    expect(isReading(proved)).toBe(false);
    expect(isReading(ran)).toBe(false);
    expect(isReading(plugins)).toBe(false);
    expect(changedByPlugging({ kind: "plugins", report: readProve })).toBe(
      false,
    );
    expect(changedByPlugging({ kind: "plugins", report: proved })).toBe(true);
  });
});

describe("proving a plugin again", () => {
  it("reads every proof it would ask and everything kept against it, which a pass clears", () => {
    const lines = reproofLines(wouldProve);
    expect(lines).toContain(
      m.plug_proof({ proof: "lists", asks: "GET /languages" }),
    );
    expect(lines.at(-1)).toBe(
      m.plug_kept({
        capability: "subtitles",
        operation: "search",
        why: "It answered with no language.",
      }),
    );
  });

  it("says where it would ask nothing and nothing is kept against it", () => {
    expect(reproofLines({ ...wouldProve, proofs: [], kept: [] })).toStrictEqual(
      [m.plug_reproof_nothing(), m.plug_kept_none()],
    );
  });

  it("says what each proof came to, and whether what was kept is cleared", () => {
    expect(reprovedLines(heldProof)).toStrictEqual([
      m.plug_proof_passed({ proof: "answers" }),
      m.plug_proof_passed({ proof: "lists" }),
      m.plug_reproof_cleared({ plugin: "subtitle-fetch" }),
    ]);
    const proofs = [...failedProof.proofs, ...wouldProve.proofs];
    expect(reprovedLines({ ...failedProof, proofs })).toStrictEqual([
      m.plug_proof_failed({ proof: "answers", faults: "No answer." }),
      m.plug_reproof_kept({ plugin: "subtitle-fetch" }),
    ]);
  });

  it("is recorded as read, then as what it came to", () => {
    expect(pluggedLines(readProve)).toStrictEqual([
      m.came_rehearsed(),
      m.plug_offer_named({ offer: proveOffer }),
    ]);
    expect(pluggedLines(proved).at(-1)).toBe(
      m.plug_reproof_cleared({ plugin: "subtitle-fetch" }),
    );
  });
});

describe("running a recipe by name", () => {
  it("says what it came to, or nothing where it ran nothing", () => {
    expect(demandedLines(wouldRun)).toBeUndefined();
    expect(
      demandedLines({ plugin: wouldRun.plugin, recipe: refresh }),
    ).toBeUndefined();
    expect(demandedLines(ranWell)).toStrictEqual([
      m.plug_recipe_held({ recipe: refresh.title }),
    ]);
    expect(demandedLines(ranBadly)).toStrictEqual([
      m.plug_recipe_failed({
        recipe: refresh.title,
        why: "The service refused the sign-in.",
      }),
    ]);
    const unsaid = { recipe: "refresh", held: false, steps: [] };
    expect(demandedLines({ ...wouldRun, ran: unsaid })).toStrictEqual([
      m.plug_recipe_failed({ recipe: refresh.title, why: "" }),
    ]);
  });

  it("is recorded as read, then as what it came to", () => {
    expect(pluggedLines(readRun)).toStrictEqual([
      m.came_rehearsed(),
      m.plug_offer_named({ offer: runOffer }),
    ]);
    expect(pluggedLines(ran)).toStrictEqual([
      m.plug_recipe_held({ recipe: refresh.title }),
    ]);
  });

  it("asks each value approved that its recipe would carry elsewhere", () => {
    expect(carriedBy(refresh)).toStrictEqual([
      {
        recipe: refresh.title,
        pair: released,
        approval: released.approval,
      },
    ]);
  });
});

describe("which recipes run when", () => {
  it("runs a recipe by name only where it says so, and at an install only where it says so or says nothing", () => {
    const claiming = { ...signIn, id: "claiming", on: "claim" as const };
    const atInstall = { ...signIn, id: "at-install", on: "install" as const };
    expect(demandRecipes([signIn, refresh, claiming])).toStrictEqual([refresh]);
    expect(
      installRecipes([signIn, refresh, claiming, atInstall]),
    ).toStrictEqual([signIn, atInstall]);
    expect(demandRecipes(undefined)).toStrictEqual([]);
    expect(installRecipes(undefined)).toStrictEqual([]);
  });

  it("asks each input once by its name, and sends each as it was typed", () => {
    const asked = inputsOf([refresh, { ...signIn }, refresh]);
    expect(asked.map((one) => one.name)).toStrictEqual([
      "account",
      "passphrase",
    ]);
    expect(inputsGiven(asked, { account: "household" })).toStrictEqual([
      "account=household",
      "passphrase=",
    ]);
  });
});

describe("what proving and running send", () => {
  it("reads by the plugin, and the recipe for a run", () => {
    expect(
      givenForPlug({ doing: "plugin-prove", plugin: "subtitle-fetch" }),
    ).toStrictEqual({ plugin: "subtitle-fetch" });
    expect(
      givenForPlug({
        doing: "plugin-run",
        plugin: "subtitle-fetch",
        recipe: "refresh",
      }),
    ).toStrictEqual({ plugin: "subtitle-fetch", recipe: "refresh" });
  });

  it("carries each value typed with the yes, and none where nothing was asked", () => {
    const yes = {
      doing: "plugin-run",
      plugin: "subtitle-fetch",
      recipe: "refresh",
      offer: runOffer,
      approved: [],
    } as const;
    expect(
      givenForPlug({ ...yes, inputs: ["account=household"] }),
    ).toStrictEqual({
      plugin: "subtitle-fetch",
      recipe: "refresh",
      offer: runOffer,
      approved: [],
      inputs: ["account=household"],
    });
    expect(givenForPlug({ ...yes, inputs: [] })).toStrictEqual({
      plugin: "subtitle-fetch",
      recipe: "refresh",
      offer: runOffer,
      approved: [],
    });
    expect(
      givenForPlug({
        doing: "plugin-prove",
        plugin: "subtitle-fetch",
        offer: proveOffer,
      }),
    ).toStrictEqual({ plugin: "subtitle-fetch", offer: proveOffer });
  });
});

describe("the proving or run standing on the screen", () => {
  it("is the newest proving or run read, for the plugin it was read for", () => {
    const given = { plugin: "subtitle-fetch" };
    expect(
      standingPlug([read("plugin-prove", given, readProve)]),
    ).toStrictEqual({
      id: "7",
      offer: proveOffer,
      doing: "plugin-prove",
      plugin: "subtitle-fetch",
      proof: wouldProve,
    });
    expect(
      standingPlug([
        read("plugin-run", { ...given, recipe: "refresh" }, readRun),
      ]),
    ).toStrictEqual({
      id: "7",
      offer: runOffer,
      doing: "plugin-run",
      plugin: "subtitle-fetch",
      demand: wouldRun,
    });
  });

  it("is nothing once it ran, or where the reading lacks what was asked for", () => {
    const given = { plugin: "subtitle-fetch" };
    expect(standingPlug([read("plugin-prove", given, proved)])).toBeUndefined();
    expect(standingPlug([read("plugin-run", given, ran)])).toBeUndefined();
    const bare = { ...readInstall, install: null };
    expect(standingPlug([read("plugin-prove", given, bare)])).toBeUndefined();
    expect(standingPlug([read("plugin-run", given, bare)])).toBeUndefined();
  });
});
