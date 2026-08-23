import type { Meta, StoryObj } from "@storybook/svelte-vite";
import Field from "./Field.svelte";
import * as m from "../paraglide/messages.js";

const meta = {
  title: "Foundations/Field",
  component: Field,
} satisfies Meta<typeof Field>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Filled in and checked. The line underneath is what the check found, not
 * what the box is for — the setup has already been to the provider and back.
 */
export const Reached: Story = {
  args: {
    label: m.field_provider_label(),
    value: "news.eweka.nl",
    confirmed: m.field_provider_reached(),
  },
};

/**
 * A figure, with the line underneath saying what choosing a different one
 * would cost. The box is as wide as the figure needs and no wider.
 */
export const Counted: Story = {
  args: {
    label: m.field_at_once_label(),
    value: "20",
    figure: true,
    hint: m.field_at_once_hint({ allowed: "20" }),
  },
};

/**
 * A figure that was checked. Confirmation and figure face together, which is
 * the commonest field on the setup screens.
 */
export const PortForwarded: Story = {
  args: {
    label: m.field_port_label(),
    value: "51413",
    figure: true,
    confirmed: m.field_port_forwarded(),
  },
};
