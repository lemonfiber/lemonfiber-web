import type { Meta, StoryObj } from "@storybook/svelte-vite";
import Storage from "./Storage.svelte";
import { diskChecks, moment, unavailable } from "./fixture";

const answered = { kind: "answered", secondsAgo: 4 } as const;
const never = { kind: "never" } as const;

const notAnswering = {
  ok: false,
  problem: {
    kind: "unreachable",
    message: "lemonfiber is not answering. It may have been stopped.",
  },
} as const;

const meta = {
  title: "Surfaces/Storage",
  component: Storage,
  args: {
    disk: moment.storage,
    live: answered,
    diagnosis: { ok: true, value: diskChecks },
    read: answered,
  },
} satisfies Meta<typeof Storage>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * What is left of the disk, and everything the checks about it found. Two
 * sources, each stamped by the panel it filled.
 */
export const TheDisk: Story = {};

/**
 * Neither source has answered. Both panels hold a place rather than showing a
 * figure nothing has measured as a zero.
 */
export const BeforeAnythingAnswers: Story = {
  args: { disk: undefined, live: never, diagnosis: undefined, read: never },
};

/**
 * The volume could not be read this refresh. The panel says so inside its own
 * border, in the words the source used, and the checks beside it carry on.
 */
export const TheVolumeCouldNotBeRead: Story = {
  args: { disk: unavailable },
};

/**
 * No check about the disk has reported in. Said in words, because a panel with
 * nothing in it reads as a screen that failed.
 */
export const NoCheckHasReported: Story = {
  args: {
    diagnosis: { ok: true, value: { overall: "unknown", findings: [] } },
  },
};

/**
 * The reading of the checks did not answer, while the live connection is still
 * carrying the figures. One panel falling behind is visible in that panel and
 * nowhere else.
 */
export const OnlyTheChecksAreSilent: Story = {
  args: {
    diagnosis: notAnswering,
    read: { kind: "silent", secondsAgo: 180 },
  },
};
