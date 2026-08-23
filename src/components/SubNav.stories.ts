import type { Meta, StoryObj } from "@storybook/svelte-vite";
import SubNav from "./SubNav.svelte";
import * as m from "../paraglide/messages.js";

const meta = {
  title: "Surfaces/SubNav",
  component: SubNav,
  argTypes: { items: { control: "object" }, selected: { control: "text" } },
  args: { onselect: () => undefined },
} satisfies Meta<typeof SubNav>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * The six places a settings screen is divided into. Every one of them stays a
 * tab stop away, and the one being shown says so with `aria-current` — the
 * strip is a list of places, not a set of tabs over one.
 */
export const AcrossSettings: Story = {
  args: {
    label: m.nav_settings(),
    selected: "stack",
    items: [
      { id: "stack", label: m.sub_stack() },
      { id: "tunnel", label: m.sub_tunnel() },
      { id: "told", label: m.sub_told() },
      { id: "updates", label: m.sub_updates() },
      { id: "backups", label: m.sub_backups() },
      { id: "privacy", label: m.sub_privacy() },
    ],
  },
};

/**
 * The same strip with four places rather than six, and the current one part
 * way down it. The list packs from the top rather than spreading to fill the
 * column, so a short strip and a long one start at the same line.
 */
export const AcrossTheHousehold: Story = {
  args: {
    label: m.nav_people(),
    selected: "ratings",
    items: [
      { id: "house", label: m.sub_house() },
      { id: "quotas", label: m.sub_quotas() },
      { id: "ratings", label: m.sub_ratings() },
      { id: "invites", label: m.sub_invites() },
    ],
  },
};
