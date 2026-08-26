import { render, screen, within } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import type { Reading } from "@lemonfiber/sdk-ts";
import { describe, expect, it, vi } from "vitest";
import Dashboard from "./Dashboard.svelte";
import { moment, services, stack, unavailable, worst } from "./fixture";
import {
  adrift,
  chosenForm,
  controls,
  declared,
  finished,
  forgotten,
  notAnswering,
  started,
  stillWaiting,
  stopped,
  wentWrong,
  wouldNot,
} from "./fixture";

import { stampFor, type Freshness } from "../lib/freshness";
import { wordFor } from "../lib/state";
import {
  everyServiceState,
  stateOfService,
  wordOfCondition,
  wordOfStanding,
  type Moment,
  type Stack,
} from "../lib/wire";
import {
  everyDoing,
  namesItsForms,
  questionOf,
  takesForms,
  titleOfDoing,
  wordOfDoing,
} from "../lib/work";
import * as m from "../paraglide/messages.js";

const never: Freshness = { kind: "never" };
const answered: Freshness = { kind: "answered", secondsAgo: 4 };
const read: Reading<Stack> = { ok: true, value: stack };

/** The screen with nothing yet, and whatever this test hands it instead. */
function board(over: Partial<Parameters<typeof Dashboard>[1]> = {}): void {
  render(Dashboard, {
    stack: undefined,
    programs: undefined,
    moment: undefined,
    flow: "opening",
    read: never,
    live: never,
    controls,
    ...over,
  });
}

/** The stream's moment, with one part of it replaced. */
const changed = (over: Partial<Moment>): Moment => ({ ...moment, ...over });

describe("before anything has answered", () => {
  it("holds a place on every panel rather than showing empty figures", () => {
    board({ controls: { ...controls, forms: undefined } });
    expect(screen.getAllByText(m.waiting_answer())).toHaveLength(7);
  });

  it("says the connection is still being opened", () => {
    board();
    expect(screen.getByText(m.flow_opening_lead())).toBeInTheDocument();
  });
});

describe("the banner", () => {
  // A screen that is current has nothing to say about being current.
  it("says nothing while the connection is carrying", () => {
    board({ flow: "live", moment });
    expect(screen.queryByText(m.flow_stale_lead())).toBeNull();
  });

  it("interrupts when the connection was never made", () => {
    board({ flow: "lost" });
    expect(screen.getByRole("alert")).toHaveTextContent(
      m.banner_contact_lead(),
    );
  });

  // A screen whose figures were true a minute ago is a claim about the whole
  // screen, and it waits for the reader to pause rather than interrupting.
  it("says what a dropped connection means for everything below it", () => {
    board({ flow: "stale", moment });
    const lead = screen.getByText(m.flow_stale_lead());
    expect(lead.closest("[role='status']")).not.toBeNull();
    expect(screen.getByText(m.flow_stale_prose())).toBeInTheDocument();
  });

  // Reloading the page is the only other way back, and nothing on the screen
  // says so.
  it("offers the connection again where nothing is opening it", async () => {
    const retry = vi.fn();
    board({ flow: "lost", onretry: retry });

    await userEvent.click(
      within(screen.getByRole("alert")).getByRole("button", {
        name: m.action_try_again(),
      }),
    );

    expect(retry).toHaveBeenCalledTimes(1);
  });

  // Something is already opening it, and a second control asking for what is
  // under way is a control that does nothing.
  it("offers nothing to press while the connection is being opened", () => {
    board({ flow: "opening" });
    expect(
      screen.queryByRole("button", { name: m.action_try_again() }),
    ).toBeNull();
  });
});

