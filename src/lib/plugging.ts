/**
 * Installing, updating, removing and proving a plugin and running one of its
 * recipes by name, and how the asking reads.
 *
 * Five requests, named as the command line names them, each asked for twice.
 * Asked bare, each writes nothing and answers with its reading: everything it
 * would write, reach, prove and stop, and the name that reading goes by. There
 * is no bare yes. The yes is the same request carrying that name, with every
 * value a recipe would carry elsewhere, every privileged shape and every
 * credential of another service that would cross to the plugin approved one
 * by one, so what runs is what was read, or lemonfiber refuses and says what
 * moved. An update names the source it updates from, which is the one the
 * plugin's record keeps.
 */
import type { Arguments } from "../api/acting";
import { sameDoing, type Asker, type Family } from "./asker";
import type { Came } from "./came";
import { isReading, type PluginDemand, type PluginReproof } from "./proving";
import type {
  PluginGranting,
  PluginInstall,
  PluginPair,
  PluginRecipe,
  PluginTaking,
  PluginRemoval,
  PluginUpdate,
  Plugs,
} from "./plugged";
import type { Unvetted } from "./unvetted";
import type { Plugging, Requested, Work } from "./work";

/** Every request the plugins panel makes, least disruptive first. */
export const everyPlugging: readonly Plugging[] = [
  "plugin-install",
  "plugin-update",
  "plugin-remove",
  "plugin-prove",
  "plugin-run",
];

/** Whether a record is of something the plugins panel asked for. */
export function isPlugging(doing: Requested): doing is Plugging {
  const plugging: readonly Requested[] = everyPlugging;
  return plugging.includes(doing);
}

/**
 * The yes to a reading: the name it went by, each value approved, and what
 * was given for each input its recipes ask, as `name=value`.
 */
interface Yes {
  readonly offer: string;
  readonly approved: readonly string[];
  readonly inputs?: readonly string[];
}

/** An installed plugin, and the recipe of it asked for by name. */
interface Running {
  readonly doing: "plugin-run";
  readonly plugin: string;
  readonly recipe: string;
}

/** An installed plugin, and the source it is updated from. */
interface Updating {
  readonly doing: "plugin-update";
  readonly plugin: string;
  readonly source: string;
}

/** One asking. */
export type Plug =
  /** What installing from a source would come to, with nothing written. */
  | { readonly doing: "plugin-install"; readonly source: string }
  /** The install, agreed to under the reading that named itself. */
  | ({ readonly doing: "plugin-install"; readonly source: string } & Yes)
  /** What updating an installed plugin from a source would come to. */
  | Updating
  /** The update, agreed to under its reading. */
  | (Updating & Yes)
  /** What removing an installed plugin would come to. */
  | { readonly doing: "plugin-remove"; readonly plugin: string }
  /** The removal, agreed to under its reading; it carries nothing elsewhere. */
  | {
      readonly doing: "plugin-remove";
      readonly plugin: string;
      readonly offer: string;
    }
  /** What proving an installed plugin again would ask, with nothing asked. */
  | { readonly doing: "plugin-prove"; readonly plugin: string }
  /** The proving, agreed to under its reading. */
  | {
      readonly doing: "plugin-prove";
      readonly plugin: string;
      readonly offer: string;
    }
  /** What running one recipe would call and carry, with nothing run. */
  | Running
  /** The run, agreed to under its reading. */
  | (Running & Yes);

/** What names the plugin one asking acts on, or the source it installs from. */
function namedBy(plug: Plug): Arguments {
  switch (plug.doing) {
    case "plugin-install":
      return { source: plug.source };
    case "plugin-update":
      return { plugin: plug.plugin, source: plug.source };
    case "plugin-remove":
    case "plugin-prove":
      return { plugin: plug.plugin };
    case "plugin-run":
      return { plugin: plug.plugin, recipe: plug.recipe };
  }
}

/** What to send for one asking. */
export function givenForPlug(plug: Plug): Arguments {
  const named = namedBy(plug);
  if (!("offer" in plug)) return named;
  if (!("approved" in plug)) return { ...named, offer: plug.offer };
  const yes = { ...named, offer: plug.offer, approved: [...plug.approved] };
  const inputs = plug.inputs ?? [];
  return inputs.length === 0 ? yes : { ...yes, inputs: [...inputs] };
}

/** How the plugins panel's requests are asked for. */
export const plugging: Family<Plug> = {
  owns: isPlugging,
  question: () => undefined,
  given: givenForPlug,
  same: sameDoing,
};

/**
 * Whether what a piece of work came to changed what is installed, which
 * changes what the settings screen reads. A reading wrote nothing.
 */
export function changedByPlugging(came: Came): boolean {
  return came.kind === "plugins" && !isReading(came.report);
}

