/**
 * Where first-run setup stands, as a suite stands it in for a running
 * lemonfiber.
 *
 * Declared as the payload the kind it names carries, so the compiler asks
 * whether each field is one the contract has rather than whoever wrote the
 * reader and the body agreeing with each other.
 */
import type { Wizard } from "../lib/wizard";

/** A machine that is set up: nothing on offer and nothing part-way. */
export const setUp: Wizard = {
  asks: false,
  at: "review",
  guard: [],
  offered: false,
  phase: "applied",
  plan: [],
  proof: null,
  ready_for_review: false,
  rehearsed: false,
  unanswered: [],
  written: [],
};

/** A machine with nothing configured, at the first step. */
export const fresh: Wizard = {
  ...setUp,
  at: "welcome",
  offered: true,
  phase: "in-progress",
  unanswered: [
    "protocols",
    "data-location",
    "library",
    "household",
    "notifications",
    "autostart",
  ],
};

/** Every question answered, and the plan to be written. */
export const reviewing: Wizard = {
  ...fresh,
  at: "review",
  phase: "reviewing",
  ready_for_review: true,
  unanswered: [],
  plan: [
    {
      key: "DATA_ROOT",
      value: "/srv/media",
      secret: false,
      origin: { origin: "operator" },
    },
    {
      key: "INDEXER_KEY",
      value: "set",
      secret: true,
      origin: { origin: "operator" },
    },
  ],
};

/** An apply that stopped part-way, and what it had written. */
export const interrupted: Wizard = {
  ...reviewing,
  phase: "applying",
  written: ["Wrote DATA_ROOT to .env.", "Made the folder /srv/media."],
};

/** The tunnel step, asking the egress guard's type, provider, address and keys. */
export const tunnelling: Wizard = {
  ...fresh,
  at: "vpn",
  asks: true,
  guard: [
    {
      asks: "choice",
      setting: "gluetun:vpn-type",
      default: "wireguard",
      choices: [
        { value: "wireguard", open: true, needs: {} },
        { value: "openvpn", open: true, needs: {} },
      ],
    },
    {
      asks: "choice",
      setting: "gluetun:provider",
      default: "",
      choices: [
        { value: "mullvad", open: true, needs: {} },
        {
          value: "custom",
          open: true,
          needs: { "gluetun:vpn-type": ["wireguard"] },
        },
        {
          value: "privado",
          open: false,
          needs: { "gluetun:vpn-type": ["openvpn"] },
        },
      ],
    },
    {
      asks: "value",
      setting: "gluetun:addresses",
      needs: { "gluetun:vpn-type": ["wireguard"] },
    },
    {
      asks: "value",
      setting: "gluetun:endpoint-ip",
      needs: { "gluetun:provider": ["custom"] },
    },
    {
      asks: "secret",
      secret: "wireguard-key",
      why: "Dial the tunnel to your VPN provider, which knows this machine by the key",
      needs: { "gluetun:vpn-type": ["wireguard"] },
    },
    {
      asks: "secret",
      secret: "openvpn-password",
      why: "Sign in to your VPN provider with your account's password",
      needs: { "gluetun:vpn-type": ["openvpn"] },
    },
  ],
};
