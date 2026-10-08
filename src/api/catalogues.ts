/**
 * What the stack holds and where each service comes from, as a suite stands
 * them in for a running lemonfiber.
 *
 * Declared as the payload the kind it names carries, so the compiler asks
 * whether each field is one the contract has rather than whoever wrote the
 * reader and the body agreeing with each other.
 */
import type { Catalogue, Provenance } from "../lib/catalogue";

/** What each service is for, and what the stack dropped. */
export const catalogue: Catalogue = {
  services: [
    {
      id: "jellyfin",
      name: "Jellyfin",
      describes: "Plays what the household holds, on every screen.",
      without_it: "nobody can watch anything.",
      criticality: "critical",
    },
    {
      id: "bazarr",
      name: "Bazarr",
      describes: "Finds subtitles for what is fetched.",
      without_it: "films arrive with no subtitles.",
      criticality: "enhancing",
    },
  ],
  removed: [
    {
      id: "ombi",
      removed_in: "2026.07",
      reason: "Its requests moved into the household view.",
      replaced_by: "jellyseerr",
    },
    {
      id: "watchtower",
      removed_in: "2026.04",
      reason: "lemonfiber moves the stack itself.",
    },
  ],
};

/** Where each service comes from; Bazarr is not named. */
export const provenance: Provenance = {
  services: [
    {
      id: "jellyfin",
      name: "Jellyfin",
      image: "jellyfin/jellyfin",
      pinned: "10.10.3",
      digest: "sha256:4f1e",
      license: "GPL-2.0-only",
      upstream: "github.com/jellyfin/jellyfin",
    },
  ],
};
