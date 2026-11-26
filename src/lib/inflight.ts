/**
 * What a stop would interrupt: each download still coming down inside what an
 * act would stop, with how far along it is and the kind of client holding it.
 *
 * Read before a stop, an update, an uninstall, a configuration change, a
 * restart or a switch is agreed to. Where the stack names nothing, nothing is
 * said. Where it could not be asked, that is said, and the act is still
 * offered.
 */
import type { ByKind, Reading } from "@lemonfiber/sdk-ts";
import * as m from "../paraglide/messages.js";

/** What a stop would interrupt. */
export type InFlight = ByKind["in-flight"]["data"];

/** One download a stop would interrupt. */
export type Unfinished = InFlight["downloads"][number];

/**
 * What an act would stop: the forms it names, narrowed to the services it
 * names where it names some, or the whole stack where it names neither.
 */
export interface Stopping {
  readonly forms: readonly string[];
  readonly services: readonly string[];
}

/** What an act stops where it names no form and no service. */
export const wholeStack: Stopping = { forms: [], services: [] };

/** What stopping only these services would stop. */
export function stoppingServices(services: readonly string[]): Stopping {
  return { forms: [], services };
}

/** What stopping these forms would stop, or the whole stack where none is named. */
export function stoppingForms(forms: readonly string[]): Stopping {
  return { forms, services: [] };
}

/** One name for what an act would stop, the same for the same forms and services. */
export function stoppingKey(stopping: Stopping): string {
  return JSON.stringify([stopping.forms, stopping.services]);
}

/** Looks up what the stack last said a stop would interrupt, while one is asked. */
export type InFlightOf = (stopping: Stopping) => Reading<InFlight> | undefined;

/** What a question is told about what its act would interrupt. */
export interface Interrupted {
  /** What is said above the downloads, where anything is. */
  readonly said: string | undefined;
  /** Each download, in the order the stack names them. */
  readonly downloads: readonly Unfinished[];
  /** Whether the stack has answered or failed to, so the act may be agreed to. */
  readonly ready: boolean;
  /** Whether letting the downloads finish first is offered beside going ahead. */
  readonly finishing: boolean;
}

/** What a question is told where its act stops nothing. */
export const interruptsNothing: Interrupted = {
  said: undefined,
  downloads: [],
  ready: true,
  finishing: false,
};

/** The kind of client holding a download, in a word. */
export function protocolWord(protocol: Unfinished["protocol"]): string {
  switch (protocol) {
    case "usenet":
      return m.inflight_usenet();
    case "torrent":
      return m.inflight_torrent();
    default:
      return m.inflight_other();
  }
}

/** One download, in a sentence. */
export function unfinishedLine(download: Unfinished): string {
  return m.inflight_line({
    name: download.name,
    progress: download.progress,
    client: protocolWord(download.protocol),
  });
}

/**
 * What a question says about what its act would interrupt, read or not.
 *
 * `waits` is whether the act takes `wait`, so it can let the downloads finish
 * first; that is offered where any is named and where the stack could not say.
 */
export function interruptedBy(
  reading: Reading<InFlight> | undefined,
  waits: boolean,
): Interrupted {
  if (reading === undefined) {
    return { ...interruptsNothing, said: m.inflight_checking(), ready: false };
  }
  if (!reading.ok) {
    return {
      ...interruptsNothing,
      said: m.inflight_unknown(),
      finishing: waits,
    };
  }
  const { downloads } = reading.value;
  if (downloads.length === 0) return interruptsNothing;
  return {
    said: waits ? m.inflight_choose() : m.inflight_interrupted(),
    downloads,
    ready: true,
    finishing: waits,
  };
}
