/**
 * What stood in the way of part of an answer, in lines a reader can carry.
 *
 * lemonfiber names each by its code and says, a sentence each, what is in the
 * way and what to do about it. Both sentences are its own and are passed
 * through unchanged, the one after the other.
 */
import type { Obstacle } from "@lemonfiber/sdk-ts/contract";

export type { Obstacle };

/** What is in the way of each part, and what to do about it, line by line. */
export function obstacleLines(
  obstacles: readonly Obstacle[],
): readonly string[] {
  return obstacles.flatMap((one) => [one.said, one.remedy]);
}
