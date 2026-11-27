/**
 * Where a member goes to watch and to ask, as the household's front door says.
 *
 * The door first, then everything else they can reach, each in lemonfiber's
 * household words: what it is to them, what it is for, and the address to open
 * it at. An address the read says does not answer from where they are is left
 * out, and so is one the read gives no address for; what lemonfiber said in its
 * place is said instead.
 */
import type { ByKind } from "@lemonfiber/sdk-ts";

/** The household's front door, as a member reads it. */
export type Door = ByKind["front-door"]["data"];

/** One place a member can go. */
export interface Way {
  readonly key: string;
  readonly service: string;
  readonly said: string;
  readonly url: string | undefined;
  readonly unaddressed: string | undefined;
}

/** What one address comes to: opened where it answers from here, else left out. */
function opened(
  address: Door["address"],
  reaches: Door["reaches"],
): string | undefined {
  if (reaches === "not-here") return undefined;
  return address?.url;
}

/** Every place the read names, the door first. */
export function waysOf(door: Door): readonly Way[] {
  const service = door.service ?? undefined;
  const first: readonly Way[] =
    service === undefined
      ? []
      : [
          {
            key: "door",
            service,
            said: door.meaning,
            url: opened(door.address, door.reaches),
            unaddressed: door.unaddressed ?? undefined,
          },
        ];
  return [
    ...first,
    ...door.beside.map((one, at): Way => ({
      key: `beside-${String(at)}`,
      service: one.service,
      said: one.because,
      url: opened(one.address, one.reaches),
      unaddressed: one.unaddressed ?? undefined,
    })),
  ];
}

/** What lemonfiber said where there is no door to begin at, and nothing where there is. */
export function nowhereOf(door: Door): string | undefined {
  return (door.service ?? undefined) === undefined ? door.meaning : undefined;
}
