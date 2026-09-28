import type { Meta, StoryObj } from "@storybook/svelte-vite";
import Away from "./Away.svelte";

const meta = {
  title: "Surfaces/Away",
  component: Away,
  args: {
    answer: {
      at: "refused",
      said: "This is not something this account may ask for.",
    },
  },
} satisfies Meta<typeof Away>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * A household member at one of the console's addresses. The page asked
 * lemonfiber the read the address is drawn from, and shows the refusal in the
 * words lemonfiber refused in rather than an empty page.
 */
export const RefusedInLemonfibersWords: Story = {};

/** The refusal arrived with no words this page can hand on as lemonfiber's. */
export const RefusedWithoutWords: Story = {
  args: { answer: { at: "refused", said: undefined } },
};

/** lemonfiber did not answer. Said in the member's words, not the stack's. */
export const NothingAnswered: Story = {
  args: {
    answer: {
      at: "unanswered",
      problem: {
        kind: "unreachable",
        message: "lemonfiber is not answering. It may have been stopped.",
      },
    },
  },
};

/** lemonfiber has not answered yet. */
export const BeforeAnythingAnswers: Story = { args: { answer: undefined } };
