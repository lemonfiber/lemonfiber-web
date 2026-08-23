import type { Meta, StoryObj } from "@storybook/svelte-vite";
import Wire from "./Wire.svelte";
import * as m from "../paraglide/messages.js";

const meta = {
  title: "Foundations/Wire",
  component: Wire,
  argTypes: { label: { control: "text" }, quiet: { control: "boolean" } },
} satisfies Meta<typeof Wire>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * What the connector means, said where the arrow is drawn. The word is read
 * between the two boxes it joins, so a reader who never sees the arrow is
 * given the direction it points in.
 */
export const Carrying: Story = { args: { label: m.schematic_carries() } };

/**
 * A route nothing is taking. The line is broken as well as faint, so it reads
 * as unused in greyscale and at a glance.
 */
export const NothingMoving: Story = {
  args: { label: m.schematic_carries_nothing(), quiet: true },
};

/**
 * Joining two boxes that already read as one sentence. There is nothing left
 * for the connector to add, so it adds nothing and is drawn only.
 */
export const JustTheArrow: Story = { args: {} };
