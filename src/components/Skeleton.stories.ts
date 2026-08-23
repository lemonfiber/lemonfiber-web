import type { Meta, StoryObj } from "@storybook/svelte-vite";
import Skeleton from "./Skeleton.svelte";
import * as m from "../paraglide/messages.js";

const meta = {
  title: "Surfaces/Skeleton",
  component: Skeleton,
} satisfies Meta<typeof Skeleton>;

export default meta;
type Story = StoryObj<typeof meta>;

// The widths below are the only literals here: a bar stands for the text that
// is coming, so its width is the width of that text.

/**
 * A line on its way. This is the bar that carries the words, so a run of them
 * is announced once — the rest of the run says nothing.
 */
export const HoldingALine: Story = {
  args: { width: "260px", label: m.waiting_next_line() },
};

/**
 * The rest of the run. It is a shape and nothing else, hidden from a screen
 * reader that has already been told what is coming.
 */
export const HoldingACell: Story = {
  args: { width: "64px" },
};
