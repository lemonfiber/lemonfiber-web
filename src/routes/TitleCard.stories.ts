import type { Meta, StoryObj } from "@storybook/svelte-vite";
import TitleCard from "./TitleCard.svelte";
import { arrival, expanse, goneFromTheShelf } from "./mine";

const meta = {
  title: "Surfaces/TitleCard",
  component: TitleCard,
  args: {
    name: "Arrival",
    answer: { at: "answered", value: arrival },
    onclose: () => undefined,
  },
} satisfies Meta<typeof TitleCard>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * A film, opened over the shelf: what it is, what it is filed under and what
 * it is about. Where it streams from is the server's, and is not drawn.
 */
export const AFilm: Story = {};

/** A series, with each season folded until it is opened. */
export const ASeries: Story = {
  args: { name: "The Expanse", answer: { at: "answered", value: expanse } },
};

/** Opened, and still being read. The name is the shelf's, so it is there. */
export const BeingRead: Story = { args: { answer: undefined } };

/** It has left the shelf since the shelf was drawn. */
export const NoLongerHere: Story = {
  args: {
    name: "A Concert Nobody Filed",
    answer: { at: "answered", value: goneFromTheShelf },
  },
};

/** lemonfiber did not answer, with a way to ask again. */
export const CouldNotBeRead: Story = {
  args: {
    answer: {
      at: "unanswered",
      problem: {
        kind: "unreachable",
        message: "lemonfiber is not answering. It may have been stopped.",
      },
    },
    onretry: () => undefined,
  },
};
