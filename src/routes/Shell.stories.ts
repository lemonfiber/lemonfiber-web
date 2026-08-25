import type { Meta, StoryObj } from "@storybook/svelte-vite";
import Shell from "./Shell.svelte";
import {
  controls,
  diagnosis,
  diskChecks,
  household,
  moment,
  scrollback,
  stack,
  started,
  stillWaiting,
} from "./fixture";
import {
  checking,
  logging,
  requesting,
  screening,
  storing,
} from "../../.storybook/snippets";
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

const checks = checking({
  diagnosis: { ok: true, value: diagnosis },
  freshness: answered,
});

const disk = storing({
  disk: moment.storage,
  live: answered,
  diagnosis: { ok: true, value: diskChecks },
  read: answered,
});

const logs = logging({
  scrollback: { ok: true, value: scrollback },
  freshness: answered,
});

const requests = requesting({
  household: { ok: true, value: household },
  freshness: answered,
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
 * The checks, in the chrome. Exactly one row of the menu says
 * `aria-current="page"`, so a reader arriving on any screen is told which one
 * it is — and the sweep reads the whole page rather than the screen alone.
 */
export const TheChecks: Story = {
  args: { place: "checks", children: checks },
};

/**
 * The disk, in the chrome: the figures off the live connection and the checks
 * about the volume under them.
 */
export const TheDisk: Story = {
  args: { place: "storage", children: disk },
};

/**
 * The scrollback, in the chrome.
 *
 * The narrow measurement is what this story is here for. Beside a menu and
 * inside the shell's own padding, a service name of twenty-one characters and a
 * line beside it have less room than the screen has on its own — which is the
 * width at which the name has to move to a row of its own.
 */
export const TheScrollback: Story = {
  args: { place: "logs", children: logs },
};

/**
 * What the household asked for, in the chrome: a table per member, inside a
 * page that still has to reach 320 pixels without going sideways.
 */
export const TheRequests: Story = {
  args: { place: "requests", children: requests },
};

/**
 * The whole console with something on offer and something in flight: the
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
