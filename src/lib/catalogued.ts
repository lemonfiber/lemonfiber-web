/**
 * What the plugin catalogue offers to install, in lines a reader can carry.
 *
 * Read from the verified index each time it is asked, never kept. Each entry
 * says what it does, the version the catalogue reviewed, what of it is
 * installed here, and what the household is without it. Where asking the
 * catalogue is switched off, the setting that lets it be asked is named; where
 * the index could not be read, lemonfiber's sentence is all there is.
 */
import type { ByKind, Reading } from "@lemonfiber/sdk-ts";
import * as m from "../paraglide/messages.js";

/** What the catalogue offers, or why it was not read. */
export type PluginCatalogue = ByKind["plugin-catalogue"]["data"];

/** One plugin the catalogue offers. */
export type Catalogued = PluginCatalogue["entries"][number];

/** What of one entry is installed here, in a line. */
function installedLine(entry: Catalogued): string {
  const { installed } = entry;
  if (installed === undefined || installed === null) {
    return m.plug_catalogue_absent();
  }
  const { version } = installed;
  return installed.newer
    ? m.plug_catalogue_behind({ version })
    : m.plug_catalogue_installed({ version });
}

/** One entry, in lines: what it does, its versions, and what is lost without it. */
export function cataloguedLines(entry: Catalogued): readonly string[] {
  return [
    entry.description,
    m.plug_catalogue_version({ version: entry.version }),
    installedLine(entry),
    m.plug_catalogue_without({ without: entry.without_it }),
  ];
}

/** Why no entry is listed, or nothing where the catalogue was read. */
export function unlistedLine(catalogue: PluginCatalogue): string | undefined {
  switch (catalogue.state) {
    case "off": {
      const { setting } = catalogue;
      return setting === undefined || setting === null
        ? m.plug_catalogue_off()
        : m.plug_catalogue_off_setting({
            key: setting.key,
            value: setting.value,
          });
    }
    case "failed":
      return catalogue.failure?.summary ?? m.plug_catalogue_failed();
    case "listed":
      return catalogue.entries.length === 0
        ? m.plug_catalogue_empty()
        : undefined;
  }
}

/** What the catalogue section draws: why nothing is listed, and each entry listed. */
export interface Shown {
  /** Why nothing is listed, where nothing is. */
  readonly said: string | undefined;
  /** Each entry, where the catalogue was read. */
  readonly entries: readonly Catalogued[];
}

/** What a read of the catalogue draws, its entries only where it was read. */
export function shownOf(offering: Reading<PluginCatalogue>): Shown {
  if (!offering.ok) return { said: offering.problem.message, entries: [] };
  const catalogue = offering.value;
  return {
    said: unlistedLine(catalogue),
    entries: catalogue.state === "listed" ? catalogue.entries : [],
  };
}
