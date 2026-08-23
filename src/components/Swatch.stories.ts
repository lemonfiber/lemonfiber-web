import type { Meta, StoryObj } from "@storybook/svelte-vite";
import Swatch from "./Swatch.svelte";
import * as m from "../paraglide/messages.js";

const meta = {
  title: "Surfaces/Swatch",
  component: Swatch,
  argTypes: { name: { control: "text" }, token: { control: "text" } },
} satisfies Meta<typeof Swatch>;

export default meta;
type Story = StoryObj<typeof meta>;

// The tokens below are the names the surface itself writes, not the brand
// names under them: a swatch shows what a component would actually get.

/** The colour the interface is named for, and the one thing it fills. */
export const Lemon: Story = {
  args: { name: m.swatch_lemon(), token: "--lemon" },
};

/**
 * What moves through the wires. It was a teal in an earlier draft, which is
 * the drift a swatch drawn from the token cannot repeat.
 */
export const Fibre: Story = {
  args: { name: m.swatch_fiber(), token: "--fiber" },
};

/**
 * A surface colour, which is nearly the ground the swatch sits on. The chip
 * is bounded by the card's own border, so a near-white is still a shape.
 */
export const Paper: Story = {
  args: { name: m.swatch_paper(), token: "--paper" },
};

/**
 * A severity the brand palette has no name for, so the surface names it. The
 * chip reads it from the same token a row that wants you reads, and follows
 * it into the dark theme where its value is a different red.
 */
export const NeedsYou: Story = {
  args: { name: m.severity_alarm(), token: "--alarm" },
};
