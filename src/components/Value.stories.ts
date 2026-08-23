import type { Meta, StoryObj } from "@storybook/svelte-vite";
import Value from "./Value.svelte";
import { everyState } from "../lib/state";
import * as m from "../paraglide/messages.js";

const meta = {
  title: "Foundations/Value",
  component: Value,
  argTypes: { state: { control: "select", options: everyState } },
} satisfies Meta<typeof Value>;

export default meta;
type Story = StoryObj<typeof meta>;

// The figures below are the only literals here: a figure is data the API
// already formatted, not a word the interface chose.

/** Measured now. The figure is what is true, so it gets full ink. */
export const Measured: Story = {
  args: { state: "known", figure: "4.1 MB/s" },
};

/**
 * The source has gone quiet. The figure is the last one it gave, which is
 * still the best answer there is — so it stays, dimmed, and says so.
 */
export const LastKnown: Story = {
  args: { state: "quiet", figure: "0 B/s" },
};

/**
 * Nothing ever measured this. Words, not a numeral: "0 B/s" and "not known"
 * mean opposite things, and a reader scanning a column must not be able to
 * mistake one for the other.
 */
export const NeverMeasured: Story = { args: { state: "unknown" } };

/** The screen has better words for the gap than the default ones. */
export const NeverMeasuredInItsOwnWords: Story = {
  args: { state: "unknown", absent: m.value_cannot_say() },
};

/**
 * Not running, so there is no figure to give. A zero here would read as a
 * measurement of nothing rather than the absence of one — so the words say
 * which of the two it is.
 */
export const NotRunning: Story = {
  args: { state: "stopped", absent: m.value_not_running() },
};

/** Under way and measured now, so it reads in full ink like any other figure. */
export const PartWay: Story = { args: { state: "part", figure: "9/11" } };