describe("how things stand", () => {
  const panel = (): HTMLElement =>
    screen.getByRole("region", { name: m.panel_standing() });

  it("counts what is wrong and names the worst of it", () => {
    board({ stack: read, moment, flow: "live", live: answered });
    expect(panel()).toHaveTextContent("2");
    expect(screen.getByText(worst)).toBeInTheDocument();
  });

  it("sets the reading of what is running beside the count", () => {
    board({ stack: read, moment, flow: "live" });
    expect(
      screen.getByText(wordOfCondition(stack.condition)),
    ).toBeInTheDocument();
  });

  // A grading with nothing named as worst still says how it was graded.
  it("falls back to the grading where nothing is named", () => {
    board({
      stack: read,
      moment: changed({ health: { ...moment.health, worst: null } }),
      flow: "live",
    });
    expect(
      screen.getByText(wordOfStanding(moment.health.standing)),
    ).toBeInTheDocument();
  });

  // A stack nothing has graded has no count, and a zero would read as "nothing
  // is wrong" rather than as "nothing has looked".
  it("shows no numeral where nothing has graded the stack", () => {
    board({
      stack: read,
      moment: changed({
        health: {
          affected: [],
          standing: "unknown",
          wanting_attention: 0,
          worst: null,
        },
      }),
      flow: "live",
    });
    expect(panel()).toHaveTextContent(m.value_not_known());
    expect(panel().querySelectorAll(".figure")).toHaveLength(0);
  });

  // The reading answers once; the stream keeps grading. One without the other
  // is a screen that knows what is running and not what is wrong with it.
  it("says what is running before anything has graded it", () => {
    board({ stack: read, read: answered });
    expect(panel()).toHaveTextContent(wordOfCondition(stack.condition));
    expect(panel()).toHaveTextContent(m.waiting_answer());
  });

  it("says in the source's own words why it could not be asked", () => {
    board({
      stack: {
        ok: false,
        problem: { kind: "unreachable", message: "Nothing answered." },
      },
    });
    expect(screen.getByText("Nothing answered.")).toBeInTheDocument();
  });

  // The panel stamps whichever source filled it, so one falling behind shows
  // in the panels it fed and nowhere else.
  it("stamps the reading until the stream has delivered", () => {
    board({ stack: read, read: answered });
    expect(panel()).toHaveTextContent(stampFor(answered));
  });

  it("stamps the stream once it has", () => {
    board({ stack: read, moment, flow: "live", live: answered, read: never });
    expect(panel()).toHaveTextContent(stampFor(answered));
  });
});

describe("the disk", () => {
  const panel = (): HTMLElement =>
    screen.getByRole("region", { name: m.panel_space() });

  it("says what is free and whether an import costs a second copy", () => {
    board({ moment, flow: "live" });
    expect(panel()).toHaveTextContent("384 GB");
    expect(panel()).toHaveTextContent(m.schematic_linked_not_copied());
    expect(panel()).toHaveTextContent(m.space_not_filling());
  });

  it("says when it runs out at the rate it is filling", () => {
    board({
      moment: changed({
        storage: {
          panel: "ready",
          data: {
            free: { reading: "known", value: 1024 },
            hardlink: "copying",
            exhaustion: { secs: 7200, nanos: 0 },
          },
        },
      }),
      flow: "live",
    });
    expect(panel()).toHaveTextContent(m.space_until_full({ span: "2h" }));
  });

  // A volume that could not be read must not render as no space at all.
  it("shows no figure where the volume could not be read", () => {
    board({
      moment: changed({
        storage: {
          panel: "ready",
          data: { free: { reading: "unknown" }, hardlink: "unknown" },
        },
      }),
      flow: "live",
    });
    expect(panel()).toHaveTextContent(m.value_cannot_say());
  });

  it("keeps the last figure a silent source gave", () => {
    board({
      moment: changed({
        storage: {
          panel: "ready",
          data: {
            free: { reading: "stale", value: 1024 },
            hardlink: "linking",
            exhaustion: null,
          },
        },
      }),
      flow: "live",
    });
    expect(panel()).toHaveTextContent("1 KB");
    expect(panel()).toHaveTextContent(m.value_last_known());
  });

  // An unavailable panel says so inside its own border; the panels beside it
  // carry on.
  it("says why it could not be filled, and shows no figures", () => {
    board({ moment: changed({ storage: unavailable }), flow: "live" });
    expect(panel()).toHaveTextContent(unavailable.data.reason);
    expect(panel()).not.toHaveTextContent("384 GB");
    expect(
      screen.getByRole("region", { name: m.panel_attention() }),
    ).toBeInTheDocument();
  });
});

