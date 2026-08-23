import type { Meta, StoryObj } from "@storybook/svelte-vite";
import Icon from "./Icon.svelte";
import { everyIcon, everyIconSize } from "../lib/icons";
import * as m from "../paraglide/messages.js";

const meta = {
  title: "Foundations/Icon",
  component: Icon,
  argTypes: {
    name: { control: "select", options: everyIcon },
    size: { control: "select", options: everyIconSize },
  },
} satisfies Meta<typeof Icon>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * How nearly every drawing in this set is used: beside a label that already
 * says what it means, so the drawing itself is announced to no one.
 */
export const BesideItsOwnWords: Story = { args: { name: "overview" } };

/**
 * Inside a tag or a table row, where the words around it are smaller too. The
 * stroke stays at 1.6, so a small drawing is the same hand and not a lighter
 * one.
 */
export const AmongSmallerWords: Story = {
  args: { name: "alert", size: "small" },
};

/**
 * On a control with no words of its own. This is the only case that carries a
 * name, and it carries one because without it the control has none.
 */
export const StandingAlone: Story = {
  args: { name: "retry", label: m.action_try_again() },
};

/** What a section that opens and closes points with. */
export const PointingAtWhatOpens: Story = { args: { name: "chev" } };

/**
 * The two drawings a row reaches for when it has something to say: a triangle
 * that wants you, and a circle that only wants an eye.
 */
export const WantingYou: Story = { args: { name: "alert" } };

/** Worth reading, not worth stopping for. */
export const WorthAnEye: Story = { args: { name: "info" } };
