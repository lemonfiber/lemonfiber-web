/**
 * What the signed-in key can use, as lemonfiber said once per session.
 *
 * Each request is named by the path it is served at. A read or an action the
 * key may use is drawn as it always is; a panel whose read it may not use is
 * drawn silenced, with one sentence saying why, and a control it may not use is
 * not drawn. Nothing is decided from a version: what was not said, because the
 * capabilities have not been read or could not be, silences nothing.
 */
import {
  READS,
  type ActionName,
  type BodyRoute,
  type ByKind,
  type ReadName,
  type Reading,
} from "@lemonfiber/sdk-ts";
import type { Revocation } from "./previewed";
import * as m from "../paraglide/messages.js";

/** What the stack can do, as the signed-in key may do it. */
export type Able = ByKind["capabilities"]["data"];

/** What one request comes to for the signed-in key. */
export type Standing = Able["capabilities"][string];

/** Where the actions are served, each under its own name. */
const ACTED_AT = "/api/actions/";

/** The path an action is served at. */
export function actedAt(name: ActionName): string {
  return `${ACTED_AT}${name}`;
}

/** Where each revocation is served, a preview of it included, as the capabilities name it. */
const REVOKED_AT = {
  "key-revoke": "/api/keys/{name}",
  "device-key-revoke": "/api/device-keys/{name}",
  "push-endpoint-remove": "/api/push-endpoints/{name}",
} as const satisfies Record<Revocation, BodyRoute>;

/** The path a revocation is served at, with the name it takes written `{name}`. */
export function revokedAt(revocation: Revocation): string {
  return REVOKED_AT[revocation];
}

/** The path a read is served at. */
export function readAt(name: ReadName): string {
  return READS[name].path;
}

/**
 * What one request comes to: its standing, `absent` where the stack said it
 * has no such request, and nothing where nothing was said.
 */
export function standingAt(
  able: Able | undefined,
  path: string,
): Standing | "absent" | undefined {
  if (able === undefined) return undefined;
  return Object.hasOwn(able.capabilities, path)
    ? able.capabilities[path]
    : "absent";
}

/** Whether a control asking for what is served at `path` may be drawn. */
function usable(able: Able | undefined, path: string): boolean {
  const standing = standingAt(able, path);
  return standing === undefined || standing === "available";
}

/** Whether a control asking for the action named may be drawn. */
export function drawn(able: Able | undefined, name: ActionName): boolean {
  return usable(able, actedAt(name));
}

/** Whether a control asking for a revocation, or a preview of it, may be drawn. */
export function revocable(
  able: Able | undefined,
  revocation: Revocation,
): boolean {
  return usable(able, revokedAt(revocation));
}

/** Why a request cannot be used, in a sentence. */
function because(standing: Exclude<Standing, "available"> | "absent"): string {
  switch (standing) {
    case "unconfigured":
      return m.able_unconfigured();
    case "unpermitted":
      return m.able_unpermitted();
    case "absent":
      return m.able_absent();
  }
}

/**
 * The one sentence a panel whose read the key cannot use is silenced with, or
 * nothing where it can be used. lemonfiber's own words come first, where the
 * read itself was answered with them.
 */
export function silenced(
  able: Able | undefined,
  name: ReadName,
  answer?: Reading<unknown>,
): string | undefined {
  const standing = standingAt(able, readAt(name));
  if (standing === undefined || standing === "available") return undefined;
  return answer?.ok === false ? answer.problem.message : because(standing);
}
