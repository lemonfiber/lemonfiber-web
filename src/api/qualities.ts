/**
 * What the quality choice is answered with, as a suite stands it in for a
 * running lemonfiber.
 *
 * Declared as the payload the kind it names carries, so the compiler asks
 * whether each field is one the contract has rather than whoever wrote the
 * reader and the body agreeing with each other.
 */
import type { Tuned, Upgraded } from "../lib/tuned";

/** The file the quality choice is written into. */
export const recyclarr = "/srv/lemonfiber/config/recyclarr/recyclarr.yml";

/** The choice in force, over a config somebody has edited by hand. */
export const inForce: Tuned = {
  rehearsed: false,
  choices: [
    {
      means: "Good-looking video that does not fill the disk.",
      needs_transcoding_here: false,
      preset: "balanced",
      resolution: "1080p, x264 or x265",
      scope: "everything",
      size_per_hour: "2 GB",
      transcoding: "Plays directly on most screens.",
    },
    {
      means: "The best picture there is, at a cost in disk and playback.",
      needs_transcoding_here: true,
      preset: "maximum",
      resolution: "2160p remux",
      scope: "movies",
      size_per_hour: "30 GB",
      transcoding: "Most screens need it transcoded.",
    },
  ],
  customised: true,
  disposition: "shown",
  music: {
    format: "lossless",
    means: "Every detail the recording has.",
    note: "Some players cannot play it.",
    scope: "music",
    size_per_hour: "300 MB",
    targets: "FLAC",
  },
};

/** What putting the recorded preset back over the edits came to. */
export const reapplied: Tuned = {
  ...inForce,
  customised: true,
  disposition: "reapplied",
  overwritten: {
    diff: "- min_score: 10\n+ min_score: 0",
    path: recyclarr,
  },
};

/** What fetching the library again would cost, with nothing fetched. */
export const costed: Upgraded = {
  rehearsed: false,
  confirmed: false,
  media: [
    { media_type: "tv", preset: "balanced", size_per_hour: "2 GB" },
    { media_type: "movies", preset: "maximum", size_per_hour: "30 GB" },
  ],
};

/** What fetching the library again started. */
export const fetched: Upgraded = {
  rehearsed: false,
  confirmed: true,
  media: [
    {
      media_type: "tv",
      outcome: { state: "started" },
      preset: "balanced",
      size_per_hour: "2 GB",
    },
    {
      media_type: "movies",
      outcome: { state: "failed", detail: "Radarr did not answer." },
      preset: "maximum",
      size_per_hour: "30 GB",
    },
  ],
};
