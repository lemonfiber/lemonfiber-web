import { screen, within } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import {
  adrift,
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
import { everyDoing, questionOf, titleOfDoing, wordOfDoing } from "../lib/work";
import * as m from "../paraglide/messages.js";
import { board } from "./Dashboard.testing";

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
            given: {},
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
          {
            id: "3",
            doing: "up",
            scoped: false,
            given: {},
            at: "done",
            job: undefined,
            came: { kind: "unread" },
          },
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

  it("lists what it came to under the record", () => {
    board({ controls: { ...controls, work: [finished] } });

    const came = screen.getByRole("list", { name: m.came_heading() });
    expect(
      within(came).getByText(m.came_condition_partial()),
    ).toBeInTheDocument();
    expect(
      within(came).getByText(m.came_still_starting({ names: "sonarr" })),
    ).toBeInTheDocument();
  });

  it("lists nothing under a record of work that has not finished", () => {
    board({ controls: { ...controls, work: [started, stopped] } });

    expect(screen.queryByRole("list", { name: m.came_heading() })).toBeNull();
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
