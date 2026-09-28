import { describe, expect, it } from "vitest";
import {
  commandLines,
  everyTier,
  hostingLines,
  labelOfTier,
  storedLines,
  uninstallLines,
  wordOfHosting,
  type Hosted,
  type Stored,
  type Uninstalled,
} from "./removed";
import { linesOf } from "./came";
import { bytes } from "./figures";
import {
  boot,
  clock,
  clockTaken,
  forgotten,
  guardKept,
  hosted,
  partlyRemoved,
  rehearsedRemoval,
  removed,
  settledSurvey,
  stored,
  surveyed,
} from "../api/removals";
import * as m from "../paraglide/messages.js";

describe("what a removal would reach, before the yes", () => {
  const lines = uninstallLines(surveyed);

  it("says nothing was removed, what it takes and leaves, and its size", () => {
    expect(lines.slice(0, 4)).toStrictEqual([
      m.remove_surveyed(),
      surveyed.manifest.removes,
      surveyed.manifest.keeps,
      m.remove_size({ size: bytes(surveyed.manifest.bytes) }),
    ]);
  });

  it("says every line it reaches, going or kept, and each credential going", () => {
    expect(lines).toContain(
      m.remove_item_going({ what: "The media server", name: "jellyfin" }),
    );
    expect(lines).toContain(
      m.remove_item_going_sized({
        what: "The series manager's image",
        name: "lscr.io/linuxserver/sonarr:4",
        size: bytes(2_147_483_648),
      }),
    );
    expect(lines).toContain(
      m.remove_item_secret({ name: "/srv/media/.lemonfiber/secrets" }),
    );
    expect(lines).toContain(
      m.remove_item_kept({
        what: "A database image",
        name: "postgres:16",
        why: "Another project on this machine stands on it.",
      }),
    );
  });

  it("says what is coming down, what is not the stack's, and what is left to do by hand", () => {
    expect(lines).toContain(
      m.remove_coming({ name: "Big Buck Bunny", progress: "42" }),
    );
    expect(lines).toContain(
      m.remove_foreign({ at: "photos", files: "312", size: bytes(1_048_576) }),
    );
    expect(lines).toContain(
      m.remove_outside({
        what: "The firewall rule",
        why: "It belongs to the operating system.",
        by_hand: "sudo pfctl -d",
      }),
    );
    expect(lines).toContain(
      m.remove_outside_unfound({
        what: "The login item",
        why: "It belongs to your account.",
        by_hand: "Remove it in System Settings.",
      }),
    );
  });

  it("passes on what lemonfiber said about the backup and the drive, and what it could not read", () => {
    expect(lines.slice(-4)).toStrictEqual([
      "A backup was written before anything went.",
      "The data location is on a drive that unplugs.",
      m.remove_incomplete(),
      "Docker would not list images.",
    ]);
  });

  it("says none of that where there is none of it", () => {
    const quiet = uninstallLines(settledSurvey);
    expect(quiet).not.toContain(m.remove_incomplete());
    expect(quiet.at(-1)).toBe(
      m.remove_item_kept({
        what: "A database image",
        name: "postgres:16",
        why: "Another project on this machine stands on it.",
      }),
    );
  });
});

describe("what a removal came to", () => {
  it("names what went and every credential it destroyed", () => {
    expect(uninstallLines(removed).slice(0, 2)).toStrictEqual([
      m.remove_gone({ names: "jellyfin, lscr.io/linuxserver/sonarr:4" }),
      m.remove_credential({ what: "The service keys" }),
    ]);
  });

  it("names what is still there, and how to finish it by hand", () => {
    expect(uninstallLines(partlyRemoved).slice(0, 3)).toStrictEqual([
      m.remove_gone({ names: "jellyfin" }),
      m.remove_credential({ what: "The service keys" }),
      m.remove_left({
        name: "lscr.io/linuxserver/sonarr:4",
        why: "image is in use",
        by_hand: "docker image rm lscr.io/linuxserver/sonarr:4",
      }),
    ]);
  });

  it("says a rehearsal removed nothing, and says so of an ending it has no words for", () => {
    expect(uninstallLines(rehearsedRemoval)[0]).toBe(m.remove_confirmed());
    const strange = {
      ...surveyed,
      removal: { state: "elsewhere" },
    } as unknown as Uninstalled;
    expect(uninstallLines(strange)[0]).toBe(m.remove_other());
  });
});

