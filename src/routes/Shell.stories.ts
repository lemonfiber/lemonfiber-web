import type { Meta, StoryObj } from "@storybook/svelte-vite";
import Shell from "./Shell.svelte";
import { controls, moment, stack, started, stillWaiting } from "./fixture";
import { screening } from "../../.storybook/snippets";
import { everyPlace } from "../lib/route";

const answered = { kind: "answered", secondsAgo: 4 } as const;

const overview = screening({
  stack: { ok: true, value: stack },
  programs: { ok: true, value: stack },
  moment,
  flow: "live",
  read: answered,
  live: answered,
  controls,
});

const nothingBuilt = screening({
  stack: undefined,
  programs: undefined,
  moment: undefined,
  flow: "opening",
  read: { kind: "never" },
  live: { kind: "never" },
  controls,
});

const meta = {
  title: "Surfaces/Shell",
  component: Shell,
  argTypes: { place: { control: "select", options: everyPlace } },
  args: { place: "overview", children: overview },
} satisfies Meta<typeof Shell>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * The whole console: the wordmark, the menu, and the screen the menu leads to.
 *
 * Assembled rather than isolated, so the sweep reads what a reader actually
 * gets — the tab order through a page of links and panels, the heading order
 * down it, and whether it reaches 320 pixels without going sideways.
 */
export const TheConsole: Story = {};

/**
 * Somewhere else in the menu. Exactly one row says `aria-current="page"`, so a
 * reader arriving on any screen is told which one it is.
 */
export const SomewhereElse: Story = {
  args: { place: "logs", children: nothingBuilt },
};

/**
 * The whole console with something on offer and something in flight: two
 * controls, a question standing on one of them, work the runtime is holding and
 * the line the wait is saying. Assembled rather than isolated, so the sweep
 * reads the tab order through all of it and whether it still reaches 320 pixels
 * without going sideways.
 */
export const WithSomethingAsked: Story = {
  args: {
    children: screening({
      stack: { ok: true, value: stack },
      programs: { ok: true, value: stack },
      moment,
      flow: "live",
      read: answered,
      live: answered,
      controls: {
        ...controls,
        confirming: "down",
        work: [started],
        waiting: stillWaiting,
      },
    }),
  },
};
