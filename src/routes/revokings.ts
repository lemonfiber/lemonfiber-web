/**
 * What the credentials panel has asked for, as a screen is handed it.
 *
 * A screen is drawn from what it is handed, so a story and a test both hand it
 * this. The reports inside each record are the ones a suite stands in for a
 * running lemonfiber, in `../api/credentials`.
 */
import {
  komgaGrant,
  revokedGrant,
  revokeOffer,
  wouldRevoke,
} from "../api/credentials";
import type { Revoker } from "../lib/revoking";
import type { Work } from "../lib/work";

/** A record of what ending the Komga grant would come to. */
export const revokeRead: Work = {
  id: "71",
  doing: "credentials-revoke",
  scoped: false,
  given: { plugin: komgaGrant.plugin, credential: komgaGrant.credential },
  at: "done",
  job: undefined,
  came: { kind: "credentials", report: wouldRevoke },
};

/** A record of that grant ended under its reading. */
export const revokeMade: Work = {
  ...revokeRead,
  id: "72",
  given: { ...revokeRead.given, offer: revokeOffer },
  came: { kind: "credentials", report: revokedGrant },
};

/** What pressing anything asks for, where nothing answers it. */
const nothing = (): void => undefined;

/** Nothing asked of any grant yet. */
export const revoker: Revoker = {
  work: [],
  asked: undefined,
  busy: false,
  onask: nothing,
  onleave: nothing,
  ondrop: nothing,
};
