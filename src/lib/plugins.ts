/**
 * The plugins on this machine, in lines a reader can carry.
 *
 * Each installed plugin is named the way its author names it, or by the id it
 * is installed under where its record carries no name. Its lines say what it
 * does in its author's words, the version installed, the source it came from
 * and the commit that source resolved to, what signed it, when it went on,
 * the services it placed and the capabilities they fill. Where the reading
 * asked each plugin's source whether it still answers, that is said too: a
 * source that has gone leaves the plugin running as it was installed, and
 * takes away the way to a newer version. Every capability the operator chose
 * one of a plugin's services to fill in place of the stack's own is named
 * under the plugins.
 *
 * What lemonfiber writes into the reading is its own and is passed through
 * unchanged. The words around it live in `messages/`.
 */
import type { ByKind } from "@lemonfiber/sdk-ts";
import { whenOf } from "./history";
import { listed } from "./listed";
import * as m from "../paraglide/messages.js";

/** The plugins on this machine, and what they fill. */
export type Plugins = ByKind["plugins"]["data"];

/** One installed plugin, as its install settled it. */
export type Installed = Plugins["installed"][number];

/** Whether one plugin's source still answers. */
export type Source = NonNullable<Plugins["sources"]>[number];

/** A capability one of a plugin's services fills, by the operator's choice. */
export type Substituted = NonNullable<Plugins["substituted"]>[number];

/** What a plugin is called, for a person to read. */
export function nameOf(plugin: Installed): string {
  const { name } = plugin;
  return name === undefined || name === null || name === ""
    ? plugin.plugin
    : name;
}

/** Whether one plugin's source still answers, in a sentence. */
export function sourceLine(source: Source): string {
  const { standing } = source;
  switch (standing.standing) {
    case "reachable":
      return m.plugin_source_reachable({ from: source.from });
    case "unreachable":
      return m.plugin_source_unreachable({
        from: source.from,
        why: standing.why,
      });
    case "unasked":
      return m.plugin_source_unasked({ why: standing.why });
    default:
      return m.plugin_source_other({ from: source.from });
  }
}

/** A value a record may leave empty, kept where it says something. */
function said(value: string | null | undefined): value is string {
  return value !== undefined && value !== null && value !== "";
}

/** Where one plugin came from and what vouches for it, line by line. */
function originLines(plugin: Installed): readonly string[] {
  const { from, revision, signed, installed_at: at } = plugin;
  const lines: string[] = [];
  if (said(from)) lines.push(m.plugin_from({ from }));
  if (said(revision)) lines.push(m.plugin_revision({ revision }));
  if (said(signed)) lines.push(m.plugin_signed({ signed }));
  if (said(at)) lines.push(m.plugin_installed_at({ when: whenOf(at) }));
  return lines;
}

/** What one plugin runs and what it fills, line by line. */
function placedLines(plugin: Installed): readonly string[] {
  const services = plugin.services.map((placed) => placed.service);
  const provides = plugin.provides ?? [];
  return [
    services.length === 0
      ? m.plugin_places_nothing()
      : m.plugin_places({ services: listed(services) }),
    provides.length === 0
      ? m.plugin_fills_nothing()
      : m.plugin_fills({ capabilities: listed(provides) }),
  ];
}

/**
 * One installed plugin, line by line: what it does, the version installed,
 * where it came from, what it runs and fills, and whether its source still
 * answers where the reading asked.
 */
export function installedLines(
  plugin: Installed,
  sources: readonly Source[],
): readonly string[] {
  const { description } = plugin;
  const source = sources.find((one) => one.plugin === plugin.plugin);
  return [
    ...(said(description) ? [description] : []),
    m.plugin_version({ version: plugin.version }),
    ...originLines(plugin),
    ...placedLines(plugin),
    ...(source === undefined ? [] : [sourceLine(source)]),
  ];
}

/** A capability a plugin's service fills by the operator's choice. */
export function substitutedLine(one: Substituted): string {
  return m.plugin_substituted({
    capability: one.capability,
    service: one.service,
    plugin: one.plugin,
  });
}
