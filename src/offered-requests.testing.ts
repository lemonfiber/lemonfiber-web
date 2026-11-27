/**
 * Every request another surface can make of the stack, each placed in one of
 * three lists: offered here, offered elsewhere by rule, or not offered yet.
 */
import { ACTIONS, isActionName, type ActionName } from "@lemonfiber/sdk-ts";
import { everyConfiguring } from "./lib/configuring";
import { everyFinding } from "./lib/finding";
import { everyHosting } from "./lib/hosting";
import { everyMending } from "./lib/mending";
import { everyPairing } from "./lib/pairing";
import { everyReclaiming } from "./lib/reclaiming";
import { everyFilling } from "./lib/filling";
import { everyMoving } from "./lib/moving";
import { everyPlugging } from "./lib/plugging";
import { everyKeying } from "./routes/keying.svelte";
import { everyRemoving } from "./lib/removing";
import { everyRevoking } from "./lib/revoking";
import { everyScheduling } from "./lib/scheduling";
import { everyValuing } from "./lib/valuing";
import { everySeeding } from "./lib/seeding";
import { everySharing } from "./lib/sharing";
import { everyUpdating } from "./lib/updating";
import { everyTending } from "./lib/tending";
import { everyTuning } from "./lib/tuning";
import { everyUpkeep } from "./lib/upkeep";
import { everyDoing } from "./lib/work";
import { named, type Feature } from "./offered.testing";

/**
 * Every request another surface can make of the stack that is not an action:
 * the setup walk its own endpoints serve, serving this surface, which the
 * command line does, replacing the certificate a paired phone pins, which only
 * the command line offers, then minting, listing and revoking keys, minting one
 * as a claim and collecting it, then registering, challenging, listing and
 * revoking device keys, then registering, listing and removing push endpoints,
 * which the core serves at routes of their own.
 */
export const NOT_ACTIONS = [
  "setup",
  "ui",
  "companion-certificate",
  "key-mint",
  "key-list",
  "key-revoke",
  "key-claim",
  "key-collect",
  "device-key-register",
  "device-key-challenge",
  "device-key-list",
  "device-key-revoke",
  "push-endpoint-register",
  "push-endpoint-list",
  "push-endpoint-remove",
] as const;

/** One request another surface can make. */
export type Request = ActionName | (typeof NOT_ACTIONS)[number];

/**
 * Every request another surface can make of the stack: every action the
 * contract lists, as the client exports them, then the rest.
 */
export const EVERY_REQUEST: readonly Request[] = [
  ...Object.keys(ACTIONS).filter((name) => isActionName(name)),
  ...NOT_ACTIONS,
];

/**
 * The lists of requests a screen walks, and the screen that walks each.
 *
 * A request is offered by being on one of these, drawn as a control on the
 * screen named. The list is imported rather than restated, so what is claimed
 * is what the screen is handed, and the screen either walks the list by name
 * or names each request in it.
 */
