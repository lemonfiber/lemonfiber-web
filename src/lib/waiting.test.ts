import { describe, expect, it } from "vitest";
import {
  givingLine,
  heldLines,
  stillHeldLines,
  waitingLines,
  waitingWords,
  type Waiting,
} from "./waiting";

const guard: Waiting = {
  service: "gluetun",
  wants: [
    {
      kind: "setting",
      setting: "gluetun:vpn-type",
      choices: ["wireguard", "openvpn"],
    },
    { kind: "secret", secret: "gluetun:wireguard-key" },
  ],
};

const through: Waiting = {
  service: "qbittorrent",
  wants: [{ kind: "service", service: "gluetun" }],
};

describe("a service held back until the operator gives what it needs", () => {
  it("names each thing it waits for the way status says it, with the choices and no value", () => {
    expect(waitingWords(guard)).toBe(
      "gluetun waits for the setting gluetun:vpn-type, one of wireguard, openvpn; the secret gluetun:wireguard-key",
    );
    expect(waitingWords(through)).toBe(
      "qbittorrent waits for gluetun, which it runs through",
    );
  });

  it("names a setting with no choices declared, and one whose choices are all ruled out", () => {
    expect(
      waitingWords({
        service: "gluetun",
        wants: [
          { kind: "setting", setting: "gluetun:countries" },
          { kind: "setting", setting: "gluetun:provider", choices: null },
          { kind: "setting", setting: "gluetun:server", choices: [] },
        ],
      }),
    ).toBe(
      "gluetun waits for the setting gluetun:countries; the setting gluetun:provider; the setting gluetun:server, which has no choice until the settings it depends on change",
    );
  });

  it("says where in the console a setting is given, only where one is waited for", () => {
    expect(waitingLines([guard, through])).toStrictEqual([
      waitingWords(guard),
      waitingWords(through),
      "Give a setting under Service settings, on the Settings screen.",
    ]);
    expect(waitingLines([through])).toStrictEqual([waitingWords(through)]);
    expect(waitingLines([])).toStrictEqual([]);
  });

  it("gives a record the heading status says it under, and nothing where nothing waits", () => {
    expect(heldLines([through])).toStrictEqual([
      "Held back until you give what they need to start",
      waitingWords(through),
    ]);
    expect(heldLines([])).toStrictEqual([]);
    expect(givingLine([through])).toBeUndefined();
  });

  it("leaves where a setting is given out of what the settings view says is still held back", () => {
    expect(stillHeldLines([guard, through])).toStrictEqual([
      "Held back until you give what they need to start",
      waitingWords(guard),
      waitingWords(through),
    ]);
    expect(stillHeldLines([])).toStrictEqual([]);
  });
});
