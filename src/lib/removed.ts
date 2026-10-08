/**
 * Taking lemonfiber off this machine, and what keeps running when no terminal
 * is open, in lines a reader and a record can carry.
 *
 * A removal answers with what it takes and what it leaves, every line it
 * reaches with its size, what is still coming down, what lemonfiber cannot
 * remove and how to do it by hand, and how much of that was read. What
 * lemonfiber keeps answers with where it lives and why each thing is kept. A
 * hosting answers with every long-running command, where each stands, and what
 * one run changed.
 *
 * What lemonfiber writes into a report is its own and is passed through
 * unchanged. The words around it live in `messages/`.
 */
import type { ByKind } from "@lemonfiber/sdk-ts";
import { bytes } from "./figures";
import { listed } from "./listed";
import * as m from "../paraglide/messages.js";

/** Everything lemonfiber keeps on this machine, or what forgetting it did. */
export type Stored = ByKind["stored"]["data"];

/** One removal, before or after it happened. */
export type Uninstalled = ByKind["uninstall"]["data"];

/** What this machine keeps running on lemonfiber's behalf. */
export type Hosted = ByKind["hosting"]["data"];

/** Which of the four removals. */
export type Tier = Uninstalled["manifest"]["tier"];

/** Every removal, from the one that takes least to the one that takes most. */
export const everyTier: readonly Tier[] = [
  "stop",
  "services",
  "configuration",
  "media",
];

/** A removal, named where it is one choice among the others. */
export function labelOfTier(tier: Tier): string {
  switch (tier) {
    case "stop":
      return m.tier_stop();
    case "services":
      return m.tier_services();
    case "configuration":
      return m.tier_configuration();
    case "media":
      return m.tier_media();
  }
}

/** One line a removal reaches. */
type Item = Uninstalled["manifest"]["items"][number];

/**
 * One line a removal reaches, going or kept, with its size where known, and
 * the credential it destroys where it holds one.
 */
function itemLines(item: Item): readonly string[] {
  const { what, name } = item;
  if (item.kept !== undefined && item.kept !== null) {
    return [m.remove_item_kept({ what, name, why: item.kept })];
  }
  const going =
    item.bytes === undefined || item.bytes === null
      ? m.remove_item_going({ what, name })
      : m.remove_item_going_sized({ what, name, size: bytes(item.bytes) });
  return item.secret ? [going, m.remove_item_secret({ name })] : [going];
}

/** What became of a removal on this run, line by line. */
function removalLines(removal: Uninstalled["removal"]): readonly string[] {
  switch (removal.state) {
    case "surveyed":
      return [m.remove_surveyed()];
    case "confirmed":
      return [m.remove_confirmed()];
    case "complete":
      return [
        m.remove_gone({ names: listed(removal.gone) }),
        ...removal.credentials.map((one) => m.remove_credential({ what: one })),
      ];
    case "partial":
      return [
        m.remove_gone({ names: listed(removal.gone) }),
        ...removal.credentials.map((one) => m.remove_credential({ what: one })),
        ...removal.left.map((one) =>
          m.remove_left({ name: one.name, why: one.why, by_hand: one.by_hand }),
        ),
      ];
    default:
      return [m.remove_other()];
  }
}

/** What a removal would come to, or came to, line by line. */
export function uninstallLines(report: Uninstalled): readonly string[] {
  const { manifest } = report;
  const lines: string[] = [
    ...removalLines(report.removal),
    manifest.removes,
    manifest.keeps,
    m.remove_size({ size: bytes(manifest.bytes) }),
    ...manifest.items.flatMap(itemLines),
  ];
  for (const one of manifest.coming) {
    lines.push(
      m.remove_coming({
        name: one.name,
        progress: String(Math.round(one.progress)),
      }),
    );
  }
  for (const one of manifest.foreign) {
    lines.push(
      m.remove_foreign({
        at: one.at,
        files: String(one.files),
        size: bytes(one.bytes),
      }),
    );
  }
  for (const one of manifest.outside) {
    const { what, why } = one;
    lines.push(
      one.found
        ? m.remove_outside({ what, why, by_hand: one.by_hand })
        : m.remove_outside_unfound({ what, why, by_hand: one.by_hand }),
    );
  }
  for (const said of [manifest.backup, manifest.volume]) {
    if (said !== undefined && said !== null) lines.push(said);
  }
  if (!manifest.confidence.complete) {
    lines.push(m.remove_incomplete(), ...manifest.confidence.unread);
  }
  return lines;
}

