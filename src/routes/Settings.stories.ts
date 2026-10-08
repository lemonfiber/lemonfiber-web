import type { Meta, StoryObj } from "@storybook/svelte-vite";
import Settings from "./Settings.svelte";
import { configurer, everySetting, stagedChange } from "./configured";
import { inForce, putQualityBack, readCost, tuner } from "./tuned";
import { made, pairer } from "./paired";
import { inventory } from "../api/credentials";
import { leaving } from "../api/leavings";
import { pausedRecord, planRecord, shared, sharer, updater } from "./lined";

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
    settings: { ok: true, value: everySetting },
    freshness: answered,
    tuner,
    configurer,
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

/**
 * Every setting, with a change that costs something staged under them: the
 * value in force against the one proposed, what it interrupts, what it does to
 * each library, and whether what is coming down is let finish first.
 */
export const WhatAChangeWouldCost: Story = {
  args: { configurer: { ...configurer, work: [stagedChange] } },
};

/**
 * Fresh pairing material for the companion app: the line to type, and the
 * short form of the certificate's fingerprint to check on the phone.
 */
export const PairingAPhone: Story = {
  args: { pairer: { ...pairer, work: [made] } },
};

/**
 * How the line is shared, with limits to declare, and the steps updating
 * would take, read and waiting for a yes.
 */
export const TheLineAndTheVersions: Story = {
  args: {
    line: { ok: true, value: shared },
    sharer,
    updater: { ...updater, work: [planRecord] },
  },
};

/**
 * Every download paused: one client stopped and one nobody reached, said in
 * the client's own words rather than read as paused.
 */
export const EveryDownloadPaused: Story = {
  args: {
    line: { ok: true, value: shared },
    sharer: { ...sharer, work: [pausedRecord] },
  },
};

/**
 * Everything that leaves this machine: lemonfiber's own requests, one allowed
 * and one switched off, and two services' requests, one with no record shipped
 * of what it reaches.
 */
export const WhatLeavesThisMachine: Story = {
  args: { outbound: { ok: true, value: leaving } },
};

/**
 * Every credential the stack holds, with no value among them, and what keeping
 * them in files protects against and what it does not.
 */
export const EveryCredential: Story = {
  args: { credentials: { ok: true, value: inventory } },
};
