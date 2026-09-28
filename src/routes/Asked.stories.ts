import type { Meta, StoryObj } from "@storybook/svelte-vite";
import Asked from "./Asked.svelte";
import { yours, yoursSpent, yoursUnasked, yoursUnread } from "./mine";

const answered = { kind: "answered", secondsAgo: 8 } as const;
const silent = { kind: "silent", secondsAgo: 300 } as const;
const never = { kind: "never" } as const;

const meta = {
  title: "Surfaces/Asked",
  component: Asked,
  args: { household: yours, freshness: answered, quiet: false },
} satisfies Meta<typeof Asked>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * What a household member asked for, with what asking does before it: whether
 * it waits for somebody to approve it, and how much of their allowance is left.
 * One request did not work, and they are told the operator has been told; one
 * was turned down, and carries the reason it was turned down with.
 */
export const WhatTheyAskedFor: Story = {};

/**
 * Nothing left of the period's allowance. They are told so before they ask,
 * with the day one more becomes possible.
 */
export const NothingLeft: Story = { args: { household: yoursSpent } };

/**
 * Nothing asked for yet. The screen says what to do first rather than drawing
 * an empty table.
 */
export const NothingAskedYet: Story = { args: { household: yoursUnasked } };

/**
 * The household could not be read. The same empty list as the story above it,
 * and the opposite fact.
 */
export const NothingCouldBeRead: Story = { args: { household: yoursUnread } };

/**
 * lemonfiber stopped answering. What they asked for stays as it stood when it
 * last answered, stamped with how long it has been quiet, and asking for
 * anything new is declined rather than queued.
 */
export const WhileNothingAnswers: Story = {
  args: { quiet: true, freshness: silent, onretry: () => undefined },
};

/**
 * lemonfiber has not answered yet. The panel holds a place rather than saying
 * nothing was asked for.
 */
export const BeforeAnythingAnswers: Story = {
  args: { household: undefined, freshness: never },
};
