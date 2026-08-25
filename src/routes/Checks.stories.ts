import type { Meta, StoryObj } from "@storybook/svelte-vite";
import Checks from "./Checks.svelte";
import { allWell, diagnosis } from "./fixture";

const answered = { kind: "answered", secondsAgo: 6 } as const;
const never = { kind: "never" } as const;

const notAnswering = {
  ok: false,
  problem: {
    kind: "unreachable",
    message: "lemonfiber is not answering. It may have been stopped.",
  },
} as const;

const meta = {
  title: "Surfaces/Checks",
  component: Checks,
  args: {
    diagnosis: { ok: true, value: diagnosis },
    freshness: answered,
  },
} satisfies Meta<typeof Checks>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * A run with every kind of verdict in it. The banner carries the run's own
 * grading; each row carries the check's own outcome, what it found, and — where
 * a service wrote something — its own words underneath.
 */
export const WhatTheChecksFound: Story = {};

/**
 * Everything that ran passed. The rows stay: a check that passed is evidence,
 * and a screen that showed only failures could not be read as a clean bill.
 */
export const EverythingPassed: Story = {
  args: { diagnosis: { ok: true, value: allWell } },
};

/**
 * A run in which something could not be established. The grading is calm and it
 * is not a pass, which is the distinction the whole subsystem exists for.
 */
export const HealthCouldNotBeEstablished: Story = {
  args: {
    diagnosis: {
      ok: true,
      value: { overall: "unknown", findings: diagnosis.findings.slice(3) },
    },
  },
};

/**
 * Nothing has answered yet. The panel holds a place rather than showing an
 * empty run, and there is no banner: an empty grading would be a claim about a
 * run that has not happened.
 */
export const BeforeAnythingAnswers: Story = {
  args: { diagnosis: undefined, freshness: never },
};

/**
 * A run that produced no finding at all. Said in words, because a panel with
 * nothing in it reads as a screen that failed rather than as a run with nothing
 * to report.
 */
export const NothingWasChecked: Story = {
  args: {
    diagnosis: { ok: true, value: { overall: "unknown", findings: [] } },
  },
};

/**
 * The reading did not answer. The panel says so in the words the client used,
 * rather than showing a run that never happened as a run that found nothing.
 */
export const NothingAnswered: Story = {
  args: {
    diagnosis: notAnswering,
    freshness: { kind: "silent", secondsAgo: 240 },
  },
};
