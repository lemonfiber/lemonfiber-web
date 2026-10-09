import type { Meta, StoryObj } from "@storybook/svelte-vite";
import Walking from "./Walking.svelte";
import { fresh, reviewing } from "../../api/setups";

const meta = {
  title: "Surfaces/Setup",
  component: Walking,
  args: {
    wizard: fresh,
    busy: false,
    proving: undefined,
    onmove: () => undefined,
  },
} satisfies Meta<typeof Walking>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * The first step on a machine with nothing configured. Beside it, the steps
 * still to come; on a phone, only how many, so the step itself is on the
 * first screen.
 */
export const Welcome: Story = {};

/**
 * A question answered with switches, each with its words beside it, and a
 * line under the actions saying what is missing while nothing can be sent.
 */
export const DownloadServices: Story = {
  args: { wizard: { ...fresh, at: "protocols" } },
};

/**
 * The provider's login: an address typed as written, a port, encryption on by
 * default, and a password hidden as it is typed.
 */
export const UsenetProvider: Story = {
  args: { wizard: { ...fresh, at: "provider" } },
};

/**
 * What a credential just given came to, said at the top of the step setup
 * moved on to, with entering it again offered where it failed.
 */
export const AKeyThatFailed: Story = {
  args: {
    wizard: {
      ...fresh,
      at: "provider",
      proof: { outcome: "rejected", detail: "The indexer refused the key." },
    },
    proving: "credentials",
  },
};

/**
 * Everything to be written, a secret by name only, with a folder long enough
 * to have to wrap on a phone rather than push the page sideways.
 */
export const Review: Story = {
  args: {
    wizard: {
      ...reviewing,
      plan: [
        {
          key: "DATA_ROOT",
          value:
            "/Users/somebody/Library/Containers/media/Data/Library/Application-Support/lemonfiber/media",
          secret: false,
          origin: { origin: "operator" },
        },
        ...reviewing.plan.slice(1),
      ],
    },
  },
};
