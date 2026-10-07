import { screen, within } from "@testing-library/svelte";
import { describe, expect, it } from "vitest";
import { moment, services, stack, unavailable, controls } from "./fixture";
import { wordFor } from "../lib/state";
import { everyServiceState, stateOfService } from "../lib/wire";
import * as m from "../paraglide/messages.js";
import { answered, read, board, changed } from "./Dashboard.testing";

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
              describes: "Does the one job this fixture is about",
              criticality: "core",
              profile: "core",
              forms: ["core"],
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

  // Left out, such a service reads as one lemonfiber forgot rather than one it
  // was told about in terms it could not follow.
  it("names a service it can do less with, and why", () => {
    board({ programs: read, read: answered });

    expect(panel()).toHaveTextContent(m.programs_less());
    expect(panel()).toHaveTextContent("bazarr");
    expect(panel()).toHaveTextContent(
      "Its declaration leaves out the part that says where to reach it.",
    );
  });

  it("says nothing of them where the reading names none", () => {
    board({ programs: { ok: true, value: { ...stack, unsupported: [] } } });
    expect(panel()).not.toHaveTextContent(m.programs_less());
  });

  // A build whose contract never named the field at all is the same screen as
  // one whose reading named none, rather than a panel with a hole in it.
  it("says nothing of them where the reading has no such field", () => {
    board({
      programs: {
        ok: true,
        value: {
          condition: stack.condition,
          active_forms: stack.active_forms,
          forms: stack.forms,
          filtered: stack.filtered,
          services: stack.services,
          undeclared: stack.undeclared,
          disturbs: stack.disturbs,
        },
      },
    });
    expect(panel()).not.toHaveTextContent(m.programs_less());
  });

  /** The row the table draws for one service, found by its name. */
  const row = (name: string): HTMLElement =>
    within(panel())
      .getAllByRole("row")
      .find((one) => within(one).queryByText(name) !== null) ??
    expect.fail(`no row names ${name}`);

  /** Where the panel lists what the forms left out, found by its heading. */
  const leftOut = (): HTMLElement =>
    screen.getByText(m.programs_left_out()).parentElement ??
    expect.fail("the heading stands on its own");

  it("names the forms running, in the stack's own words", () => {
    board({ programs: read, read: answered });

    expect(panel()).toHaveTextContent(m.programs_forms_running());
    const running = within(panel()).getAllByRole("list")[0];
    expect(running).toHaveTextContent("Core");
    expect(running).toHaveTextContent("Media");
    expect(panel()).not.toHaveTextContent(m.programs_forms_none());
  });

  it("says so where no form is running", () => {
    board({
      programs: { ok: true, value: { ...stack, active_forms: [] } },
    });
    expect(panel()).toHaveTextContent(m.programs_forms_none());
  });

  it("says nothing of forms until the reading has answered", () => {
    board({
      programs: {
        ok: false,
        problem: { kind: "unreachable", message: "Nothing answered." },
      },
    });
    expect(panel()).not.toHaveTextContent(m.programs_forms_running());
    expect(panel()).not.toHaveTextContent(m.programs_left_out());
  });

  // A service two forms share is there for both, so one row names both rather
  // than the service being drawn twice.
  it("names every form a service runs for, on its one row", () => {
    board({ programs: read, read: answered });

    expect(screen.getAllByText("Sonarr")).toHaveLength(1);
    expect(row("Sonarr")).toHaveTextContent("Core, Media");
    expect(row("Prowlarr")).toHaveTextContent("Core");
    expect(row("Prowlarr")).not.toHaveTextContent("Media");
  });

  it("says a service no running form holds runs for none", () => {
    board({ programs: read, read: answered });
    expect(row("Plex")).toHaveTextContent(m.programs_no_form());
  });

  // The names are the stack's, from its listing of forms; with no listing, the
  // id is the only name the page has, and a blank would say no form at all.
  it("names a form by its id where the listing has not answered", () => {
    board({
      programs: read,
      controls: { ...controls, forms: undefined },
    });
    expect(row("Sonarr")).toHaveTextContent("core, media");
    expect(within(panel()).getAllByRole("list")[0]).toHaveTextContent("media");
  });

  it("lists what the forms left out, with what each needs and who asked", () => {
    board({ programs: read, read: answered });

    const listed = leftOut();
    expect(listed).toHaveTextContent("SABnzbd");
    expect(listed).toHaveTextContent(m.needs_usenet());
    expect(listed).toHaveTextContent(
      m.programs_asked_by({ forms: "Core, Media" }),
    );
  });

  // Left out on purpose is the operator's setting being honoured. A row among
  // the services would draw it as one that did not start.
  it("keeps what was left out apart from the services that are down", () => {
    board({ programs: read, read: answered });
    const rows = within(panel()).getAllByRole("row");
    expect(rows.some((one) => one.textContent.includes("SABnzbd"))).toBe(false);
  });

  // A lemonfiber can list it among the services as well, as not there. It is
  // still drawn once, as left out, and not as a service that failed.
  it("draws a left-out service listed as not there only as left out", () => {
    board({
      programs: {
        ok: true,
        value: {
          ...stack,
          services: [
            {
              id: "sabnzbd",
              name: "SABnzbd",
              describes: "Downloads over usenet",
              state: "absent",
              criticality: "important",
              profile: "usenet",
              forms: [],
              depends_on: [],
            },
          ],
        },
      },
    });

    expect(screen.getAllByText("SABnzbd")).toHaveLength(1);
    expect(leftOut()).toHaveTextContent("SABnzbd");
    expect(panel()).not.toHaveTextContent(wordFor("stopped"));
    expect(panel()).toHaveTextContent(m.programs_none());
  });

  it("keeps one that was left out and is running anyway", () => {
    board({
      programs: {
        ok: true,
        value: {
          ...stack,
          services: [
            {
              id: "sabnzbd",
              name: "SABnzbd",
              describes: "Downloads over usenet",
              state: "running",
              criticality: "important",
              profile: "usenet",
              forms: [],
              depends_on: [],
            },
          ],
        },
      },
    });

    expect(row("SABnzbd")).toHaveTextContent(wordFor("known"));
    expect(leftOut()).toHaveTextContent("SABnzbd");
  });

  it("says nothing of what was left out where nothing was", () => {
    board({ programs: { ok: true, value: { ...stack, filtered: [] } } });
    expect(panel()).not.toHaveTextContent(m.programs_left_out());
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
