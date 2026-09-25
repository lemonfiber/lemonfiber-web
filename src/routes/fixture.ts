/**
 * One stack, as the server would describe it.
 *
 * A screen is drawn from what it is handed, so a story and a test both hand it
 * this. Written against the generated contract rather than invented, which makes
 * a field that changes shape a compiler error here before it is a blank space on
 * a panel.
 */
import { frontDoor, house } from "./house";
import type {
  Alert,
  Form,
  Forms,
  Logged,
  Moment,
  Preview,
  Service,
  Stack,
  Tunnel,
  Word,
} from "../lib/wire";
import type { Controls, Work } from "../lib/work";

/** Bytes free on a disk with room on it. */
const FREE = 412_000_000_000;

/** Bytes a second a usenet download runs at. */
const SPEED = 12_000_000;

/** The port the provider forwards to the download client. */
const FORWARDED = 51_413;

/** The tunnel, carrying the downloading it is there to carry. */
export const tunnel: Tunnel = {
  country: "Iceland",
  egress_matches: true,
  exit_ip: "198.51.100.42",
  forwarded_port: FORWARDED,
};

/** The tunnel up, and the downloading going out past it. */
export const leaking: Tunnel = { ...tunnel, egress_matches: false };

/** The service the reading names first, which is the worst of them. */
export const worstService: Service = {
  id: "prowlarr",
  name: "Prowlarr",
  describes:
    "Holds your indexer accounts in one place and shares them with everything else",
  state: "stopped",
  criticality: "important",
  profile: "core",
  forms: ["core"],
  depends_on: [],
  exit: 1,
};

/** Every service the reading names, worst first. */
export const services: readonly Service[] = [
  worstService,
  {
    id: "sonarr",
    name: "Sonarr",
    describes: "Watches for new episodes and fetches them",
    state: "unhealthy",
    criticality: "core",
    profile: "core",
    forms: ["core", "media"],
    depends_on: ["gluetun"],
  },
  {
    id: "radarr",
    name: "Radarr",
    describes: "Watches for films and fetches them",
    state: "starting",
    criticality: "core",
    profile: "core",
    forms: ["core", "media"],
    depends_on: ["gluetun"],
  },
  {
    id: "gluetun",
    name: "Gluetun",
    describes:
      "Routes torrent traffic through your VPN and blocks it if the VPN drops",
    state: "healthy",
    criticality: "critical",
    profile: "core",
    forms: ["core"],
    depends_on: [],
  },
  {
    id: "plex",
    name: "Plex",
    describes: "Plays your library back, in the house and away from it",
    state: "host-managed",
    criticality: "optional",
    profile: "extras",
    // Nothing that holds it is running, which is not the same as a form
    // missing it.
    forms: [],
    depends_on: [],
  },
];

/** What the whole stack amounts to. */
export const stack: Stack = {
  condition: "degraded",
  active_forms: ["core", "media"],
  forms: [],
  services: [...services],
  // The stack is set up for torrents alone, so what downloads over usenet is
  // left out of both forms that asked for it.
  filtered: [
    {
      id: "sabnzbd",
      name: "SABnzbd",
      needs: "usenet",
      profile: "usenet",
      forms: ["core", "media"],
    },
  ],
  undeclared: [],
  // A service that starts, stops and reports its state like any other, and
  // that lemonfiber can do none of the work needing to know what it is for.
  unsupported: [
    {
      what: "bazarr",
      because:
        "Its declaration leaves out the part that says where to reach it.",
    },
  ],
  // What each verb takes the stack away for, which a screen says before it asks
  // anybody to confirm one. The teardown that waits for downloads is the one with
  // nothing to bound it: what it waits for belongs to whoever is seeding.
  disturbs: {
    starting: { bound: "bounded", seconds: 180 },
    stopping: { bound: "bounded", seconds: 10 },
    stopping_after_downloads: { bound: "open-ended", until: "downloads" },
    restarting: { bound: "bounded", seconds: 180 },
    switching: { bound: "bounded", seconds: 180 },
  },
};

