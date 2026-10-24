/**
 * What ending a plugin's grant of a credential would come to, or came to, in
 * lines a reader can carry.
 *
 * A reading names the grant it would end, the plugin's services that would
 * restart once the credential is withdrawn, that the plugin stays installed
 * with what the credential was for left unfilled, and that a value already
 * handed is taken back only by rotating the credential. What a revoke that ran
 * came to says whether the grant ended, what restarted, and why nothing did
 * where lemonfiber says so.
 *
 * What lemonfiber writes into a report is its own and is passed through
 * unchanged. The words around it live in `messages/`.
 */
import type { Inventory } from "./credentials";
import { listed } from "./listed";
import * as m from "../paraglide/messages.js";

/** What ending one grant would come to, or came to. */
export type Revoked = NonNullable<Inventory["revoked"]>;

/** What stays once a grant is ended, line by line. */
function afterLines(revoked: Revoked): readonly string[] {
  const { grant } = revoked;
  return [
    m.credential_revoke_stays({
      plugin: grant.plugin,
      capability: grant.for,
    }),
    m.credential_revoke_rotate({ credential: grant.credential }),
  ];
}

/**
 * What ending a grant would do, line by line: the grant it ends, what
 * restarts, and what stays.
 */
export function revokeLines(revoked: Revoked): readonly string[] {
  const { grant, restarts } = revoked;
  return [
    m.credential_revoke_ends({
      plugin: grant.plugin,
      credential: grant.credential,
      of: grant.of,
      capability: grant.for,
    }),
    restarts.length === 0
      ? m.credential_revoke_restarts_none()
      : m.credential_revoke_restarts({ services: listed(restarts) }),
    ...afterLines(revoked),
  ];
}

/** What a revoke that ran came to, line by line. */
function endedLines(revoked: Revoked): readonly string[] {
  const { grant, restarts, unrestarted } = revoked;
  const named = { plugin: grant.plugin, credential: grant.credential };
  const lines = [
    revoked.ended ? m.came_grant_ended(named) : m.came_grant_not_ended(named),
  ];
  if (restarts.length > 0) {
    lines.push(m.came_grant_restarted({ services: listed(restarts) }));
  }
  if (unrestarted !== undefined && unrestarted !== null) {
    lines.push(m.came_grant_unrestarted({ why: unrestarted }));
  }
  return [...lines, ...afterLines(revoked)];
}

/**
 * What a record of the credentials panel's asking says it came to, line by
 * line. A reading says it changed nothing and names itself; the reading is
 * drawn whole beside its yes.
 */
export function revokedLines(report: Inventory): readonly string[] {
  const { revoked } = report;
  if (revoked === undefined || revoked === null) {
    return [m.came_credentials_read({ count: report.held.length })];
  }
  if (report.rehearsed) {
    return [
      m.came_rehearsed(),
      m.credential_revoke_named({ offer: revoked.agreement }),
    ];
  }
  return endedLines(revoked);
}
