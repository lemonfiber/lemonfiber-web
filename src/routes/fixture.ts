/**
 * One stack, as the server would describe it.
 *
 * A screen is drawn from what it is handed, so a story and a test both hand it
 * this. Written against the generated contract rather than invented, which makes
 * a field that changes shape a compiler error here before it is a blank space on
 * a panel.
 */
import type {
  Diagnosis,
  Form,
  Forms,
  Household,
  Logged,
  Moment,
  Service,
  Stack,
  Verdict,
} from "../lib/wire";
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

/** The forms this stack declares, in the order the manifest declares them. */
export const declared: readonly Form[] = [
  {
    id: "core",
    name: "Core",
    description: "The tunnel, the download programs, and what finds things.",
    composable: false,
  },
  {
    id: "media",
    name: "Media",
    description: "Your library, and what serves it to the household.",
    composable: true,
  },
  {
    id: "extras",
    name: "Extras",
    description: "Requests from the household, and the pages that answer them.",
    composable: true,
  },
];

/** Every form the stack declares, as the listing answers. */
export const forms: Forms = { forms: [...declared] };

/** The form a story takes up, by the id the listing gave it. */
export const chosenForm = "media";

/** Nothing has been asked of the stack, and nothing is holding anything up. */
export const controls: Controls = {
  forms: { ok: true, value: forms },
  chosen: [],
  work: [],
  waiting: undefined,
  confirming: undefined,
  busy: false,
  onchoose: () => undefined,
  onpress: () => undefined,
  onleave: () => undefined,
  ondrop: () => undefined,
  onhush: () => undefined,
};

/** The name lemonfiber gave work it took on. */
export const job = "9f2c41ab7d0e5c63";

/** Work the runtime is holding, under the name the reply gave it. */
export const started: Work = {
  id: "1",
  doing: "up",
  scoped: false,
  at: "under-way",
  job,
};

/** Work whose name was redeemed, and which had finished. */
export const finished: Work = {
  id: "2",
  doing: "up",
  scoped: false,
  at: "done",
  job,
};

/** What lemonfiber said about work that ran and stopped. */
export const wentWrong =
  "The container engine refused to start gluetun: no such device /dev/net/tun.";

/** Work whose name was redeemed, and which had stopped. */
export const stopped: Work = {
  id: "3",
  doing: "up",
  scoped: false,
  at: "stopped",
  said: wentWrong,
};

/** Work under a name this run no longer knows. */
export const forgotten: Work = {
  id: "4",
  doing: "restart",
  scoped: true,
  at: "forgotten",
  job,
};

/** What lemonfiber said when it could not be asked at all. */
export const notAnswering =
  "lemonfiber is not answering. It may have been stopped.";

/** Work this page has lost the thread of. */
export const adrift: Work = {
  id: "5",
  doing: "pull",
  scoped: true,
  at: "adrift",
  job,
  said: notAnswering,
};

/** What a wait says while it is still waiting, in lemonfiber's own words. */
export const stillWaiting =
  "Still starting: sonarr, radarr — 25 seconds so far, of 180.";

/** What lemonfiber says about a request it would not carry out. */
export const wouldNot =
  "The action `restart` needs `forms`, which was not given.";

/**
 * The problem a warning or a failure carries.
 *
 * The wire carries a problem's fields beside the outcome rather than under a
 * name of their own, and the contract now declares them, so this is taken from
 * the generated verdict rather than restated beside it. A hand-written copy of a
 * generated shape is a second declaration of one thing, and it was written when
 * the contract described the outcome and nothing else.
 */
type Trouble = Omit<Extract<Verdict, { outcome: "warn" }>, "outcome">;

/**
 * A warning, as the endpoint renders one.
 *
 * The fields go beside the outcome rather than under a name of their own, which
 * is how the wire carries them and is now what the generated type declares.
 *
 * A warning and a failure are separate arms of that type, so each is built under
 * its own literal. One function taking the outcome as an argument would hold a
 * value belonging to neither arm.
 */
const warned = (problem: Trouble): Verdict => ({ outcome: "warn", ...problem });

/** A failure, as the endpoint renders one. */
const failed = (problem: Trouble): Verdict => ({ outcome: "fail", ...problem });

/** The disk filling up, as a check reports it. */
const filling: Trouble = {
  code: "storage.headroom",
  severity: "warning",
  state: "actionable",
  summary: "Less than a tenth of the data volume is free.",
  meaning:
    "Imports will start failing before downloads do, and a failed import leaves the download where it is.",
  remedies: [
    {
      action: "Delete what has already been watched, or add a larger volume.",
      detail: "The library folder is the one that grows.",
    },
    { action: "Pause the queue until there is room.", detail: null },
  ],
};

