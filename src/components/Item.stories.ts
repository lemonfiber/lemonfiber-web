import type { Meta, StoryObj } from "@storybook/svelte-vite";
import Item from "./Item.svelte";
import { pressing } from "../../.storybook/snippets";
import { spanFor } from "../lib/freshness";
import { everyState } from "../lib/state";
import * as m from "../paraglide/messages.js";

const oneWay = pressing({ label: m.action_how_checked() });

const twoWays = pressing(
  { label: m.action_why_seeing() },
  { label: m.action_fix_it(), weight: "firm" },
);

const meta = {
  title: "Surfaces/Item",
  component: Item,
  argTypes: { state: { control: "select", options: everyState } },
} satisfies Meta<typeof Item>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Checked, and true. A confirmed row still earns its place: an operator who
 * only ever sees problems has no way to know what was looked at.
 */
export const Confirmed: Story = {
  args: {
    state: "known",
    eyebrow: m.eyebrow_confirmed(),
    title: m.check_tunnel_title(),
    prose: m.check_tunnel_prose({
      address: "185.65.135.72",
      country: "the Netherlands",
    }),
    actions: oneWay,
  },
};

/**
 * A source has stopped answering. Nothing is broken yet, but any figure it
 * fed is the last one it gave rather than what is true now.
 */
export const WatchingIt: Story = {
  args: {
    state: "quiet",
    eyebrow: m.eyebrow_watching(),
    title: m.check_quiet_title(),
    prose: m.check_quiet_prose({ service: "SABnzbd", span: spanFor(240) }),
    actions: oneWay,
  },
};

/**
 * It will not resolve itself. This is the only kind of row that fills its
 * port in and tints the whole line, so one of them on a screen is unmissable.
 */
export const NeedsYou: Story = {
  args: {
    state: "stopped",
    eyebrow: m.severity_alarm(),
    title: m.check_stuck_title(),
    prose: m.check_stuck_prose({
      release: "The Bear, series 3 episode 4",
      service: "Sonarr",
    }),
    actions: twoWays,
  },
};

/**
 * Nothing has ever reported on this. An absence is not a fault, so the row
 * stays calm and asks for nothing.
 */
export const NeverMeasured: Story = {
  args: {
    state: "unknown",
    eyebrow: m.eyebrow_not_looked_at(),
    title: m.check_fill_rate_title(),
    prose: m.check_fill_rate_prose(),
  },
};

/**
 * Under way. There is nothing to press, so the row offers nothing and lets
 * the prose keep the full width.
 */
export const PartWay: Story = {
  args: {
    state: "part",
    eyebrow: m.eyebrow_under_way(),
    title: m.check_scan_title(),
    prose: m.check_scan_prose({ done: "9", total: "11" }),
  },
};
