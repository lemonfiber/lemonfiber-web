import type { Meta, StoryObj } from "@storybook/svelte-vite";
import Meter from "./Meter.svelte";
import { everyState } from "../lib/state";
import * as m from "../paraglide/messages.js";

const meta = {
  title: "Foundations/Meter",
  component: Meter,
  argTypes: { state: { control: "select", options: everyState } },
  args: { label: m.meter_how_far() },
} satisfies Meta<typeof Meter>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Measured now, and moving. */
export const UnderWay: Story = { args: { part: 0.64 } };

/**
 * The source has gone quiet, so the bar is where it was left rather than
 * where it is. It loses its amber; the figure beside it is what says why.
 */
export const LastKnown: Story = { args: { part: 0.91, state: "quiet" } };

/** Nothing has happened yet, and the bar says exactly that. */
export const NotStarted: Story = { args: { part: 0 } };

/** How full the disk is, which is the same question asked of a different thing. */
export const HowFullTheDiskIs: Story = {
  args: { part: 0.897, label: m.panel_disk() },
};
