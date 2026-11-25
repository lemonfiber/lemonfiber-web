/**
 * A backup or restore running now, in the words the disk screen says it in.
 *
 * Everything here is what the stack said of the copy: how much it has written
 * of how much it will, the part it is writing, and whether it is working,
 * slowed on purpose or stalled. Nothing is worked out from how long the stream
 * has been quiet, which says something about the connection and nothing about
 * the copy.
 */
import type { ByKind, Reading } from "@lemonfiber/sdk-ts";
import { bytes, rate } from "./figures";
import { whenOf } from "./instant";
import type { Tone } from "./state";
import * as m from "../paraglide/messages.js";

/** The backup or restore running on this machine now, or none. */
export type Copying = ByKind["copying"]["data"];

/** A backup or restore running now. */
export type Running = NonNullable<Copying["running"]>;

/** What a reading of the copy running holds, where it could be read. */
export function heldIn(
  read: Reading<Copying> | undefined,
): Copying | undefined {
  return read?.ok === true ? read.value : undefined;
}

/** The copy running, where one is. */
export function runningOf(copying: Copying | undefined): Running | undefined {
  return copying?.running ?? undefined;
}

/** What is running, as the panel's heading. */
export function titleOf(running: Running): string {
  return running.what === "backup" ? m.copying_backup() : m.copying_restore();
}

/** How much it has written of how much it will, in words. */
export function figuresOf(running: Running): string {
  return m.copying_written({
    written: bytes(running.written),
    whole: bytes(running.whole),
  });
}

/** How much it has written of how much it will, from 0 to 1. */
export function shareOf(running: Running): number {
  return running.whole > 0 ? running.written / running.whole : 0;
}

/** Whether it is working, slowed on purpose or stalled, in plain words. */
export function stateOf(running: Running): string {
  switch (running.state) {
    case "working":
      return m.copying_working();
    case "paced":
      return m.copying_paced({ limit: rate(running.limit) });
    case "stalled":
      return m.copying_stalled({ wrote: whenOf(running.wrote) });
  }
}

/** How loudly its state is drawn: a stall is worth looking at. */
export function toneOf(running: Running): Tone {
  return running.state === "stalled" ? "watch" : "calm";
}

/** The part it is writing now, as the stack names it. */
export function partOf(running: Running): string {
  return m.copying_part({ part: running.part });
}

/** When it started. */
export function startedOf(running: Running): string {
  return m.copying_started({ when: whenOf(running.started) });
}
