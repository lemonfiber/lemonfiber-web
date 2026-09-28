import type { Meta, StoryObj } from "@storybook/svelte-vite";
import Dashboard from "./Dashboard.svelte";
import { chosenForm, controls, moment, stack } from "./fixture";
import { clock, hosted, hoster, keptRecord, unhosted } from "./removals";

const answered = { kind: "answered", secondsAgo: 4 } as const;

const meta = {
  title: "Surfaces/Dashboard/Kept running",
  component: Dashboard,
  args: {
    stack: { ok: true, value: stack },
    programs: { ok: true, value: stack },
    moment,
    flow: "live",
    read: answered,
    live: answered,
    controls: { ...controls, chosen: [chosenForm] },
    hosting: { hosted: { ok: true, value: hosted }, hoster },
  },
} satisfies Meta<typeof Dashboard>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * What this machine keeps running when no terminal is open: what each command
 * does, the command it runs, where it stands, and the one control each offers.
 */
export const WhatThisMachineKeepsRunning: Story = {};

/**
 * The guard kept over the form chosen, and the question asked before taking
 * the clock back, in the words of what it does.
 */
export const AskedBeforeTakingOneBack: Story = {
  args: {
    hosting: {
      hosted: { ok: true, value: hosted },
      hoster: {
        ...hoster,
        work: [keptRecord],
        asked: { doing: "hosting-remove", command: clock },
      },
    },
  },
};

/**
 * A machine whose service manager lemonfiber cannot configure. Nothing is
 * offered, and the panel says what to do instead.
 */
export const NoServiceManagerToKeepIt: Story = {
  args: { hosting: { hosted: { ok: true, value: unhosted }, hoster } },
};
