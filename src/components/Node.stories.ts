import type { Meta, StoryObj } from "@storybook/svelte-vite";
import Node from "./Node.svelte";
import { everyState } from "../lib/state";
import * as m from "../paraglide/messages.js";

const meta = {
  title: "Surfaces/Node",
  component: Node,
  argTypes: { state: { control: "select", options: everyState } },
} satisfies Meta<typeof Node>;

export default meta;
type Story = StoryObj<typeof meta>;

// The figures and the program names below are the only literals here: an
// address, a rate and a container's name are data, not words this interface
// chose.

/** A program answering now. The mark says so, and the figure is what is true. */
export const AProgramWorking: Story = {
  args: { name: "gluetun", state: "known", figure: "185.65.135.72 · NL" },
};

/**
 * A program that has stopped answering. The box is left open and the mark is
 * the broken clock, so the state reads without colour — and the figure stays,
 * uncaptioned, since the mark beside the name has already said what it is.
 */
export const AProgramGoneQuiet: Story = {
  args: { name: "sabnzbd", state: "quiet", figure: "0 B/s" },
};

/**
 * A place on disk. It runs nothing, so it has no state to carry and takes no
 * mark: a tick beside it would claim something was checked.
 */
export const APlaceOnDisk: Story = {
  args: {
    name: m.schematic_downloads(),
    figure: m.schematic_free({ size: "412 GB" }),
  },
};

/**
 * A thing the operator has not set up yet, which is what the wizard draws
 * while it is still being answered. The box is neither closed nor filled in.
 */
export const NotSetUpYet: Story = {
  args: {
    name: m.schematic_library(),
    figure: m.schematic_set_up_at({ step: "5" }),
    pending: true,
  },
};

/**
 * Nothing has ever measured this one. The figure it was handed does not reach
 * the box: words say which of the two it is, here as everywhere else.
 */
export const NeverMeasured: Story = {
  args: { name: "sabnzbd", state: "unknown", figure: "0 B/s" },
};
