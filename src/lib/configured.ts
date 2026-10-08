/**
 * What a setting holds, and what changing one came to, in lines a record can
 * carry.
 *
 * A change answers with where it stands (applied, staged for a yes, turned
 * away, or nothing to do), the difference between the value in force and the
 * one proposed, and what the change costs: what it stops, what it keeps, what
 * it newly asks for, what is still coming down, an edit found in the file, and
 * what moving the data location does to each library. A replacement
 * credential is proven against its service before the old one goes.
 *
 * What lemonfiber writes into a report, such as a consequence, a reason, a
 * setting's value or a service's name, is its own and is passed through
 * unchanged. The words around them live in `messages/`.
 */
import type { ByKind } from "@lemonfiber/sdk-ts";
import { listed } from "./listed";
import * as m from "../paraglide/messages.js";

/** Every setting asked about, or what changing one came to. */
export type Configured = ByKind["config"]["data"];

/** One setting, its value, and where the value came from. */
export type Setting = Configured["settings"][number];

/** A proposed change, and where it stands. */
type Review = NonNullable<Configured["review"]>;

/** What the change costs, found before it was made. */
type Findings = NonNullable<Review["findings"]>;

/** What proving a replacement credential came to. */
type Proof = NonNullable<Review["proof"]>;

/** Where a setting's value came from, in a few words. */
export function originWords(origin: Setting["origin"]): string {
  switch (origin.origin) {
    case "bundled":
      return m.config_origin_bundled();
    case "operator":
      return m.config_origin_operator();
    case "plugin":
      return m.config_origin_plugin({ named: origin.named });
    case "overridden":
      return m.config_origin_overridden({ named: origin.named });
    case "orphaned":
      return m.config_origin_orphaned({ named: origin.named });
    case "unknown":
      return m.config_origin_unknown({ why: origin.why });
    default:
      return m.config_origin_other();
  }
}

/** Where the proposal stands, and the difference it makes. */
function stanceLine(review: Review): string {
  const { key, to } = review.change;
  const from = review.change.from ?? m.config_value_unset();
  switch (review.stance) {
    case "applied":
      return m.came_config_applied({ key, from, to });
    case "pending":
      return m.came_config_pending({ key, from, to });
    case "unchanged":
      return m.came_config_unchanged({ key, to });
    case "blocked":
      return m.came_config_blocked({ key });
    default:
      return m.came_config_other({ key });
  }
}

/** What the change costs, line by line. */
function findingLines(findings: Findings): readonly string[] {
  const lines: string[] = [];
  if (findings.stops.length > 0) {
    lines.push(m.came_config_stops({ names: listed(findings.stops) }));
  }
  if (findings.keeps.length > 0) {
    lines.push(m.came_config_keeps({ names: listed(findings.keeps) }));
  }
  for (const opening of findings.opens) {
    lines.push(
      m.came_config_opens({ what: opening.what, because: opening.because }),
    );
  }
  for (const active of findings.active) {
    lines.push(
      m.came_config_active({
        name: active.name,
        protocol: active.protocol,
        progress: String(active.progress),
      }),
    );
  }
  const { edited } = findings;
  if (edited !== undefined && edited !== null) {
    lines.push(
      m.came_config_edited({ found: edited.found, wrote: edited.wrote }),
    );
  }
  for (const library of findings.library) {
    const said = { service: library.service, path: library.path };
    lines.push(
      library.carried
        ? m.came_config_library_carried(said)
        : m.came_config_library_lost(said),
      library.because,
    );
  }
  return lines;
}

/** What proving a replacement credential came to. */
function proofLine(proof: Proof): string {
  switch (proof.outcome) {
    case "valid":
      return m.came_config_proof_valid({ observed: proof.observed });
    case "rejected":
      return m.came_config_proof_rejected({ detail: proof.detail });
    case "unreachable":
      return m.came_config_proof_unreachable({ detail: proof.detail });
    case "degraded":
      return m.came_config_proof_degraded({ detail: proof.detail });
    default:
      return m.came_config_proof_other();
  }
}

/** What changing a setting came to, line by line. */
export function configLines(report: Configured): readonly string[] {
  const lines: string[] = [];
  if (report.rehearsed) lines.push(m.came_rehearsed());
  const { review } = report;
  if (review === undefined || review === null) {
    lines.push(m.came_config_read({ count: String(report.settings.length) }));
    return lines;
  }
  lines.push(stanceLine(review));
  if (review.refusal !== undefined && review.refusal !== null) {
    lines.push(review.refusal);
  }
  if (report.consequence !== undefined && report.consequence !== null) {
    lines.push(report.consequence);
  }
  if (review.findings !== undefined) {
    lines.push(...findingLines(review.findings));
  }
  if (review.proof !== undefined && review.proof !== null) {
    lines.push(proofLine(review.proof));
  }
  return lines;
}
