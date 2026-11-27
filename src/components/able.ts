/**
 * What the signed-in key can use, handed down to every panel and control.
 *
 * Held by the console that read it, and asked of by whatever draws a panel or a
 * control. Where nothing holds it, as in a story, a suite or a member's own
 * screens, nothing is silenced.
 */
import { getContext, setContext } from "svelte";
import type { Able } from "../lib/able";

/** What it is held under. */
export const ABLE = Symbol("able");

/** What it is asked through: whatever was last read, read again on each asking. */
export type Holding = () => Able | undefined;

/** Hold what the signed-in key can use for everything drawn beneath. */
export function holdAble(holding: Holding): void {
  setContext(ABLE, holding);
}

/** What the signed-in key can use, as held above, or nothing where nothing is. */
export function ableHere(): Holding {
  return getContext<Holding | undefined>(ABLE) ?? (() => undefined);
}
