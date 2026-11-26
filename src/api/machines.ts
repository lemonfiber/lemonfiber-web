/**
 * How this machine stands, as the stack answers each read: how the console is
 * served, how the stack runs without lemonfiber, and what setup settled.
 */
import type { Certificate, Served, Settled, Stack } from "../lib/machine";

/** The certificate a console served on the household's own name is under. */
export const certificate: Certificate = {
  fingerprint:
    "5E:2A:91:0C:77:B3:4D:E8:1F:6A:C2:09:3B:D5:8E:40:A7:16:F3:2C:9D:61:B8:05:EE:73:4A:1C:90:D2:6B:3F",
  issuer: "lemonfiber on media-box",
  issuer_cut: false,
  names: ["media-box.local", "198.51.100.20"],
  names_more: 0,
  self_signed: true,
  subject: "lemonfiber on media-box",
  subject_cut: false,
  valid_from: 1_767_225_600,
  valid_until: 1_798_761_600,
};

/** A console served encrypted to the network, under its own name. */
export const servedEncrypted: Served = {
  certificate,
  encrypted: true,
  named: "media-box.local",
  network: true,
  port: 8443,
};

/** A console served without encryption to the network: anyone on the path can read it. */
export const servedPlain: Served = {
  encrypted: false,
  network: true,
  port: 8080,
  unrecorded: "the stack folder could not be written to",
};

/** A console served without encryption to this machine alone. */
export const servedHere: Served = {
  encrypted: false,
  network: false,
  port: 8080,
};

/** The stack lemonfiber ships, with one part its words alone do not bring up. */
export const shipped: Stack = {
  env: "/srv/lemonfiber/.env",
  exceptions: [
    {
      part: "the tunnel",
      because: "it starts once lemonfiber has written its keys",
    },
  ],
  non_interactive: { form: "lemonfiber --yes <action>" },
  plain_up: [
    "docker",
    "compose",
    "--project-directory",
    "/srv/lemonfiber",
    "--env-file",
    "/srv/lemonfiber/.env",
    "up",
    "-d",
  ],
  project: "/srv/lemonfiber",
  source: "bundled",
};

/** The operator's own stack, kept in a folder whose name has a space in it. */
export const ownStack: Stack = {
  ...shipped,
  exceptions: [],
  plain_up: ["docker", "compose", "--project-directory", "/srv/my stack", "up"],
  project: "/srv/my stack",
  source: { own: "/srv/my stack" },
};

/** A stack set up for both ways of downloading, as the operator chose. */
export const settledDone: Settled = {
  data_root: "/srv/media",
  protocols: { torrent: true, usenet: true },
  service_user: { from: "set", gid: 1000, uid: 1000 },
  setup: "done",
};
