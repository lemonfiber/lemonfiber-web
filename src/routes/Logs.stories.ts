import type { Meta, StoryObj } from "@storybook/svelte-vite";
import Logs from "./Logs.svelte";
import { scrollback } from "./fixture";

const answered = { kind: "answered", secondsAgo: 2 } as const;
const never = { kind: "never" } as const;

const meta = {
  title: "Surfaces/Logs",
  component: Logs,
  args: { scrollback: { ok: true, value: scrollback }, freshness: answered },
} satisfies Meta<typeof Logs>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * What every service has said lately.
 *
 * One name here is twenty-one characters and is never shortened; one line is a
 * path with nothing in it to break on. At a wide window the names hold a column
 * and the lines sit beside them; at a narrow one the lines drop under their own
 * name rather than being squeezed into a column nobody can read, which is what
 * the sweep at 320 pixels is reading.
 */
export const WhatTheyAreSaying: Story = {};

/**
 * Nothing has answered yet. The panel holds a place rather than showing an
 * empty scrollback.
 */
export const BeforeAnythingAnswers: Story = {
  args: { scrollback: undefined, freshness: never },
};

/**
 * The services are running and have said nothing. Said in words, because an
 * empty panel reads as a screen that failed rather than as a stack that is
 * quiet.
 */
export const NothingHasBeenSaid: Story = {
  args: { scrollback: { ok: true, value: [] } },
};

/**
 * The scrollback could not be read. The panel says so in the words the client
 * used, rather than showing a silence nobody established.
 */
export const NothingAnswered: Story = {
  args: {
    scrollback: {
      ok: false,
      problem: {
        kind: "unreachable",
        message: "lemonfiber is not answering. It may have been stopped.",
      },
    },
    freshness: { kind: "silent", secondsAgo: 120 },
  },
};
