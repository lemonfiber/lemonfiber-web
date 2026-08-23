import type { Meta, StoryObj } from "@storybook/svelte-vite";
import StateMark from "./StateMark.svelte";
import { everyState } from "../lib/state";

const meta = {
  title: "Foundations/StateMark",
  component: StateMark,
  argTypes: { state: { control: "select", options: everyState } },
} satisfies Meta<typeof StateMark>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Measured just now. */
export const Working: Story = { args: { state: "known" } };

/** A clock with a broken edge: it answered, then stopped. */
export const GoneQuiet: Story = { args: { state: "quiet" } };

/** A question on a broken edge, and the one state with no colour of its own. */
export const NeverMeasured: Story = { args: { state: "unknown" } };

/** A stop square: deliberately not running. */
export const Stopped: Story = { args: { state: "stopped" } };

/** A half-filled disc: under way, not finished. */
export const PartWay: Story = { args: { state: "part" } };
