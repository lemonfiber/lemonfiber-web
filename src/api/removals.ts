/**
 * What this machine keeps running, what lemonfiber keeps, and what taking it
 * off the machine would reach or reached, as a suite stands them in for a
 * running lemonfiber.
 *
 * Declared as the payload the kind it names carries, so the compiler asks
 * whether each field is one the contract has rather than whoever wrote the
 * reader and the body agreeing with each other.
 */
import type { Hosted, Stored, Uninstalled } from "../lib/removed";

/** One long-running command, as the reading lists it. */
type Command = Hosted["commands"][number];

/** The guard on the data location, not kept running. */
export const guard: Command = {
  name: "watch",
  command: "lemonfiber watch",
  guarantees: "stops the stack if the data location disappears",
  standing: "not-hosted",
};

/** The clock that closes requests nobody ruled on, kept running. */
export const clock: Command = {
  name: "expiring",
  command: "lemonfiber household expiring",
  guarantees:
    "closes requests nobody has ruled on, and tells whoever asked why",
  standing: "hosted",
  definition: "/Users/ada/Library/LaunchAgents/lemonfiber.expiring.plist",
  runs: "/usr/local/bin/lemonfiber household expiring",
  output: "/Users/ada/.local/state/lemonfiber/expiring.log",
};

/** The start at boot, whose program is gone. */
export const boot: Command = {
  name: "boot",
  command: "lemonfiber up --at-boot",
  guarantees: "brings the stack back after this machine restarts",
  standing: "orphaned",
  missing: "/usr/local/bin/lemonfiber",
};

/** The guard not kept, the clock kept, and the boot start left behind. */
export const hosted: Hosted = {
  manager: "launchd",
  caveat: "launchd starts it again only after you sign in.",
  commands: [guard, clock, boot],
};

/** A machine whose service manager lemonfiber cannot configure. */
export const unhosted: Hosted = {
  manager: "unsupported",
  instruction: "Start lemonfiber watch from your own service manager.",
  commands: [
    {
      name: "watch",
      command: "lemonfiber watch",
      guarantees: "stops the stack if the data location disappears",
      standing: "unsupported",
    },
  ],
};

/** The guard handed to the machine, and started. */
export const guardKept: Hosted = {
  ...hosted,
  changed: {
    name: "watch",
    installed: true,
    rehearsed: false,
    started: true,
    touched: ["/Users/ada/Library/LaunchAgents/lemonfiber.watch.plist"],
  },
};

/** The clock taken back off the machine. */
export const clockTaken: Hosted = {
  ...hosted,
  caveat: null,
  changed: {
    name: "expiring",
    installed: false,
    rehearsed: false,
    started: false,
    touched: [],
  },
};

/** Everything lemonfiber keeps, listed with nothing removed. */
export const stored: Stored = {
  roots: [
    {
      at: "/Users/ada/.config/lemonfiber",
      what: "Your settings and credentials",
    },
  ],
  kept: [
    {
      what: "The stack's credentials",
      at: "/Users/ada/.config/lemonfiber/secrets.toml",
      why: "Every service signs in with them.",
      secret: true,
    },
    {
      what: "The record of changes",
      at: "/Users/ada/.local/state/lemonfiber/history.jsonl",
      why: "It is what putting a change back reads.",
      secret: false,
    },
  ],
  beside: [
    {
      what: "The media library",
      why: "It is yours, and a removal of its own takes it.",
    },
  ],
  removal: { state: "unconfirmed" },
};

/** All of it forgotten, save one directory the machine would not let go. */
export const forgotten: Stored = {
  ...stored,
  removal: {
    state: "done",
    gone: ["/Users/ada/.config/lemonfiber"],
    left: [
      {
        at: "/Users/ada/.local/state/lemonfiber",
        why: "Permission denied.",
      },
    ],
  },
};

/** What removing the services would reach, listed with nothing removed. */
export const surveyed: Uninstalled = {
  manifest: {
    tier: "services",
    agreement: "services-4f1a",
    removes: "The containers, their network and their images.",
    keeps: "Your configuration and your media.",
    bytes: 2_147_483_648,
    items: [
      {
        name: "jellyfin",
        what: "The media server",
        sort: "container",
        secret: false,
      },
      {
        name: "lscr.io/linuxserver/sonarr:4",
        what: "The series manager's image",
        sort: "image",
        secret: false,
        bytes: 2_147_483_648,
      },
      {
        name: "/srv/media/.lemonfiber/secrets",
        what: "The service keys",
        sort: "path",
        secret: true,
      },
      {
        name: "postgres:16",
        what: "A database image",
        sort: "image",
        secret: false,
        kept: "Another project on this machine stands on it.",
      },
    ],
    coming: [{ name: "Big Buck Bunny", progress: 41.6 }],
    foreign: [{ at: "photos", files: 312, bytes: 1_048_576 }],
    outside: [
      {
        what: "The firewall rule",
        why: "It belongs to the operating system.",
        by_hand: "sudo pfctl -d",
        found: true,
      },
      {
        what: "The login item",
        why: "It belongs to your account.",
        by_hand: "Remove it in System Settings.",
        found: false,
      },
    ],
    confidence: { complete: false, unread: ["Docker would not list images."] },
    backup: "A backup was written before anything went.",
    volume: "The data location is on a drive that unplugs.",
  },
  removal: { state: "surveyed" },
};

/** Nothing coming down, and everything read. */
export const settledSurvey: Uninstalled = {
  manifest: {
    ...surveyed.manifest,
    tier: "stop",
    coming: [],
    foreign: [],
    outside: [],
    backup: null,
    volume: null,
    confidence: { complete: true, unread: [] },
  },
  removal: { state: "surveyed" },
};

/** The services removed, and the credential that went with them. */
export const removed: Uninstalled = {
  ...surveyed,
  removal: {
    state: "complete",
    gone: ["jellyfin", "lscr.io/linuxserver/sonarr:4"],
    credentials: ["The service keys"],
  },
};

/** The services and their keys removed, save one image the engine would not let go. */
export const partlyRemoved: Uninstalled = {
  ...surveyed,
  removal: {
    state: "partial",
    gone: ["jellyfin"],
    credentials: ["The service keys"],
    left: [
      {
        name: "lscr.io/linuxserver/sonarr:4",
        why: "image is in use",
        by_hand: "docker image rm lscr.io/linuxserver/sonarr:4",
      },
    ],
  },
};

/** The removal agreed to as a rehearsal. */
export const rehearsedRemoval: Uninstalled = {
  ...surveyed,
  removal: { state: "confirmed" },
};
