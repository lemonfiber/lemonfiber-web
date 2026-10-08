import type { Meta, StoryObj } from "@storybook/svelte-vite";
import Requests from "./Requests.svelte";
import { household, unasked, unread } from "./house";
import { letThrough, madeOffer, readOffer, tender } from "./tended";
import { finder, searchedRecord, traced, tracer, walkedRecord } from "./finds";
import { guidance } from "../api/apps";
import { stalled } from "../api/stalls";

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
      value: { rehearsed: false, available: true, findings: [], members: [] },
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

/**
 * The media server listed everybody and the request service was not asked, so
 * nobody's requests were read. Each panel says that rather than standing empty:
 * an empty panel under somebody's name reads as a person who has asked for
 * nothing, which is the opposite of what happened.
 */
export const NobodysRequestsWereRead: Story = {
  args: { household: { ok: true, value: unasked } },
};

/**
 * The household run from the console: offering somebody an account and saying
 * what the house may ask for first, then under each person what waits on the
 * operator and what can be done for their account.
 */
export const RunningTheHousehold: Story = {
  args: { tender },
};

/**
 * An offer read and nothing made. The yes under it is the same offer, on the
 * terms that were read.
 */
export const AnOfferRead: Story = {
  args: { tender: { ...tender, work: [readOffer] } },
};

/** What offering an account and letting a request through came to. */
export const WhatRunningItCameTo: Story = {
  args: { tender: { ...tender, work: [letThrough, madeOffer] } },
};

/**
 * Taking a password off has nothing to read first, so what it does is asked
 * before anything is sent.
 */
export const BeforeANewPassword: Story = {
  args: { tender: { ...tender, asked: { doing: "reissue", name: "Kit" } } },
};

/**
 * One thing walked through end to end, and where another item is, with a
 * search for it kept as a record.
 */
export const FindingThings: Story = {
  args: {
    finder: { ...finder, work: [walkedRecord, searchedRecord] },
    tracer: { ...tracer, reading: { ok: true, value: traced } },
  },
};

/**
 * Two stuck downloads, each with the service holding it, the stage it stopped
 * at and a control that follows it, under a note that one queue could not be
 * read.
 */
export const StuckDownloads: Story = {
  args: { stuck: { ok: true, value: stalled }, finder, tracer },
};

/**
 * Which app to watch on: a phone well served and a TV poorly served, a caution
 * that playback will struggle on this machine, and what to do when it buffers.
 */
export const WhichAppToWatchOn: Story = {
  args: { clients: { ok: true, value: guidance } },
};
