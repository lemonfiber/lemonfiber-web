import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { createRawSnippet } from "svelte";
import Panel from "./Panel.svelte";
import { notAnswering, pressing, showing } from "../../.storybook/snippets";
import * as m from "../paraglide/messages.js";

const body = createRawSnippet(() => ({
  render: () =>
    `<p style="margin:0;color:var(--muted)">${m.panel_disk_body({ free: "412 GB", total: "4 TB" })}</p>`,
}));

const nothingYet = showing({
  state: "unknown",
  absent: m.panel_nothing_yet(),
});

const note = notAnswering({
  service: "Prowlarr",
  actions: pressing(
    { label: m.action_try_again() },
    { label: m.action_read_logs() },
  ),
});

const meta = {
  title: "Surfaces/Panel",
  component: Panel,
  args: { title: m.panel_disk(), children: body },
} satisfies Meta<typeof Panel>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The source answered a moment ago, so everything inside is current. */
export const Answering: Story = {
  args: { freshness: { kind: "answered", secondsAgo: 4 } },
};

/**
 * The source answered, but a while back. The figures are still the ones it
 * gave; the stamp is what tells you how old they are.
 */
export const AnsweredAWhileAgo: Story = {
  args: { freshness: { kind: "answered", secondsAgo: 2700 } },
};

/**
 * The source is unreachable. This panel shows nothing rather than showing
 * figures it cannot stand behind — and it says so inside its own border, so
 * the rest of the screen is not called into question with it.
 */
export const Unreachable: Story = {
  args: {
    title: m.panel_indexers(),
    freshness: { kind: "silent", secondsAgo: 240 },
    dead: note,
    flush: true,
  },
};

/**
 * Nothing has ever reported this. Not a fault, so the panel stays open and
 * calm — but it has no figures to give, and the stamp says why.
 */
export const NeverChecked: Story = {
  args: {
    title: m.panel_fill_rate(),
    freshness: { kind: "never" },
    children: nothingYet,
  },
};

/** Rows and tables meet the border, so the body gives up its inset. */
export const HoldingRows: Story = {
  args: { freshness: { kind: "answered", secondsAgo: 9 }, flush: true },
};
