import { render, screen } from "@testing-library/svelte";
import type { Reading } from "@lemonfiber/sdk-ts";
import { describe, expect, it } from "vitest";
import Dashboard from "./Dashboard.svelte";
import { moment, services, stack, unavailable, worst } from "./fixture";

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
    ...over,
  });
}

/** The stream's moment, with one part of it replaced. */
const changed = (over: Partial<Moment>): Moment => ({ ...moment, ...over });

describe("before anything has answered", () => {
  it("holds a place on every panel rather than showing empty figures", () => {
    board();
    expect(screen.getAllByText(m.waiting_answer())).toHaveLength(6);
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
