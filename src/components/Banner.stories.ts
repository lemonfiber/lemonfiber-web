import type { Meta, StoryObj } from "@storybook/svelte-vite";
import Banner from "./Banner.svelte";
import { pressing } from "../../.storybook/snippets";
import { spanFor } from "../lib/freshness";
import { everyTone } from "../lib/state";
import * as m from "../paraglide/messages.js";

const meta = {
  title: "Surfaces/Banner",
  component: Banner,
  argTypes: { tone: { control: "select", options: everyTone } },
} satisfies Meta<typeof Banner>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * The stack stopped answering, so nothing under this line is current. A panel
 * stamps its own source; this is the one thing every panel below it depends
 * on, which is why it sits above them all rather than inside one.
 */
export const LostContact: Story = {
  args: {
    tone: "watch",
    lead: m.banner_contact_lead(),
    prose: m.banner_contact_prose(),
    actions: pressing({ label: m.action_hide_this() }),
  },
};

/**
 * It wants the operator now, so it interrupts rather than waiting for their
 * next pause. The one control being asked for is the filled one.
 */
export const NeedsYou: Story = {
  args: {
    tone: "alarm",
    lead: m.check_stuck_title(),
    prose: m.check_stuck_prose({
      release: "The Bear, series 3 episode 4",
      service: "Sonarr",
    }),
    actions: pressing(
      { label: m.action_why_seeing() },
      { label: m.action_fix_it(), weight: "firm" },
    ),
  },
};

/**
 * Worth knowing and nothing more. No tint, no filled port, and nothing to
 * press — it is a sentence, and the screen carries on underneath it.
 */
export const WorthKnowing: Story = {
  args: {
    tone: "calm",
    lead: m.check_quiet_title(),
    prose: m.check_quiet_prose({ service: "SABnzbd", span: spanFor(240) }),
  },
};