export const WALKED: readonly {
  readonly list: readonly Request[];
  readonly named: string;
  readonly by: readonly string[];
}[] = [
  {
    list: everyDoing,
    named: "everyDoing",
    by: ["src/routes/panels/Running.svelte"],
  },
  {
    list: everyMending,
    named: "everyMending",
    by: ["src/routes/panels/Mend.svelte"],
  },
  {
    list: everyUpkeep,
    named: "everyUpkeep",
    by: [
      "src/routes/panels/Backups.svelte",
      "src/routes/panels/Support.svelte",
    ],
  },
  {
    list: everyTuning,
    named: "everyTuning",
    by: ["src/routes/panels/Quality.svelte"],
  },
  {
    list: everyConfiguring,
    named: "everyConfiguring",
    by: ["src/routes/panels/Configuration.svelte"],
  },
  {
    list: everyTending,
    named: "everyTending",
    by: ["src/routes/panels/Tending.svelte", "src/routes/panels/Tended.svelte"],
  },
  {
    list: everyPairing,
    named: "everyPairing",
    by: ["src/routes/panels/Pairing.svelte"],
  },
  {
    list: everySharing,
    named: "everySharing",
    by: ["src/routes/panels/Line.svelte"],
  },
  {
    list: everyUpdating,
    named: "everyUpdating",
    by: ["src/routes/panels/Updates.svelte"],
  },
  {
    list: everyFinding,
    named: "everyFinding",
    by: ["src/routes/panels/Walk.svelte", "src/routes/panels/Trace.svelte"],
  },
  {
    list: everyHosting,
    named: "everyHosting",
    by: ["src/routes/panels/Hosting.svelte"],
  },
  {
    list: everyRemoving,
    named: "everyRemoving",
    by: ["src/routes/panels/Removal.svelte"],
  },
  {
    list: everySeeding,
    named: "everySeeding",
    by: ["src/routes/panels/Letting.svelte"],
  },
  {
    list: everyReclaiming,
    named: "everyReclaiming",
    by: ["src/routes/panels/Reclaim.svelte"],
  },
  {
    list: everyFilling,
    named: "everyFilling",
    by: ["src/routes/panels/Choosing.svelte"],
  },
  {
    list: everyMoving,
    named: "everyMoving",
    by: ["src/routes/panels/Moving.svelte"],
  },
  {
    list: everyKeying,
    named: "everyKeying",
    by: [
      "src/routes/panels/Keys.svelte",
      "src/routes/panels/Phones.svelte",
      "src/routes/panels/Woken.svelte",
    ],
  },
  {
    list: ["ask", "notify-choose"],
    named: "movedBy",
    by: ["src/api/member.ts"],
  },
  {
    list: ["setup"],
    named: "movedBy",
    by: ["src/routes/setting.svelte.ts", "src/routes/Setup.svelte"],
  },
  {
    list: everyPlugging,
    named: "everyPlugging",
    by: [
      "src/routes/panels/Plugins.svelte",
      "src/routes/panels/Plugging.svelte",
      "src/routes/panels/PlugOffer.svelte",
    ],
  },
  {
    list: everyRevoking,
    named: "everyRevoking",
    by: [
      "src/routes/panels/Granted.svelte",
      "src/routes/panels/Revoking.svelte",
    ],
  },
  {
    list: everyValuing,
    named: "everyValuing",
    by: [
      "src/routes/panels/Values.svelte",
      "src/routes/panels/Valued.svelte",
      "src/routes/panels/Valuing.svelte",
    ],
  },
  {
    list: everyScheduling,
    named: "everyScheduling",
    by: ["src/routes/panels/Scheduled.svelte"],
  },
];

/** Requests this console offers. */
export const OFFERED_REQUESTS: readonly Request[] = [
  "ask",
  "up",
  "down",
  "switch",
  "restart",
  "pull",
  "seed",
  "adopt",
  "repair",
  "diagnose",
  "accept",
  "undo",
  "backup",
  "restore",
  "support",
  "quality-set",
  "quality-reapply",
  "quality-upgrade",
  "config-set",
  "invite",
  "reissue",
  "household-allow",
  "household-approve",
  "household-decline",
  "household-handoff",
  "companion-pair",
  "bandwidth",
  "downloads-pause",
  "downloads-resume",
  "update",
  "watch",
  "walkthrough",
  "search",
  "hosting-install",
  "hosting-remove",
  "forget",
  "uninstall",
  "stop-seeding",
  "space",
  "wiring-fill",
  "migrate-adopt",
  "migrate-import",
  "migrate-beside",
  "migrate-replace",
  "key-list",
  "key-mint",
  "key-claim",
  "key-revoke",
  "device-key-list",
  "device-key-revoke",
  "push-endpoint-list",
  "push-endpoint-remove",
  "plugin-install",
  "plugin-update",
  "plugin-prove",
  "plugin-run",
  "plugin-remove",
  "credentials-revoke",
  "settings-set",
  "settings-clear",
  "setup",
  "run",
  "notify-choose",
];

/**
 * Requests this console does not offer because a requirement says it cannot,
 * each with that requirement and why.
 */
export const ELSEWHERE_REQUESTS: Partial<Record<Request, string>> = {
  ui: "G1-R1 — a surface cannot start itself; the address bar is the equivalent, since being able to ask is proof it is already serving",
  "key-collect":
    "C10-R20 — a key is collected by the program that will hold it, with the claim its link carries; the console mints the claim and shows its link",
};

/** Requests nobody has offered here yet, each with the feature it belongs to. */
export const NOT_YET_REQUESTS: Partial<Record<Request, Feature>> = {
  reset: "C9",
  remove: "D6",
  grant: "D11",
  watched: "D11",
  tune: "ARCH-R420",
  play: "ARCH-R420",
  "push-woken": "ARCH-R404",
  "companion-certificate": "N1",
  "device-key-register": "C10",
  "device-key-challenge": "C10",
  "push-endpoint-register": "ARCH-R282",
  "internal-certificate-replace": "ARCH-R354",
};

/** Every request placed in a list. */
export const requests = named(
  OFFERED_REQUESTS,
  Object.keys(ELSEWHERE_REQUESTS),
  Object.keys(NOT_YET_REQUESTS),
);
