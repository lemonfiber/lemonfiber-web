/**
 * What a household member was part-way through, in the words they read it in.
 *
 * How far in is the media server's own record of the member's playback, read
 * through lemonfiber, which keeps no copy of it. A length the server does not
 * know is left out rather than guessed, and with it how much is left.
 *
 * The words live in `messages/`, so no screen holds one.
 */
import type { ByKind } from "@lemonfiber/sdk-ts";
import { minutesOf } from "./title";
import type { Holding } from "./yours";
import * as m from "../paraglide/messages.js";

/** What the watching read answers for one member. */
export type PartWays = ByKind["part-way"]["data"];

/** One title or episode they were part-way through. */
export type PartWay = PartWays["part_way"][number];

/** Seconds in a minute, as the server counts how far in in seconds. */
const MINUTE = 60;

/** How long it runs, where the server knows a length worth measuring against. */
function lengthOf(one: PartWay): number | undefined {
  const length = one.length ?? undefined;
  return length === undefined || length <= 0 ? undefined : length;
}

/** How far through it they are, from 0 to 1, where its length is known. */
export function partOf(one: PartWay): number | undefined {
  const length = lengthOf(one);
  return length === undefined ? undefined : one.position / length;
}

/**
 * How far they got, in a few words: how much is left where its length is
 * known, and how far in where it is not.
 */
export function farOf(one: PartWay): string {
  const length = lengthOf(one);
  if (length === undefined) {
    return m.member_partway_in({
      far: minutesOf(Math.floor(one.position / MINUTE)),
    });
  }
  const left = Math.max(0, length - one.position);
  return m.member_partway_left({ left: minutesOf(Math.ceil(left / MINUTE)) });
}

/**
 * The shelf title it is, where it is one: a film or a series opens as the
 * shelf's titles do, and an episode is not a title of its own.
 */
export function shelvedAs(one: PartWay): Holding | undefined {
  if (one.medium === "episode") return undefined;
  return {
    id: one.id,
    medium: one.medium,
    title: one.title,
    year: one.year ?? null,
  };
}
