/**
 * Integration keys, as a suite stands them in for a running lemonfiber.
 *
 * Declared as the payload the kind it names carries, so the compiler asks
 * whether each field is one the contract has rather than whoever wrote the
 * reader and the body agreeing with each other.
 */
import type { Listed, Listing, Minted } from "../lib/keys";

/** A read key Home Assistant has used. */
export const home: Listed = {
  name: "home",
  scope: "read",
  purpose: "home-assistant",
  state: "active",
  minted: "1790000000",
  used: "1790003600",
  member_minted: false,
};

/** A key a household member minted for themselves, never used. */
export const kits: Listed = {
  name: "kit-phone",
  scope: "member:kit",
  purpose: "other",
  state: "active",
  minted: "1790000100",
  member_minted: true,
};

/** A key revoked. */
export const old: Listed = {
  name: "old-mcp",
  scope: "act",
  purpose: "mcp",
  state: "revoked",
  minted: "1780000000",
  used: null,
  revoked: "1789000000",
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
  secret: "lfk_shown_once",
  pin: "sha256:ab12",
  address: "192.0.2.10:7777",
};

/** A key minted where the stack is not yet served encrypted on the network. */
export const madeLocal: Minted = {
  name: "local",
  scope: "act",
  purpose: "mcp",
  secret: "lfk_local",
  caution:
    "The stack is not served on the network yet, so this key only works on this machine.",
};
