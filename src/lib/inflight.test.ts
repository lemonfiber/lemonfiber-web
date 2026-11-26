import { describe, expect, it } from "vitest";
import {
  interruptedBy,
  interruptsNothing,
  protocolWord,
  stoppingForms,
  stoppingKey,
  stoppingServices,
  wholeStack,
  unfinishedLine,
  type Unfinished,
} from "./inflight";
import { expanse, nothingComing, twoComing } from "../api/inflights";
import * as m from "../paraglide/messages.js";

describe("what a stop would interrupt", () => {
  it("says it is being checked, and holds the yes, until the stack answers", () => {
    expect(interruptedBy(undefined, true)).toStrictEqual({
      said: m.inflight_checking(),
      downloads: [],
      ready: false,
      finishing: false,
    });
  });

  it("says it could not find out, and still offers both choices where the act takes them", () => {
    const refused = {
      ok: false as const,
      problem: { kind: "unreachable" as const, message: "No." },
    };
    expect(interruptedBy(refused, true)).toStrictEqual({
      said: m.inflight_unknown(),
      downloads: [],
      ready: true,
      finishing: true,
    });
    expect(interruptedBy(refused, false).finishing).toBe(false);
  });

  it("adds nothing where the stack names nothing", () => {
    expect(
      interruptedBy({ ok: true, value: nothingComing }, true),
    ).toStrictEqual(interruptsNothing);
    expect(interruptsNothing).toStrictEqual({
      said: undefined,
      downloads: [],
      ready: true,
      finishing: false,
    });
  });

  it("offers letting them finish where the act can, and says they are interrupted where it cannot", () => {
    const read = { ok: true as const, value: twoComing };
    expect(interruptedBy(read, true)).toStrictEqual({
      said: m.inflight_choose(),
      downloads: twoComing.downloads,
      ready: true,
      finishing: true,
    });
    expect(interruptedBy(read, false)).toMatchObject({
      said: m.inflight_interrupted(),
      finishing: false,
    });
  });
});

describe("what an act would stop", () => {
  it("is named the same for the same forms and services, and apart otherwise", () => {
    expect(stoppingKey(stoppingForms(["usenet"]))).toBe(
      stoppingKey({ forms: ["usenet"], services: [] }),
    );
    expect(stoppingKey(stoppingServices(["sabnzbd"]))).not.toBe(
      stoppingKey(stoppingForms(["sabnzbd"])),
    );
    expect(wholeStack).toStrictEqual(stoppingForms([]));
  });
});

describe("one download", () => {
  it("says what it is, how far along, and the kind of client holding it", () => {
    expect(unfinishedLine(expanse)).toBe(
      m.inflight_line({
        name: expanse.name,
        progress: 62,
        client: m.inflight_usenet(),
      }),
    );
    expect(protocolWord("torrent")).toBe(m.inflight_torrent());
    expect(protocolWord("sideways" as Unfinished["protocol"])).toBe(
      m.inflight_other(),
    );
  });
});
