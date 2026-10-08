/**
 * What the plugins panel has asked for, as a screen is handed it.
 *
 * A screen is drawn from what it is handed, so a story and a test both hand it
 * this. The reports inside each record are the ones a suite stands in for a
 * running lemonfiber, in `../api/plugs`.
 */
import {
  installOffer,
  madeInstall,
  readInstall,
  wouldRemove,
  wouldUpdate,
} from "../api/plugs";
import type { Plugger } from "../lib/plugging";
import type { Work } from "../lib/work";

export { installOffer, readInstall } from "../api/plugs";

/** A record of what installing the subtitle fetcher would come to. */
export const installRead: Work = {
  id: "61",
  doing: "plugin-install",
  scoped: false,
  given: { source: "subtitle-fetch" },
  at: "done",
  job: undefined,
  came: { kind: "plugins", report: readInstall },
};

/** A record of that install, made under its reading. */
export const installMade: Work = {
  ...installRead,
  id: "62",
  given: { source: "subtitle-fetch", offer: installOffer },
  came: { kind: "plugins", report: madeInstall },
};

/** A record of what updating the fetcher would come to. */
export const updateRead: Work = {
  id: "63",
  doing: "plugin-update",
  scoped: false,
  given: { plugin: "subtitle-fetch" },
  at: "done",
  job: undefined,
  came: {
    kind: "plugins",
    report: {
      ...readInstall,
      agreement: "plugin-update:5d20",
      install: null,
      update: wouldUpdate,
    },
  },
};

/** A record of what removing the fetcher would come to. */
export const removeRead: Work = {
  ...updateRead,
  id: "64",
  doing: "plugin-remove",
  came: {
    kind: "plugins",
    report: {
      ...readInstall,
      agreement: "plugin-remove:7e01",
      install: null,
      removal: wouldRemove,
    },
  },
};

/** What pressing anything asks for, where nothing answers it. */
const nothing = (): void => undefined;

/** Nothing asked of any plugin yet. */
export const plugger: Plugger = {
  work: [],
  asked: undefined,
  busy: false,
  onask: nothing,
  onleave: nothing,
  ondrop: nothing,
};
