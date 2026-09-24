import { render, screen, within } from "@testing-library/svelte";
import type { Reading } from "@lemonfiber/sdk-ts";
import { describe, expect, it } from "vitest";
import Checks from "./Checks.svelte";
import { allWell, attributed, diagnosis } from "./findings";
import type { Freshness } from "../lib/freshness";
import { everyFixing, wordOfFixing } from "../lib/trouble";
import { everyOverall, gradingOf, wordOfOutcome } from "../lib/verdict";
import type { Diagnosis } from "../lib/wire";
import * as m from "../paraglide/messages.js";

const never: Freshness = { kind: "never" };
const answered: Freshness = { kind: "answered", secondsAgo: 6 };

const notAnswering: Reading<Diagnosis> = {
  ok: false,
  problem: {
    kind: "unreachable",
    message: "lemonfiber is not answering. It may have been stopped.",
  },
};

/** The screen, given whatever this test hands it. */
function checks(
  diagnosis: Reading<Diagnosis> | undefined,
  freshness: Freshness = answered,
): void {
  render(Checks, { diagnosis, freshness });
}

const panel = (): HTMLElement =>
  screen.getByRole("region", { name: m.panel_findings() });

describe("before anything has answered", () => {
  it("holds a place rather than showing a run that has not happened", () => {
    checks(undefined, never);
    expect(screen.getByText(m.waiting_answer())).toBeInTheDocument();
  });

  // An empty grading would be a claim about a run nobody has made.
  it("grades nothing", () => {
    checks(undefined, never);
    for (const overall of everyOverall) {
      expect(screen.queryByText(gradingOf(overall).lead)).toBeNull();
    }
  });
});

describe("the run's own grading", () => {
  it.each(everyOverall)("says what a %s run came to", (overall) => {
    checks({ ok: true, value: { ...allWell, overall } });
    expect(screen.getByText(gradingOf(overall).lead)).toBeInTheDocument();
  });

  // A broken stack is the one thing on this screen that interrupts.
  it("interrupts for a broken run and waits for a pause otherwise", () => {
    checks({ ok: true, value: diagnosis });
    expect(screen.getByRole("alert")).toHaveTextContent(
      gradingOf("broken").lead,
    );
  });

  it("waits for the reader to pause where nothing is broken", () => {
    checks({ ok: true, value: allWell });
    expect(screen.queryByRole("alert")).toBeNull();
    expect(screen.getByRole("status")).toHaveTextContent(
      gradingOf("healthy").lead,
    );
  });
});

describe("each finding", () => {
  it("says how every check turned out, in the server's own word", () => {
    checks({ ok: true, value: diagnosis });
    for (const outcome of [
      "pass",
      "warn",
      "fail",
      "unverified",
      "skipped",
    ] as const) {
      expect(
        screen.getAllByText(wordOfOutcome(outcome)).length,
      ).toBeGreaterThan(0);
    }
  });

  it("names what was checked", () => {
    checks({ ok: true, value: diagnosis });
    expect(
      screen.getByRole("heading", {
        name: "Every service is answering its own health check",
      }),
    ).toBeInTheDocument();
  });

  it("carries the evidence a passing check stated", () => {
    checks({ ok: true, value: diagnosis });
    expect(
      screen.getByText("Docker Engine 27.3.1 on this machine"),
    ).toBeInTheDocument();
  });

  // The whole diagnosis, not only the fault: what it means and what to do about
  // it are what make a finding a diagnosis rather than a fault report.
  it("says what a warning means and what to do about it", () => {
    checks({ ok: true, value: diagnosis });
    expect(
      screen.getByText("Less than a tenth of the data volume is free."),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Imports will start failing before downloads do, and a failed import leaves the download where it is.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Pause the queue until there is room."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("The library folder is the one that grows."),
    ).toBeInTheDocument();
  });

  it("says which service a finding is about", () => {
    checks({ ok: true, value: diagnosis });
    expect(
      screen.getByText(m.finding_about({ service: "prowlarr" })),
    ).toBeInTheDocument();
  });

  // One service's trouble attributed to the service underneath it, rather than
  // counted as one more independent thing wrong.
  it("names the check that explains another", () => {
    checks({ ok: true, value: diagnosis });
    expect(
      screen.getByText(m.finding_explained_by({ check: "network.tunnel" })),
    ).toBeInTheDocument();
  });

  // A check can say a service is not answering; only the service can say why.
  it("carries what the service said for itself", () => {
    checks({ ok: true, value: diagnosis });
    expect(screen.getByText(/address in use/)).toBeInTheDocument();
  });

  it("promises no evidence where the service wrote none", () => {
    checks({
      ok: true,
      value: {
        ...allWell,
        findings: [{ ...allWell.findings[0], said: "   " }],
      } as Diagnosis,
    });

    expect(screen.queryByText(m.finding_said())).toBeNull();
  });
});

