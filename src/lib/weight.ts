/**
 * How much a control insists.
 *
 * A screen offers several things and wants one of them pressed. `firm` is that
 * one; everything else is `quiet`, so a row of controls has a single centre of
 * gravity rather than several competing for it.
 *
 * Spec: 10-functional/features/g-ux/g1-interface-tiers.md
 */

/**
 * `quiet` is offered; `firm` is the one being asked for.
 */
export type Weight = "quiet" | "firm";

/**
 * Every weight there is, in the order they grow.
 *
 * A screen, a story and a test all walk this one list, as they do for states
 * and severities.
 */
export const everyWeight: readonly Weight[] = ["quiet", "firm"];
