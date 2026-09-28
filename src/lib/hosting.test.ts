import { describe, expect, it } from "vitest";
import {
  actOf,
  changedTheHosting,
  everyHosting,
  givenForHost,
  hosting,
  isHosting,
  type Command,
  type Host,
} from "./hosting";
import type { Hosted } from "./removed";
import { clockTaken, guardKept, hosted } from "../api/removals";
import * as m from "../paraglide/messages.js";

/** A command as the reading lists it, standing where it is asked to. */
const standing = (where: Command["standing"], name = "expiring"): Command => ({
  name,
  command: `lemonfiber ${name}`,
  guarantees: "closes requests nobody has ruled on",
  standing: where,
});

const guard = standing("not-hosted", "watch");
const clock = standing("hosted");

describe("what the hosting panel asks for", () => {
  it("is the two requests it makes, and nothing else", () => {
    expect(everyHosting.every(isHosting)).toBe(true);
    expect(isHosting("watch")).toBe(false);
  });

  it("names the command, and gives the guard the forms it guards", () => {
    expect(
      givenForHost({ doing: "hosting-install", command: guard, forms: ["tv"] }),
    ).toStrictEqual({ kept: "watch", forms: ["tv"] });
    expect(
      givenForHost({
        doing: "hosting-install",
        command: standing("not-hosted"),
        forms: ["tv"],
      }),
    ).toStrictEqual({ kept: "expiring" });
    expect(
      givenForHost({ doing: "hosting-remove", command: clock }),
    ).toStrictEqual({ kept: "expiring" });
  });

  // Both change the machine and nothing comes back to read first, so each is
  // asked about, in the words of what the reading said the command does.
  it("asks before keeping one running, naming what it does and what it guards", () => {
    const question = hosting.question({
      doing: "hosting-install",
      command: guard,
      forms: ["tv", "films"],
    });
    expect(question).toStrictEqual({
      eyebrow: m.confirm_mend_eyebrow(),
      title: m.confirm_host_title({ name: "watch" }),
      prose: m.confirm_host_prose_forms({
        guarantees: guard.guarantees,
        command: guard.command,
        forms: "tv, films",
      }),
      yes: m.action_host_yes(),
    });
    expect(
      hosting.question({
        doing: "hosting-install",
        command: standing("not-hosted"),
        forms: [],
      })?.prose,
    ).toBe(
      m.confirm_host_prose({
        guarantees: clock.guarantees,
        command: clock.command,
      }),
    );
  });

  it("asks before taking one back, naming what stops happening", () => {
    expect(
      hosting.question({ doing: "hosting-remove", command: clock }),
    ).toStrictEqual({
      eyebrow: m.confirm_mend_eyebrow(),
      title: m.confirm_unhost_title({ name: "expiring" }),
      prose: m.confirm_unhost_prose({ guarantees: clock.guarantees }),
      yes: m.action_unhost_yes(),
    });
  });

  it("takes a yes only for the same command, over the same forms", () => {
    const asked: Host = {
      doing: "hosting-install",
      command: guard,
      forms: ["tv"],
    };
    expect(hosting.same(asked, { ...asked, forms: ["tv"] })).toBe(true);
    expect(hosting.same(asked, { ...asked, forms: ["films"] })).toBe(false);
    expect(
      hosting.same(asked, { doing: "hosting-remove", command: guard }),
    ).toBe(false);
    expect(hosting.same(undefined, asked)).toBe(false);
  });
});

describe("what can be asked of a command where it stands", () => {
  it("keeps one that is not kept, and takes back one installed in any state", () => {
    expect(actOf(standing("not-hosted"))).toBe("hosting-install");
    for (const where of [
      "hosted",
      "installed-unverified",
      "stopped",
      "orphaned",
    ] as const) {
      expect(actOf(standing(where))).toBe("hosting-remove");
    }
  });

  it("offers nothing this machine cannot keep, or where it stands nowhere this page knows", () => {
    expect(actOf(standing("unsupported"))).toBeUndefined();
    expect(
      actOf(standing("elsewhere" as unknown as Command["standing"])),
    ).toBeUndefined();
  });
});

describe("what changed what the machine keeps running", () => {
  it("is a run that kept or took back a command, and not a rehearsal or a reading", () => {
    expect(changedTheHosting({ kind: "hosting", report: guardKept })).toBe(
      true,
    );
    expect(changedTheHosting({ kind: "hosting", report: clockTaken })).toBe(
      true,
    );
    expect(changedTheHosting({ kind: "hosting", report: hosted })).toBe(false);
    const rehearsed: Hosted = {
      ...hosted,
      changed: {
        name: "watch",
        installed: true,
        rehearsed: true,
        started: false,
        touched: [],
      },
    };
    expect(changedTheHosting({ kind: "hosting", report: rehearsed })).toBe(
      false,
    );
    expect(
      changedTheHosting({
        kind: "hosting",
        report: { ...hosted, changed: null },
      }),
    ).toBe(false);
    expect(changedTheHosting({ kind: "unread" })).toBe(false);
  });
});
