import { describe, expect, it } from "vitest";
import {
  aboutLines,
  changeLines,
  openChoices,
  readerWords,
  secretWords,
  valuedLines,
  valueWords,
  whoseWords,
  type Change,
} from "./values";
import {
  clearingCountries,
  countries,
  domain,
  madeClear,
  madeKey,
  madeSet,
  movingTunnel,
  mtu,
  setOffer,
  tunnelKey,
  values,
  vpnType,
  wouldSet,
} from "../api/values";

describe("whose a setting is", () => {
  it("names lemonfiber's own apart from a plugin's", () => {
    expect(whoseWords(domain.whose)).toBe("lemonfiber's own");
    expect(whoseWords(vpnType.whose)).toBe("Of gluetun");
  });
});

describe("what a setting holds", () => {
  it("says the operator's value where one is recorded", () => {
    expect(valueWords(domain)).toBe("Set to media.example.org");
  });

  it("says the default its readers fall back on, once however many read it", () => {
    expect(valueWords(vpnType)).toBe("Not set, so openvpn, its default");
    const [reader] = vpnType.readers;
    expect(
      valueWords({
        ...vpnType,
        value: null,
        readers: reader === undefined ? [] : [reader, reader],
      }),
    ).toBe("Not set, so openvpn, its default");
  });

  it("names each reader's own default where they differ", () => {
    expect(
      valueWords({
        ...domain,
        value: "",
        readers: [
          {
            service: "caddy",
            variable: "A",
            default: "one",
            met: true,
            needs: {},
          },
          {
            service: "komga",
            variable: "B",
            default: "two",
            met: true,
            needs: {},
          },
        ],
      }),
    ).toBe("Not set, so each service's own default: one, two");
  });

  it("says no default is declared where none is", () => {
    expect(valueWords({ ...countries, value: null })).toBe(
      "Not set, and no default is declared",
    );
  });
});

describe("a service reading a setting", () => {
  it("names the variable, and what it waits for where it is read only under other values", () => {
    const [caddy] = domain.readers;
    const [guard] = mtu.readers;
    expect(caddy === undefined ? "" : readerWords(caddy)).toBe(
      "caddy reads it as DOMAIN",
    );
    expect(guard === undefined ? "" : readerWords(guard)).toBe(
      "gluetun reads it as WIREGUARD_MTU once gluetun:vpn-type is one of wireguard",
    );
  });
});

describe("what a setting is besides its value", () => {
  it("names where it was filed from, the values it accepts now, and who reads it", () => {
    expect(openChoices(vpnType)).toStrictEqual(["wireguard", "openvpn"]);
    expect(aboutLines(vpnType)).toStrictEqual([
      "One of wireguard, openvpn",
      "gluetun reads it as VPN_TYPE",
    ]);
    expect(aboutLines(domain)).toStrictEqual([
      "Filed from LEMONFIBER_DOMAIN in the environment file",
      "caddy reads it as DOMAIN",
      "jellyfin reads it as PUBLISHED_URL",
    ]);
  });

  it("names the values that are no choice while the settings they depend on stand", () => {
    expect(openChoices(mtu)).toStrictEqual([]);
    expect(aboutLines(mtu)).toStrictEqual([
      "Not a choice while the settings it depends on stand as they do: 1280, 1320",
      "gluetun reads it as WIREGUARD_MTU once gluetun:vpn-type is one of wireguard",
    ]);
    expect(openChoices(countries)).toStrictEqual([]);
  });
});

describe("a secret", () => {
  it("says whether it is held and where its value came from, never the value", () => {
    expect(secretWords(tunnelKey)).toBe("Not held");
    expect(secretWords(madeKey)).toBe("Held, from lemonfiber, made for it");
    expect(secretWords({ ...madeKey, from: "operator" })).toBe(
      "Held, from you",
    );
    expect(secretWords({ ...madeKey, from: "recipe" })).toBe(
      "Held, from a recipe",
    );
    expect(secretWords({ ...madeKey, from: "granted" })).toBe(
      "Held, from a credential granted to it",
    );
    expect(secretWords({ ...madeKey, from: null })).toBe("Held, from you");
  });
});

describe("what a change would do", () => {
  it("names each move and its cost, what it rewrites and restarts, and what stays held back", () => {
    expect(changeLines(movingTunnel)).toStrictEqual([
      "gluetun:vpn-type becomes wireguard.",
      "qbittorrent loses its peers while gluetun reconnects through WireGuard.",
      "Rewrites the entry of gluetun.",
      "Restarts gluetun, qbittorrent.",
      "Held back until you give what they need to start",
      "gluetun waits for the secret gluetun:wireguard-key",
    ]);
  });

  it("names a value moved from another, a value given up, and what it starts", () => {
    const moving: Change = {
      ...movingTunnel,
      settings: [
        { setting: "gluetun:vpn-type", was: "openvpn", value: "wireguard" },
        { setting: "gluetun:countries", was: "Belgium" },
        { setting: "gluetun:mtu", value: null, consequence: "" },
      ],
      regenerates: [],
      restarts: [],
      starts: ["qbittorrent"],
      waiting: [],
    };
    expect(changeLines(moving)).toStrictEqual([
      "gluetun:vpn-type goes from openvpn to wireguard.",
      "gluetun:countries gives up Belgium, and its default is written again.",
      "gluetun:mtu is cleared, and its default is written again.",
      "Restarts nothing.",
      "Starts qbittorrent, which waited for it.",
    ]);
  });
});

describe("what a record of the settings panel's asking says", () => {
  it("counts a plain reading", () => {
    expect(valuedLines(values)).toStrictEqual(["4 settings read."]);
  });

  it("says a reading wrote nothing and names itself", () => {
    expect(valuedLines(wouldSet)).toStrictEqual([
      "This was a rehearsal, so nothing was changed.",
      `This reading is named ${setOffer}.`,
    ]);
  });

  it("says a change was made, what moved, restarted and still waits", () => {
    expect(valuedLines(madeSet)).toStrictEqual([
      "The change was made.",
      "gluetun:vpn-type becomes wireguard.",
      "Restarts gluetun, qbittorrent.",
      "Held back until you give what they need to start",
      "gluetun waits for the secret gluetun:wireguard-key",
    ]);
  });

  it("says why nothing restarted, and what a change started", () => {
    expect(valuedLines(madeClear)).toStrictEqual([
      "The change was made.",
      "gluetun:countries gives up Netherlands,Belgium, and its default is written again.",
      "Its services did not restart: the stack is stopped",
    ]);
    expect(
      valuedLines({
        ...madeClear,
        change: { ...clearingCountries, applied: true, starts: ["gluetun"] },
      }),
    ).toStrictEqual([
      "The change was made.",
      "gluetun:countries gives up Netherlands,Belgium, and its default is written again.",
      "Starts gluetun, which waited for it.",
    ]);
  });

  it("says a change that ran was not made, without claiming what it would restart or start", () => {
    expect(
      valuedLines({
        ...madeSet,
        change: { ...movingTunnel, starts: ["qbittorrent"], waiting: [] },
      }),
    ).toStrictEqual([
      "The change was not made.",
      "gluetun:vpn-type becomes wireguard.",
    ]);
  });
});