describe("the programs", () => {
  const panel = (): HTMLElement =>
    screen.getByRole("region", { name: m.panel_programs() });

  it("names every service the reading gives", () => {
    board({ programs: read, read: answered });
    for (const service of services) {
      expect(screen.getByText(service.name)).toBeInTheDocument();
    }
  });

  it.each(everyServiceState)("tags a service that is %s", (state) => {
    board({
      programs: {
        ok: true,
        value: {
          ...stack,
          services: [
            {
              id: "one",
              name: "One",
              state,
              criticality: "core",
              profile: "core",
              depends_on: [],
            },
          ],
        },
      },
    });
    expect(
      screen.getAllByText(wordFor(stateOfService(state))).length,
    ).toBeGreaterThan(0);
  });

  it("says plainly when nothing has reported in", () => {
    board({ programs: { ok: true, value: { ...stack, services: [] } } });
    expect(screen.getByText(m.programs_none())).toBeInTheDocument();
  });

  it("says in the source's own words why it could not be asked", () => {
    board({
      programs: {
        ok: false,
        problem: { kind: "unreachable", message: "Nothing answered." },
      },
    });
    expect(panel()).toHaveTextContent("Nothing answered.");
  });
});

describe("what is coming in", () => {
  const panel = (): HTMLElement =>
    screen.getByRole("region", { name: m.panel_downloading() });

  it("draws how far each one has got", () => {
    board({ moment, flow: "live" });
    expect(
      screen.getByRole("progressbar", { name: m.meter_how_far() }),
    ).toHaveAttribute("aria-valuenow", "62");
    expect(panel()).toHaveTextContent("11 MB/s");
    expect(panel()).toHaveTextContent("8m");
  });

  // A stalled download and one whose client has gone quiet mean opposite
  // things, and the speed is the figure that difference is about.
  it("gives no speed and no time left where neither was measured", () => {
    board({
      moment: changed({
        transfers: {
          panel: "ready",
          data: [
            {
              name: "Some Film (2019)",
              progress: 4,
              protocol: "torrent",
              speed: { reading: "unknown" },
            },
          ],
        },
      }),
      flow: "live",
    });
    expect(panel().querySelectorAll(".figure")).toHaveLength(0);
    expect(panel()).toHaveTextContent(m.value_cannot_say());
  });

  it("says plainly when nothing is downloading", () => {
    board({
      moment: changed({ transfers: { panel: "ready", data: [] } }),
      flow: "live",
    });
    expect(screen.getByText(m.moving_nothing())).toBeInTheDocument();
  });

  it("says why it could not be filled", () => {
    board({ moment: changed({ transfers: unavailable }), flow: "live" });
    expect(panel()).toHaveTextContent(unavailable.data.reason);
  });
});

describe("what is waiting in line", () => {
  const panel = (): HTMLElement =>
    screen.getByRole("region", { name: m.panel_waiting_in_line() });

  it("gives each service a box with what it is holding", () => {
    board({ moment, flow: "live" });
    expect(panel()).toHaveTextContent("sonarr");
    expect(panel()).toHaveTextContent("4");
  });

  it("says plainly when nothing is queued", () => {
    board({
      moment: changed({ queue: { panel: "ready", data: [] } }),
      flow: "live",
    });
    expect(screen.getByText(m.waiting_nothing())).toBeInTheDocument();
  });

  it("says why it could not be filled", () => {
    board({ moment: changed({ queue: unavailable }), flow: "live" });
    expect(panel()).toHaveTextContent(unavailable.data.reason);
  });
});

