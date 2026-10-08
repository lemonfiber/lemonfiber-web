/**
 * What installing, updating and removing a plugin is answered with, as a suite
 * stands them in for a running lemonfiber.
 *
 * Declared as the payload the kind it names carries, so the compiler asks
 * whether each field is one the contract has rather than whoever wrote the
 * reader and the body agreeing with each other.
 */
import type {
  PluginInstall,
  PluginPair,
  PluginRecipe,
  PluginRemoval,
  PluginUpdate,
  Plugs,
} from "../lib/plugged";
import { plugins, subtitles } from "./installs";

/** The name the install's reading gives itself. */
export const installOffer = "plugin-install:9c41e2";

/** A value read from the stack and released to a host outside it. */
export const released: PluginPair = {
  value: "api_key",
  origin: "credential-store",
  to: "opensubtitles",
  approval: "api_key@opensubtitles",
  release: "The subtitle service needs the key to answer.",
  from: "sonarr",
};

/** A value carried to a service inside the stack, asking no approval. */
export const kept: PluginPair = {
  value: "language",
  origin: "",
  to: "subfetch",
};

/** A recipe that signs the fetcher in to an outside service. */
export const signIn: PluginRecipe = {
  id: "sign-in",
  title: "Sign in to the subtitle service",
  why: "Without an account the service answers ten times a day.",
  steps: [
    {
      id: "read-key",
      method: "GET",
      path: "/api/v3/config",
      to: "sonarr",
      adapter: { kind: "servarr", owner: "lemonfiber" },
    },
    {
      id: "login",
      method: "POST",
      path: "/login",
      to: "opensubtitles",
      adapter: null,
    },
  ],
  pairs: [released, kept],
};

/** What installing the fetcher would write, reach and prove, with nothing done. */
export const wouldInstall: PluginInstall = {
  changes: [
    { path: "/srv/lemonfiber/plugins/subfetch", puts: "directory" },
    { path: "/srv/lemonfiber/compose/subfetch.yml", puts: "document" },
    { path: "/srv/lemonfiber/proxy/routes.conf", puts: "region" },
  ],
  overrides: [
    { setting: "bazarr.enabled", why: "It fetches subtitles itself." },
  ],
  contests: [
    {
      capability: "subtitles",
      by: "jellyfin",
      claimants: ["bazarr", "subfetch"],
    },
  ],
  proofs: [
    {
      proof: "answers",
      asks: "GET /health",
      establishes: "The fetcher answers.",
      why: "A fetcher that does not answer fetches nothing.",
      of: "subfetch",
    },
    {
      proof: "lists",
      asks: "GET /languages",
      establishes: "It lists the languages it fetches.",
      why: "The language setting is chosen from this list.",
      of: null,
    },
  ],
  recipes_ran: [],
  recorded: false,
  would: {
    ...subtitles,
    recipes: [signIn],
    services: [
      {
        service: "subfetch",
        image: "ghcr.io/example/subfetch",
        tag: "1.4.0",
        digest: "sha256:3b1f",
        config_path: "plugins/subtitle-fetch/subfetch",
        takes_data: true,
        reached: { tier: "household", hostname: "subs.home", port: 8080 },
      },
      {
        service: "subfetch-worker",
        image: "ghcr.io/example/subfetch-worker",
        tag: "1.4.0",
        digest: "sha256:77aa",
        config_path: "plugins/subtitle-fetch/worker",
        takes_data: false,
        reached: { tier: "loopback", port: 9090 },
      },
      {
        service: "subfetch-cron",
        image: "ghcr.io/example/subfetch-cron",
        tag: "1.4.0",
        digest: "sha256:88bb",
        config_path: "plugins/subtitle-fetch/cron",
        takes_data: false,
      },
    ],
    declared: {
      reaches: ["opensubtitles"],
      secrets: [
        {
          id: "account",
          of: "opensubtitles",
          why: "To sign in for more answers.",
        },
      ],
      license: "MIT",
      upstream: "example.org/subtitle-fetch",
      reviewed: false,
      claims: ["subtitles"],
    },
  },
};

/** The reading of an install, standing for a yes. */
export const readInstall: Plugs = {
  ...plugins,
  rehearsed: true,
  agreement: installOffer,
  install: wouldInstall,
};

/** The install made under that reading, every proof held and nothing broken. */
export const installed: PluginInstall = {
  ...wouldInstall,
  recorded: true,
  against: "service",
  proofs: wouldInstall.proofs.map((proof) => ({
    ...proof,
    came_to: { outcome: "passed" },
  })),
  recipes_ran: [{ recipe: "sign-in", held: true, steps: [] }],
  verified: { broke: [], unsettled: [] },
};

/** What the install made under that reading was answered with. */
export const madeInstall: Plugs = { ...plugins, install: installed };

/** What updating the fetcher would come to. */
export const wouldUpdate: PluginUpdate = {
  plugin: "subtitle-fetch",
  from: "1.4.0",
  to: "1.5.0",
  interrupts: ["subfetch"],
  install: wouldInstall,
  went_back: { rehearsed: true, reversed: [], left: [] },
};

/** What removing the fetcher would come to. */
export const wouldRemove: PluginRemoval = {
  plugin: "subtitle-fetch",
  interrupts: [],
  leaves: [{ capability: "subtitles", filled_by: "subtitle-fetch" }],
  removed: false,
  went_back: {
    rehearsed: true,
    reversed: [
      {
        target: "subfetch",
        action: { does: "delete", path: "/srv/lemonfiber/plugins/subfetch" },
      },
    ],
    left: [],
  },
};
