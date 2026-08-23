import type { Meta, StoryObj } from "@storybook/svelte-vite";
import WizardSteps from "./WizardSteps.svelte";
import * as m from "../paraglide/messages.js";

const setup = [
  {
    title: m.step_folders_title(),
    detail: m.step_folders_detail({ path: "/data" }),
  },
  { title: m.step_tunnel_title(), detail: "Mullvad, Netherlands" },
  { title: m.step_downloading_title(), detail: m.step_downloading_detail() },
  { title: m.step_finding_title(), detail: m.step_finding_detail() },
  { title: m.step_library_title(), detail: m.step_library_detail() },
  { title: m.step_household_title(), detail: m.step_household_detail() },
  { title: m.step_check_title(), detail: m.step_check_detail() },
];

const meta = {
  title: "Surfaces/WizardSteps",
  component: WizardSteps,
} satisfies Meta<typeof WizardSteps>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * A setup part way through. Two steps settled, one being done, four still to
 * come — and the amber run of connectors stops exactly where the work has.
 */
export const PartWayThrough: Story = {
  args: { steps: setup, current: 3 },
};

/**
 * The first thing anybody sees. Nothing is behind you yet, so there is no
 * amber on the rail at all.
 */
export const JustStarted: Story = {
  args: { steps: setup, current: 1 },
};

/**
 * The last step. Every connector above it is amber and the run has one thing
 * left to prove.
 */
export const AlmostDone: Story = {
  args: { steps: setup, current: 7 },
};
