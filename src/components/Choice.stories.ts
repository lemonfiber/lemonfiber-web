import type { Meta, StoryObj } from "@storybook/svelte-vite";
import Choice from "./Choice.svelte";
import * as m from "../paraglide/messages.js";

const meta = {
  title: "Foundations/Choice",
  component: Choice,
} satisfies Meta<typeof Choice>;

export default meta;
type Story = StoryObj<typeof meta>;

/** On, with the words it turns on beside it. */
export const TurnedOn: Story = {
  args: { words: m.wizard_provider_tls(), on: true, onclick: () => undefined },
};

/** Off. The words stay where they were, so the row does not move. */
export const TurnedOff: Story = {
  args: { words: m.wizard_usenet(), on: false, onclick: () => undefined },
};
