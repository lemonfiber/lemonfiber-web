/**
 * What proving a plugin again, running one of its recipes by name and reading
 * the plugin catalogue are answered with, as a suite stands them in for a
 * running lemonfiber.
 */
import type { Catalogued, PluginCatalogue } from "../lib/catalogued";
import type { Plugs } from "../lib/plugged";
import type {
  PluginDemand,
  PluginRecipe,
  PluginReproof,
  RecipeInput,
} from "../lib/proving";
import { plugins, subtitles } from "./installs";
import { released, wouldInstall } from "./plugs";

/** The name proving the fetcher again reads under. */
export const proveOffer = "plugin-prove:1a2b";

/** The name running its refresh recipe reads under. */
export const runOffer = "plugin-run:3c4d";

/** What a recipe asks who signs in. */
export const account: RecipeInput = {
  name: "account",
  ask: "Which account signs in?",
  secret: false,
};

/** What a recipe asks they sign in with, which may be a secret. */
export const passphrase: RecipeInput = {
  name: "passphrase",
  ask: "What does it sign in with?",
  secret: true,
};

/** A recipe the fetcher runs only when asked, asking who signs in and how. */
export const refresh: PluginRecipe = {
  id: "refresh",
  on: "demand",
  title: "Sign in again",
  why: "The subtitle service forgets a sign-in after a month.",
  steps: [
    {
      id: "login",
      method: "POST",
      path: "/login",
      to: "opensubtitles",
      native: null,
    },
  ],
  pairs: [released],
  inputs: [account, passphrase],
};

/** The fetcher, installed with its refresh recipe. */
export const refreshable = {
  ...subtitles,
  recipes: [refresh],
};

/** What is installed, the fetcher able to be refreshed. */
export const refreshables: Plugs = {
  ...plugins,
  installed: [refreshable, ...plugins.installed.slice(1)],
};

/** One answer kept against the fetcher's adapter. */
const outside = {
  at: 1_795_000_000,
  capability: "subtitles",
  operation: "search",
  plugin: "subtitle-fetch",
  why: "It answered with no language.",
};

/** What proving the fetcher again would ask, with nothing asked. */
export const wouldProve: PluginReproof = {
  plugin: "subtitle-fetch",
  proofs: wouldInstall.proofs,
  kept: [outside],
  asked: false,
  cleared: false,
};

/** The reading of proving it again, standing for a yes. */
export const readProve: Plugs = {
  ...plugins,
  agreement: proveOffer,
  proof: wouldProve,
};

/** What proving it again came to, every proof held. */
export const heldProof: PluginReproof = {
  ...wouldProve,
  asked: true,
  cleared: true,
  proofs: wouldInstall.proofs.map((proof) => ({
    ...proof,
    came_to: { outcome: "passed" },
  })),
};

/** Proving it again under that reading, every proof held. */
export const proved: Plugs = { ...readProve, proof: heldProof };

/** What proving it again came to, one proof failing and one asked nothing. */
export const failedProof: PluginReproof = {
  ...wouldProve,
  asked: true,
  proofs: wouldInstall.proofs.map((proof) =>
    proof.of === null
      ? { ...proof, came_to: null }
      : { ...proof, came_to: { outcome: "failed", faults: ["No answer."] } },
  ),
};

/** What running the refresh recipe would call and carry, with nothing run. */
export const wouldRun: PluginDemand = {
  plugin: "subtitle-fetch",
  recipe: refresh,
  ran: null,
};

/** The reading of running it, standing for a yes. */
export const readRun: Plugs = {
  ...refreshables,
  agreement: runOffer,
  demand: wouldRun,
};

/** What running it came to, every step holding. */
export const ranWell: PluginDemand = {
  ...wouldRun,
  ran: { recipe: "refresh", held: true, steps: [] },
};

/** Running it under that reading, every step holding. */
export const ran: Plugs = { ...readRun, demand: ranWell };

/** What running it came to, a step not holding. */
export const ranBadly: PluginDemand = {
  ...wouldRun,
  ran: {
    recipe: "refresh",
    held: false,
    steps: [],
    why: "The service refused the sign-in.",
  },
};

/** An install whose recipe asks who signs in before it runs. */
export const wouldInstallAsking = {
  ...wouldInstall,
  would: {
    ...wouldInstall.would,
    recipes: [
      {
        ...refresh,
        id: "first-sign-in",
        on: "install" as const,
        inputs: [account],
      },
      refresh,
    ],
  },
};

/** The fetcher as the catalogue offers it, a version ahead of the one here. */
export const fetcherOffered: Catalogued = {
  id: "subtitle-fetch",
  name: "Subtitle fetch",
  description: "Fetches subtitles for everything the library holds.",
  version: "1.5.0",
  installed: { version: "1.4.0", newer: true },
  without_it: "Nothing has subtitles unless a file carries its own.",
};

/** A plugin the catalogue offers that is not installed here. */
export const coversOffered: Catalogued = {
  id: "cover-art",
  name: "Cover art",
  description: "Finds covers for the books the library holds.",
  version: "2.0.0",
  without_it: "A book without a cover shows its title alone.",
};

/** What the catalogue offers: one plugin installed behind it, one not here. */
export const listed: PluginCatalogue = {
  state: "listed",
  serial: 12,
  published: 1_795_400_000,
  entries: [fetcherOffered, coversOffered],
};

/** What the catalogue says where asking it is switched off. */
export const switchedOff: PluginCatalogue = {
  state: "off",
  entries: [],
  setting: {
    action: "config-set",
    key: "LEMONFIBER_REACH_CATALOGUE",
    value: "on",
  },
};

/** Why the catalogue's index could not be read. */
export const staleIndex = {
  code: "PLUGIN-CATALOGUE",
  summary: "The catalogue's index is older than the one already read.",
};

/** What the catalogue says where its index could not be read. */
export const unread: PluginCatalogue = {
  state: "failed",
  entries: listed.entries,
  failure: staleIndex,
};
