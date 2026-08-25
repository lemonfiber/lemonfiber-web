import type { Meta, StoryObj } from "@storybook/svelte-vite";
import Action from "./Action.svelte";
import { everyWeight } from "../lib/weight";
import * as m from "../paraglide/messages.js";

const meta = {
  title: "Foundations/Action",
  component: Action,
  argTypes: { weight: { control: "select", options: everyWeight } },
} satisfies Meta<typeof Action>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Offered, not asked for. Everything a row can do that is not the thing it
 * wants doing takes this weight, so a screen of them stays quiet.
 */
export const Offered: Story = {
  args: { label: m.action_how_checked() },
};

/**
 * The one being asked for. Filled in lemon, and a row has at most one — two
 * of them side by side is two centres of gravity and no answer to which.
 */
export const AskedFor: Story = {
  args: { label: m.action_fix_it(), weight: "firm" },
};

/** What a panel with nothing to show offers instead of figures. */
export const TryingAgain: Story = {
  args: { label: m.action_try_again() },
};

/**
 * Nothing to do for the moment. It sinks into the ground it sits on rather
 * than leaving the page: `disabled` takes a button out of the tab order, and a
 * reader whose focus was on the button they just pressed would be left
 * standing nowhere.
 */
export const NothingToDoYet: Story = {
  args: { label: m.action_try_again(), off: true },
};
