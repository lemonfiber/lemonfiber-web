import { describe, expect, it } from "vitest";
import {
  LOG_LINES,
  changedTheBackups,
  everyUpkeep,
  givenForKeep,
  isUpkeep,
  linesTyped,
  questionOfKeep,
  standingBundle,
  standingListing,
} from "./upkeep";
import type { Work } from "./work";
import {
  archive,
  backed,
  described,
  listed,
  listing,
  restored,
  written,
} from "../api/archived";
import * as m from "../paraglide/messages.js";

/** A record of one asking, answered at once with what it came to. */
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

const terms = { logs: 500, filenames: true };

describe("what the backups and support panels ask for", () => {
  it("is every request they make, and nothing else", () => {
    expect(everyUpkeep.every(isUpkeep)).toBe(true);
    expect(isUpkeep("repair")).toBe(false);
    expect(isUpkeep("up")).toBe(false);
  });

  it("sends nothing with a backup, which covers the whole stack", () => {
    expect(givenForKeep({ doing: "backup" })).toStrictEqual({});
  });

  it("names the archive alone when asking what putting it back would do", () => {
    expect(givenForKeep({ doing: "restore", archive })).toStrictEqual({
      archive,
    });
  });

  // The yes names the listing it was read in, so lemonfiber can refuse to
  // spend it on a listing that has since moved on.
  it("puts an archive back only with the listing it was read in", () => {
    expect(
      givenForKeep({ doing: "restore", archive, offer: listed, repoint: true }),
    ).toStrictEqual({ archive, confirm: true, offer: listed, repoint: true });
  });

  it("describes a bundle, and writes one, on the same terms", () => {
    expect(givenForKeep({ doing: "support", terms })).toStrictEqual({
      write: false,
      logs: 500,
      filenames: true,
    });
    expect(
      givenForKeep({ doing: "support", terms, write: true }),
    ).toStrictEqual({ write: true, logs: 500, filenames: true });
  });
});

describe("what is asked before anything is written", () => {
  it("asks before a backup, which has nothing to read first", () => {
    expect(questionOfKeep({ doing: "backup" })).toStrictEqual({
      eyebrow: m.confirm_keep_eyebrow(),
      title: m.confirm_backup_title(),
      prose: m.confirm_backup_prose(),
      yes: m.action_backup_yes(),
    });
  });

  // What comes back is the thing to read before agreeing, or is itself the
  // agreeing, so neither is held up for a question.
  it("asks nothing before a listing, a restore or a bundle", () => {
    expect(questionOfKeep({ doing: "restore", archive })).toBeUndefined();
    expect(questionOfKeep({ doing: "support", terms })).toBeUndefined();
  });
});

describe("whether the backups have changed", () => {
  it("has once a backup was written", () => {
    expect(changedTheBackups({ kind: "backup", report: backed })).toBe(true);
  });

  it("has not after a rehearsal, a listing, a restore or a bundle", () => {
    const rehearsed = { ...backed, rehearsed: true };
    expect(changedTheBackups({ kind: "backup", report: rehearsed })).toBe(
      false,
    );
    expect(changedTheBackups({ kind: "restore", report: restored })).toBe(
      false,
    );
    expect(changedTheBackups({ kind: "bundle", report: written })).toBe(false);
  });
});

describe("the listing standing on the screen", () => {
  const read = answered(
    "2",
    "restore",
    { archive },
    {
      kind: "restore",
      report: listing,
    },
  );

  it("is the newest listing, with what agreeing to it names", () => {
    expect(standingListing([read])).toStrictEqual({
      id: "2",
      archive,
      agreement: listed,
      relocation: { now: "/mnt/media", was: "/srv/media" },
    });
  });

  it("carries no relocation where the archive's location matches", () => {
    const same = { ...listing, would: { ...listing.would, relocation: null } };
    const matched = answered(
      "3",
      "restore",
      { archive },
      {
        kind: "restore",
        report: same,
      },
    );
    expect(standingListing([matched])?.relocation).toBeUndefined();
  });

  it("is gone once the archive has been put back", () => {
    const done = answered(
      "4",
      "restore",
      { archive },
      {
        kind: "restore",
        report: restored,
      },
    );
    expect(standingListing([done, read])).toBeUndefined();
  });

  it("is gone while the newest restore is still under way", () => {
    const going: Work = {
      id: "5",
      doing: "restore",
      scoped: false,
      given: { archive },
      at: "under-way",
      job: "5c63",
    };
    expect(standingListing([going, read])).toBeUndefined();
  });

  it("is nothing where no restore was asked for", () => {
    const backup = answered(
      "6",
      "backup",
      {},
      { kind: "backup", report: backed },
    );
    expect(standingListing([backup])).toBeUndefined();
  });

  it("is nothing where the answer is not a listing, or names no archive", () => {
    const unread = answered("7", "restore", { archive }, { kind: "unread" });
    const unnamed = answered(
      "8",
      "restore",
      {},
      {
        kind: "restore",
        report: listing,
      },
    );
    expect(standingListing([unread])).toBeUndefined();
    expect(standingListing([unnamed])).toBeUndefined();
  });
});

describe("the bundle description standing on the screen", () => {
  const given = { write: false, logs: 500, filenames: true };
  const read = answered("2", "support", given, {
    kind: "bundle",
    report: described,
  });

  it("is the newest description, with the terms it was read under", () => {
    expect(standingBundle([read])).toStrictEqual({
      id: "2",
      terms: { logs: 500, filenames: true },
      pieces: described.contents.pieces,
    });
  });

  it("reads terms that were never sent as lemonfiber's own", () => {
    const bare = answered(
      "3",
      "support",
      {},
      {
        kind: "bundle",
        report: described,
      },
    );
    expect(standingBundle([bare])?.terms).toStrictEqual({
      logs: LOG_LINES,
      filenames: false,
    });
  });

  it("is gone once the bundle has been written", () => {
    const wrote = answered(
      "4",
      "support",
      { ...given, write: true },
      {
        kind: "bundle",
        report: written,
      },
    );
    expect(standingBundle([wrote, read])).toBeUndefined();
  });

  it("is nothing where no bundle was asked for, or the answer is not one", () => {
    const unread = answered("5", "support", given, { kind: "unread" });
    expect(standingBundle([])).toBeUndefined();
    expect(standingBundle([unread])).toBeUndefined();
  });
});

describe("a count of log lines as typed", () => {
  it("is a whole number above nothing", () => {
    expect(linesTyped(" 500 ")).toBe(500);
    expect(linesTyped("1")).toBe(1);
  });

  it("is nothing where what was typed is not one", () => {
    expect(linesTyped("")).toBeUndefined();
    expect(linesTyped("0")).toBeUndefined();
    expect(linesTyped("-3")).toBeUndefined();
    expect(linesTyped("2.5")).toBeUndefined();
    expect(linesTyped("lots")).toBeUndefined();
    expect(linesTyped("9".repeat(20))).toBeUndefined();
  });
});
