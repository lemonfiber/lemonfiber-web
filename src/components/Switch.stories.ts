import type { Meta, StoryObj } from "@storybook/svelte-vite";
import Switch from "./Switch.svelte";
import * as m from "../paraglide/messages.js";

const meta = {
  title: "Foundations/Switch",
  component: Switch,
} satisfies Meta<typeof Switch>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * On. The track fills and the knob has travelled, so the position reads at a
 * glance down a column of settings rather than one at a time.
 */
export const TurnedOn: Story = {
  args: { on: true, label: m.setting_boot_title() },
};

/**
 * Off. The track is the same line that separates the rows, which is as quiet
 * as a control gets while still being one.
 */
export const TurnedOff: Story = {
  args: { on: false, label: m.setting_night_title() },
};
