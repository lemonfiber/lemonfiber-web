/**
 * Every setting and secret the services read, as a suite stands them in for a
 * running lemonfiber, and what moving or clearing settings would come to.
 *
 * Declared as the payload the kind it names carries, so the compiler asks
 * whether each field is one the contract has rather than whoever wrote the
 * reader and the body agreeing with each other.
 */
import type { Change, SecretRead, ValueRead, Values } from "../lib/values";

/** The core's domain, set by the operator and read by two services. */
export const domain: ValueRead = {
  name: "LEMONFIBER_DOMAIN",
  whose: { of: "core" },
  value: "media.example.org",
  environment: "LEMONFIBER_DOMAIN",
  readers: [
    { service: "caddy", variable: "DOMAIN", met: true, needs: {} },
    { service: "jellyfin", variable: "PUBLISHED_URL", met: true, needs: {} },
  ],
};

/** The guard's tunnel, still at its default, chosen from two values. */
export const vpnType: ValueRead = {
  name: "gluetun:vpn-type",
  whose: { of: "namespace", namespace: "gluetun" },
  readers: [
    {
      service: "gluetun",
      variable: "VPN_TYPE",
      default: "openvpn",
      met: true,
      needs: {},
    },
  ],
  choices: [
    { value: "wireguard", open: true, needs: {} },
    { value: "openvpn", open: true, needs: {} },
  ],
};

/** The countries the guard may exit from, set by the operator. */
export const countries: ValueRead = {
  name: "gluetun:countries",
  whose: { of: "namespace", namespace: "gluetun" },
  value: "Netherlands,Belgium",
  readers: [
    { service: "gluetun", variable: "SERVER_COUNTRIES", met: true, needs: {} },
  ],
};

/** A setting read only under a tunnel the operator has not chosen. */
export const mtu: ValueRead = {
  name: "gluetun:wireguard-mtu",
  whose: { of: "namespace", namespace: "gluetun" },
  readers: [
    {
      service: "gluetun",
      variable: "WIREGUARD_MTU",
      default: "1320",
      met: false,
      needs: { "gluetun:vpn-type": ["wireguard"] },
    },
  ],
  choices: [
    {
      value: "1280",
      open: false,
      needs: { "gluetun:vpn-type": ["wireguard"] },
    },
    {
      value: "1320",
      open: false,
      needs: { "gluetun:vpn-type": ["wireguard"] },
    },
  ],
};

/** The guard's tunnel key, not yet entered. */
export const tunnelKey: SecretRead = {
  name: "gluetun:wireguard-key",
  whose: { of: "namespace", namespace: "gluetun" },
  held: false,
  readers: [
    {
      service: "gluetun",
      variable: "WIREGUARD_PRIVATE_KEY",
      met: false,
      needs: { "gluetun:vpn-type": ["wireguard"] },
    },
  ],
};

/** A key lemonfiber made for a plugin's service. */
export const madeKey: SecretRead = {
  name: "komga:api-key",
  whose: { of: "namespace", namespace: "komga" },
  held: true,
  from: "minted",
  readers: [{ service: "komga", variable: "API_KEY", met: true, needs: {} }],
};

/** The guard, held back until its tunnel and key are given. */
const guardWaits: Values["waiting"] = [
  {
    service: "gluetun",
    wants: [
      {
        kind: "setting",
        setting: "gluetun:vpn-type",
        choices: ["wireguard", "openvpn"],
      },
      { kind: "secret", secret: "gluetun:wireguard-key" },
    ],
  },
];

/** Every setting and secret, as read. */
export const values: Values = {
  rehearsed: false,
  settings: [domain, vpnType, countries, mtu],
  secrets: [tunnelKey, madeKey],
  waiting: guardWaits,
};

/** The name the reading of moving the tunnel gave itself. */
export const setOffer = "settings-set:9c1e";

/** What moving the guard's tunnel to WireGuard would come to. */
export const movingTunnel: Change = {
  agreement: setOffer,
  applied: false,
  settings: [
    {
      setting: "gluetun:vpn-type",
      value: "wireguard",
      consequence:
        "qbittorrent loses its peers while gluetun reconnects through WireGuard.",
    },
  ],
  regenerates: ["gluetun"],
  restarts: ["gluetun", "qbittorrent"],
  starts: [],
  waiting: [
    {
      service: "gluetun",
      wants: [{ kind: "secret", secret: "gluetun:wireguard-key" }],
    },
  ],
};

/** That change read, with nothing written, under the operator's overlay. */
export const wouldSet: Values = {
  ...values,
  rehearsed: true,
  change: movingTunnel,
  unvetted: { overlay: "/etc/lemonfiber/overlay.yml", services: ["gluetun"] },
};

/** That change made under its reading. */
export const madeSet: Values = {
  ...values,
  settings: [domain, { ...vpnType, value: "wireguard" }, countries, mtu],
  change: { ...movingTunnel, applied: true },
};

/** The name the reading of clearing the countries gave itself. */
export const clearOffer = "settings-clear:51d0";

/** What taking the operator's countries away would come to. */
export const clearingCountries: Change = {
  agreement: clearOffer,
  applied: false,
  settings: [{ setting: "gluetun:countries", was: "Netherlands,Belgium" }],
  regenerates: ["gluetun"],
  restarts: [],
  starts: [],
  waiting: [],
};

/** That clearing read, with nothing written. */
export const wouldClear: Values = {
  ...values,
  rehearsed: true,
  change: clearingCountries,
};

/** That clearing made, with the stack stopped so nothing restarted. */
export const madeClear: Values = {
  ...values,
  settings: [domain, vpnType, { ...countries, value: null }, mtu],
  change: {
    ...clearingCountries,
    applied: true,
    unrestarted: "the stack is stopped",
  },
};
