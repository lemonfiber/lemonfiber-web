import { screen } from "@testing-library/svelte";
import { describe, expect, it } from "vitest";
import { moment, stack, unavailable, worst, cleared } from "./fixture";
import { stampFor } from "../lib/freshness";
import { wordOfSeverity } from "../lib/trouble";
import { wordOfCondition, wordOfStanding } from "../lib/wire";
import * as m from "../paraglide/messages.js";
import { never, answered, read, board, changed } from "./Dashboard.testing";

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

  // A count on its own is a number nobody can act on, and the operator reading
  // it here is the one who would otherwise go looking for the rest of it.
  it("expands to each thing wrong and what to do about it", () => {
    board({ stack: read, moment, flow: "live" });

    expect(panel()).toHaveTextContent(m.affected_lead());
    expect(panel()).toHaveTextContent(
      "Prowlarr is not answering its health check.",
    );
    expect(panel()).toHaveTextContent(
      "Less than a tenth of the data volume is free.",
    );
    expect(panel()).toHaveTextContent(m.finding_to_do());
    expect(panel()).toHaveTextContent(
      "Read what it said for itself, then start it again.",
    );
    expect(panel()).toHaveTextContent(
      "Check that nothing else holds the port it binds to.",
    );
    expect(panel()).toHaveTextContent(
      "Nothing new is being found, and anything waiting on a search stays where it is.",
    );
    expect(panel()).toHaveTextContent(
      "A download large enough to fill the rest will fail partway and leave what it wrote.",
    );
  });

  it("says how much each thing wrong matters", () => {
    board({ stack: read, moment, flow: "live" });

    expect(panel()).toHaveTextContent(wordOfSeverity("error"));
    expect(panel()).toHaveTextContent(wordOfSeverity("warning"));
  });

  // Nine imports a full disk stopped are one thing wrong. Set under the cause
  // rather than beside it, the list agrees with the figure above it.
  it("sets what follows from a cause under that cause", () => {
    board({ stack: read, moment, flow: "live" });

    expect(panel()).toHaveTextContent(m.affected_follows());
    expect(panel()).toHaveTextContent("queue.depth");
    expect(panel()).toHaveTextContent("providers.reachable");
  });

  // A heading over a list that is not there would promise one.
  it("expands to nothing where nothing is wrong", () => {
    board({
      stack: read,
      moment: changed({
        health: {
          affected: [],
          standing: "healthy",
          wanting_attention: 0,
          worst: null,
        },
      }),
      flow: "live",
    });

    expect(panel()).not.toHaveTextContent(m.affected_lead());
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

describe("what the operator has been told", () => {
  const panel = (): HTMLElement =>
    screen.getByRole("region", { name: m.panel_told() });

  // The one channel that needs nothing set up. A condition carried only by a
  // channel somebody has to configure is one nobody was told about.
  it("carries what happened, how much it matters and what to do", () => {
    board({ moment, flow: "live" });

    expect(panel()).toHaveTextContent(
      "Downloading left this machine outside the tunnel.",
    );
    expect(panel()).toHaveTextContent(wordOfSeverity("critical"));
    expect(panel()).toHaveTextContent(m.finding_to_do());
    expect(panel()).toHaveTextContent(
      "Stop the download client, then start the tunnel again.",
    );
  });

  // An alert that names the event and the fix leaves the operator to work out
  // for themselves what it cost them, which is the judgement the line exists to
  // save. Its order carries that: what happened, what it costs, what to do.
  it("sets what it costs between what happened and what to do", () => {
    board({ moment, flow: "live" });

    const said = panel().textContent;
    const happened = said.indexOf(
      "Downloading left this machine outside the tunnel.",
    );
    const costs = said.indexOf(
      "Traffic that should have been inside the tunnel was not, for as long as this lasted.",
    );
    const todo = said.indexOf(
      "Stop the download client, then start the tunnel again.",
    );

    expect(happened).toBeGreaterThan(-1);
    expect(costs).toBeGreaterThan(happened);
    expect(todo).toBeGreaterThan(costs);
  });

  // A tunnel that dropped and came back matters, and a screen showing only what
  // is wrong now has nothing to say about the hour the operator was away.
  it("keeps what is over, and says which way it went", () => {
    board({ moment, flow: "live" });

    expect(panel()).toHaveTextContent(
      "There is room on the data volume again.",
    );
    expect(panel()).toHaveTextContent(m.told_onset());
    expect(panel()).toHaveTextContent(m.told_resolved());
  });

  // One event across several services is one row naming all of them, not the
  // same thing said once per service.
  it("names every check a grouped interruption speaks for", () => {
    board({ moment, flow: "live" });

    expect(panel()).toHaveTextContent(m.told_speaks_for());
    expect(panel()).toHaveTextContent("vpn.killswitch");
  });

  it("names none where an interruption speaks only for itself", () => {
    board({ moment: changed({ alerts: [cleared] }), flow: "live" });
    expect(panel()).not.toHaveTextContent(m.told_speaks_for());
  });

  it("says plainly when nothing has interrupted", () => {
    board({ moment: changed({ alerts: [] }), flow: "live" });
    expect(panel()).toHaveTextContent(m.told_none());
  });
});
