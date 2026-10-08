/**
 * What the stack wires to what, as a suite stands it in for a running
 * lemonfiber.
 *
 * Declared as the payload the kind it names carries, so the compiler asks
 * whether each field is one the contract has rather than whoever wrote the
 * reader and the body agreeing with each other.
 */
import type { Link, Wiring } from "../lib/wiring";

/** Sonarr asks for a download client, and one does it. */
export const outright: Link = {
  by: "sonarr",
  reaches: {
    how: "asked",
    capability: "download-client",
    services: ["qbittorrent"],
    settled: { settled: "outright" },
    origins: { qbittorrent: { origin: "bundled" } },
  },
};

/** Prowlarr feeds every service that searches. */
export const each: Link = {
  by: "prowlarr",
  reaches: {
    how: "asked",
    capability: "searcher",
    services: ["sonarr", "radarr"],
    settled: { settled: "each" },
    origins: {},
  },
};

/** Two request services claim one ask, and nobody has chosen. */
export const contested: Link = {
  by: "jellyfin",
  reaches: {
    how: "asked",
    capability: "requests",
    services: [],
    settled: { settled: "contested", claimants: ["jellyseerr", "ombi"] },
    origins: { ombi: { origin: "plugin", named: "plugin-ombi" } },
  },
};

/** The operator chose one subtitle service over another, and said why. */
export const chosen: Link = {
  by: "radarr",
  reaches: {
    how: "asked",
    capability: "subtitles",
    services: ["bazarr"],
    settled: {
      settled: "chosen",
      whose: "operator",
      over: ["subgen"],
      why: "Bazarr finds them rather than writing them.",
    },
    origins: {},
  },
};

/** A link kept to a named service. */
export const byName: Link = {
  by: "jellyfin",
  reaches: {
    how: "by-name",
    service: "jellyfin-db",
    why: "It keeps its own database.",
  },
};

/** Every link, and one ask nothing fills. */
export const wiring: Wiring = {
  wired: [outright, each, contested, chosen, byName],
  unfilled: [{ by: "lidarr", capability: "music-indexer" }],
};
