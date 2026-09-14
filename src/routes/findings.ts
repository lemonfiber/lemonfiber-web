/**
 * One run of the checks, as the server would answer it.
 *
 * Apart from the stack the rest of the fixtures describe, for the reason the
 * house is: a screen is drawn from what it is handed, and what the checks screen
 * is handed comes from one endpoint of its own. Written against the generated
 * contract rather than invented, which makes a field that changes shape a
 * compiler error here before it is a blank space on a panel.
 */
import type { Diagnosis, Verdict } from "../lib/wire";

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
  detail: "GET http://127.0.0.1:9696/api/v1/health — connection refused (7)",
  cause: {
    code: "network.tunnel",
    severity: "critical",
    state: "guided",
    summary: "The tunnel is holding the port Prowlarr binds to.",
    meaning: "Everything that goes out through the tunnel is waiting on it.",
    remedies: [
      { action: "Start the tunnel again, then Prowlarr.", detail: null },
    ],
  },
};

/**
 * A failure the operator has already answered.
 *
 * It is not resolved, so it stays in the run; it is answered, so the row that
 * draws it is the one place the difference can be shown.
 */
const setAside: Trouble = {
  code: "storage.hardlink",
  severity: "error",
  state: "suppressed",
  summary: "Imports copy into the library instead of linking.",
  meaning:
    "Each one takes minutes rather than being instant, and twice the room while it runs.",
  remedies: [
    {
      action: "Put the downloads and the library on one filesystem.",
      detail: null,
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
      check: "storage.hardlink",
      category: "storage",
      title: "Imports link into the library rather than copying",
      verdict: failed(setAside),
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
