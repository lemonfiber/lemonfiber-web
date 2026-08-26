import type { Meta, StoryObj } from "@storybook/svelte-vite";
import Unlock from "./Unlock.svelte";

const meta = {
  title: "Surfaces/Unlock",
  component: Unlock,
  args: {
    onopen: () => undefined,
  },
} satisfies Meta<typeof Unlock>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * The first screen anyone sees. A run mints a key, prints it once, and expects
 * it back on every request — there is no cookie, no session and nowhere to look
 * it up, so this is the one thing the page asks a person for.
 */
export const AskingForTheKey: Story = {};

/**
 * The same screen, arrived at because a run would not take the key the page
 * held. It says so where a reader who cannot see the screen change is told, and
 * the console it replaced is gone.
 */
export const AfterTheRunRefusedTheKey: Story = { args: { refused: true } };
