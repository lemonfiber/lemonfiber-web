import type { Meta, StoryObj } from "@storybook/svelte-vite";
import Code from "./Code.svelte";
import * as m from "../paraglide/messages.js";

const meta = {
  title: "Foundations/Code",
  component: Code,
} satisfies Meta<typeof Code>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * An address somebody is handed, drawn as squares a phone's camera reads. The
 * squares stay dark on the lemon ground in every theme.
 */
export const AnAddress: Story = {
  args: {
    text: ["http:", "", "lemonfiber.local:5055", "join", "7f3a"].join("/"),
    label: m.came_invite_address_said(),
  },
};

/**
 * A link that opens an app, which is longer, so the code holds more squares
 * at the same size.
 */
export const ALink: Story = {
  args: {
    text: "lemonfiber://join?address=https%3A%2F%2Flemonfiber.local%3A8443&fingerprint=00&stack=c1d2e3f4a5b6&name=Sam&expires=1790000000&claim=9c1e",
    label: m.came_invite_join_said(),
  },
};