/** The worst thing wrong, as the grading names it. */
export const worst = "Prowlarr has stopped and nothing is being found.";

/**
 * An interruption that is running, grouped across the checks it speaks for.
 *
 * One event over two checks rather than two alerts, which is the difference
 * between a screen an operator reads and one they learn to scroll past.
 */
export const raised: Alert = {
  check: "vpn.egress-match",
  kind: "vpn-egress",
  moment: "onset",
  severity: "critical",
  summary: "Downloading left this machine outside the tunnel.",
  meaning:
    "Traffic that should have been inside the tunnel was not, for as long as this lasted.",
  remedies: ["Stop the download client, then start the tunnel again."],
  affected: ["vpn.egress-match", "vpn.killswitch"],
};

/** A condition that is over, kept rather than dropped once it cleared. */
export const cleared: Alert = {
  check: "storage.headroom",
  kind: "disk-headroom",
  moment: "resolved",
  severity: "warning",
  summary: "There is room on the data volume again.",
  meaning: "Nothing is at risk of failing to write while this holds.",
  remedies: [],
  affected: ["storage.headroom"],
};

/** One moment of the stack, with every panel filled. */
export const moment: Moment = {
  alerts: [raised, cleared],
  door: { panel: "ready", data: frontDoor },
  health: {
    // Two root causes, counted once each. The nine imports the first of them
    // stopped are under it rather than beside it, which is what keeps the list
    // agreeing with the figure above it.
    affected: [
      {
        check: "services.health",
        severity: "error",
        summary: "Prowlarr is not answering its health check.",
        meaning:
          "Nothing new is being found, and anything waiting on a search stays where it is.",
        remedies: [
          "Read what it said for itself, then start it again.",
          "Check that nothing else holds the port it binds to.",
        ],
        downstream: ["queue.depth", "providers.reachable"],
      },
      {
        check: "storage.headroom",
        severity: "warning",
        summary: "Less than a tenth of the data volume is free.",
        meaning:
          "A download large enough to fill the rest will fail partway and leave what it wrote.",
        remedies: [],
        downstream: [],
      },
    ],
    standing: "degraded",
    wanting_attention: 2,
    worst,
  },
  household: { panel: "ready", data: house },
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
  vpn: { panel: "ready", data: tunnel },
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

/**
 * What starting that form would come to. The stack is set up for torrents alone,
 * so what downloads over usenet would be left out, and one of the programs that
 * would start declares no estimate of the memory it needs.
 */
export const rehearsed: Preview = {
  forms: [chosenForm],
  profiles: ["media"],
  services: ["sonarr", "radarr", "jellyfin"],
  dropped: [{ profile: "usenet", needs: "usenet" }],
  filtered: [
    {
      id: "sabnzbd",
      name: "SABnzbd",
      needs: "usenet",
      profile: "usenet",
      forms: [chosenForm],
    },
  ],
  footprint: { estimated_mib: 1536, unestimated: ["jellyfin"] },
};

/** Nothing has been asked of the stack, and nothing is holding anything up. */
export const controls: Controls = {
  forms: { ok: true, value: forms },
  chosen: [],
  preview: undefined,
  previewed: { kind: "never" },
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

/**
 * One word explained, in the words the binary answered with.
 *
 * Copied out of its answer rather than written here. Nothing reads this as what
 * the product says a word means; it stands for whatever came back, and what a
 * screen draws is the answer it was handed.
 */
export const explained: Word = {
  word: "hardlink",
  short:
    "Lets one file appear in two places while taking up the space once — so importing is instant and costs no extra disk.",
  deep: "Both names point at the same data. Deleting one leaves the other working. This is why the download folder and the library should sit on one volume: across two, the file has to be copied instead, which takes time and twice the room.",
  also_called: [],
  forms: ["hardlinked"],
};
