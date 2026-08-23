import type { Meta, StoryObj } from "@storybook/svelte-vite";
import WizardStep from "./WizardStep.svelte";
import { everyStanding } from "../lib/steps";
import * as m from "../paraglide/messages.js";

const meta = {
  title: "Surfaces/WizardStep",
  component: WizardStep,
  argTypes: { standing: { control: "select", options: everyStanding } },
} satisfies Meta<typeof WizardStep>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Behind you. The tick replaces the numeral and the line down to the next
 * step turns amber, so a glance at the rail says how far in you are without
 * reading a word of it.
 */
export const Settled: Story = {
  args: {
    position: 2,
    total: 7,
    title: m.step_tunnel_title(),
    detail: "Mullvad, Netherlands",
    standing: "done",
  },
};

/**
 * The one being done. The only step with a lemon ground and a heavier ring,
 * so a rail has a single place the eye lands.
 */
export const WhereYouAre: Story = {
  args: {
    position: 3,
    total: 7,
    title: m.step_downloading_title(),
    detail: m.step_downloading_detail(),
    standing: "now",
  },
};

/**
 * Still to come. Outlined and quiet: it is not a thing that wants you, it is
 * a thing that will.
 */
export const StillToCome: Story = {
  args: {
    position: 5,
    total: 7,
    title: m.step_library_title(),
    detail: m.step_library_detail(),
    standing: "later",
  },
};