describe("what needs the operator", () => {
  const panel = (): HTMLElement =>
    screen.getByRole("region", { name: m.panel_attention() });

  it("names what is stuck and carries the service's own account of why", () => {
    board({ moment, flow: "live" });
    expect(panel()).toHaveTextContent("Some Series S02E04");
    expect(panel()).toHaveTextContent(
      "Permission denied writing into the library folder.",
    );
    expect(panel()).toHaveTextContent(m.eyebrow_stuck());
  });

  // Twenty downloads a full disk stopped is one thing to fix, and twenty rows
  // about it is how an operator learns to stop reading them.
  it("counts what shares one cause rather than listing it again", () => {
    board({
      moment: changed({
        stuck: [
          {
            name: "The library folder",
            stall: "orphaned",
            held_for: 90,
            items: 20,
          },
        ],
      }),
      flow: "live",
    });
    expect(panel()).toHaveTextContent(m.stuck_several({ count: 20 }));
    expect(panel()).toHaveTextContent(
      m.stuck_for({ stall: m.stall_orphaned(), span: "1m" }),
    );
  });

  it("says plainly when nothing is wrong", () => {
    board({ moment: changed({ stuck: [] }), flow: "live" });
    expect(screen.getByText(m.figure_nothing_wrong())).toBeInTheDocument();
  });
});