/** A reading standing for a yes, and the record it came on. */
export type Offered = {
  /** The record, which is what putting the reading away puts away. */
  readonly id: string;
  /** The name the reading gave itself, which the yes carries. */
  readonly offer: string;
  /** The operator's own overlay, where it changes a service. */
  readonly unvetted?: Unvetted | undefined;
} & (
  | {
      readonly doing: "plugin-install";
      readonly source: string;
      readonly install: PluginInstall;
    }
  | {
      readonly doing: "plugin-update";
      readonly plugin: string;
      readonly source: string;
      readonly update: PluginUpdate;
    }
  | {
      readonly doing: "plugin-remove";
      readonly plugin: string;
      readonly removal: PluginRemoval;
    }
  | {
      readonly doing: "plugin-prove";
      readonly plugin: string;
      readonly proof: PluginReproof;
    }
  | {
      readonly doing: "plugin-run";
      readonly plugin: string;
      readonly demand: PluginDemand;
    }
);

/** The reading a report holds for installing from a source, where it holds one. */
function installOffered(
  id: string,
  offer: string,
  source: string | undefined,
  report: Plugs,
): Offered | undefined {
  const { install } = report;
  if (install === undefined || install === null || source === undefined) {
    return undefined;
  }
  return { id, offer, doing: "plugin-install", source, install };
}

/** The reading a report holds for an act on an installed plugin, where it holds one. */
function pluginOffered(
  id: string,
  offer: string,
  doing: Exclude<Plugging, "plugin-install">,
  given: Work["given"],
  report: Plugs,
): Offered | undefined {
  const { plugin, source } = given;
  if (plugin === undefined) return undefined;
  const { update, removal, proof, demand } = report;
  switch (doing) {
    case "plugin-update":
      return update === undefined || update === null || source === undefined
        ? undefined
        : { id, offer, doing, plugin, source, update };
    case "plugin-remove":
      return removal === undefined || removal === null
        ? undefined
        : { id, offer, doing, plugin, removal };
    case "plugin-prove":
      return proof === undefined || proof === null
        ? undefined
        : { id, offer, doing, plugin, proof };
    case "plugin-run":
      return demand === undefined || demand === null
        ? undefined
        : { id, offer, doing, plugin, demand };
  }
}

/** The reading a report holds for the act asked, where it holds one. */
function offeredOf(
  id: string,
  doing: Plugging,
  given: Work["given"],
  report: Plugs,
): Offered | undefined {
  const offer = report.agreement ?? "";
  if (offer === "") return undefined;
  return doing === "plugin-install"
    ? installOffered(id, offer, given.source, report)
    : pluginOffered(id, offer, doing, given, report);
}

/**
 * The reading standing on the screen, where one is: the newest act asked
 * for, answered with its reading and nothing written.
 */
export function standingPlug(work: readonly Work[]): Offered | undefined {
  const newest = work.find((one) => isPlugging(one.doing));
  if (newest === undefined || !isPlugging(newest.doing)) return undefined;
  if (newest.at !== "done" || newest.came.kind !== "plugins") return undefined;
  const { report } = newest.came;
  if (!isReading(report)) return undefined;
  const offered = offeredOf(newest.id, newest.doing, newest.given, report);
  const unvetted = report.unvetted ?? undefined;
  return offered === undefined || unvetted === undefined
    ? offered
    : { ...offered, unvetted };
}

/**
 * One thing a reading asks to be approved apart from the offer: a value a
 * recipe would carry elsewhere, a privileged shape a service would take, or a
 * credential of another service that would cross to the plugin, with what
 * approving it is written as, which the yes sends.
 */
export type Approvable =
  | {
      /** The recipe that would carry it, by its title. */
      readonly recipe: string;
      readonly pair: PluginPair;
      readonly approval: string;
    }
  | { readonly taking: PluginTaking; readonly approval: string }
  | { readonly granting: PluginGranting; readonly approval: string };

/**
 * Every value a reading's recipes would carry off the machine or away from
 * the service it was read from, then every privileged shape a service of it
 * would take, then every credential that would cross to it, each needing its
 * own approval.
 */
export function approvables(install: PluginInstall): readonly Approvable[] {
  const carried = (install.would.recipes ?? []).flatMap((recipe) =>
    carriedBy(recipe),
  );
  const taken = install.taking.map((taking) => ({
    taking,
    approval: taking.approval,
  }));
  const granted = install.granting.map((granting) => ({
    granting,
    approval: granting.approval,
  }));
  return [...carried, ...taken, ...granted];
}

/** Every value one recipe would carry that needs its own approval. */
export function carriedBy(recipe: PluginRecipe): readonly Approvable[] {
  return recipe.pairs.flatMap((pair) =>
    pair.approval === undefined
      ? []
      : [{ recipe: recipe.title, pair, approval: pair.approval }],
  );
}

/** The install a reading would make, the new version's for an update. */
export function installOf(offered: Offered): PluginInstall | undefined {
  if (offered.doing === "plugin-install") return offered.install;
  if (offered.doing === "plugin-update") return offered.update.install;
  return undefined;
}

/**
 * Everything the plugins panel is given to act with, and what pressing its
 * controls asks for.
 */
export type Plugger = Asker<Plug>;
