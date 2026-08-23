import type { Meta, StoryObj } from "@storybook/svelte-vite";
import PersonRow from "./PersonRow.svelte";
import { pressing } from "../../.storybook/snippets";
import { spanFor } from "../lib/freshness";
import * as m from "../paraglide/messages.js";

const edit = pressing({ label: m.action_edit() });

const meta = {
  title: "Surfaces/PersonRow",
  component: PersonRow,
} satisfies Meta<typeof PersonRow>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * You. The only person who can change anything, and the only one with no
 * allowance to draw — so the row states it in words and draws no bar.
 */
export const You: Story = {
  args: {
    name: "Wessel",
    tag: m.person_you(),
    prose: m.person_owner(),
    quota: m.quota_no_limit(),
    actions: edit,
  },
};

/**
 * Someone with an allowance. The words say how much is gone and the bar says
 * the same thing as a length, so neither has to be read to get it.
 */
export const WithAnAllowance: Story = {
  args: {
    name: "Nora",
    prose: m.person_asker({ span: spanFor(7200) }),
    quota: m.quota_used({ used: "3", limit: "5" }),
    part: 0.6,
    actions: edit,
  },
};

/**
 * A child. The tag beside the name is what the rest of the row's limits
 * follow from, so it sits with the name rather than with the settings.
 */
export const AChild: Story = {
  args: {
    name: "Sam",
    tag: m.person_age({ years: "12" }),
    prose: m.person_child({ rating: "PG" }),
    quota: m.quota_used({ used: "1", limit: "3" }),
    part: 0.33,
    actions: edit,
  },
};

/**
 * Somebody passing through. No allowance because there is nothing to allow —
 * a guest can watch and cannot ask, which is a phrase and not a bar at zero.
 */
export const AGuest: Story = {
  args: {
    name: "Guest",
    prose: m.person_guest({ days: "3" }),
    quota: m.quota_cannot_ask(),
    actions: edit,
  },
};
