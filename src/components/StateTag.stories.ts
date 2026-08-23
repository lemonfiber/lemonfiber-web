import type { Meta, StoryObj } from "@storybook/svelte-vite";
import StateTag from "./StateTag.svelte";
import type { State } from "../lib/state";

const every: State[] = ["known", "quiet", "unknown", "stopped", "part"];

const meta = {
  title: "Foundations/StateTag",
  component: StateTag,
  argTypes: { state: { control: "select", options: every } },
} satisfies Meta<typeof StateTag>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Working: Story = { args: { state: "known" } };

/** Answered a moment ago but not now. The figure beside it is the last one given. */
export const GoneQuiet: Story = { args: { state: "quiet" } };

/** Nothing has ever reported this. Not the same as zero, and not a problem. */
export const NeverMeasured: Story = { args: { state: "unknown" } };

export const Stopped: Story = { args: { state: "stopped" } };

export const PartWay: Story = { args: { state: "part" } };

/** Naming a thing rather than a state, as the services list does. */
export const NamingAService: Story = {
  args: { state: "known", label: "gluetun" },
};
