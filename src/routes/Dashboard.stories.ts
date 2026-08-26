import type { Meta, StoryObj } from "@storybook/svelte-vite";
import Dashboard from "./Dashboard.svelte";
import {
  adrift,
  chosenForm,
  controls,
  finished,
  forgotten,
  moment,
  notAnswering,
  stack,
  started,
  stillWaiting,
  stopped,
  unavailable,
  wouldNot,
} from "./fixture";
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
    controls,
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
    controls: { ...controls, forms: undefined },
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
 * Nothing answered at all, and nothing is opening the connection again: a first
 * opening is tried once. The banner interrupts, carries the one control that
 * asks for the connection again, and each panel says in the source's own words
 * why it is empty rather than showing a zero.
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
    onretry: () => undefined,
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

/**
 * The one costly control has been pressed and nothing has happened yet. The
 * question stands under the controls rather than in place of them, so a reader
 * whose focus is still on the button they pressed reaches the answer by moving
 * forward. Every control is silenced without leaving the page.
 */
export const AskingBeforeItStops: Story = {
  args: { controls: { ...controls, confirming: "down" } },
};

/**
 * Work the runtime is holding. The reply named it and said nothing else: the
 * request is over, the work is not, and closing this page would not stop it.
 */
export const WorkThatOutlivesTheRequest: Story = {
  args: { controls: { ...controls, work: [started] } },
};

/**
 * The stream carrying what the wait is still waiting for. It is its own row:
 * one wait speaks at a time and never names the work it belongs to, so filing
 * it under a job would be a claim the stream did not make.
 */
export const WhatTheWaitIsSaying: Story = {
  args: {
    controls: { ...controls, work: [started], waiting: stillWaiting },
  },
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
          at: "declined",
          said: wouldNot,
        },
      ],
    },
  },
};

/**
 * A form taken up. Three controls that could do nothing without one come
 * alive, the two that can mean the whole stack say they no longer do, and the
 * line above them says as much in words.
 */
export const AFormChosen: Story = {
  args: { controls: { ...controls, chosen: [chosenForm] } },
};

/**
 * The stack declares no forms at all. Said in words rather than left as an
 * empty frame a reader has to interpret.
 */
export const NoFormsDeclared: Story = {
  args: {
    controls: { ...controls, forms: { ok: true, value: { forms: [] } } },
  },
};

/**
 * The listing did not answer. The panel says why in the source's own words,
 * and the controls that need a form stay silent because there is none to
 * choose.
 */
export const FormsCouldNotBeListed: Story = {
  args: {
    controls: {
      ...controls,
      forms: {
        ok: false,
        problem: { kind: "unreachable", message: notAnswering },
      },
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
 * A name this run no longer knows. Nothing carries a job across a restart, so
 * this is absence rather than an unfinished wait — and it is said as absence,
 * with no alarm attached to it.
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
      work: [started, finished, stopped, forgotten, adrift],
    },
  },
};

/**
 * A request in flight. No control can be pressed a second time, and none of
 * them leaves the page while it cannot be.
 */
export const AskingNow: Story = {
  args: { controls: { ...controls, busy: true } },
};
