import { describe, expect, it } from "vitest";
import { linesOf } from "./came";
import { bytes } from "./figures";
import {
  backupLines,
  bundleLines,
  restoreLines,
  scopeWords,
  type Backed,
  type Restored,
} from "./kept";
import {
  archive,
  backed,
  described,
  destination,
  listing,
  restored,
  written,
} from "../api/archived";
import * as m from "../paraglide/messages.js";

/** How much of the stack an archive covers, as the contract names it. */
type Scope = Backed["scope"];

describe("what an archive covers", () => {
  it("names the whole stack, one service, or the setup already here", () => {
    expect(scopeWords({ scope: "whole_stack" })).toBe(m.came_scope_whole());
    expect(scopeWords({ scope: "service", name: "sonarr" })).toBe(
      m.came_scope_service({ name: "sonarr" }),
    );
    expect(scopeWords({ scope: "existing", project: "media", trees: [] })).toBe(
      m.came_scope_existing({ project: "media" }),
    );
  });

  // A scope a newer lemonfiber adds is said to be one, rather than dropped.
  it("says so of a scope wider than this build's contract", () => {
    const wider = { scope: "elsewhere" } as unknown as Scope;
    expect(scopeWords(wider)).toBe(m.came_scope_other());
  });
});

describe("what a backup came to", () => {
  it("says where it went, that it is sensitive, and what was pruned", () => {
    expect(backupLines(backed)).toStrictEqual([
      m.came_backup_path({ path: backed.path, scope: m.came_scope_whole() }),
      m.came_sensitive(),
      m.came_backup_pruned({ names: backed.pruned.join(", ") }),
    ]);
  });

  it("says a rehearsal changed nothing, and a slow capture was slow", () => {
    const slow: Backed = {
      ...backed,
      rehearsed: true,
      sensitive: false,
      pruned: [],
      pace: { brisk: false, budget: 1024, moved: 4096 },
    };
    expect(backupLines(slow)).toStrictEqual([
      m.came_rehearsed(),
      m.came_backup_path({ path: backed.path, scope: m.came_scope_whole() }),
      m.came_backup_slow({ moved: bytes(4096), budget: bytes(1024) }),
    ]);
  });

  it("is what a record of one lists", () => {
    expect(linesOf({ kind: "backup", report: backed })).toStrictEqual(
      backupLines(backed),
    );
  });
});

describe("what putting an archive back would do, or did", () => {
  const { manifest } = listing.would;

  it("says what it holds, where it was taken, and that it is sensitive", () => {
    expect(restoreLines(listing)).toStrictEqual([
      m.came_restore_would({
        scope: m.came_scope_whole(),
        taken: manifest.created_at,
        version: manifest.product_version,
      }),
      m.came_restore_relocation({ now: "/mnt/media", was: "/srv/media" }),
      m.came_sensitive(),
    ]);
  });

  it("warns of an older archive, and says nothing of a location that matches", () => {
    const older: Restored = {
      rehearsed: false,
      would: {
        ...listing.would,
        downgrade: true,
        relocation: null,
        manifest: { ...manifest, sensitive: false },
      },
    };
    expect(restoreLines(older)).toStrictEqual([
      m.came_restore_would({
        scope: m.came_scope_whole(),
        taken: manifest.created_at,
        version: manifest.product_version,
      }),
      m.came_restore_downgrade(),
    ]);
  });

  it("says what was put back, and where it now points", () => {
    expect(restoreLines(restored)).toStrictEqual([
      m.came_restore_done({ scope: m.came_scope_whole(), version: "0.18.0" }),
      m.came_restore_repointed({ now: "/mnt/media", was: "/srv/media" }),
    ]);
  });

  it("says nothing of pointing where nothing was re-pointed", () => {
    const scope: Scope = { scope: "service", name: archive };
    const unsaid: Restored = {
      ...restored,
      done: { from_version: "0.18.0", scope },
    };
    const cleared: Restored = {
      ...restored,
      done: { from_version: "0.18.0", relocated: null, scope },
    };
    const only = [
      m.came_restore_done({
        scope: m.came_scope_service({ name: archive }),
        version: "0.18.0",
      }),
    ];
    expect(restoreLines(unsaid)).toStrictEqual(only);
    expect(restoreLines(cleared)).toStrictEqual(only);
  });

  it("is what a record of one lists", () => {
    expect(linesOf({ kind: "restore", report: listing })).toStrictEqual(
      restoreLines(listing),
    );
  });
});

describe("what a support bundle holds", () => {
  const { contents } = described;
  const size = bytes(described.bytes);
  const made = [
    m.came_bundle_taken({
      at: contents.taken.at,
      lemonfiber: "0.18.0",
      stack: "home",
    }),
    m.came_bundle_window({ window: contents.terms.window }),
    m.came_bundle_filenames_replaced(),
  ];

  it("says where it would go and what could not be gathered", () => {
    expect(bundleLines(described)).toStrictEqual([
      m.came_bundle_would({ path: destination, size }),
      ...made,
      m.came_bundle_missing({ names: "the engine's own log" }),
    ]);
  });

  it("says where it went once written", () => {
    expect(bundleLines(written)[0]).toBe(
      m.came_bundle_written({ path: destination, size }),
    );
  });

  // A machine that will not say where lemonfiber keeps its own files leaves a
  // description with nowhere to name, which is said by saying nothing of it.
  it("says which settings and filenames were shown as they are", () => {
    const opened = {
      ...contents,
      missing: [],
      terms: { ...contents.terms, filenames: true, revealed: ["VPN_USER"] },
    };
    const nowhere = bundleLines({
      rehearsed: false,
      bytes: described.bytes,
      contents: opened,
    });
    const cleared = bundleLines({
      rehearsed: false,
      bytes: described.bytes,
      contents: opened,
      path: null,
      would_go: null,
    });
    const lines = [
      made[0],
      made[1],
      m.came_bundle_filenames_shown(),
      m.came_bundle_revealed({ names: "VPN_USER" }),
    ];
    expect(nowhere).toStrictEqual(lines);
    expect(cleared).toStrictEqual(lines);
  });

  it("is what a record of one lists", () => {
    expect(linesOf({ kind: "bundle", report: described })).toStrictEqual(
      bundleLines(described),
    );
  });
});
