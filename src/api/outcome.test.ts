import { API_VERSION, type ByKind, type Kind } from "@lemonfiber/sdk-ts";
import { describe, expect, it } from "vitest";
import { backed, described, listing } from "./archived";
import { staged } from "./configs";
import { offered } from "./invitations";
import { guarded, traced, walked } from "./found";
import { declared, paused, plan } from "./lines";
import { material } from "./pairings";
import { hosted, stored, surveyed } from "./removals";
import { letOffer, reclaimedRoom } from "./spaces";
import { wouldFill } from "./substitutions";
import { household } from "../routes/house";
import { outcomeOf } from "./outcome";
import { costed, reapplied } from "./qualities";
import { ran } from "../routes/fixture";
import { allWell } from "../routes/findings";
import { offer, undone } from "../routes/mended";

/** One envelope, as a finished job is redeemed for it. */
const sealed = <K extends Kind>(kind: K, data: ByKind[K]["data"]) => ({
  api_version: API_VERSION,
  kind,
  data,
});

const wired: ByKind["seed"]["data"] = {
  assessment: "assessed",
  rehearsed: false,
  wirings: [],
};

describe("what an envelope says a piece of work came to", () => {
  it("reads what a start, stop, switch, restart or fetch came to", () => {
    expect(outcomeOf(sealed("lifecycle", ran))).toStrictEqual({
      kind: "lifecycle",
      report: ran,
    });
  });

  it("reads what wiring the programs to each other came to", () => {
    expect(outcomeOf(sealed("seed", wired))).toStrictEqual({
      kind: "seed",
      report: wired,
    });
  });

  it("reads a run of the checks", () => {
    expect(outcomeOf(sealed("doctor", allWell))).toStrictEqual({
      kind: "doctor",
      report: allWell,
    });
  });

  it("reads what could be put right, or what putting it right came to", () => {
    expect(outcomeOf(sealed("repair", offer))).toStrictEqual({
      kind: "repair",
      report: offer,
    });
  });

  it("reads what putting the last repair back came to", () => {
    expect(outcomeOf(sealed("undo", undone))).toStrictEqual({
      kind: "undo",
      report: undone,
    });
  });

  it("reads where a backup was written", () => {
    expect(outcomeOf(sealed("backup", backed))).toStrictEqual({
      kind: "backup",
      report: backed,
    });
  });

  it("reads what an archive holds, or what putting it back came to", () => {
    expect(outcomeOf(sealed("restore", listing))).toStrictEqual({
      kind: "restore",
      report: listing,
    });
  });

  it("reads what a support bundle holds", () => {
    expect(outcomeOf(sealed("bundle", described))).toStrictEqual({
      kind: "bundle",
      report: described,
    });
  });

  it("reads the quality choice, and what fetching the library again costs", () => {
    expect(outcomeOf(sealed("quality", reapplied))).toStrictEqual({
      kind: "quality",
      report: reapplied,
    });
    expect(outcomeOf(sealed("upgrade", costed))).toStrictEqual({
      kind: "upgrade",
      report: costed,
    });
  });

  it("reads what changing a setting came to", () => {
    expect(outcomeOf(sealed("config", staged))).toStrictEqual({
      kind: "config",
      report: staged,
    });
  });

  it("reads what offering an account, or ruling on the household, came to", () => {
    expect(outcomeOf(sealed("invitation", offered))).toStrictEqual({
      kind: "invitation",
      report: offered,
    });
    expect(outcomeOf(sealed("household", household))).toStrictEqual({
      kind: "household",
      report: household,
    });
  });

  it("reads pairing material", () => {
    expect(outcomeOf(sealed("pairing", material))).toStrictEqual({
      kind: "pairing",
      report: material,
    });
  });

  it("reads what pausing every download came to", () => {
    expect(outcomeOf(sealed("pausing", paused))).toStrictEqual({
      kind: "pausing",
      report: paused,
    });
  });

  it("reads how the line is shared, and what updating would change", () => {
    expect(outcomeOf(sealed("bandwidth", declared))).toStrictEqual({
      kind: "bandwidth",
      report: declared,
    });
    expect(outcomeOf(sealed("update", plan))).toStrictEqual({
      kind: "update",
      report: plan,
    });
  });

  it("reads where one item is, a walk through, and how a guard ended", () => {
    expect(outcomeOf(sealed("trace", traced))).toStrictEqual({
      kind: "trace",
      report: traced,
    });
    expect(outcomeOf(sealed("walkthrough", walked))).toStrictEqual({
      kind: "walkthrough",
      report: walked,
    });
    expect(outcomeOf(sealed("watch", guarded))).toStrictEqual({
      kind: "watch",
      report: guarded,
    });
  });

  it("reads what the machine keeps running, what lemonfiber keeps, and a removal", () => {
    expect(outcomeOf(sealed("hosting", hosted))).toStrictEqual({
      kind: "hosting",
      report: hosted,
    });
    expect(outcomeOf(sealed("stored", stored))).toStrictEqual({
      kind: "stored",
      report: stored,
    });
    expect(outcomeOf(sealed("uninstall", surveyed))).toStrictEqual({
      kind: "uninstall",
      report: surveyed,
    });
    expect(outcomeOf(sealed("stop-seeding", letOffer))).toStrictEqual({
      kind: "stop-seeding",
      report: letOffer,
    });
    expect(outcomeOf(sealed("space", reclaimedRoom))).toStrictEqual({
      kind: "space",
      report: reclaimedRoom,
    });
    expect(outcomeOf(sealed("substitution", wouldFill))).toStrictEqual({
      kind: "substitution",
      report: wouldFill,
    });
  });

  // A payload read under the wrong kind is fields with changed meanings, so
  // an envelope nothing here reads is kept as unread rather than guessed at.
  it("keeps an outcome nothing here reads as unread", () => {
    expect(
      outcomeOf(
        sealed("reset", {
          rehearsed: false,
          confirmed: false,
          reverted: [],
          reverted_connections: [],
        }),
      ),
    ).toStrictEqual({ kind: "unread" });
  });
});
