import type { Meta, StoryObj } from "@storybook/svelte-vite";
import WhereToWatch from "./WhereToWatch.svelte";
import { kitsDoor } from "../api/hearings";

const meta = {
  title: "Surfaces/WhereToWatch",
  component: WhereToWatch,
  args: { door: { at: "answered", value: kitsDoor } },
} satisfies Meta<typeof WhereToWatch>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Where to begin, then where to watch, each as a link and a code a phone can
 * scan; a place that does not answer from where they are says so instead.
 */
export const WhereToBegin: Story = {};

/** Nowhere to begin yet, in lemonfiber's words. */
export const NowhereYet: Story = {
  args: {
    door: {
      at: "answered",
      value: { ...kitsDoor, service: null, address: null, beside: [] },
    },
  },
};

/** Still waiting for the house to answer. */
export const Waiting: Story = { args: { door: undefined } };

/** The house did not answer. */
export const NotRead: Story = {
  args: {
    door: {
      at: "unanswered",
      problem: { kind: "unreachable", message: "The house is not answering." },
    },
  },
};
