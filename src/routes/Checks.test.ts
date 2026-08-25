import { render, screen } from "@testing-library/svelte";
import type { Reading } from "@lemonfiber/sdk-ts";
import { describe, expect, it } from "vitest";
import Checks from "./Checks.svelte";
import { allWell, diagnosis } from "./fixture";
import type { Freshness } from "../lib/freshness";
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

describe("a run with nothing in it", () => {
  it("says so in words rather than leaving the panel empty", () => {
    checks({ ok: true, value: { overall: "unknown", findings: [] } });
    expect(panel()).toHaveTextContent(m.checks_none());
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
