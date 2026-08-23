import type { Meta, StoryObj } from "@storybook/svelte-vite";
import Port from "./Port.svelte";
import { everyTone, severityWord } from "../lib/state";

const meta = {
  title: "Foundations/Port",
  component: Port,
  argTypes: { tone: { control: "select", options: everyTone } },
} satisfies Meta<typeof Port>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Nothing is wanted. The strand seen end-on: terminated, and claiming nothing
 * about whether what it carries is good news.
 */
export const NothingNeeded: Story = {
  args: { tone: "calm", label: severityWord("calm") },
};

/** Worth an eye, not an interruption. Tinted, but still outlined. */
export const WorthWatching: Story = {
  args: { tone: "watch", label: severityWord("watch") },
};

/** It wants you now. The one tile on the screen that is filled in. */
export const NeedsYou: Story = {
  args: { tone: "alarm", label: severityWord("alarm") },
};

/**
 * Sitting beside text that already says what it means, as it does in a row.
 * The tile carries no name of its own, so a screen reader hears it once.
 */
export const BesideItsOwnWords: Story = { args: { tone: "alarm" } };
