import { describe, expect, it } from "vitest";
import {
  clientLine,
  codeLine,
  handoffLines,
  remedyLine,
  sessionLine,
  stateLine,
  type Handoff,
  type Remedy,
} from "./handoff";
import { whenOf } from "./history";
import {
  onAndroid,
  onIphone,
  readyForSam,
  seenAndroid,
  servedAt,
  unprovisionedKit,
  unseenIphone,
} from "../api/handoffs";
import * as m from "../paraglide/messages.js";

describe("where a hand-off stands", () => {
  it.each([
    ["unprovisioned", m.handoff_unprovisioned({ name: "Sam" })],
    ["ready", m.handoff_ready({ name: "Sam" })],
    ["pending", m.handoff_pending({ name: "Sam" })],
    ["connected", m.handoff_connected({ name: "Sam" })],
    ["failed", m.handoff_failed({ name: "Sam" })],
  ] as const)("says %s in a sentence", (state, line) => {
    expect(stateLine({ ...readyForSam, state })).toBe(line);
  });

  it("says a state it has no words for as that", () => {
    const state = "revoked" as unknown as Handoff["state"];
    expect(stateLine({ ...readyForSam, state })).toBe(
      m.handoff_state_other({ name: "Sam" }),
    );
  });
});

describe("what there is to do next", () => {
  it.each([
    ["invite", m.handoff_remedy_invite({ name: "Kit" })],
    ["ask-again", m.handoff_remedy_ask_again({ name: "Kit" })],
    ["start-server", m.handoff_remedy_start_server()],
    ["record-address", m.handoff_remedy_record_address()],
  ] as const)("says %s in this console's words", (remedy, line) => {
    expect(remedyLine(remedy, "Kit")).toBe(line);
  });

  it("says a remedy it has no words for as that", () => {
    expect(remedyLine("reboot" as unknown as Remedy, "Kit")).toBe(
      m.handoff_remedy_other(),
    );
  });
});

describe("a hand-off, line by line", () => {
  it("says everything lemonfiber said about it, in order", () => {
    expect(handoffLines(readyForSam)).toStrictEqual([
      m.handoff_ready({ name: "Sam" }),
      m.handoff_address({ address: servedAt }),
      "Anyone on the home network who holds the code can find the server.",
      m.handoff_issued({ when: whenOf("2026-10-08T09:30:00Z") }),
      m.handoff_quick_connect({ name: "Sam" }),
      m.handoff_remedy_ask_again({ name: "Sam" }),
    ]);
  });

  it("carries lemonfiber's reason, and leaves out what it did not say", () => {
    expect(handoffLines(unprovisionedKit)).toStrictEqual([
      m.handoff_unprovisioned({ name: "Kit" }),
      "Kit has no account on the media server.",
      m.handoff_remedy_invite({ name: "Kit" }),
    ]);
  });

  it("takes an empty value, or one left out, as nothing said", () => {
    const bare: Handoff = {
      address: "",
      clients: [],
      name: "Kit",
      quick_connect: false,
      reason: "",
      rehearsed: false,
      sessions: [],
      state: "unprovisioned",
      steps: [],
    };
    expect(handoffLines(bare)).toStrictEqual([
      m.handoff_unprovisioned({ name: "Kit" }),
    ]);
  });
});

describe("each app, its code and each device signed in", () => {
  it("flags an app that is not open source", () => {
    expect(clientLine(onAndroid)).toBe(
      m.handoff_client({ device: "Android phone", client: "Jellyfin" }),
    );
    expect(clientLine(onIphone)).toBe(
      m.handoff_client_closed({ device: "iPhone", client: "Infuse" }),
    );
  });

  it("tells a link that opens the app from an address to type", () => {
    expect(codeLine(onAndroid)).toBe(
      m.handoff_code_link({ code: "jellyfin://media.lan:8096" }),
    );
    expect(codeLine(onIphone)).toBe(m.handoff_code_address({ code: servedAt }));
  });

  it("says when a device was last seen, where lemonfiber knows", () => {
    expect(sessionLine(seenAndroid)).toBe(
      m.handoff_session_seen({
        device: "Android phone",
        client: "Jellyfin",
        when: whenOf("2026-10-08T09:41:00Z"),
      }),
    );
    expect(sessionLine(unseenIphone)).toBe(
      m.handoff_session({ device: "iPhone", client: "Infuse" }),
    );
  });
});
