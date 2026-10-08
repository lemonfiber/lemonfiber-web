/**
 * The versions in play and where this copy of lemonfiber stands, as a suite
 * stands them in for a running lemonfiber.
 *
 * Declared as the payload the kind it names carries, so the compiler asks
 * whether each field is one the contract has rather than whoever wrote the
 * reader and the body agreeing with each other.
 */
import type { Standing, Versions } from "../lib/copy";

/** The versions in play, with the engine answering. */
export const versions: Versions = {
  binary: "0.17.2",
  stack: "2026.10",
  compose: "2.39.1",
  supported_schema: [3, 4],
  changelog: { releases: [], requirements: {}, state: "current" },
};

/** A Homebrew copy with a newer release out, and the command to move it. */
export const behind: Standing = {
  standing: "update-available",
  running: "0.17.2",
  offered: "0.18.0",
  installed: "homebrew",
  owner: "Homebrew",
  at: "/opt/homebrew/bin/lemonfiber",
  command: "brew upgrade lemonfiber",
  changed: "Adds the household view to the web interface.",
  carries: "A release brings the program and the web interface it serves.",
  afterwards: "Your stack and settings are left as they are.",
};

/** A copy whose check could not reach the release list. */
export const untold: Standing = {
  standing: "check-failed",
  running: "0.17.2",
  installed: "untellable",
  untold: "The release list did not answer.",
  instead: "Check the release page yourself.",
  carries: "A release brings the program and the web interface it serves.",
  afterwards: "Your stack and settings are left as they are.",
};
