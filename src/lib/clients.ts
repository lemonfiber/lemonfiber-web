/**
 * Which app to watch on, device by device, and what to do when it does not
 * work, in lines a reader can carry.
 *
 * The guidance is the same on every machine: it belongs to the apps rather
 * than to a stack. Each kind of device names what to use on it, whether that
 * app is open source, and how well the device is served, with a caution and
 * what to do instead where lemonfiber has one. Where the preset in force asks
 * more of this machine than it can give, that is said once, above every
 * device. What to do when it does not work is keyed by what somebody would say
 * is happening, each with what could be behind it, how to tell, and the fix.
 *
 * What lemonfiber writes into the guidance is its own and is passed through
 * unchanged. The words around it live in `messages/`.
 */
import type { ByKind } from "@lemonfiber/sdk-ts";
import * as m from "../paraglide/messages.js";

/** Which app to watch on, and what to do when it does not work. */
export type Guidance = ByKind["clients"]["data"];

/** One kind of device somebody in the house might watch on. */
export type Device = Guidance["devices"][number];

/** One thing that could be behind a symptom. */
export type Cause = Guidance["trouble"][number]["causes"][number];

/** How well a device is served, in a sentence. */
export function wordOfSupport(support: Device["support"]): string {
  switch (support) {
    case "good":
      return m.clients_good();
    case "workable":
      return m.clients_workable();
    case "poor":
      return m.clients_poor();
    case "fallback":
      return m.clients_fallback();
    default:
      return m.clients_support_other();
  }
}

/** One kind of device, line by line. */
export function deviceLines(device: Device): readonly string[] {
  const lines = [
    device.open_source
      ? m.clients_use({ client: device.client })
      : m.clients_use_closed({ client: device.client }),
    wordOfSupport(device.support),
  ];
  const { caution, instead } = device;
  if (caution !== undefined && caution !== null) lines.push(caution);
  if (instead !== undefined && instead !== null) lines.push(instead);
  return lines;
}

/** One thing that could be behind a symptom, line by line. */
export function causeLines(cause: Cause): readonly string[] {
  return [
    cause.because,
    m.clients_tell({ tell: cause.tell }),
    m.clients_fix({ fix: cause.fix }),
  ];
}
