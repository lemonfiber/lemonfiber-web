/**
 * Every credential the stack holds, as a suite stands it in for a running
 * lemonfiber.
 *
 * Declared as the payload the kind it names carries, so the compiler asks
 * whether each field is one the contract has rather than whoever wrote the
 * reader and the body agreeing with each other.
 */
import type { Held, Inventory } from "../lib/credentials";

/** A password the operator supplied, in use by two consumers. */
export const webPassword: Held = {
  name: "qBittorrent web UI password",
  setting: "qbittorrent.password",
  location: "/srv/lemonfiber/secrets/qbittorrent",
  state: "active",
  origin: "operator",
  from: { origin: "bundled" },
  consumers: ["sonarr", "radarr"],
  fingerprint: "3f9a",
};

/** A key a plugin's service made, not proved lately, with an advisory. */
export const staleKey: Held = {
  name: "Komga API key",
  setting: "komga.api_key",
  location: "/srv/lemonfiber/secrets/komga",
  state: "stale",
  origin: "service",
  from: { origin: "plugin", named: "plugin-komga" },
  consumers: [],
  advisory: "It has not been proved in thirty days.",
};

/** Every credential, and what keeping them in files protects against. */
export const inventory: Inventory = {
  rehearsed: false,
  held: [webPassword, staleKey],
  protection: {
    summary: "Each value is kept in a file only you can read.",
    against: ["Other accounts on this machine reading them."],
    not_against: ["Anyone who can act as you, or as root."],
  },
};
