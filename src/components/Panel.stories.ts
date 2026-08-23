import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { createRawSnippet } from "svelte";
import Panel from "./Panel.svelte";
import * as m from "../paraglide/messages.js";

const body = createRawSnippet(() => ({
  render: () =>
    `<p style="margin:0;color:var(--muted)">${m.panel_disk_body({ free: "412 GB", total: "4 TB" })}</p>`,
}));

const nothingYet = createRawSnippet(() => ({
  render: () =>
    `<p style="margin:0;color:var(--faint);font-style:italic">${m.panel_nothing_yet()}</p>`,
}));

const note = createRawSnippet(() => ({
  render: () =>
    `<p style="margin:0;color:var(--muted);text-align:center">
       <strong style="color:var(--text)">${m.panel_dead_source({ service: "Prowlarr" })}</strong><br>
       ${m.panel_dead_scope()}
     </p>`,
}));

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
