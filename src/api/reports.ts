/**
 * What finished work on the checks screen is redeemed for, as a suite stands it
 * in for a running lemonfiber.
 *
 * Declared as the payload the kind it names carries, so the compiler asks
 * whether each field is one the contract has rather than whoever wrote the
 * reader and the body agreeing with each other.
 */
import type { Repaired, Undone } from "../lib/came";

/** What the offer named itself, which an agreement names back. */
export const agreement = "offer-7d0e5c63";

/** What can be put right, and nothing changed yet. */
export const offer: Repaired = {
  acted: false,
  agreement,
  beyond: [],
  mended: [],
  offered: [
    {
      check: "services.health",
      does: "Restart prowlarr, which has stopped answering its own health check.",
      effects: [],
      reversible: false,
    },
    {
      check: "storage.permissions",
      does: "Give the downloads folder to the user the services run as.",
      effects: ["Every file under the downloads folder changes owner."],
      reversible: true,
    },
  ],
};

/** What agreeing to one repair came to. */
export const carried: Repaired = {
  acted: true,
  agreement,
  beyond: [
    {
      check: "network.tunnel",
      remedy: {
        action: "Check the provider's account is still active.",
        detail: null,
      },
    },
  ],
  mended: [
    {
      outcome: { outcome: "fixed" },
      repair: {
        check: "services.health",
        does: "Restart prowlarr.",
        effects: [],
        reversible: false,
      },
    },
  ],
  offered: [],
};

/** What putting the last repair back came to. */
export const undone: Undone = {
  rehearsed: false,
  reversed: [
    {
      target: "sonarr",
      action: {
        does: "restore",
        key: "downloadClient",
        value: "sabnzbd",
        wrote: "qbittorrent",
      },
    },
  ],
  left: [
    {
      target: "radarr",
      because: "Radarr is not answering, so nothing could be put back there.",
    },
  ],
};
