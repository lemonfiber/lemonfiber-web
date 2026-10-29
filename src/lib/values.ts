/**
 * Every setting the stack's services read from the operator, every secret they
 * read, and what moving or clearing settings would come to, or came to, in
 * lines a reader can carry.
 *
 * A setting is a value a service's environment reads from the operator rather
 * than from its manifest. The read says whose it is, the value the operator
 * recorded or the default each reader falls back on, each service that reads it
 * and the variable it is read into, and the values it accepts with whether
 * each is a choice now. A secret is named without its value. A change names
 * each setting it moves, every entry it rewrites, every service it restarts,
 * every service held back that it starts, and every service still held back
 * once it is made.
 *
 * What lemonfiber writes into a report, such as a setting's name, a value, a
 * consequence or a reason, is its own and is passed through unchanged. The
 * words around them live in `messages/`.
 */
import type { ByKind } from "@lemonfiber/sdk-ts";
import { listed } from "./listed";
import { unvettedLines } from "./unvetted";
import { stillHeldLines } from "./waiting";
import * as m from "../paraglide/messages.js";

/** Every setting and secret, and what changing settings came to. */
export type Values = ByKind["settings"]["data"];

/** One setting. */
export type ValueRead = Values["settings"][number];

/** One secret, without its value. */
export type SecretRead = Values["secrets"][number];

/** One service reading a setting or a secret. */
type Reader = ValueRead["readers"][number];

/** A change to one or more settings, made in one act. */
export type Change = NonNullable<Values["change"]>;

/** One setting a change moves. */
type Move = Change["settings"][number];

/** Whether lemonfiber said something here. */
function said(text: string | null | undefined): text is string {
  return text !== undefined && text !== null && text !== "";
}

/** Whose a setting or a secret is. */
export function whoseWords(whose: ValueRead["whose"]): string {
  return whose.of === "core"
    ? m.values_whose_core()
    : m.values_whose({ namespace: whose.namespace });
}

/**
 * What a setting holds: the operator's value where one is recorded, otherwise
 * the default its readers fall back on.
 */
export function valueWords(setting: ValueRead): string {
  if (said(setting.value)) return m.values_value({ value: setting.value });
  const defaults = [
    ...new Set(setting.readers.map((one) => one.default).filter(said)),
  ];
  if (defaults.length === 0) return m.values_unset();
  const [only] = defaults;
  return defaults.length === 1 && only !== undefined
    ? m.values_default({ value: only })
    : m.values_defaults({ values: listed(defaults) });
}

/** The settings and values a reading of it, or a choice, is written under. */
function needsWords(
  needs: Readonly<Record<string, readonly string[]>>,
): string {
  return listed(
    Object.entries(needs).map(([setting, values]) =>
      m.values_needs({ setting, values: listed(values) }),
    ),
  );
}

/** One service reading a setting or a secret, and what it waits for to. */
export function readerWords(reader: Reader): string {
  const { service, variable } = reader;
  return reader.met
    ? m.values_reader({ service, variable })
    : m.values_reader_waiting({
        service,
        variable,
        needs: needsWords(reader.needs),
      });
}

/** Every value a setting accepts now, where it declares choices. */
export function openChoices(setting: ValueRead): readonly string[] {
  return (setting.choices ?? [])
    .filter((one) => one.open)
    .map((one) => one.value);
}

/**
 * What a setting is besides its value, line by line: where it was filed from,
 * the values it accepts, and each service that reads it.
 */
export function aboutLines(setting: ValueRead): readonly string[] {
  const lines: string[] = [];
  if (said(setting.environment)) {
    lines.push(m.values_environment({ key: setting.environment }));
  }
  const open = openChoices(setting);
  if (open.length > 0) lines.push(m.values_choices({ values: listed(open) }));
  const closed = (setting.choices ?? [])
    .filter((one) => !one.open)
    .map((one) => one.value);
  if (closed.length > 0) {
    lines.push(m.values_choices_closed({ values: listed(closed) }));
  }
  return [...lines, ...setting.readers.map(readerWords)];
}

/** Where a secret's value came from. */
function fromWords(from: NonNullable<SecretRead["from"]>): string {
  switch (from) {
    case "operator":
      return m.values_from_operator();
    case "recipe":
      return m.values_from_recipe();
    case "granted":
      return m.values_from_granted();
    case "minted":
      return m.values_from_minted();
  }
}

/** Whether a secret is held, and where its value came from, never the value. */
export function secretWords(secret: SecretRead): string {
  const { from } = secret;
  if (!secret.held) return m.values_secret_missing();
  return from === undefined || from === null
    ? m.values_secret_held({ from: m.values_from_operator() })
    : m.values_secret_held({ from: fromWords(from) });
}

/** One setting a change moves, in a line. */
function moveLine(move: Move): string {
  const { setting, was, value } = move;
  if (said(value)) {
    return said(was)
      ? m.values_move({ setting, was, value })
      : m.values_move_set({ setting, value });
  }
  return said(was)
    ? m.values_move_cleared({ setting, was })
    : m.values_move_cleared_unset({ setting });
}

/**
 * What a change would do, line by line: each setting it moves with what moving
 * it costs, every entry it rewrites, what it restarts, every service held back
 * that it starts, and every service still held back once it is made.
 */
export function changeLines(change: Change): readonly string[] {
  const lines: string[] = [];
  for (const move of change.settings) {
    lines.push(moveLine(move));
    if (said(move.consequence)) lines.push(move.consequence);
  }
  if (change.regenerates.length > 0) {
    lines.push(m.values_regenerates({ services: listed(change.regenerates) }));
  }
  lines.push(
    change.restarts.length === 0
      ? m.values_restarts_none()
      : m.values_restarts({ services: listed(change.restarts) }),
  );
  if (change.starts.length > 0) {
    lines.push(m.values_starts({ services: listed(change.starts) }));
  }
  return [...lines, ...stillHeldLines(change.waiting)];
}

/** What a change that ran came to, line by line. */
function madeLines(change: Change): readonly string[] {
  const lines = [
    change.applied ? m.came_values_made() : m.came_values_not_made(),
    ...change.settings.map(moveLine),
  ];
  if (change.applied && change.restarts.length > 0) {
    lines.push(m.values_restarts({ services: listed(change.restarts) }));
  }
  if (said(change.unrestarted)) {
    lines.push(m.came_values_unrestarted({ why: change.unrestarted }));
  }
  if (change.applied && change.starts.length > 0) {
    lines.push(m.values_starts({ services: listed(change.starts) }));
  }
  return [...lines, ...stillHeldLines(change.waiting)];
}

/**
 * What a record of the settings panel's asking says it came to, line by line.
 * A reading says it wrote nothing and names itself; the reading is drawn whole
 * beside its yes.
 */
export function valuedLines(report: Values): readonly string[] {
  const { change } = report;
  if (change === undefined || change === null) {
    return [m.came_values_read({ count: report.settings.length })];
  }
  if (report.rehearsed) {
    return [
      m.came_rehearsed(),
      m.values_offer_named({ offer: change.agreement }),
    ];
  }
  return [...madeLines(change), ...unvettedLines(report.unvetted)];
}
