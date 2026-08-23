import type { Meta, StoryObj } from "@storybook/svelte-vite";
import Segmented from "./Segmented.svelte";
import * as m from "../paraglide/messages.js";

const meta = {
  title: "Foundations/Segmented",
  component: Segmented,
} satisfies Meta<typeof Segmented>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Two options. The one that is taken is the only one with a ground, and the
 * only one on the way through the screen; the arrow keys reach the other.
 */
export const TwoWays: Story = {
  args: {
    label: m.choice_density(),
    selected: "comfortable",
    options: [
      { value: "comfortable", label: m.choice_roomy() },
      { value: "compact", label: m.choice_dense() },
    ],
  },
};

/**
 * Three options, where the middle one is what a reader who has chosen nothing
 * gets. The row is one control with one border, not three buttons in a line.
 */
export const ThreeWays: Story = {
  args: {
    label: m.choice_appearance(),
    selected: "auto",
    options: [
      { value: "paper", label: m.choice_paper() },
      { value: "auto", label: m.choice_auto() },
      { value: "ink", label: m.choice_ink() },
    ],
  },
};
