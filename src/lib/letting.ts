/**
 * The completed downloads the disk accounting names, and letting one go, in
 * lines a reader and a record can carry.
 *
 * The accounting answers with every completed download, what it takes up and
 * where it stands: never put in the library, left alone as the operator said,
 * or still being shared, with how much it has sent against what it received.
 * Letting one go answers first with what that costs and what goes with it,
 * and then with what the client let go.
 *
 * What lemonfiber writes into a report is its own and is passed through
 * unchanged. The words around it live in `messages/`.
 */
import type { ByKind } from "@lemonfiber/sdk-ts";
import { bytes } from "./figures";
import * as m from "../paraglide/messages.js";

/** Where the disk stands, and what could be got back. */
export type Reckoned = ByKind["space"]["data"];

/** Letting one completed download go, offered or answered. */
export type Let = ByKind["stop-seeding"]["data"];

/** One completed download, as the accounting names it. */
export type Candidate = Reckoned["candidates"][number];

/** Where one completed download stands, in a few words. */
export function wordOfCandidate(standing: Candidate["standing"]): string {
  switch (standing.standing) {
    case "never_imported":
      return m.candidate_never_imported();
    case "left_alone":
      return m.candidate_left_alone();
    case "seeding":
      return m.candidate_seeding({ ratio: (standing.ratio / 100).toFixed(2) });
    default:
      return m.candidate_unrecognised();
  }
}

/** Whether a completed download is still being shared, which is what letting go is for. */
export function seeding(candidate: Candidate): boolean {
  return candidate.standing.standing === "seeding";
}

/**
 * One completed download, line by line: what it takes up and where it stands,
 * and what removing it costs where it costs anything.
 */
export function candidateLines(candidate: Candidate): readonly string[] {
  const lines = [
    m.candidate_size({ size: bytes(candidate.bytes) }),
    wordOfCandidate(candidate.standing),
  ];
  const { consequence } = candidate;
  if (consequence !== undefined && consequence !== null) {
    lines.push(consequence);
  }
  return lines;
}

/** What letting a download go would cost, or what it came to, line by line. */
export function lettingLines(report: Let): readonly string[] {
  const { gone } = report;
  if (gone === undefined || gone === null) {
    return [
      m.letting_offered({ name: report.download.name }),
      ...candidateLines(report.download),
      report.goes,
    ];
  }
  return [
    ...(gone.rehearsed ? [m.came_rehearsed()] : []),
    m.letting_gone({ name: gone.name, size: bytes(gone.bytes) }),
  ];
}
