/**
 * Installing, updating and removing a plugin, and how the asking reads.
 *
 * Three requests, named as the command line names them, each asked for twice.
 * Asked bare, each writes nothing and answers with its reading: everything it
 * would write, reach, prove and stop, and the name that reading goes by. There
 * is no bare yes. The yes is the same request carrying that name, with every
 * value a recipe would carry elsewhere approved one by one, so what runs is
 * what was read, or lemonfiber refuses and says what moved.
 */
import type { Arguments } from "../api/acting";
import { sameDoing, type Asker, type Family } from "./asker";
import type { Came } from "./came";
import type {
  PluginInstall,
  PluginPair,
  PluginTaking,
  PluginRemoval,
  PluginUpdate,
  Plugs,
} from "./plugged";
import type { Plugging, Requested, Work } from "./work";

/** Every request the plugins panel makes, least disruptive first. */
export const everyPlugging: readonly Plugging[] = [
  "plugin-install",
  "plugin-update",
  "plugin-remove",
];

/** Whether a record is of something the plugins panel asked for. */
export function isPlugging(doing: Requested): doing is Plugging {
  const plugging: readonly Requested[] = everyPlugging;
  return plugging.includes(doing);
}

/** The yes to a reading: the name it went by, and each value approved. */
interface Yes {
  readonly offer: string;
  readonly approved: readonly string[];
}

/** One asking. */
export type Plug =
  /** What installing from a source would come to, with nothing written. */
  | { readonly doing: "plugin-install"; readonly source: string }
  /** The install, agreed to under the reading that named itself. */
  | ({ readonly doing: "plugin-install"; readonly source: string } & Yes)
  /** What updating an installed plugin would come to. */
  | { readonly doing: "plugin-update"; readonly plugin: string }
  /** The update, agreed to under its reading. */
  | ({ readonly doing: "plugin-update"; readonly plugin: string } & Yes)
  /** What removing an installed plugin would come to. */
  | { readonly doing: "plugin-remove"; readonly plugin: string }
  /** The removal, agreed to under its reading; it carries nothing elsewhere. */
  | {
      readonly doing: "plugin-remove";
      readonly plugin: string;
      readonly offer: string;
    };

/** What to send for one asking. */
export function givenForPlug(plug: Plug): Arguments {
  const named =
    plug.doing === "plugin-install"
      ? { source: plug.source }
      : { plugin: plug.plugin };
  if (!("offer" in plug)) return named;
  if (!("approved" in plug)) return { ...named, offer: plug.offer };
  return { ...named, offer: plug.offer, approved: [...plug.approved] };
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
  return came.kind === "plugins" && !came.report.rehearsed;
}

/** A reading standing for a yes, and the record it came on. */
export type Offered = {
  /** The record, which is what putting the reading away puts away. */
  readonly id: string;
  /** The name the reading gave itself, which the yes carries. */
  readonly offer: string;
} & (
  | {
      readonly doing: "plugin-install";
      readonly source: string;
      readonly install: PluginInstall;
    }
  | {
      readonly doing: "plugin-update";
      readonly plugin: string;
      readonly update: PluginUpdate;
    }
  | {
      readonly doing: "plugin-remove";
      readonly plugin: string;
      readonly removal: PluginRemoval;
    }
);

/** The reading a report holds for the act asked, where it holds one. */
function offeredOf(
  id: string,
  doing: Plugging,
  given: Work["given"],
  report: Plugs,
): Offered | undefined {
  const offer = report.agreement ?? "";
  const { source, plugin } = given;
  if (offer === "") return undefined;
  if (doing === "plugin-install") {
    const { install } = report;
    if (install === undefined || install === null || source === undefined) {
      return undefined;
    }
    return { id, offer, doing, source, install };
  }
  if (plugin === undefined) return undefined;
  if (doing === "plugin-update") {
    const { update } = report;
    if (update === undefined || update === null) return undefined;
    return { id, offer, doing, plugin, update };
  }
  const { removal } = report;
  if (removal === undefined || removal === null) return undefined;
  return { id, offer, doing, plugin, removal };
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
  if (!report.rehearsed) return undefined;
  return offeredOf(newest.id, newest.doing, newest.given, report);
}

/**
 * One thing a reading asks to be approved apart from the offer: a value a
 * recipe would carry elsewhere, or a privileged shape a service would take,
 * with what approving it is written as, which the yes sends.
 */
export type Approvable =
  | {
      /** The recipe that would carry it, by its title. */
      readonly recipe: string;
      readonly pair: PluginPair;
      readonly approval: string;
    }
  | { readonly taking: PluginTaking; readonly approval: string };

/**
 * Every value a reading's recipes would carry off the machine or away from
 * the service it was read from, then every privileged shape a service of it
 * would take, each needing its own approval.
 */
export function approvables(install: PluginInstall): readonly Approvable[] {
  const carried = (install.would.recipes ?? []).flatMap((recipe) =>
    recipe.pairs.flatMap((pair) =>
      pair.approval === undefined
        ? []
        : [{ recipe: recipe.title, pair, approval: pair.approval }],
    ),
  );
  const taken = install.taking.map((taking) => ({
    taking,
    approval: taking.approval,
  }));
  return [...carried, ...taken];
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
