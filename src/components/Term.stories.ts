import type { Meta, StoryObj } from "@storybook/svelte-vite";
import Term from "./Term.svelte";
import * as m from "../paraglide/messages.js";

const meta = {
  title: "Foundations/Term",
  component: Term,
} satisfies Meta<typeof Term>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * A word the interface needs and a reader may not have. The underline says
 * there is more to it; pressing it says what.
 */
export const Unread: Story = {
  args: {
    term: m.term_hardlink(),
    name: m.term_hardlink_name(),
    meaning: m.term_hardlink_meaning(),
  },
};

/**
 * Once opened, it stops asking. The underline drops to the line colour: the
 * explanation is still there for anyone who wants it a second time.
 */
export const Read: Story = {
  args: {
    term: m.term_stale(),
    name: m.term_stale_name(),
    meaning: m.term_stale_meaning(),
    read: true,
  },
};
