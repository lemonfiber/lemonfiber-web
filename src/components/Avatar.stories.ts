import type { Meta, StoryObj } from "@storybook/svelte-vite";
import Avatar from "./Avatar.svelte";

const meta = {
  title: "Foundations/Avatar",
  component: Avatar,
} satisfies Meta<typeof Avatar>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * A person on a household row. Lemon carries no severity, so a wall of these
 * reads as people rather than as a wall of states.
 */
export const OnAHouseholdRow: Story = {
  args: { name: "Nora" },
};

/**
 * The same person in a header, where the row around it is half the height.
 * Same tile, one size down.
 */
export const InAHeader: Story = {
  args: { name: "Nora", small: true },
};
