/**
 * What the quality choice came to, in lines a record can carry.
 *
 * Putting the recorded preset back over a config edited by hand answers with
 * the choice in force and, where it replaced something, the file and the lines
 * that went. Fetching the library again answers, unconfirmed, with what each
 * kind of media would be fetched at and what an hour of it takes, and,
 * confirmed, with whether the search for each started.
 *
 * What lemonfiber writes into a report, such as a preset's name, a size or a
 * service's reason, is its own and is passed through unchanged. The words
 * around them live in `messages/`.
 */
import type { ByKind } from "@lemonfiber/sdk-ts";
import * as m from "../paraglide/messages.js";

/** The choice in force, or what putting it back came to. */
export type Tuned = ByKind["quality"]["data"];

/** What fetching the library again would cost, or what it started. */
export type Upgraded = ByKind["upgrade"]["data"];

/** What became of the choice, as the report names it. */
type Disposition = Tuned["disposition"];

/** One kind of media, and what fetching it again costs or came to. */
type Upgrading = Upgraded["media"][number];

/** What became of the choice, in one line. */
function dispositionWords(disposition: Disposition): string {
  switch (disposition) {
    case "reapplied":
      return m.came_quality_reapplied();
    case "would-reapply":
      return m.came_quality_would_reapply();
    case "recorded":
      return m.came_quality_recorded();
    case "held":
      return m.came_quality_held();
    case "rehearsed":
      return m.came_rehearsed();
    case "shown":
      return m.came_quality_shown();
    default:
      return m.came_quality_other();
  }
}

/** What putting the recorded preset back came to, line by line. */
export function qualityLines(report: Tuned): readonly string[] {
  const lines = [dispositionWords(report.disposition)];
  const { overwritten } = report;
  if (overwritten !== undefined && overwritten !== null) {
    lines.push(
      m.came_quality_overwritten({ path: overwritten.path }),
      overwritten.diff,
    );
  }
  return lines;
}

/** What became of fetching one kind of media again, where it was asked. */
function outcomeWords(media: Upgrading): string {
  const { outcome, media_type: kind } = media;
  if (outcome === undefined || outcome === null) {
    return m.came_upgrade_cost({
      kind,
      preset: media.preset,
      size: media.size_per_hour,
    });
  }
  switch (outcome.state) {
    case "started":
      return m.came_upgrade_started({ kind, preset: media.preset });
    case "not-started":
      return m.came_upgrade_not_started({ kind });
    case "failed":
      return m.came_upgrade_failed({ kind, detail: outcome.detail });
    default:
      return m.came_upgrade_other({ kind });
  }
}

/** What fetching the library again would cost, or what it started. */
export function upgradeLines(report: Upgraded): readonly string[] {
  const lines = report.media.map(outcomeWords);
  if (!report.confirmed) lines.push(m.came_upgrade_unconfirmed());
  return lines;
}
