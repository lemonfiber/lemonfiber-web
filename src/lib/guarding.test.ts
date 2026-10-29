import { describe, expect, it } from "vitest";
import {
  askedNow,
  carrying,
  chosen,
  offered,
  type GuardQuestion,
} from "./guarding";
import { tunnelling } from "../api/setups";

const questions = tunnelling.guard;
const [type, provider] = questions;

/** The question about the provider, which the fixture holds second. */
const providing = provider?.asks === "choice" ? provider : undefined;

/** What is asked, by the setting or the secret it is about. */
const named = (settings: Readonly<Record<string, string>>): string[] =>
  askedNow(questions, settings).map((one) =>
    one.asks === "secret" ? one.secret : one.setting,
  );

describe("what the tunnel step asks of the egress guard", () => {
  it("asks every choice, and each value or secret only under the answers that need it", () => {
    expect(named({})).toStrictEqual([
      "gluetun:vpn-type",
      "gluetun:provider",
      "gluetun:addresses",
      "wireguard-key",
    ]);
    expect(named({ "gluetun:provider": "custom" })).toStrictEqual([
      "gluetun:vpn-type",
      "gluetun:provider",
      "gluetun:addresses",
      "gluetun:endpoint-ip",
      "wireguard-key",
    ]);
    expect(named({ "gluetun:vpn-type": "openvpn" })).toStrictEqual([
      "gluetun:vpn-type",
      "gluetun:provider",
      "openvpn-password",
    ]);
  });

  it("offers only the values the answers before it open, and keeps a choice only while it is offered", () => {
    if (providing === undefined) throw new Error("no provider question");
    expect(offered(questions, {}, providing)).toStrictEqual([
      "mullvad",
      "custom",
    ]);
    const openvpn = { "gluetun:vpn-type": "openvpn" };
    expect(offered(questions, openvpn, providing)).toStrictEqual([
      "mullvad",
      "privado",
    ]);
    expect(
      chosen(
        questions,
        { ...openvpn, "gluetun:provider": "custom" },
        providing,
      ),
    ).toBeUndefined();
    expect(chosen(questions, {}, providing)).toBeUndefined();
    if (type?.asks !== "choice") throw new Error("no type question");
    expect(chosen(questions, {}, type)).toBe("wireguard");
  });
});

describe("a question under a setting nothing answers", () => {
  it("is not asked, and a choice with no default waits for one", () => {
    const lone: GuardQuestion[] = [
      {
        asks: "choice",
        setting: "guard:region",
        choices: [{ value: "eu", open: true, needs: {} }],
      },
      {
        asks: "value",
        setting: "guard:server",
        needs: { "guard:pool": ["any"] },
      },
    ];
    expect(askedNow(lone, {})).toStrictEqual([lone[0]]);
    expect(carrying(lone, {}, {})).toBeUndefined();
  });
});

describe("the tunnel answer", () => {
  it("is the bare word where the guard asks nothing", () => {
    expect(carrying([], {}, {})).toStrictEqual({ vpn: "carrying" });
  });

  it("is nothing while a question asked is unanswered", () => {
    expect(carrying(questions, {}, {})).toBeUndefined();
    expect(
      carrying(
        questions,
        { "gluetun:provider": "mullvad" },
        { "wireguard-key": "k" },
      ),
    ).toBeUndefined();
    expect(
      carrying(
        questions,
        { "gluetun:provider": "mullvad", "gluetun:addresses": "  " },
        { "wireguard-key": "k" },
      ),
    ).toBeUndefined();
    expect(
      carrying(
        questions,
        {
          "gluetun:provider": "mullvad",
          "gluetun:addresses": "198.51.100.2/32",
        },
        {},
      ),
    ).toBeUndefined();
  });

  it("carries exactly what is asked under the answers, a default choice included, and nothing else", () => {
    expect(
      carrying(
        questions,
        {
          "gluetun:provider": "custom",
          "gluetun:addresses": " 198.51.100.2/32 ",
          "gluetun:endpoint-ip": "192.0.2.1",
        },
        { "wireguard-key": "a key", "openvpn-password": "left over" },
      ),
    ).toStrictEqual({
      vpn: {
        carrying: {
          settings: {
            "gluetun:vpn-type": "wireguard",
            "gluetun:provider": "custom",
            "gluetun:addresses": "198.51.100.2/32",
            "gluetun:endpoint-ip": "192.0.2.1",
          },
          secrets: { "wireguard-key": "a key" },
        },
      },
    });
    expect(
      carrying(
        questions,
        {
          "gluetun:vpn-type": "openvpn",
          "gluetun:provider": "privado",
          "gluetun:addresses": "198.51.100.2/32",
        },
        { "openvpn-password": "a password", "wireguard-key": "left over" },
      ),
    ).toStrictEqual({
      vpn: {
        carrying: {
          settings: {
            "gluetun:vpn-type": "openvpn",
            "gluetun:provider": "privado",
          },
          secrets: { "openvpn-password": "a password" },
        },
      },
    });
  });
});