describe("the detail under a finding", () => {
  // The plain sentences are what an operator reads. The raw detail is there for
  // the one who wants it, after them rather than in front of them.
  it("carries the raw detail, and sets it after the plain account", () => {
    checks({ ok: true, value: diagnosis });
    const said = panel().textContent;

    expect(said).toContain("connection refused");
    expect(said.indexOf(m.finding_detail())).toBeGreaterThan(
      said.indexOf(
        "Nothing can be searched for while it is down, so nothing new will arrive.",
      ),
    );
  });

  // A full disk producing eleven failures is one problem. The check reports the
  // one that produced it rather than leaving the symptom to stand alone.
  it("reports the problem that produced this one", () => {
    checks({ ok: true, value: diagnosis });

    expect(screen.getByText(m.finding_caused())).toBeInTheDocument();
    expect(
      screen.getByText("The tunnel is holding the port Prowlarr binds to."),
    ).toBeInTheDocument();
  });

  it("promises neither where the verdict carries neither", () => {
    checks({ ok: true, value: allWell });

    expect(screen.queryByText(m.finding_detail())).toBeNull();
    expect(screen.queryByText(m.finding_caused())).toBeNull();
  });
});

describe("where a finding stands with being fixed", () => {
  // What lemonfiber can put right, what wants the operator somewhere else, and
  // what they have already answered are different work, and a row naming only
  // the outcome leaves all three looking like the same work.
  it("says which of them it is", () => {
    checks({ ok: true, value: diagnosis });

    expect(screen.getByText(wordOfFixing("guided"))).toBeInTheDocument();
    expect(screen.getByText(wordOfFixing("actionable"))).toBeInTheDocument();
    expect(screen.getByText(wordOfFixing("suppressed"))).toBeInTheDocument();
  });

  it("says nothing of it where the verdict carries none", () => {
    checks({ ok: true, value: allWell });

    for (const fixing of everyFixing) {
      expect(screen.queryByText(wordOfFixing(fixing))).toBeNull();
    }
  });

  /** The row one finding is drawn on, by the title over it. */
  const rowOf = (title: string): Element | null =>
    screen.getByRole("heading", { name: title }).closest("article");

  // It is not resolved, so hiding it would be a screen saying nothing is wrong
  // when something is; it is answered, so leaving it shouting would put it back
  // in front of the operator who already dealt with it.
  it("keeps one the operator set aside, without the weight of a live one", () => {
    checks({ ok: true, value: diagnosis });

    expect(
      rowOf("Imports link into the library rather than copying"),
    ).not.toHaveClass("alarm");
    expect(
      rowOf("Every service is answering its own health check"),
    ).toHaveClass("alarm");
  });
});

