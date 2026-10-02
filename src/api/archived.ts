/**
 * What backing up, restoring and gathering a support bundle are answered with,
 * as a suite stands them in for a running lemonfiber.
 *
 * Declared as the payload the kind it names carries, so the compiler asks
 * whether each field is one the contract has rather than whoever wrote the
 * reader and the body agreeing with each other.
 */
import type { Archives, Backed, Bundled, Restored } from "../lib/kept";

/** The name a backup was written under. */
export const archive = "lemonfiber-whole_stack-20260928T161500Z.tar.gz";

/** What a listing named itself, which an agreement names back. */
export const listed = "listing-3a91c0de";

/** The backups this machine keeps, newest first. */
export const kept: Archives = {
  archives: [archive, "lemonfiber-whole_stack-20260921T161500Z.tar.gz"],
};

/** A backup of the whole stack, written, with an older one pruned. */
export const backed: Backed = {
  path: `/home/ada/.local/share/lemonfiber/backups/${archive}`,
  pace: { brisk: true, budget: 2_000_000_000, moved: 48_000_000 },
  pruned: ["lemonfiber-whole_stack-20260801T161500Z.tar.gz"],
  rehearsed: false,
  scope: { scope: "whole_stack" },
  sensitive: true,
};

/** What an archive holds and what putting it back would overwrite. */
export const listing: Restored = {
  rehearsed: false,
  done: null,
  would: {
    agreement: listed,
    downgrade: false,
    manifest: {
      created_at: "2026-09-28T16:15:00Z",
      data_root: "/srv/media",
      members: [{ archive_path: "config/sonarr", label: "sonarr" }],
      product_version: "0.18.0",
      schema: 1,
      scope: { scope: "whole_stack" },
      sensitive: true,
    },
    relocation: { now: "/mnt/media", was: "/srv/media" },
  },
};

/** What putting the archive back came to, re-pointed at this machine. */
export const restored: Restored = {
  rehearsed: false,
  done: {
    from_version: "0.18.0",
    relocated: { now: "/mnt/media", was: "/srv/media" },
    scope: { scope: "whole_stack" },
  },
  would: listing.would,
};

/** Where the bundle's file would go, on a run that writes nothing. */
export const destination =
  "/home/ada/.local/share/lemonfiber/support/bundle.tar.gz";

/** What a bundle would hold, with nothing written. */
export const described: Bundled = {
  rehearsed: false,
  bytes: 184_320,
  contents: {
    missing: ["the engine's own log"],
    pieces: [
      {
        name: "doctor.txt",
        body: "services.health  pass\nnetwork.tunnel  warn",
      },
      { name: "logs/sonarr.txt", body: "Starting Sonarr\nListening on 8989" },
    ],
    taken: {
      at: "2026-09-28T16:20:00Z",
      lemonfiber: "0.18.0",
      stack: "home",
    },
    terms: {
      filenames: false,
      revealed: [],
      window: "the last 200 lines of each service",
    },
  },
  path: null,
  would_go: destination,
};

/** The same bundle, written. */
export const written: Bundled = {
  ...described,
  path: destination,
  would_go: null,
};