describe("what lemonfiber keeps", () => {
  it("lists where it lives, each thing kept and why, and what is beside it", () => {
    expect(storedLines(stored)).toStrictEqual([
      m.forget_unconfirmed(),
      m.forget_root({
        at: "/Users/ada/.config/lemonfiber",
        what: "Your settings and credentials",
      }),
      m.forget_kept_secret({
        what: "The stack's credentials",
        at: "/Users/ada/.config/lemonfiber/secrets.toml",
        why: "Every service signs in with them.",
      }),
      m.forget_kept({
        what: "The record of changes",
        at: "/Users/ada/.local/state/lemonfiber/history.jsonl",
        why: "It is what putting a change back reads.",
      }),
      m.forget_beside({
        what: "The media library",
        why: "It is yours, and a removal of its own takes it.",
      }),
    ]);
  });

  it("says what forgetting took, and what the machine would not let go", () => {
    expect(storedLines(forgotten).slice(0, 2)).toStrictEqual([
      m.forget_gone({ at: "/Users/ada/.config/lemonfiber" }),
      m.forget_left({
        at: "/Users/ada/.local/state/lemonfiber",
        why: "Permission denied.",
      }),
    ]);
  });

  it("says nothing about removing where nobody asked, and says so of what it has no words for", () => {
    const listed: Stored = { ...stored, removal: { state: "not-asked" } };
    expect(storedLines(listed)[0]).toBe(
      m.forget_root({
        at: "/Users/ada/.config/lemonfiber",
        what: "Your settings and credentials",
      }),
    );
    const strange = {
      ...stored,
      removal: { state: "elsewhere" },
    } as unknown as Stored;
    expect(storedLines(strange)[0]).toBe(m.forget_other());
  });
});

describe("what this machine keeps running", () => {
  it("says what each command does, where it stands, and where its pieces are", () => {
    expect(commandLines(clock)).toStrictEqual([
      clock.guarantees,
      m.hosting_command({ name: "expiring", standing: m.hosting_hosted() }),
      m.hosting_typed({ command: "lemonfiber household expiring" }),
      m.hosting_runs({ runs: "/usr/local/bin/lemonfiber household expiring" }),
      m.hosting_service_file({
        at: "/Users/ada/Library/LaunchAgents/lemonfiber.expiring.plist",
      }),
      m.hosting_output({
        at: "/Users/ada/.local/state/lemonfiber/expiring.log",
      }),
    ]);
  });

  it("names the program a definition points at that is gone", () => {
    expect(commandLines(boot)).toContain(
      m.hosting_missing({ program: "/usr/local/bin/lemonfiber" }),
    );
  });

  it("has a word for every standing, and says so of one it has none for", () => {
    expect(
      (
        [
          "not-hosted",
          "hosted",
          "installed-unverified",
          "stopped",
          "orphaned",
          "unsupported",
        ] as const
      ).map(wordOfHosting),
    ).toStrictEqual([
      m.hosting_not_hosted(),
      m.hosting_hosted(),
      m.hosting_unverified(),
      m.hosting_stopped(),
      m.hosting_orphaned(),
      m.hosting_unsupported(),
    ]);
    expect(
      wordOfHosting(
        "elsewhere" as unknown as Hosted["commands"][number]["standing"],
      ),
    ).toBe(m.hosting_unrecognised());
  });

  it("says what a run kept running, and where every command stands after", () => {
    expect(hostingLines(guardKept)).toStrictEqual([
      m.hosting_installed({ name: "watch" }),
      "/Users/ada/Library/LaunchAgents/lemonfiber.watch.plist",
      m.hosting_command({ name: "watch", standing: m.hosting_not_hosted() }),
      m.hosting_command({ name: "expiring", standing: m.hosting_hosted() }),
      m.hosting_command({ name: "boot", standing: m.hosting_orphaned() }),
      "launchd starts it again only after you sign in.",
    ]);
  });

  it("says what a run took back, and one that was installed and not started", () => {
    expect(hostingLines(clockTaken)[0]).toBe(
      m.hosting_removed({ name: "expiring" }),
    );
    const unstarted: Hosted = {
      ...guardKept,
      changed: {
        name: "watch",
        installed: true,
        rehearsed: true,
        started: false,
        touched: [],
      },
    };
    expect(hostingLines(unstarted).slice(0, 3)).toStrictEqual([
      m.came_rehearsed(),
      m.hosting_installed({ name: "watch" }),
      m.hosting_not_started({ name: "watch" }),
    ]);
  });
});

describe("a record of any of them", () => {
  it("carries the same lines", () => {
    expect(linesOf({ kind: "hosting", report: hosted })).toStrictEqual(
      hostingLines(hosted),
    );
    expect(linesOf({ kind: "stored", report: stored })).toStrictEqual(
      storedLines(stored),
    );
    expect(linesOf({ kind: "uninstall", report: surveyed })).toStrictEqual(
      uninstallLines(surveyed),
    );
  });
});

describe("the four removals", () => {
  it("each have a name to be chosen by", () => {
    expect(everyTier.map(labelOfTier)).toStrictEqual([
      m.tier_stop(),
      m.tier_services(),
      m.tier_configuration(),
      m.tier_media(),
    ]);
  });
});
