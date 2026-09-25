import type { Meta, StoryObj } from "@storybook/svelte-vite";
import Dashboard from "./Dashboard.svelte";
import {
  adrift,
  chosenForm,
  rehearsed,
  controls,
  finished,
  forgotten,
  leaking,
  moment,
  notAnswering,
  stack,
  started,
  stillWaiting,
  stopped,
  unavailable,
  wouldNot,
} from "./fixture";
import { doorNumbered, frontDoor, house, unaskedHouse } from "./house";
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
 * The tunnel is up, connected where the operator chose, and the download
 * program's own traffic is not going through it. Every other line on the panel
 * reads fine, which is exactly why the comparison is the one that carries the
 * mark: a tunnel carrying nothing is invisible without it.
 */
export const TheDownloadingIsNotInTheTunnel: Story = {
  args: { moment: { ...moment, vpn: { panel: "ready", data: leaking } } },
};

/**
 * A provider that forwards no port. An ordinary place to be rather than a
 * fault, so the panel says what it costs — fewer people able to reach you to
 * share with — instead of marking an absence red.
 */
export const NoPortIsForwarded: Story = {
  args: {
    moment: {
      ...moment,
      vpn: {
        panel: "ready",
        data: { ...leaking, egress_matches: true, forwarded_port: null },
      },
    },
  },
};

/**
 * No tunnel is configured, and the panel is left out altogether rather than
 * drawn permanently red for a choice somebody made on purpose.
 */
export const NoTunnelIsConfigured: Story = {
  args: { moment: { ...moment, vpn: null } },
};

/**
 * lemonfiber can no longer reach what it reads the figures off, while this
 * page's own connection to lemonfiber is carrying normally. Two connections,
 * and the one that failed is the one nothing on the screen would otherwise say
 * anything about.
 */
export const LemonfiberCannotReachTheEngine: Story = {
  args: { moment: { ...moment, telemetry: "disconnected" } },
};

/**
 * Six panels whose sources could not fill them. Each says so inside its own
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
      door: unavailable,
      household: unavailable,
      vpn: unavailable,
    },
  },
};

/**
 * A stack with nothing wrong. Nothing stuck, nothing downloading, nothing
 * queued, nothing the operator has been told — said in words, because a row of
 * zeroes reads as a measurement and these are absences. The grading expands to
 * nothing either: a heading over a list that is not there would promise one.
 */
export const NothingWrong: Story = {
  args: {
    moment: {
      ...moment,
      alerts: [],
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
  args: {
    controls: {
      ...controls,
      chosen: [chosenForm],
      preview: { ok: true, value: rehearsed },
      previewed: { kind: "answered", secondsAgo: 2 },
    },
  },
};

/**
 * Two forms taken up. What starting them would do is one answer for both: a
 * program they share is listed once.
 */
export const TwoFormsChosen: Story = {
  args: {
    controls: {
      ...controls,
      chosen: ["core", chosenForm],
      preview: {
        ok: true,
        value: {
          ...rehearsed,
          forms: ["core", chosenForm],
          services: ["gluetun", "prowlarr", ...rehearsed.services],
        },
      },
      previewed: { kind: "answered", secondsAgo: 2 },
    },
  },
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

/**
 * The operator named a front door and this stack will not send anybody there.
 * The worked-out door stands, and the sentence under it carries what they
 * wrote and why it is not it — so an operator whose setting was refused finds
 * their own words rather than a door they did not choose.
 */
export const TheDoorTheOperatorNamedWasRefused: Story = {
  args: {
    moment: {
      ...moment,
      door: {
        panel: "ready",
        data: {
          ...frontDoor,
          chosen: {
            chosen: "refused",
            door: {
              named: "qbittorrent",
              because:
                "Nobody in the house should learn the download client exists.",
            },
          },
        },
      },
    },
  },
};

/**
 * The door is answering and nothing on this machine can say where another
 * device would reach it. A different thing to fix from a service that is down,
 * and told apart from it — one is fixed by starting something, the other by
 * giving this machine an address the household's devices can use.
 */
export const TheDoorHasNowhereToBeReachedAt: Story = {
  args: {
    moment: {
      ...moment,
      door: {
        panel: "ready",
        data: {
          ...frontDoor,
          standing: "stranded",
          address: null,
          meaning:
            "The request surface is answering here, and nothing on this machine can say what address another device would reach it at.",
        },
      },
    },
  },
};

/**
 * Nothing at all is published to the household: an operator-only stack. Said
 * as that rather than by pointing at something absent, and the address that
 * would have been handed out is not substituted for.
 */
export const NoFrontDoorAtAll: Story = {
  args: {
    moment: {
      ...moment,
      door: {
        panel: "ready",
        data: {
          standing: "none",
          chosen: { chosen: "derived" },
          service: null,
          facing: null,
          address: null,
          meaning:
            "This stack publishes nothing anybody in the house could begin at.",
          beside: [],
        },
      },
    },
  },
};

/**
 * A machine with no friendly name to publish. The address is a number, so what
 * is worth knowing about it sits under it as a caption: a number can change on
 * its own, and a bookmark that stops working is a question for the operator.
 */
export const AnAddressThatMayChange: Story = {
  args: {
    moment: {
      ...moment,
      door: {
        panel: "ready",
        data: {
          ...frontDoor,
          address: {
            url: doorNumbered,
            caution:
              "This is a number rather than a name, and the house's router may hand out a different one.",
          },
        },
      },
    },
  },
};

/**
 * Nothing in the house is waiting on the operator. Said in words, because an
 * empty table reads as a table nobody filled in.
 */
export const NothingIsWaitingOnTheOperator: Story = {
  args: {
    moment: {
      ...moment,
      household: {
        panel: "ready",
        data: {
          ...house,
          members: house.members.map((one) => ({ ...one, requests: [] })),
        },
      },
    },
  },
};

/**
 * The record could not be read at all. The same empty list as a house nobody
 * lives in, and the opposite fact — which is why the answer carries which of
 * the two it is, and why the panel says it.
 */
export const TheHouseCouldNotBeRead: Story = {
  args: {
    moment: {
      ...moment,
      household: {
        panel: "ready",
        data: {
          ...house,
          available: false,
          members: [],
          findings: [
            "The media server answered, and its list of accounts could not be read.",
          ],
        },
      },
    },
  },
};

/**
 * The media server listed everybody and the request service was not asked, so
 * nobody's requests were read. The panel says it could not be read rather than
 * that nothing is waiting — the two arrive as the same empty list, and an
 * operator told the second would go to bed on somebody's unruled request.
 */
export const NobodysRequestsWereRead: Story = {
  args: {
    moment: {
      ...moment,
      household: { panel: "ready", data: unaskedHouse },
    },
  },
};