describe("where each check came from", () => {
  /** The row one finding is drawn on, by the title over it. */
  const rowOf = (title: string): HTMLElement => {
    const row = screen.getByRole("heading", { name: title }).closest("article");
    if (row === null) throw new Error(`no row is drawn for "${title}"`);
    return row;
  };

  /** Every sentence that says where a check came from, on any row. */
  const everyMark = (): string[] => [
    m.finding_from_operator(),
    m.finding_from_plugin({ named: "plex" }),
    m.finding_from_unknown({
      why: "The plugin that declared it is no longer installed.",
    }),
    m.finding_from_unrecognised(),
  ];

  // The stack's own row comes first, so a screen that only asked the first row
  // whether anything was marked would draw neither the mark nor the note.
  it("marks the check a plugin put there, on its own row", () => {
    checks({ ok: true, value: attributed });

    expect(
      within(rowOf("Plex can read the library it serves from")).getByText(
        m.finding_from_plugin({ named: "plex" }),
      ),
    ).toBeInTheDocument();
  });

  it("marks the check the operator added", () => {
    checks({ ok: true, value: attributed });

    expect(
      within(rowOf("The storage box on the home network answers")).getByText(
        m.finding_from_operator(),
      ),
    ).toBeInTheDocument();
  });

  // Not knowing is never read as the stack's own, and the gap reads as a reason
  // rather than as a shrug.
  it("marks a check nobody could place, with the reason the stack gave", () => {
    checks({ ok: true, value: attributed });

    expect(
      within(rowOf("Komga has finished reading the comics folder")).getByText(
        m.finding_from_unknown({
          why: "The plugin that declared it is no longer installed.",
        }),
      ),
    ).toBeInTheDocument();
  });

  it("still marks a check nobody could place where the stack gave no reason", () => {
    checks({ ok: true, value: attributed });

    expect(
      within(rowOf("Nothing in the queue has stopped moving")).getByText(
        m.finding_from_unrecognised(),
      ),
    ).toBeInTheDocument();
  });

  // The stack's own are nearly every row, and a word on each of them is a word
  // nobody reads.
  it("leaves the stack's own check unmarked", () => {
    checks({ ok: true, value: attributed });
    const own = rowOf("Docker is installed and its daemon is answering");

    for (const mark of everyMark()) {
      expect(within(own).queryByText(mark)).toBeNull();
    }
  });

  it("says once, under the rows, what an unmarked check is", () => {
    checks({ ok: true, value: attributed });
    const said = panel().textContent;

    expect(screen.getAllByText(m.findings_marked())).toHaveLength(1);
    expect(said.indexOf(m.findings_marked())).toBeGreaterThan(
      said.indexOf("Nothing in the queue has stopped moving"),
    );
  });

  it("says it on a run where only a later row is marked", () => {
    checks({ ok: true, value: diagnosis });

    expect(screen.getByText(m.findings_marked())).toBeInTheDocument();
    expect(
      within(rowOf("Plex can read the library it serves from")).getByText(
        m.finding_from_plugin({ named: "plex" }),
      ),
    ).toBeInTheDocument();
  });

  // With nothing marked there is nothing for the note to explain.
  it("says nothing of it where every check is the stack's own", () => {
    checks({ ok: true, value: allWell });

    expect(screen.queryByText(m.findings_marked())).toBeNull();
    for (const mark of everyMark()) {
      expect(screen.queryByText(mark)).toBeNull();
    }
  });
});

describe("a run with nothing in it", () => {
  it("says so in words rather than leaving the panel empty", () => {
    checks({ ok: true, value: { overall: "unknown", findings: [] } });
    expect(panel()).toHaveTextContent(m.checks_none());
  });
});

// The wire version is one number and the vocabulary under it grows, so a
// running lemonfiber can report a check whose outcome, or whose family, this
// build's contract does not name. The screen reads a field off whatever the
// verdict is read as, so falling off the end of that switch takes the whole
// screen down rather than one row.
describe("a word this build has no entry for", () => {
  /** One run whose only finding is worded in a vocabulary wider than this one. */
  function wider(over: Record<string, unknown>): Reading<Diagnosis> {
    const said: unknown = {
      overall: "unknown",
      findings: [
        {
          check: "queue.pressure",
          category: "queue",
          title: "The queue is being worked through",
          origin: { origin: "bundled" },
          verdict: { outcome: "pass", note: null },
          ...over,
        },
      ],
    };
    return { ok: true, value: said as Diagnosis };
  }

  it("draws the finding, and says the outcome is not a word it knows", () => {
    checks(wider({ verdict: { outcome: "inconclusive" } }));

    expect(
      screen.getByRole("heading", {
        name: "The queue is being worked through",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText(m.outcome_unrecognised())).toBeInTheDocument();
  });

  it("says the family is not one it knows rather than drawing a blank tag", () => {
    checks(wider({ category: "hardware" }));

    expect(screen.getByText(m.category_unrecognised())).toBeInTheDocument();
  });

  // A lemonfiber older than this contract sends no origin, and a newer one can
  // send one this build has no word for. Either is marked as nobody being able to
  // say, and neither is read as the stack's own.
  it.each([
    ["sent no origin", { origin: undefined }],
    ["sent one this page has no word for", { origin: { origin: "inherited" } }],
  ])("marks a check whose server %s", (_, over) => {
    checks(wider(over));

    expect(screen.getByText(m.finding_from_unrecognised())).toBeInTheDocument();
    expect(screen.getByText(m.findings_marked())).toBeInTheDocument();
  });

  it("says a grading it cannot place rather than grading nothing", () => {
    const graded: unknown = { ...allWell, overall: "inconclusive" };
    checks({ ok: true, value: graded as Diagnosis });

    expect(screen.getByText(m.overall_unrecognised_lead())).toBeInTheDocument();
  });
});

describe("when the reading did not answer", () => {
  it("says so in the words the client used", () => {
    checks(notAnswering, { kind: "silent", secondsAgo: 240 });
    expect(
      screen.getByText(
        "lemonfiber is not answering. It may have been stopped.",
      ),
    ).toBeInTheDocument();
  });

  it("grades nothing it was not told", () => {
    checks(notAnswering);
    expect(screen.queryByRole("alert")).toBeNull();
  });
});
