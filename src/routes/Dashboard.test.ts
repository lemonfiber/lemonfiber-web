import { screen, within } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { moment, controls } from "./fixture";
import * as m from "../paraglide/messages.js";
import { answered, read, board, changed } from "./Dashboard.testing";

/**
 * Every panel this screen draws.
 *
 * A panel that quietly stops being drawn looks from a suite of tests exactly
 * like a panel nobody wrote one for, and the tests below each reach for their
 * own panel by name and would pass unchanged with every other one gone. This
 * list is walked in both directions — nothing named here may be missing, and
 * nothing drawn may be missing from here — so a panel added to the screen and
 * left out of the tests, or dropped from the screen and left in them, fails
 * rather than passing quietly.
 */
const everyPanel: readonly string[] = [
  m.panel_standing(),
  m.panel_space(),
  m.panel_tunnel(),
  m.panel_forms(),
  m.panel_rehearsal(),
  m.panel_running(),
  m.panel_attention(),
  m.panel_told(),
  m.panel_front_door(),
  m.panel_household(),
  m.panel_programs(),
  m.panel_downloading(),
  m.panel_waiting_in_line(),
];

describe("every panel the screen draws", () => {
  const filled = (): void => {
    board({
      stack: read,
      programs: read,
      moment,
      flow: "live",
      read: answered,
      live: answered,
    });
  };

  it.each(everyPanel)("draws %s from what its source gave it", (title) => {
    filled();
    expect(screen.getByRole("region", { name: title })).toBeInTheDocument();
  });

  it.each(everyPanel)("draws %s before anything has answered", (title) => {
    board({ controls: { ...controls, forms: undefined } });
    expect(screen.getByRole("region", { name: title })).toBeInTheDocument();
  });

  // A panel's own heading is the only second-level one on this screen, so the
  // headings read down the page are the panels read down the page.
  it("draws these and no others, in this order", () => {
    filled();
    expect(
      screen
        .getAllByRole("heading", { level: 2 })
        .map((heading) => heading.textContent),
    ).toEqual(everyPanel);
  });
});

describe("before anything has answered", () => {
  // Every panel but two: the controls, which are this page's own and are
  // waiting on nothing, and what starting would do, which is waiting on a form
  // being chosen rather than on an answer.
  it("holds a place on every panel rather than showing empty figures", () => {
    board({ controls: { ...controls, forms: undefined } });
    expect(screen.getAllByText(m.waiting_answer())).toHaveLength(
      everyPanel.length - 2,
    );
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

// The page reaching lemonfiber and lemonfiber reaching what it reads the
// figures off are two connections, and the second can fail while the first is
// carrying. A screen that graded itself by the stream alone would call a
// moment current because it arrived on time, whatever was behind it.
describe("what lemonfiber says about its own reach", () => {
  it("says nothing where every source answered", () => {
    board({ moment, flow: "live", live: answered });
    expect(screen.queryByText(m.telemetry_disconnected_lead())).toBeNull();
  });

  it("interrupts where nothing is refreshing the figures", () => {
    board({
      moment: changed({ telemetry: "disconnected" }),
      flow: "live",
      live: answered,
    });
    expect(screen.getByRole("alert")).toHaveTextContent(
      m.telemetry_disconnected_lead(),
    );
    expect(
      screen.getByText(m.telemetry_disconnected_prose()),
    ).toBeInTheDocument();
  });

  it("says which panels to doubt where only some sources answered", () => {
    board({
      moment: changed({ telemetry: "degraded" }),
      flow: "live",
      live: answered,
    });
    expect(screen.getByText(m.telemetry_degraded_lead())).toBeInTheDocument();
  });

  it("says nothing about its own reach before the stream has carried", () => {
    board();
    expect(screen.queryByText(m.telemetry_degraded_lead())).toBeNull();
  });
});
