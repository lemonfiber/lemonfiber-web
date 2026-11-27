import type { Meta, StoryObj } from "@storybook/svelte-vite";
import Dashboard from "./Dashboard.svelte";
import {
  adrift,
  chosenForm,
  controls,
  finished,
  forgotten,
  job,
  moment,
  stack,
  started,
  stopped,
  wouldNot,
} from "./fixture";
import type { Ending } from "../api/redeeming";
import type { Work } from "../lib/work";

const answered = { kind: "answered", secondsAgo: 4 } as const;

/** A guard over the data location whose work ended before it finished, as said. */
const ended = (ending: Ending): Work => ({
  id: "6",
  doing: "watch",
  scoped: true,
  given: {},
  at: "ended",
  job,
  ending,
});

/**
 * The overview with what this page has asked for under its controls: each
 * record as what became of its work leaves it. The rest of the screen stands
 * as it does live.
 */
const meta = {
  title: "Surfaces/Dashboard/Work",
  component: Dashboard,
  args: {
    stack: { ok: true, value: stack },
    programs: { ok: true, value: stack },
    moment,
    flow: "live",
    read: answered,
    live: answered,
    controls,
  },
} satisfies Meta<typeof Dashboard>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Work the runtime is holding. The reply named it and said nothing else: the
 * request is over, the work is not, and neither closing this page nor hiding
 * the record would stop it.
 */
export const WorkThatOutlivesTheRequest: Story = {
  args: { controls: { ...controls, work: [started] } },
};

/**
 * lemonfiber would not do it, and says why in its own sentence rather than in
 * a status nobody can read.
 */
export const AskedForSomethingRefused: Story = {
  args: {
    controls: {
      ...controls,
      work: [
        {
          id: "2",
          doing: "down",
          scoped: false,
          given: {},
          at: "declined",
          said: wouldNot,
        },
      ],
    },
  },
};

/**
 * The name was redeemed and the work had finished. The record stops saying it
 * is under way, which it could only have gone on saying by never asking.
 */
export const WorkThatFinished: Story = {
  args: { controls: { ...controls, work: [finished] } },
};

/**
 * The name was redeemed and the work had stopped. What went wrong is
 * lemonfiber's own account of it, passed through as it was written.
 */
export const WorkThatStopped: Story = {
  args: { controls: { ...controls, work: [stopped] } },
};

/**
 * A name lemonfiber no longer answers this page about: never issued in this
 * run, let go elsewhere, or work another sign-in started. It is absence rather
 * than an unfinished wait or a failure, and is said with no alarm attached.
 */
export const WorkNoLongerKnown: Story = {
  args: { controls: { ...controls, work: [forgotten] } },
};

/**
 * The asking stopped, not the work. The record reads as the last thing known
 * rather than claiming an outcome this page never heard.
 */
export const LostTrackOfTheWork: Story = {
  args: { controls: { ...controls, work: [adrift] } },
};

/**
 * Several records at once, newest first. Every way a record can read, on one
 * page, so the order they are read in is a thing a reader can check.
 */
export const EverythingAskedForSoFar: Story = {
  args: {
    controls: {
      ...controls,
      chosen: [chosenForm],
      work: [started, finished, stopped, ended("let-go"), forgotten, adrift],
    },
  },
};

/**
 * The name was released, which ended the work before it finished. Told apart
 * from work that finished and from work that failed.
 */
export const WorkEndedByReleasingItsName: Story = {
  args: { controls: { ...controls, work: [ended("released")] } },
};

/**
 * Nothing asked about a guard for long enough, and it was let go. Somebody's
 * decision and a screen that went away are different news.
 */
export const WorkLetGoUnasked: Story = {
  args: { controls: { ...controls, work: [ended("let-go")] } },
};

/** The services the work followed stopped saying anything, so it ended. */
export const WorkWhoseServicesWentQuiet: Story = {
  args: { controls: { ...controls, work: [ended("quiet")] } },
};
