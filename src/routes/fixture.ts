/**
 * One stack, as the server would describe it.
 *
 * A screen is drawn from what it is handed, so a story and a test both hand it
 * this. Written against the generated contract rather than invented, which makes
 * a field that changes shape a compiler error here before it is a blank space on
 * a panel.
 */
import type { Moment, Service, Stack } from "../lib/wire";
import type { Controls, Work } from "../lib/work";

/** Bytes free on a disk with room on it. */
const FREE = 412_000_000_000;

/** Bytes a second a usenet download runs at. */
const SPEED = 12_000_000;

/** The service the reading names first, which is the worst of them. */
export const worstService: Service = {
  id: "prowlarr",
  name: "Prowlarr",
  state: "stopped",
  criticality: "important",
  profile: "core",
  depends_on: [],
  exit: 1,
};

/** Every service the reading names, worst first. */
export const services: readonly Service[] = [
  worstService,
  {
    id: "sonarr",
    name: "Sonarr",
    state: "unhealthy",
    criticality: "core",
    profile: "core",
    depends_on: ["gluetun"],
  },
  {
    id: "radarr",
    name: "Radarr",
    state: "starting",
    criticality: "core",
    profile: "core",
    depends_on: ["gluetun"],
  },
  {
    id: "gluetun",
    name: "Gluetun",
    state: "healthy",
    criticality: "critical",
    profile: "core",
    depends_on: [],
  },
  {
    id: "plex",
    name: "Plex",
    state: "host-managed",
    criticality: "optional",
    profile: "extras",
    depends_on: [],
  },
];

/** What the whole stack amounts to. */
export const stack: Stack = {
  condition: "degraded",
  forms: [],
  services: [...services],
};

/** The worst thing wrong, as the grading names it. */
export const worst = "Prowlarr has stopped and nothing is being found.";

/** One moment of the stack, with every panel filled. */
export const moment: Moment = {
  alerts: [],
  health: {
    affected: [],
    standing: "degraded",
    wanting_attention: 2,
    worst,
  },
  queue: {
    panel: "ready",
    data: [
      { service: "sonarr", depth: 4, stuck: 1 },
      { service: "radarr", depth: 2, stuck: 0 },
    ],
  },
  services: { panel: "ready", data: [...services] },
  storage: {
    panel: "ready",
    data: {
      free: { reading: "known", value: FREE },
      hardlink: "linking",
      exhaustion: null,
    },
  },
  stuck: [
    {
      name: "Some Series S02E04",
      stall: "repeated-import-failure",
      held_for: 5400,
      items: 1,
      blocking: "Permission denied writing into the library folder.",
    },
  ],
  telemetry: "live",
  transfers: {
    panel: "ready",
    data: [
      {
        name: "Some Film (2019)",
        progress: 62,
        protocol: "usenet",
        speed: { reading: "known", value: SPEED },
        eta: { secs: 480, nanos: 0 },
      },
    ],
  },
  vpn: null,
};

/** A panel whose source could not fill it. */
export const unavailable = {
  panel: "unavailable",
  data: { reason: "The download client is not answering." },
} as const;

/** Nothing has been asked of the stack, and nothing is holding anything up. */
export const controls: Controls = {
  work: [],
  waiting: undefined,
  confirming: undefined,
  busy: false,
  onpress: () => undefined,
  onleave: () => undefined,
  ondrop: () => undefined,
  onhush: () => undefined,
};

/** Work the runtime is holding, under the name the reply gave it. */
export const started: Work = {
  id: "1",
  doing: "up",
  at: "under-way",
  job: "9f2c41ab7d0e5c63",
};

/** What a wait says while it is still waiting, in lemonfiber's own words. */
export const stillWaiting =
  "Still starting: sonarr, radarr — 25 seconds so far, of 180.";

/** What lemonfiber says about a request it would not carry out. */
export const wouldNot =
  "The action `restart` needs `forms`, which was not given.";
