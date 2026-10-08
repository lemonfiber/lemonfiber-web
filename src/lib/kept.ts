/**
 * What keeping a copy of the stack came to, in lines a record can carry.
 *
 * A backup answers with where the archive went and what it covers; a restore
 * with what the archive holds and what putting it back would overwrite, or with
 * what it put back; a support bundle with what it holds, how it was made, and
 * where it is or would go. Each is a finished action's outcome, read the way
 * every other one is.
 *
 * Sentences lemonfiber writes into a report, such as how much of the logs a
 * bundle took, are its own and are passed through unchanged. The words around
 * them live in `messages/`.
 */
import type { ByKind } from "@lemonfiber/sdk-ts";
import { bytes } from "./figures";
import { listed } from "./listed";
import * as m from "../paraglide/messages.js";

/** The backups this machine keeps, by the names they were written under. */
export type Archives = ByKind["archives"]["data"];

/** Where a backup was written, and what it covers. */
export type Backed = ByKind["backup"]["data"];

/** What a restore would overwrite, and what it put back where it did. */
export type Restored = ByKind["restore"]["data"];

/** What a support bundle holds, and where it is if it was written. */
export type Bundled = ByKind["bundle"]["data"];

/** An archive taken against another data location than this machine's. */
export type Relocation = NonNullable<Restored["would"]["relocation"]>;

/** How much of the stack an archive covers. */
type Scope = Backed["scope"];

/** What an archive covers, in a few words. */
export function scopeWords(scope: Scope): string {
  switch (scope.scope) {
    case "whole_stack":
      return m.came_scope_whole();
    case "service":
      return m.came_scope_service({ name: scope.name });
    case "existing":
      return m.came_scope_existing({ project: scope.project });
    default:
      return m.came_scope_other();
  }
}

/** Where a backup went, what it covers, and what retention took with it. */
export function backupLines(report: Backed): readonly string[] {
  const lines: string[] = [];
  if (report.rehearsed) lines.push(m.came_rehearsed());
  lines.push(
    m.came_backup_path({ path: report.path, scope: scopeWords(report.scope) }),
  );
  if (report.sensitive) lines.push(m.came_sensitive());
  if (report.pruned.length > 0) {
    lines.push(m.came_backup_pruned({ names: listed(report.pruned) }));
  }
  if (!report.pace.brisk) {
    lines.push(
      m.came_backup_slow({
        moved: bytes(report.pace.moved),
        budget: bytes(report.pace.budget),
      }),
    );
  }
  return lines;
}

/**
 * What an archive holds and what restoring it would come to, or what it put
 * back where it did.
 */
export function restoreLines(report: Restored): readonly string[] {
  const { done, would } = report;
  if (done !== undefined && done !== null) {
    const lines = [
      m.came_restore_done({
        scope: scopeWords(done.scope),
        version: done.from_version,
      }),
    ];
    if (done.relocated !== undefined && done.relocated !== null) {
      lines.push(m.came_restore_repointed(done.relocated));
    }
    return lines;
  }
  const lines = [
    m.came_restore_would({
      scope: scopeWords(would.manifest.scope),
      taken: would.manifest.created_at,
      version: would.manifest.product_version,
    }),
  ];
  if (would.relocation !== undefined && would.relocation !== null) {
    lines.push(m.came_restore_relocation(would.relocation));
  }
  if (would.downgrade) lines.push(m.came_restore_downgrade());
  if (would.manifest.sensitive) lines.push(m.came_sensitive());
  return lines;
}

/** What a bundle holds, how it was made, and where it is or would go. */
export function bundleLines(report: Bundled): readonly string[] {
  const { contents } = report;
  const size = bytes(report.bytes);
  const lines: string[] = [];
  if (report.path !== undefined && report.path !== null) {
    lines.push(m.came_bundle_written({ path: report.path, size }));
  } else if (report.would_go !== undefined && report.would_go !== null) {
    lines.push(m.came_bundle_would({ path: report.would_go, size }));
  }
  lines.push(
    m.came_bundle_taken({
      at: contents.taken.at,
      lemonfiber: contents.taken.lemonfiber,
      stack: contents.taken.stack,
    }),
    m.came_bundle_window({ window: contents.terms.window }),
    contents.terms.filenames
      ? m.came_bundle_filenames_shown()
      : m.came_bundle_filenames_replaced(),
  );
  if (contents.terms.revealed.length > 0) {
    lines.push(
      m.came_bundle_revealed({ names: listed(contents.terms.revealed) }),
    );
  }
  if (contents.missing.length > 0) {
    lines.push(m.came_bundle_missing({ names: listed(contents.missing) }));
  }
  return lines;
}
