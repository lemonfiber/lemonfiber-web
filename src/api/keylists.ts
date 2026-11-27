/**
 * Integration keys, as a suite stands them in for a running lemonfiber.
 *
 * Declared as the payload the kind it names carries, so the compiler asks
 * whether each field is one the contract has rather than whoever wrote the
 * reader and the body agreeing with each other.
 */
import type { Claimed, Listed, Listing, Minted } from "../lib/keys";
import type { Phone, Phones } from "../lib/phones";
import type { Wakeable, Woken } from "../lib/woken";

/** A read key Home Assistant has used. */
export const home: Listed = {
  name: "home",
  scope: "read",
  purpose: "home-assistant",
  state: "active",
  minted: 1_790_000_000,
  used: 1_790_003_600,
  member_minted: false,
};

/** A key a household member minted for themselves, never used. */
export const kits: Listed = {
  name: "kit-phone",
  scope: "member:kit",
  purpose: "other",
  state: "active",
  minted: 1_790_000_100,
  member_minted: true,
};

/** A key revoked. */
export const old: Listed = {
  name: "old-mcp",
  scope: "act",
  purpose: "mcp",
  state: "revoked",
  minted: 1_780_000_000,
  used: null,
  revoked: 1_789_000_000,
  member_minted: false,
};

/** Three keys, and what lemonfiber says of their purposes. */
export const listing: Listing = {
  keys: [home, kits, old],
  purposes: "What each key is for is its minter's word, and nothing checks it.",
  rehearsed: false,
};

/** The read key just minted, with the pin and address a program needs. */
export const made: Minted = {
  name: "home",
  scope: "read",
  purpose: "home-assistant",
  secret: `lfk_${crypto.randomUUID()}`,
  pin: "sha256:ab12",
  address: "192.0.2.10:7777",
};

/** A key minted where the stack is not yet served encrypted on the network. */
export const madeLocal: Minted = {
  name: "local",
  scope: "act",
  purpose: "mcp",
  secret: `lfk_${crypto.randomUUID()}`,
  caution:
    "The stack is not served on the network yet, so this key only works on this machine.",
};

/** A read key minted as a claim, its link carrying a claim made afresh for each run. */
export const claimed: Claimed = {
  name: "home",
  scope: "read",
  purpose: "home-assistant",
  link: `lemonfiber://key?claim=${crypto.randomUUID()}`,
  lapses: 1_790_000_600,
};

/** An Android phone's key, kept in its own chip and used once. */
export const pixel: Phone = {
  name: "pixel",
  app: "app.lemonfiber.companion",
  fingerprint: "ab".repeat(32),
  backing: "strongbox",
  registered: 1_790_000_000,
  used: 1_790_007_200,
};

/** An iPhone's key, never used. */
export const iphone: Phone = {
  name: "iphone",
  app: "app.lemonfiber.companion",
  fingerprint: "cd".repeat(32),
  backing: "enclave",
  registered: 1_790_000_300,
};

/** A phone's key revoked. */
export const tablet: Phone = {
  name: "tablet",
  app: "app.lemonfiber.companion",
  fingerprint: "ef".repeat(32),
  backing: "tee",
  registered: 1_780_000_000,
  used: null,
  revoked: 1_789_000_000,
};

/** Three phones' keys, as read. */
export const phones: Phones = {
  keys: [pixel, iphone, tablet],
  rehearsed: false,
};

/** The phones' keys once the iPhone's is revoked, naming it. */
export const unpaired: Phones = {
  keys: [pixel, { ...iphone, revoked: 1_790_010_000 }, tablet],
  rehearsed: false,
  revoked: "iphone",
};

/** A distributor's address for one phone, its path carrying a token made afresh for each run. */
const wakeAt = (host: string, rest: string): string =>
  ["https:", "", host, `${rest}${crypto.randomUUID()}`].join("/");

/** A phone woken through its distributor, its address carrying a token made afresh for each run. */
export const pixelWoken: Wakeable = {
  name: "pixel",
  endpoint: wakeAt("push.example.test", "wake/"),
  registered: 1_790_000_000,
};

/** A phone woken through another distributor, at a port of its own. */
export const iphoneWoken: Wakeable = {
  name: "iphone",
  endpoint: wakeAt("wake.example.test:8443", "up?token="),
  registered: 1_790_000_300,
};

/** Two phones that can be woken, as read. */
export const woken: Woken = {
  endpoints: [pixelWoken, iphoneWoken],
  rehearsed: false,
};

/** The phones that can be woken once the iPhone is removed, naming it. */
export const unwoken: Woken = {
  endpoints: [pixelWoken],
  rehearsed: false,
  removed: "iphone",
};