describe("what can be asked of the stack", () => {
  const press = (label: string): Promise<void> =>
    userEvent.click(screen.getByRole("button", { name: label }));

  it("offers a control for every action there is", () => {
    board();

    for (const doing of everyDoing) {
      expect(
        screen.getByRole("button", { name: wordOfDoing(doing, false) }),
      ).toBeInTheDocument();
    }
  });

  it("asks for what a control names when it is pressed", async () => {
    const onpress = vi.fn();
    board({ controls: { ...controls, onpress } });

    await press(wordOfDoing("up", false));

    expect(onpress).toHaveBeenCalledWith("up");
  });

  // A request in flight is not a second thing to ask for, and a control that
  // left the page would take a reader's own focus with it.
  it("silences every control while a request is in flight, without hiding them", () => {
    board({ controls: { ...controls, busy: true } });

    for (const doing of everyDoing) {
      expect(
        screen.getByRole("button", { name: wordOfDoing(doing, false) }),
      ).toHaveAttribute("aria-disabled", "true");
    }
  });

  // Two things are being acted on, and a control read out of the group it
  // belongs to would be a control read without its subject.
  it("keeps what acts on forms apart from what acts on the whole stack", () => {
    board();

    expect(
      screen.getByRole("group", { name: m.running_controls() }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("group", { name: m.running_whole_controls() }),
    ).toBeInTheDocument();
  });

  it("announces what has been asked for in a place a reader is told about", () => {
    board();

    expect(
      screen.getByRole("status", { name: m.running_asked() }),
    ).toBeInTheDocument();
  });
});

describe("what the controls reach", () => {
  // Sending a request lemonfiber would refuse for a reason already on the
  // screen makes an operator read a refusal to learn what they could see.
  it("silences what cannot be asked for without a form", () => {
    board();

    for (const doing of namesItsForms) {
      expect(
        screen.getByRole("button", { name: wordOfDoing(doing, false) }),
      ).toHaveAttribute("aria-disabled", "true");
    }
  });

  it("offers them once a form has been chosen", () => {
    board({ controls: { ...controls, chosen: [chosenForm] } });

    for (const doing of namesItsForms) {
      expect(
        screen.getByRole("button", { name: wordOfDoing(doing, true) }),
      ).toHaveAttribute("aria-disabled", "false");
    }
  });

  // Naming no form means the whole stack for these two, so they say the whole
  // stack rather than saying nothing.
  it("says starting and stopping reach the whole stack when nothing is chosen", () => {
    board();

    expect(screen.getByText(m.running_scope_none())).toBeInTheDocument();
    for (const doing of ["up", "down"] as const) {
      expect(
        screen.getByRole("button", { name: wordOfDoing(doing, false) }),
      ).toHaveAttribute("aria-disabled", "false");
    }
  });

  it("says they reach only what was chosen once something is", () => {
    board({ controls: { ...controls, chosen: [chosenForm] } });

    expect(screen.getByText(m.running_scope_some())).toBeInTheDocument();
    for (const doing of takesForms) {
      expect(
        screen.getByRole("button", { name: wordOfDoing(doing, true) }),
      ).toBeInTheDocument();
    }
  });
});

describe("the forms the stack declares", () => {
  it("names each of them in the stack's own words", () => {
    board();

    for (const form of declared) {
      expect(
        screen.getByRole("heading", { name: form.name }),
      ).toBeInTheDocument();
      expect(screen.getByText(form.description)).toBeInTheDocument();
    }
  });

  it("says which of them the controls act on", () => {
    board({ controls: { ...controls, chosen: [chosenForm] } });

    const chose = declared.find((form) => form.id === chosenForm);

    expect(chose).toBeDefined();
    expect(
      screen.getByRole("button", {
        name: m.forms_choose({ name: chose?.name ?? "" }),
      }),
    ).toHaveAttribute("aria-pressed", "true");
  });

  it("asks for a form to be taken up when its control is pressed", async () => {
    const onchoose = vi.fn();
    board({ controls: { ...controls, onchoose } });

    await userEvent.click(
      screen.getByRole("button", {
        name: m.forms_choose({ name: declared[0]?.name ?? "" }),
      }),
    );

    expect(onchoose).toHaveBeenCalledWith(declared[0]?.id);
  });

  it("says plainly when the stack declares none", () => {
    board({
      controls: { ...controls, forms: { ok: true, value: { forms: [] } } },
    });

    expect(screen.getByText(m.forms_none())).toBeInTheDocument();
  });

  // The words are the source's own, which is worth more than any reading of
  // them.
  it("says in the source's own words why they could not be listed", () => {
    board({
      controls: {
        ...controls,
        forms: {
          ok: false,
          problem: { kind: "unreachable", message: notAnswering },
        },
      },
    });

    expect(screen.getByText(notAnswering)).toBeInTheDocument();
  });
});

describe("before something costly is carried out", () => {
  it("asks what it costs rather than doing it", () => {
    board({ controls: { ...controls, confirming: "down" } });

    expect(screen.getByText(m.confirm_stop_title())).toBeInTheDocument();
    expect(screen.getByText(m.confirm_stop_prose())).toBeInTheDocument();
  });

  it("asks the action for again when the answer is yes", async () => {
    const onpress = vi.fn();
    board({ controls: { ...controls, confirming: "down", onpress } });

    await userEvent.click(
      screen.getByRole("button", { name: m.action_stop_everything() }),
    );

    expect(onpress).toHaveBeenCalledWith("down");
  });

  it("leaves it running when the answer is no", async () => {
    const onleave = vi.fn();
    board({ controls: { ...controls, confirming: "down", onleave } });

    await userEvent.click(
      screen.getByRole("button", { name: m.action_leave_running() }),
    );

    expect(onleave).toHaveBeenCalledOnce();
  });

  // The answer sits after the controls, so a reader whose focus is on the
  // button they pressed reaches it by moving forward rather than going back.
  it("puts the answer after the control that asked the question", () => {
    board({ controls: { ...controls, confirming: "down" } });

    const asked = screen.getByRole("button", {
      name: wordOfDoing("down", false),
    });
    const answer = screen.getByRole("button", {
      name: m.action_stop_everything(),
    });

    expect(
      asked.compareDocumentPosition(answer) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("asks nothing at all before an action that costs nothing", () => {
    board({ controls: { ...controls, confirming: "up" } });

    expect(questionOf("up", false)).toBeUndefined();
    expect(
      screen.queryByRole("button", { name: m.action_leave_running() }),
    ).toBeNull();
  });
});

describe("work that outlives the request that started it", () => {
  it("keeps the record, and the name lemonfiber gave the work", () => {
    board({ controls: { ...controls, work: [started] } });

    expect(screen.getByText(titleOfDoing("up", false))).toBeInTheDocument();
    expect(screen.getByText(/9f2c41ab7d0e5c63/)).toBeInTheDocument();
  });

  it("puts a record away when it is asked to", async () => {
    const ondrop = vi.fn();
    board({ controls: { ...controls, work: [started], ondrop } });

    await userEvent.click(
      screen.getByRole("button", { name: m.action_hide_record() }),
    );

    expect(ondrop).toHaveBeenCalledWith(started.id);
  });

  // One wait speaks at a time and never names the work it belongs to, so a
  // line filed under a job would be a claim the stream did not make.
  it("keeps what the wait said apart from what this tab asked for", () => {
    board({
      controls: { ...controls, work: [started], waiting: stillWaiting },
    });

    expect(screen.getByText(m.waiting_still())).toBeInTheDocument();
    expect(screen.getByText(stillWaiting)).toBeInTheDocument();
  });

  it("puts the wait's line away when it is asked to", async () => {
    const onhush = vi.fn();
    board({ controls: { ...controls, waiting: stillWaiting, onhush } });

    await userEvent.click(
      screen.getByRole("button", { name: m.action_hide_line() }),
    );

    expect(onhush).toHaveBeenCalledOnce();
  });
});

describe("when lemonfiber would not do it", () => {
  it("says what it said, rather than that something went wrong", () => {
    board({
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
    });

    expect(screen.getByText(wouldNot)).toBeInTheDocument();
    expect(screen.getByText(m.eyebrow_refused())).toBeInTheDocument();
  });

  it("says so of work that finished while the request was open", () => {
    board({
      controls: {
        ...controls,
        work: [
          { id: "3", doing: "up", scoped: false, at: "done", job: undefined },
        ],
      },
    });

    expect(screen.getByText(m.work_done())).toBeInTheDocument();
  });
});

describe("what became of work whose name was redeemed", () => {
  it("says it finished, rather than that it is still going", () => {
    board({ controls: { ...controls, work: [finished] } });

    expect(screen.getByText(m.eyebrow_finished())).toBeInTheDocument();
    expect(screen.queryByText(m.eyebrow_taken_on())).toBeNull();
  });

  // What went wrong is lemonfiber's own account of it, and a record that only
  // said "stopped" would leave an operator with nothing to act on.
  it("says what stopped it, in the words the failure rendered", () => {
    board({ controls: { ...controls, work: [stopped] } });

    expect(screen.getByText(wentWrong)).toBeInTheDocument();
    expect(screen.getByText(m.eyebrow_stopped_short())).toBeInTheDocument();
  });

  // Nothing carries a job across a restart, so a tab reopened onto a run that
  // has been restarted is asking about work nothing is doing.
  it("says a name this run no longer knows is gone, not unfinished", () => {
    board({ controls: { ...controls, work: [forgotten] } });

    expect(screen.getByText(m.eyebrow_forgotten())).toBeInTheDocument();
  });

  // The work may be running perfectly well; it is the asking that stopped.
  it("says it lost the thread rather than that the work stopped", () => {
    board({ controls: { ...controls, work: [adrift] } });

    expect(screen.getByText(m.eyebrow_lost_track())).toBeInTheDocument();
    expect(screen.getByText(new RegExp(notAnswering))).toBeInTheDocument();
  });
});

// The sweep that reads stories presses its way through every screen, and a
// screen drawn from a fixture is handed no handlers at all. Pressing through
// one is what says a story is a page rather than a picture of one.
describe("a screen drawn from a fixture, with nothing wired to it", () => {
  it("offers controls that can be pressed with nothing behind them", async () => {
    board();

    for (const doing of everyDoing) {
      await userEvent.click(
        screen.getByRole("button", { name: wordOfDoing(doing, false) }),
      );
    }
    for (const form of declared) {
      await userEvent.click(
        screen.getByRole("button", {
          name: m.forms_choose({ name: form.name }),
        }),
      );
    }

    expect(
      screen.getByRole("button", { name: wordOfDoing("up", false) }),
    ).toBeInTheDocument();
  });

  it("offers answers and records that can be pressed the same way", async () => {
    board({
      controls: {
        ...controls,
        confirming: "down",
        work: [started],
        waiting: stillWaiting,
      },
    });

    await userEvent.click(
      screen.getByRole("button", { name: m.action_stop_everything() }),
    );
    await userEvent.click(
      screen.getByRole("button", { name: m.action_leave_running() }),
    );
    for (const hide of [m.action_hide_line(), m.action_hide_record()]) {
      await userEvent.click(screen.getByRole("button", { name: hide }));
    }

    expect(screen.getByText(m.confirm_stop_title())).toBeInTheDocument();
  });
});
