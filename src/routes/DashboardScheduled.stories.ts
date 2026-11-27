import type { Meta, StoryObj } from "@storybook/svelte-vite";
import Dashboard from "./Dashboard.svelte";
import { controls, moment, stack } from "./fixture";
import { heldBack, wentNow, wouldRun } from "../api/runs";
import type { Ran } from "../lib/ran";
import type { Runner } from "../lib/scheduling";
import type { Work } from "../lib/work";

const answered = { kind: "answered", secondsAgo: 4 } as const;

const nothing = (): void => undefined;

/** One record of running configarr now, answered with what it came to. */
const record = (id: string, report: Ran): Work => ({
  id,
  doing: "run",
  scoped: false,
  given: { service: "configarr", now: true, dry_run: report.rehearsed },
  at: "done",
  job: undefined,
  came: { kind: "ran", report },
});

/** What running a service now asks for, with these records under it. */
const runner = (work: readonly Work[]): Runner => ({
  work,
  asked: undefined,
  busy: false,
  onask: nothing,
  onleave: nothing,
  ondrop: nothing,
});

/**
 * The overview with a service that runs and exits on a schedule, which can be
 * run now. The rest of the screen stands as it does live.
 */
const meta = {
  title: "Surfaces/Dashboard/Scheduled",
  component: Dashboard,
  args: {
    stack: { ok: true, value: stack },
    programs: { ok: true, value: stack },
    moment: {
      ...moment,
      scheduled: [
        {
          id: "configarr",
          name: "Configarr",
          fired: true,
          health: "succeeded",
          running: false,
          skipped: 0,
        },
      ],
    },
    flow: "live",
    read: answered,
    live: answered,
    controls,
    runner: runner([]),
  },
} satisfies Meta<typeof Dashboard>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Nothing asked yet: each service offers running it now, rehearsed first. */
export const ReadyToRun: Story = {};

/** The rehearsal read, with the yes naming the service. */
export const RehearsedBeforeTheYes: Story = {
  args: { runner: runner([record("1", wouldRun)]) },
};

/** The rehearsal held back, in lemonfiber's words, with no yes under it. */
export const HeldBack: Story = {
  args: { runner: runner([record("2", heldBack)]) },
};

/** The run taken, and how it went. */
export const RunNow: Story = {
  args: { runner: runner([record("3", wentNow)]) },
};
