import type { Meta, StoryObj } from "@storybook/svelte-vite";
import Settings from "./Settings.svelte";
import { inForce, putQualityBack, readCost, tuner } from "./tuned";

const answered = { kind: "answered", secondsAgo: 6 } as const;

const notAnswering = {
  ok: false,
  problem: {
    kind: "unreachable",
    message: "lemonfiber is not answering. It may have been stopped.",
  },
} as const;

const meta = {
  title: "Surfaces/Settings",
  component: Settings,
  args: {
    quality: { ok: true, value: inForce },
    freshness: answered,
    tuner,
  },
} satisfies Meta<typeof Settings>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * The quality in force, over a config edited by hand: each choice in the
 * stack's own terms, the one this machine would have to transcode marked, and
 * the recorded preset offered back.
 */
export const TheQualityInForce: Story = {};

/**
 * Putting the recorded preset back, asked about before the yes, because the
 * edits made by hand are lost and nothing can be read first.
 */
export const AskedBeforeTheEditsGo: Story = {
  args: { tuner: { ...tuner, asked: { doing: "quality-reapply" } } },
};

/**
 * What fetching the library again would cost, read before the yes, with what
 * putting the recorded preset back replaced under it.
 */
export const WhatFetchingAgainWouldCost: Story = {
  args: { tuner: { ...tuner, work: [readCost, putQualityBack] } },
};

/** The reading did not answer, and says so in lemonfiber's words. */
export const NothingAnswered: Story = {
  args: { quality: notAnswering },
};
