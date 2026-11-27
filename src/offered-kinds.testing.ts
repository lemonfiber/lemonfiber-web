/**
 * Every kind of answer the client carries, each placed in one of three lists:
 * read here, offered elsewhere by rule, or not read yet.
 */
import type { Kind } from "@lemonfiber/sdk-ts";
import { named, type Feature } from "./offered.testing";

/** Kinds something the page imports reads. */
export const OFFERED_KINDS: readonly Kind[] = [
  "admission",
  "adoption",
  "alert",
  "alerts",
  "archives",
  "askable",
  "askable-kinds",
  "asked",
  "backup",
  "bandwidth",
  "beside",
  "boot",
  "bundle",
  "clients",
  "capabilities",
  "catalogue",
  "config",
  "copying",
  "credentials",
  "dashboard",
  "device-keys",
  "doctor",
  "ended",
  "forms",
  "front-door",
  "glossary",
  "handoff",
  "held",
  "history",
  "hosting",
  "household",
  "in-flight",
  "import",
  "invitation",
  "job",
  "key-claim",
  "keys",
  "lifecycle",
  "log",
  "migration",
  "minted-key",
  "notify",
  "notify-mine",
  "outbound",
  "pairing",
  "part-way",
  "pausing",
  "playing",
  "plugins",
  "plugin-catalogue",
  "preview",
  "provenance",
  "push-endpoints",
  "quality",
  "queue",
  "ran",
  "repair",
  "replacement",
  "replay",
  "restore",
  "seed",
  "self-update",
  "served",
  "settings",
  "settled",
  "space",
  "stack",
  "start",
  "status",
  "stop-seeding",
  "stored",
  "step",
  "stuck",
  "substitution",
  "title",
  "trace",
  "undo",
  "uninstall",
  "update",
  "upgrade",
  "version",
  "walkthrough",
  "watch",
  "watcher",
  "wiring",
  "wizard",
];

/**
 * Kinds the client reads on this page's behalf, each with the export of the
 * client's that does.
 *
 * A refusal is one: the client reads the envelope a failure is rendered in and
 * hands back its sentence, so nothing here opens it by name.
 */
export const THROUGH_THE_CLIENT: Partial<Record<Kind, string>> = {
  error: "refusalIn",
};

/**
 * Kinds no endpoint serves, each with the requirement that says why none has
 * to.
 */
export const ELSEWHERE_KINDS: Partial<Record<Kind, string>> = {
  caller:
    "ARCH-R42 — who the session or key a request carried proves to be, which the web API asks the core through dispatch before it answers anything; no route serves it",
  logs: "G1-R1 — what `lemonfiber logs` writes under `--json` once its scrollback ends, which is how a command writes its answer to a pipe; the console reads the lines themselves as `log`",
  "notify-heard":
    "N1-R80 — the web surface handing on an event a service posted to it, which the core answers the surface alone; no route serves it",
  password:
    "G1-R1 — what setting this surface's password came to, which `lemonfiber ui` asks for before it serves; serving the web interface is the command line's, since a surface cannot start itself",
  "plugin-claims":
    "G1-R1 — what `lemonfiber plugin claims` writes under `--json`, a plugin author's read of their own source answered with no stack, which no route serves",
  "plugin-conformance":
    "G1-R1 — what `lemonfiber plugin conform` writes under `--json`, a plugin author's read of their own recordings answered with no stack, which no route serves",
  "plugin-provenance":
    "G1-R1 — what `lemonfiber plugin provenance` writes under `--json`, a plugin author's read of their own images answered with no stack, which no route serves",
  "plugin-recording":
    "G1-R1 — what `lemonfiber plugin record` writes under `--json`, a plugin author's recordings of their own adapters made with no stack, which no route serves",
  pull: "G1-R1 — the lines the command line writes while it fetches, under `--json`, which is how a command writes its answer to a pipe; the web offers fetching through the `pull` request, answered with `lifecycle`",
  renewed:
    "N1-R80 — the web surface renewing the grant to play of a member whose client spoke to it, which the core answers the surface alone; no route serves it",
  setup:
    "G1-R1 — what the command line's own setup writes under `--json`; the setup a browser walks answers with `wizard`",
  standing:
    "ARCH-R42 — what the web API composes its routes and its answers from, which it reads from the core through dispatch; no route serves it",
  untuned:
    "N1-R80 — the web surface closing the live streams whose passes lapsed unrenewed, which the core answers the surface alone; no route serves it",
};

/**
 * Kinds nobody here reads yet that no endpoint answers with, so that they wait
 * on lemonfiber rather than on this surface.
 */
export const UNSERVED_KINDS: readonly Kind[] = [
  "certificate",
  "logs-exported",
  "walkthrough-offer",
];

/** Kinds nobody here reads yet, each with the feature it belongs to. */
export const NOT_YET_KINDS: Partial<Record<Kind, Feature>> = {
  certificate: "N1",
  channels: "ARCH-R420",
  "device-challenge": "C10",
  "device-key": "C10",
  grant: "D11",
  guide: "D11",
  "logs-exported": "B4",
  music: "D2",
  news: "N27",
  "news-items": "N27",
  play: "ARCH-R420",
  "push-endpoint": "ARCH-R282",
  removal: "D6",
  reset: "C9",
  "sign-in-code": "ARCH-R441",
  tuned: "ARCH-R420",
  "walkthrough-offer": "D3",
  watched: "D11",
  word: "G2",
};

/** Every kind placed in a list. */
export const kinds = named(
  OFFERED_KINDS,
  Object.keys(THROUGH_THE_CLIENT),
  Object.keys(ELSEWHERE_KINDS),
  Object.keys(NOT_YET_KINDS),
);
