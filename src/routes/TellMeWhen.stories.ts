import type { Meta, StoryObj } from "@storybook/svelte-vite";
import TellMeWhen from "./TellMeWhen.svelte";
import { kitsTelling } from "../api/hearings";

const meta = {
  title: "Surfaces/TellMeWhen",
  component: TellMeWhen,
  args: {
    telling: { at: "answered", value: kitsTelling },
    ontick: () => undefined,
  },
} satisfies Meta<typeof TellMeWhen>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Each way offered, switched on where they are told on it, and their phone. */
export const WaysOffered: Story = {};

/** Nothing offered yet, and no phone of theirs set up. */
export const NothingOffered: Story = {
  args: {
    telling: {
      at: "answered",
      value: { ...kitsTelling, offered: [], phone: false },
    },
  },
};

/** A choice that did not go through: nothing moved. */
export const NotChosen: Story = {
  args: {
    choosing: {
      at: "unanswered",
      problem: { kind: "unreachable", message: "The house is not answering." },
    },
  },
};

/** Still waiting for the house to answer. */
export const Waiting: Story = { args: { telling: undefined } };
