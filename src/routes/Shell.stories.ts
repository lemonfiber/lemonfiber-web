import type { Meta, StoryObj } from "@storybook/svelte-vite";
import Shell from "./Shell.svelte";
import {
  controls,
  moment,
  scrollback,
  stack,
  started,
  stillWaiting,
} from "./fixture";
import { diagnosis, diskChecks } from "./findings";
import { household } from "./house";
import { kit, kitsShelf, yours } from "./mine";
import {
  asking,
  checking,
  logging,
  requesting,
  screening,
  shelving,
  storing,
} from "../../.storybook/snippets";
import { memberMenu } from "../lib/rooms";
import { consoleMenu, everyPlace } from "../lib/route";

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
  args: { place: "overview", menu: consoleMenu, children: overview },
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

/**
 * What a household member signed in to: their own menu in the same chrome, and
 * what they asked for with what asking does before it. Nothing of the console's
 * is reachable from it, and it still has to reach 320 pixels without going
 * sideways, which is the phone the member is most likely holding.
 */
export const AMembersRequests: Story = {
  args: {
    place: "asked",
    menu: memberMenu,
    children: asking({
      household: yours,
      freshness: answered,
      quiet: false,
    }),
  },
};

/**
 * What the household holds that the member signed in can watch, in their
 * chrome, beside what they are held to.
 */
export const AMembersShelf: Story = {
  args: {
    place: "held",
    menu: memberMenu,
    children: shelving({
      access: { at: "answered", value: [kit.access] },
      watched: answered,
      shelf: { at: "answered", value: kitsShelf },
      freshness: answered,
    }),
  },
};
