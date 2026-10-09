import type { Meta, StoryObj } from "@storybook/svelte-vite";
import Shelf from "./Shelf.svelte";
import {
  arrival,
  kit,
  kitsEmptyShelf,
  kitsShelf,
  kitsUnreadShelf,
} from "./mine";

const answered = { kind: "answered", secondsAgo: 8 } as const;
const never = { kind: "never" } as const;

const unreachable = {
  at: "unanswered",
  problem: {
    kind: "unreachable",
    message: "lemonfiber is not answering. It may have been stopped.",
  },
} as const;

const meta = {
  title: "Surfaces/Shelf",
  component: Shelf,
  args: {
    access: { at: "answered", value: [kit.access] },
    watched: answered,
    shelf: { at: "answered", value: kitsShelf },
    freshness: answered,
    onopen: () => undefined,
    onclose: () => undefined,
  },
} satisfies Meta<typeof Shelf>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * What the household holds that the member signed in can watch, as the media
 * server shows it to them, beside what they are held to. A title their limits
 * hide is not on the shelf to begin with.
 */
export const WhatIsHere: Story = {};

/** One title opened over the shelf, read when it was opened. */
export const OneTitleOpened: Story = {
  args: {
    opened: kitsShelf.holdings[0],
    told: { at: "answered", value: arrival },
  },
};

/** The shelf was read, and holds nothing they can watch yet. */
export const NothingHereYet: Story = {
  args: { shelf: { at: "answered", value: kitsEmptyShelf } },
};

/**
 * The media server would not give up the shelf. Said as unread, not as empty,
 * and without the account of why, which is the operator's, with a way to ask
 * again.
 */
export const TheShelfCouldNotBeRead: Story = {
  args: {
    shelf: { at: "answered", value: kitsUnreadShelf },
    onretry: () => undefined,
  },
};

/**
 * lemonfiber stopped answering. Neither the shelf nor the limits are kept from
 * an earlier read: a second copy of what somebody may watch is the one a
 * household would believe.
 */
export const WhileNothingAnswers: Story = {
  args: {
    access: unreachable,
    watched: never,
    shelf: unreachable,
    freshness: never,
  },
};

/** Nothing has answered yet, and both panels hold a place. */
export const BeforeAnythingAnswers: Story = {
  args: {
    access: undefined,
    watched: never,
    shelf: undefined,
    freshness: never,
  },
};