/** What forgetting did on this run, line by line. */
function forgottenLines(removal: Stored["removal"]): readonly string[] {
  switch (removal.state) {
    case "not-asked":
      return [];
    case "unconfirmed":
      return [m.forget_unconfirmed()];
    case "done":
      return [
        m.forget_gone({ at: listed(removal.gone) }),
        ...removal.left.map((one) =>
          m.forget_left({ at: one.at, why: one.why }),
        ),
      ];
    default:
      return [m.forget_other()];
  }
}

/** Everything lemonfiber keeps, or what forgetting it did, line by line. */
export function storedLines(report: Stored): readonly string[] {
  const lines: string[] = [...forgottenLines(report.removal)];
  lines.push(
    ...report.roots.map((one) => m.forget_root({ what: one.what, at: one.at })),
    ...report.kept.map((one) =>
      one.secret
        ? m.forget_kept_secret({ what: one.what, at: one.at, why: one.why })
        : m.forget_kept({ what: one.what, at: one.at, why: one.why }),
    ),
    ...report.beside.map((one) =>
      m.forget_beside({ what: one.what, why: one.why }),
    ),
  );
  return lines;
}

/** One long-running command. */
type Command = Hosted["commands"][number];

/** Where one long-running command stands. */
type Standing = Command["standing"];

/** Where one long-running command stands, in a few words. */
export function wordOfHosting(standing: Standing): string {
  switch (standing) {
    case "not-hosted":
      return m.hosting_not_hosted();
    case "hosted":
      return m.hosting_hosted();
    case "installed-unverified":
      return m.hosting_unverified();
    case "stopped":
      return m.hosting_stopped();
    case "orphaned":
      return m.hosting_orphaned();
    case "unsupported":
      return m.hosting_unsupported();
    default:
      return m.hosting_unrecognised();
  }
}

/**
 * What one long-running command does, how it runs and where it stands, line
 * by line: what it does while it runs, the command it runs, and where its
 * definition, its output and anything missing are.
 */
export function commandLines(command: Command): readonly string[] {
  const lines = [
    command.guarantees,
    m.hosting_command({
      name: command.name,
      standing: wordOfHosting(command.standing),
    }),
    m.hosting_typed({ command: command.command }),
  ];
  const { runs, definition, output, missing } = command;
  if (runs !== undefined && runs !== null) lines.push(m.hosting_runs({ runs }));
  if (definition !== undefined && definition !== null) {
    lines.push(m.hosting_service_file({ at: definition }));
  }
  if (output !== undefined && output !== null) {
    lines.push(m.hosting_output({ at: output }));
  }
  if (missing !== undefined && missing !== null) {
    lines.push(m.hosting_missing({ program: missing }));
  }
  return lines;
}

/** What a hosting run changed, or where every command stands, line by line. */
export function hostingLines(report: Hosted): readonly string[] {
  const lines: string[] = [];
  const { changed } = report;
  if (changed !== undefined && changed !== null) {
    if (changed.rehearsed) lines.push(m.came_rehearsed());
    lines.push(
      changed.installed
        ? m.hosting_installed({ name: changed.name })
        : m.hosting_removed({ name: changed.name }),
    );
    if (changed.installed && !changed.started) {
      lines.push(m.hosting_not_started({ name: changed.name }));
    }
    lines.push(...changed.touched);
  }
  lines.push(
    ...report.commands.map((one) =>
      m.hosting_command({
        name: one.name,
        standing: wordOfHosting(one.standing),
      }),
    ),
  );
  for (const said of [report.caveat, report.instruction]) {
    if (said !== undefined && said !== null) lines.push(said);
  }
  return lines;
}
