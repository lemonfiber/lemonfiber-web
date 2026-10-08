/**
 * What choosing a service to fill a capability came to, as a suite stands it
 * in for a running lemonfiber.
 *
 * Declared as the payload the kind it names carries, so the compiler asks
 * whether each field is one the contract has rather than whoever wrote the
 * reader and the body agreeing with each other.
 */
import type { Substituted } from "../lib/substituted";

/** Choosing Jellyseerr for requests, worked out and written nowhere. */
export const wouldFill: Substituted = {
  agreement: "requests:jellyseerr:none:jellyfin:nothing",
  applied: false,
  rehearsed: true,
  substitution: {
    capability: "requests",
    now: "jellyseerr",
    was: null,
    asked_by: ["jellyfin"],
    leaves_unfilled: [],
    setting: "wiring.requests = jellyseerr",
    why: "Jellyseerr knows the household.",
  },
};

/** The same choice, written. */
export const filled: Substituted = {
  ...wouldFill,
  applied: true,
  rehearsed: false,
};

/**
 * Choosing Subgen for subtitles over Bazarr, which also fills what Sonarr asks
 * for, and would leave that unfilled.
 */
export const wouldLeave: Substituted = {
  agreement: "subtitles:subgen:bazarr:radarr:sonarr-hints",
  applied: false,
  rehearsed: true,
  substitution: {
    capability: "subtitles",
    now: "subgen",
    was: "bazarr",
    asked_by: [],
    leaves_unfilled: [{ by: "sonarr", capability: "subtitle-hints" }],
    setting: "wiring.subtitles = subgen",
  },
};
