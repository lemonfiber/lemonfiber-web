/**
 * Every credential the stack holds, described without being disclosed, in lines
 * a reader can carry.
 *
 * The inventory names each credential with where it stands, who produced it,
 * whose it is, where its value lives, the setting it is recorded under and
 * everything that authenticates with it. It carries no value and has no field a
 * value could go in, so nothing here can draw one. Beside the credentials comes
 * lemonfiber's own account of what keeping them in files protects against and
 * what it does not, passed on as written. Each credential granted to a
 * third-party plugin names the plugin, what it was granted for and when.
 *
 * What lemonfiber writes into the inventory is its own and is passed through
 * unchanged. The words around it live in `messages/`.
 */
import type { ByKind } from "@lemonfiber/sdk-ts";
import { whenOf } from "./history";
import { listed } from "./listed";
import * as m from "../paraglide/messages.js";

/** Every credential, and what storing them protects against. */
export type Inventory = ByKind["credentials"]["data"];

/** One credential, without its value. */
export type Held = Inventory["held"][number];

/** One credential of another service granted to a third-party plugin. */
export type Granted = Inventory["grants"][number];

/** Where one credential stands, in a few words. */
export function wordOfState(state: Held["state"]): string {
  switch (state) {
    case "absent":
      return m.credential_absent();
    case "active":
      return m.credential_active();
    case "stale":
      return m.credential_stale();
    case "invalid":
      return m.credential_invalid();
    case "rotating":
      return m.credential_rotating();
    case "superseded":
      return m.credential_superseded();
    default:
      return m.credential_state_other();
  }
}

/** Who produced one credential, in a few words. */
export function wordOfMaker(origin: Held["origin"]): string {
  switch (origin) {
    case "operator":
      return m.credential_by_operator();
    case "service":
      return m.credential_by_service();
    case "lemonfiber":
      return m.credential_by_lemonfiber();
    default:
      return m.credential_by_other();
  }
}

/** Whose line one credential is, in a few words. */
export function wordOfOwner(from: Held["from"]): string {
  switch (from.origin) {
    case "bundled":
    case "operator":
      return m.credential_of_stack();
    case "plugin":
    case "overridden":
    case "orphaned":
      return m.credential_of_plugin({ named: from.named });
    case "unknown":
      return m.credential_of_unknown({ why: from.why });
    default:
      return m.credential_of_other();
  }
}

/** One credential, line by line, with no value among them. */
export function heldLines(one: Held): readonly string[] {
  const lines = [
    wordOfState(one.state),
    wordOfMaker(one.origin),
    wordOfOwner(one.from),
    m.credential_location({ location: one.location }),
    m.credential_setting({ setting: one.setting }),
    one.consumers.length === 0
      ? m.credential_unused()
      : m.credential_consumers({ consumers: listed(one.consumers) }),
  ];
  const { fingerprint, advisory } = one;
  if (fingerprint !== undefined && fingerprint !== null) {
    lines.push(m.credential_fingerprint({ fingerprint }));
  }
  if (advisory !== undefined && advisory !== null) lines.push(advisory);
  return lines;
}

/** Every grant of one credential, in the order the inventory lists them. */
export function grantsOf(
  one: Held,
  grants: readonly Granted[],
): readonly Granted[] {
  return grants.filter((grant) => grant.credential === one.setting);
}

/** Every grant of a credential the inventory lists nowhere else. */
export function strayGrants(inventory: Inventory): readonly Granted[] {
  const settings = new Set(inventory.held.map((one) => one.setting));
  return inventory.grants.filter((grant) => !settings.has(grant.credential));
}

/**
 * One grant beside the credential it crosses, in a line: the plugin it is
 * granted to, what for, and when it was approved.
 */
export function grantLine(grant: Granted): string {
  return m.credential_granted({
    plugin: grant.plugin,
    capability: grant.for,
    when: whenOf(grant.at),
  });
}

/** One grant on its own, in a line that also names the credential and whose it is. */
export function strayGrantLine(grant: Granted): string {
  return m.credential_granted_stray({
    credential: grant.credential,
    of: grant.of,
    plugin: grant.plugin,
    capability: grant.for,
    when: whenOf(grant.at),
  });
}
