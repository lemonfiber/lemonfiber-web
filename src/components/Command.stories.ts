import type { Meta, StoryObj } from "@storybook/svelte-vite";
import Command from "./Command.svelte";
import * as m from "../paraglide/messages.js";

const meta = {
  title: "Foundations/Command",
  component: Command,
} satisfies Meta<typeof Command>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The words that start the stack without lemonfiber, selected whole on one press. */
export const StartWithoutLemonfiber: Story = {
  args: {
    label: m.stack_up(),
    text: "docker compose --project-directory /srv/lemonfiber --env-file /srv/lemonfiber/.env --profile media --profile usenet up -d",
  },
};
