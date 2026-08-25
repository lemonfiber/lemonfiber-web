import type { Meta, StoryObj } from "@storybook/svelte-vite";
import Term from "./Term.svelte";
import type { Explaining } from "../api/explaining";
import { explained } from "../routes/fixture";
import * as m from "../paraglide/messages.js";

/** One running lemonfiber, answering what the word means. */
const explain: Explaining = () =>
  Promise.resolve({ ok: true, value: explained });

const meta = {
  title: "Foundations/Term",
  component: Term,
} satisfies Meta<typeof Term>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * A word the interface needs and a reader may not have. The underline says
 * there is more to it; pressing it says what — in the binary's own words,
 * asked for when it is pressed and not before.
 */
export const Unread: Story = {
  args: {
    term: m.term_hardlink(),
    word: explained.word,
    explain,
  },
};

/**
 * Once opened, it stops asking. The underline drops to the line colour: the
 * explanation is still there for anyone who wants it a second time.
 */
export const Read: Story = {
  args: {
    term: m.term_hardlink(),
    word: explained.word,
    explain,
    read: true,
  },
};
