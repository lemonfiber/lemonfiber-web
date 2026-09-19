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

/**
 * The account a password goes with, offered to whatever keeps the reader's
 * passwords so the two are filled in together.
 */
export const WhoIsSigningIn: Story = {
  args: {
    label: m.wayin_name_label(),
    value: "",
    hint: m.wayin_name_hint(),
    purpose: "who",
  },
};

/**
 * A password, hidden as it is typed. A password shown on the screen is a
 * password read over a shoulder.
 */
export const ASecret: Story = {
  args: {
    label: m.wayin_password_label(),
    value: "",
    purpose: "secret",
  },
};
