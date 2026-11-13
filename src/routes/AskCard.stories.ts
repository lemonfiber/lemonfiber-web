import type { Meta, StoryObj } from "@storybook/svelte-vite";
import AskCard from "./AskCard.svelte";
import { didAsk, dune, duneTwo, wouldAsk } from "./found";

const meta = {
  title: "Surfaces/AskCard",
  component: AskCard,
  args: {
    title: dune,
    rehearsal: { at: "answered", value: wouldAsk },
    onask: () => undefined,
    onrehearse: () => undefined,
    onclose: () => undefined,
  },
} satisfies Meta<typeof AskCard>;

export default meta;
type Story = StoryObj<typeof meta>;

/** What asking would come to, in lemonfiber's words, before anything is sent. */
export const BeforeAsking: Story = {};

/** What asking would come to, still being read. */
export const Rehearsing: Story = { args: { rehearsal: undefined } };

/** The ask on its way, which cannot be sent twice. */
export const Asking: Story = { args: { sending: true } };

/** What the ask came to. */
export const Asked: Story = {
  args: { sent: { at: "answered", value: didAsk } },
};

/** An ask that went unanswered, asked for nowhere, with a way to send it again. */
export const Unanswered: Story = {
  args: {
    sent: {
      at: "unanswered",
      problem: {
        kind: "unreachable",
        message: "lemonfiber is not answering. It may have been stopped.",
      },
    },
  },
};

/** A title already on its way: its action stays, unusable, naming where it stands. */
export const OnItsWay: Story = { args: { title: duneTwo } };
