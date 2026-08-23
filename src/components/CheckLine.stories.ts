import type { Meta, StoryObj } from "@storybook/svelte-vite";
import CheckLine from "./CheckLine.svelte";
import * as m from "../paraglide/messages.js";

const meta = {
  title: "Foundations/CheckLine",
  component: CheckLine,
} satisfies Meta<typeof CheckLine>;

export default meta;
type Story = StoryObj<typeof meta>;

// The counts below are the only literals here: how many lines a log holds is
// data the API already counted, not a word the interface chose.

/**
 * A kind of line that is being shown. The box is ticked and the words take
 * full ink, so a column of these reads as a list of what is in.
 */
export const Shown: Story = {
  args: { on: true, label: m.filter_problems(), count: "1" },
};

/**
 * A kind that is being held back. The count stays beside it, so what turning
 * it back on would cost is on the screen before it is pressed.
 */
export const HeldBack: Story = {
  args: { on: false, label: m.filter_chatter(), count: "318" },
};

/**
 * A span rather than a kind. Nothing counts the lines in it, so the line
 * carries no figure at all.
 */
export const NothingCountsThem: Story = {
  args: { on: true, label: m.filter_last_hour() },
};

/**
 * A program rather than a kind. The name is the program's own, so it is set
 * exactly as the program writes it.
 */
export const OneProgram: Story = {
  args: { on: true, label: "sonarr", count: "28" },
};
