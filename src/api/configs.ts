/**
 * What the settings are answered with, as a suite stands them in for a
 * running lemonfiber.
 *
 * Declared as the payload the kind it names carries, so the compiler asks
 * whether each field is one the contract has rather than whoever wrote the
 * reader and the body agreeing with each other.
 */
import type { Configured } from "../lib/configured";

/**
 * What setup decided, as every answer of this kind lists it: a decision the
 * configuration holds, a credential held and never shown, and one the settings
 * store keeps that nothing holds yet.
 */
const decided: Configured["decisions"] = [
  {
    affects: "where every download and every library file lives",
    cost: "consequential",
    credential: false,
    held: true,
    key: "DATA_ROOT",
  },
  {
    affects: "the password the account is reached with",
    cost: "cheap",
    credential: true,
    held: true,
    key: "USENET_PASS",
  },
  {
    affects: "the language and region the house says it has",
    cost: "cheap",
    credential: false,
    held: false,
    key: "LEMONFIBER_LOCALE",
    setting: "LEMONFIBER_LOCALE",
  },
];

/** Every setting, as a listing answers with them. */
export const everySetting: Configured = {
  changed: false,
  decisions: decided,
  rehearsed: false,
  settings: [
    {
      key: "data_location",
      origin: { origin: "operator" },
      secret: false,
      value: "/srv/media",
    },
    {
      key: "usenet_password",
      origin: { origin: "operator" },
      secret: true,
      value: "set, and withheld",
    },
    {
      key: "port_forwarding",
      origin: { origin: "bundled" },
      secret: false,
      value: "on",
    },
  ],
};

/** A consequential change, staged for a yes, and everything it costs. */
export const staged: Configured = {
  changed: true,
  consequence: "Moving the library takes as long as copying it.",
  decisions: decided,
  rehearsed: false,
  review: {
    change: {
      cost: "consequential",
      from: "/srv/media",
      key: "data_location",
      to: "/mnt/media",
    },
    findings: {
      active: [{ name: "Big.Film.2160p", progress: 42, protocol: "torrent" }],
      edited: null,
      keeps: [],
      library: [
        {
          because: "The new location holds the same folders.",
          carried: true,
          host: "/mnt/media/tv",
          path: "/tv",
          service: "sonarr",
        },
      ],
      opens: [],
      stops: [],
    },
    stance: "pending",
  },
  settings: [],
};

/** The same change, made. */
export const applied: Configured = {
  ...staged,
  review: {
    change: {
      cost: "consequential",
      from: "/srv/media",
      key: "data_location",
      to: "/mnt/media",
    },
    stance: "applied",
  },
};

/** A cheap change, made at once. */
export const madeAtOnce: Configured = {
  changed: true,
  decisions: decided,
  rehearsed: false,
  review: {
    change: {
      cost: "cheap",
      from: "on",
      key: "port_forwarding",
      to: "off",
    },
    stance: "applied",
  },
  settings: [],
};