/** A service that is up and failing its own health check. */
const unanswered: Trouble = {
  code: "services.health",
  severity: "error",
  state: "guided",
  summary: "Prowlarr has not answered its health check for three minutes.",
  meaning:
    "Nothing can be searched for while it is down, so nothing new will arrive.",
  remedies: [
    {
      action: "Read what it said for itself, below, and restart it.",
      detail: "Restarting it alone will not free the port it cannot bind to.",
    },
  ],
};

/** One run of the checks, with every kind of verdict in it. */
export const diagnosis: Diagnosis = {
  overall: "broken",
  findings: [
    {
      check: "environment.docker",
      category: "environment",
      title: "Docker is installed and its daemon is answering",
      verdict: {
        outcome: "pass",
        note: "Docker Engine 27.3.1 on this machine",
      },
    },
    {
      check: "storage.headroom",
      category: "storage",
      title: "There is room on the data volume to keep importing",
      verdict: warned(filling),
    },
    {
      check: "services.health",
      category: "services",
      title: "Every service is answering its own health check",
      service: "prowlarr",
      caused_by: "network.tunnel",
      said: "FATAL could not bind to the tunnel: address in use\nretrying in 30s",
      verdict: failed(unanswered),
    },
    {
      check: "vpn.egress-match",
      category: "vpn",
      title: "Torrent traffic leaves through the tunnel",
      verdict: {
        outcome: "unverified",
        reason:
          "The download client would not say which address it went out from.",
        remedy: {
          action: "Start the download client and run the checks again.",
          detail: "This one is the reason the tunnel cannot be proved.",
        },
      },
    },
    {
      check: "providers.quota",
      category: "providers",
      title: "The Usenet provider still has quota left",
      verdict: {
        outcome: "skipped",
        reason: "No Usenet provider is set up, so there is no quota to read.",
      },
    },
  ],
};

/** A run in which everything that ran passed. */
export const allWell: Diagnosis = {
  overall: "healthy",
  findings: [
    {
      check: "environment.docker",
      category: "environment",
      title: "Docker is installed and its daemon is answering",
      verdict: { outcome: "pass", note: null },
    },
  ],
};

/** The checks about the disk, on their own. */
export const diskChecks: Diagnosis = {
  overall: "degraded",
  findings: [
    {
      check: "storage.one-filesystem",
      category: "storage",
      title: "Downloads and the library are on one filesystem",
      verdict: {
        outcome: "pass",
        note: "so an import links rather than copying",
      },
    },
    {
      check: "storage.headroom",
      category: "storage",
      title: "There is room on the data volume to keep importing",
      verdict: warned(filling),
    },
  ],
};

/**
 * What the services said lately.
 *
 * One name is twenty-one characters, which is what makes the width decide where
 * the name goes; one line is a path with nothing in it to break on.
 */
export const scrollback: readonly Logged[] = [
  {
    service: "sonarr",
    stream: "stdout",
    at: "2026-08-25T09:41:02.113Z",
    line: "INFO grabbed The.Expanse.S06E01.2160p.WEB-DL",
  },
  {
    service: "calibre-web-automated",
    stream: "stdout",
    at: "2026-08-25T09:41:04.887Z",
    line: "INFO shelved The Long Way to a Small Angry Planet",
  },
  {
    service: "qbittorrent",
    stream: "stderr",
    at: null,
    line: "saved /downloads/complete/Some.Release.2160p.WEB-DL.DDP5.1.H.265-GROUP/some.release.2160p.mkv",
  },
  {
    service: "sonarr",
    stream: "stderr",
    at: "2026-08-25T09:41:09.004Z",
    line: "WARN import failed: permission denied writing into the library folder",
  },
];

/** What the household has asked for. */
export const household: Household = {
  available: true,
  findings: [],
  members: [
    {
      name: "Ada",
      requests: [
        { title: "The Expanse", media: "series", state: "partly-here" },
        { title: "Arrival", media: "film", state: "here" },
        { title: "Andor", media: "series", state: "getting" },
      ],
    },
    {
      name: "Kit",
      requests: [
        { title: null, media: "film", state: "waiting-for-approval" },
        { title: "Some Film Nobody Filed", media: "film", state: "failed" },
        { title: "An Older Thing", media: null, state: null },
        { title: null, media: null, state: "declined" },
      ],
    },
  ],
};

/** A household nothing could be read from, which is not an empty one. */
export const unread: Household = {
  available: false,
  findings: [
    "The request service answered, but its list of requests could not be read.",
  ],
  members: [],
};
