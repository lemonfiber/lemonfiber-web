import type { Meta, StoryObj } from "@storybook/svelte-vite";
import Dashboard from "./Dashboard.svelte";
import { moment, stack, unavailable } from "./fixture";
import { everyFlow } from "../lib/flow";

const answered = { kind: "answered", secondsAgo: 4 } as const;
const never = { kind: "never" } as const;

const meta = {
  title: "Surfaces/Dashboard",
  component: Dashboard,
  argTypes: { flow: { control: "select", options: everyFlow } },
  args: {
    stack: { ok: true, value: stack },
    programs: { ok: true, value: stack },
    moment,
    flow: "live",
    read: answered,
    live: answered,
  },
} satisfies Meta<typeof Dashboard>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * The connection is carrying, so the screen makes no claim about being
 * current: it simply is, and there is no banner.
 */
export const Live: Story = {};

/**
 * Nothing has answered yet. Every panel holds a place rather than showing an
 * empty figure, and the banner says the connection is still being opened —
 * which is not the same as one that failed.
 */
export const BeforeAnythingAnswers: Story = {
  args: {
    stack: undefined,
    programs: undefined,
    moment: undefined,
    flow: "opening",
    read: never,
    live: never,
  },
};

/**
 * The readings answered and the connection has not opened. The screen draws
 * what is running from the readings and says plainly that nothing has graded
 * it, rather than waiting for both.
 */
export const OnlyTheReadingsAnswered: Story = {
  args: { moment: undefined, flow: "opening", live: never },
};

/**
 * The connection carried figures and stopped. Everything stays on the screen
 * and the banner says what it now is: the last thing confirmed, not what is
 * true now.
 */
export const TheConnectionDropped: Story = {
  args: { flow: "stale", live: { kind: "silent", secondsAgo: 96 } },
};

/**
 * Nothing answered at all. The banner interrupts, and each panel says in the
 * source's own words why it is empty rather than showing a zero.
 */
export const NothingAnswered: Story = {
  args: {
    stack: {
      ok: false,
      problem: {
        kind: "unreachable",
        message: "lemonfiber is not answering. It may have been stopped.",
      },
    },
    programs: {
      ok: false,
      problem: {
        kind: "unreachable",
        message: "lemonfiber is not answering. It may have been stopped.",
      },
    },
    moment: undefined,
    flow: "lost",
    read: { kind: "silent", secondsAgo: 240 },
    live: never,
  },
};

/**
 * Three panels whose sources could not fill them. Each says so inside its own
 * border, in the words its source used, and the panels beside them carry on —
 * which is the whole of degrading honestly.
 */
export const PanelsThatCouldNotBeFilled: Story = {
  args: {
    moment: {
      ...moment,
      storage: unavailable,
      transfers: unavailable,
      queue: unavailable,
    },
  },
};

/**
 * A stack with nothing wrong. Nothing stuck, nothing downloading, nothing
 * queued — said in words, because a row of zeroes reads as a measurement and
 * these are absences.
 */
export const NothingWrong: Story = {
  args: {
    moment: {
      ...moment,
      health: {
        affected: [],
        standing: "healthy",
        wanting_attention: 0,
        worst: null,
      },
      stuck: [],
      transfers: { panel: "ready", data: [] },
      queue: { panel: "ready", data: [] },
    },
  },
};
