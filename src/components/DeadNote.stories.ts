import type { Meta, StoryObj } from "@storybook/svelte-vite";
import DeadNote from "./DeadNote.svelte";
import { pressing } from "../../.storybook/snippets";
import * as m from "../paraglide/messages.js";

const meta = {
  title: "Surfaces/DeadNote",
  component: DeadNote,
  args: { service: "Prowlarr" },
} satisfies Meta<typeof DeadNote>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * What a panel puts where its figures were. Shown on its own here; in a screen
 * it is what a panel is given in place of its body, and giving it is what makes
 * that panel dead.
 */
export const NotAnswering: Story = {
  args: {
    actions: pressing(
      { label: m.action_try_again() },
      { label: m.action_read_logs() },
    ),
  },
};

/** Nothing can be done about it from here, so nothing is offered. */
export const NothingToPress: Story = { args: {} };
