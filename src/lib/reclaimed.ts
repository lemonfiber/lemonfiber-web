/**
 * What of the disk could be got back and what each part would cost, and what
 * taking back what costs nothing came to, in lines a reader and a record can
 * carry.
 *
 * The accounting names every part of the disk that could be got back, each
 * with what it occupies and what getting it back would cost. lemonfiber offers
 * only the parts that cost nothing: downloads nothing ever took, and archives
 * whose unpacked copy is the one in use. A download still being shared costs
 * standing with its tracker and is left with the operator, and what they asked
 * to be left alone is not on offer at all.
 *
 * What lemonfiber writes into a report is its own and is passed through
 * unchanged. The words around it live in `messages/`.
 */
import { bytes } from "./figures";
import type { Reckoned } from "./letting";
import * as m from "../paraglide/messages.js";

/** One part of the disk that could be got back. */
export type Part = Reckoned["reclaimable"][number];

/** What getting one part back would cost. */
export type Cost = Part["reclaim"];

/** The costs lemonfiber offers to take a part back at, which are none. */
const FREE: ReadonlySet<Cost> = new Set(["the_easy_win", "already_have_it"]);

/** Whether lemonfiber offers to take a part back, which it does where it costs nothing. */
export function offered(part: Part): boolean {
  return FREE.has(part.reclaim);
}

/** What one part of the disk is, in a few words. */
export function wordOfCategory(category: Part["category"]): string {
  switch (category.of) {
    case "tree":
      return category.name;
    case "landing":
      return m.reclaim_landing();
    case "seeding":
      return m.reclaim_seeding();
    case "orphaned":
      return m.reclaim_orphaned();
    case "extracted":
      return m.reclaim_extracted();
    case "services":
      return m.reclaim_services();
    case "unmanaged":
      return m.reclaim_unmanaged();
    default:
      return m.reclaim_unrecognised();
  }
}

/** What getting one part back would cost, in a few words. */
export function wordOfCost(cost: Cost): string {
  switch (cost) {
    case "by_losing_content":
      return m.reclaim_cost_losing();
    case "in_progress":
      return m.reclaim_cost_landing();
    case "at_the_cost_of_ratio":
      return m.reclaim_cost_tracker();
    case "the_easy_win":
      return m.reclaim_cost_untaken();
    case "already_have_it":
      return m.reclaim_cost_unpacked();
    case "marginally":
      return m.reclaim_cost_little();
    case "you_said_not":
      return m.reclaim_cost_refused();
    default:
      return m.reclaim_cost_unrecognised();
  }
}

/** One part of the disk, in a line: what it is, what it occupies, and what getting it back costs. */
export function partLine(part: Part): string {
  return m.reclaim_part({
    part: wordOfCategory(part.category),
    size: bytes(part.tally.physical),
    cost: wordOfCost(part.reclaim),
  });
}

/** What taking back every part on offer would give back, in bytes. */
export function offeredBytes(reckoned: Reckoned): number {
  return reckoned.reclaimable
    .filter(offered)
    .reduce((total, part) => total + part.tally.physical, 0);
}

/**
 * What taking back what costs nothing came to, line by line: how much it gave
 * back, and each thing it could not take with what the platform said.
 */
export function reclaimedLines(report: Reckoned): readonly string[] {
  const { reclaimed } = report;
  if (reclaimed === undefined || reclaimed === null) {
    return [m.came_reclaim_untaken()];
  }
  return [
    ...(reclaimed.rehearsed ? [m.came_rehearsed()] : []),
    m.came_reclaim_taken({ size: bytes(reclaimed.bytes) }),
    ...reclaimed.left.map((left) =>
      m.came_reclaim_left({ at: left.at, why: left.why }),
    ),
  ];
}
