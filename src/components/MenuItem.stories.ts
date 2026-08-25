import type { Meta, StoryObj } from "@storybook/svelte-vite";
import MenuItem from "./MenuItem.svelte";
import { everyIcon } from "../lib/icons";
import * as m from "../paraglide/messages.js";

const meta = {
  title: "Foundations/MenuItem",
  component: MenuItem,
  argTypes: { icon: { control: "select", options: everyIcon } },
} satisfies Meta<typeof MenuItem>;

export default meta;
type Story = StoryObj<typeof meta>;

// The addresses and the tallies below are the only literals here: where a
// screen lives and how many things are on it are not words the interface
// chose.

/**
 * The screen being read. Exactly one row in a menu is given a ground and says
 * `aria-current="page"`, so a reader arriving anywhere knows where they are.
 */
export const TheScreenBeingRead: Story = {
  args: {
    href: "/overview",
    icon: "overview",
    label: m.nav_overview(),
    tally: "1",
    urgent: true,
    current: true,
  },
};

/**
 * Somewhere else, with things on it. The tally is quiet: three downloads
 * running is a number, not a problem.
 */
export const SomewhereElse: Story = {
  args: {
    href: "/activity",
    icon: "activity",
    label: m.nav_activity(),
    tally: "3",
  },
};

/**
 * Somewhere else with nothing waiting. No tally at all, rather than a zero —
 * a zero is a figure, and there is nothing here to count.
 */
export const NothingWaiting: Story = {
  args: { href: "/logs", icon: "logs", label: m.nav_logs() },
};

/**
 * A row the page answers itself. It is still a link to a real address — the
 * press is handed to whatever routes it, and a modified press is left to the
 * browser, so a second tab and the back button both still work.
 */
export const AnsweredByThePage: Story = {
  args: {
    href: "/storage",
    icon: "storage",
    label: m.nav_storage(),
    onclick: (event: MouseEvent) => {
      event.preventDefault();
    },
  },
};

/**
 * Somewhere else that wants the operator. The tally takes the alarm ground,
 * so what needs doing is visible from whichever screen is open.
 */
export const SomethingWantsYou: Story = {
  args: {
    href: "/checks",
    icon: "checks",
    label: m.nav_checks(),
    tally: "1",
    urgent: true,
  },
};
