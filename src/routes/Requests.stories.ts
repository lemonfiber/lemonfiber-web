import type { Meta, StoryObj } from "@storybook/svelte-vite";
import Requests from "./Requests.svelte";
import { household, unread } from "./fixture";

const answered = { kind: "answered", secondsAgo: 8 } as const;
const never = { kind: "never" } as const;

const meta = {
  title: "Surfaces/Requests",
  component: Requests,
  args: { household: { ok: true, value: household }, freshness: answered },
} satisfies Meta<typeof Requests>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * What each person in the house asked for, and where each request stands.
 *
 * Where it stands is set in words and given no colour: nobody has said that a
 * request turned down wants the operator more than one still waiting for
 * approval does.
 */
export const WhatTheHouseAskedFor: Story = {};

/**
 * Nothing has answered yet. The panel holds a place rather than showing a
 * household that has asked for nothing.
 */
export const BeforeAnythingAnswers: Story = {
  args: { household: undefined, freshness: never },
};

/**
 * The record was read and the house has asked for nothing.
 */
export const NobodyHasAskedForAnything: Story = {
  args: {
    household: {
      ok: true,
      value: { available: true, findings: [], members: [] },
    },
  },
};

/**
 * The record could not be read at all. The same empty list as the story above
 * it, and the opposite fact — which is why the answer carries which of the two
 * it is, and why the screen says it.
 */
export const NothingCouldBeRead: Story = {
  args: { household: { ok: true, value: unread } },
};

/**
 * Some of it was read and some of it was not. What could not be read stands in
 * its own panel: it is not one more request, it is the reason the lists above
 * it may be shorter than the truth.
 */
export const SomeOfItCouldNotBeRead: Story = {
  args: {
    household: {
      ok: true,
      value: { ...household, findings: [...unread.findings] },
    },
  },
};

/**
 * The reading did not answer. The panel says so in the words the client used.
 */
export const NothingAnswered: Story = {
  args: {
    household: {
      ok: false,
      problem: {
        kind: "unreachable",
        message: "lemonfiber is not answering. It may have been stopped.",
      },
    },
    freshness: { kind: "silent", secondsAgo: 300 },
  },
};
