/**
 * What handing somebody a device is answered with, as a suite stands them in
 * for a running lemonfiber.
 *
 * Declared as the payload the kind it names carries, so the compiler asks
 * whether each field is one the contract has rather than whoever wrote the
 * reader and the body agreeing with each other.
 */
import type { Handoff, HandoffClient, HandoffSession } from "../lib/handoff";

/** The address the media server is reached at on the home network. */
export const servedAt = ["http:", "", "media.lan:8096"].join("/");

/** An open-source app that opens at the server from a link. */
export const onAndroid: HandoffClient = {
  client: "Jellyfin",
  code: "jellyfin://media.lan:8096",
  deep_link: true,
  device: "Android phone",
  open_source: true,
};

/** An app that is not open source, pointed at the server by its address. */
export const onIphone: HandoffClient = {
  client: "Infuse",
  code: servedAt,
  deep_link: false,
  device: "iPhone",
  open_source: false,
};

/** A device signed in, and when lemonfiber last saw it. */
export const seenAndroid: HandoffSession = {
  client: "Jellyfin",
  device: "Android phone",
  last_seen: "2026-10-08T09:41:00Z",
};

/** A device signed in that lemonfiber has not seen since. */
export const unseenIphone: HandoffSession = {
  client: "Infuse",
  device: "iPhone",
  last_seen: null,
};

/** A code ready for Sam, with an app for each kind of device. */
export const readyForSam: Handoff = {
  address: servedAt,
  caution: "Anyone on the home network who holds the code can find the server.",
  clients: [onAndroid, onIphone],
  issued: "2026-10-08T09:30:00Z",
  name: "Sam",
  quick_connect: true,
  reason: null,
  rehearsed: false,
  remedy: "ask-again",
  sessions: [],
  state: "ready",
  steps: [
    "Install the app on the device.",
    "Scan the code, or type the address.",
    "Sign in as Sam.",
  ],
};

/** Sam's phone signed in, seen once and once not. */
export const connectedSam: Handoff = {
  ...readyForSam,
  remedy: null,
  sessions: [seenAndroid, unseenIphone],
  state: "connected",
};

/** Kit has no account yet, so there is nothing to sign in to. */
export const unprovisionedKit: Handoff = {
  address: null,
  caution: null,
  clients: [],
  issued: null,
  name: "Kit",
  quick_connect: false,
  reason: "Kit has no account on the media server.",
  rehearsed: false,
  remedy: "invite",
  sessions: [],
  state: "unprovisioned",
  steps: [],
};
