import { render, screen } from "@testing-library/svelte";
import type { Reading } from "@lemonfiber/sdk-ts";
import { describe, expect, it } from "vitest";
import Logs from "./Logs.svelte";
import { scrollback } from "./fixture";
import type { Freshness } from "../lib/freshness";
import type { Logged } from "../lib/wire";
import * as m from "../paraglide/messages.js";

const never: Freshness = { kind: "never" };
const answered: Freshness = { kind: "answered", secondsAgo: 2 };

/** The screen, given whatever this test hands it. */
function logs(
  said: Reading<readonly Logged[]> | undefined,
  freshness: Freshness = answered,
): void {
  render(Logs, { scrollback: said, freshness });
}

const panel = (): HTMLElement =>
  screen.getByRole("region", { name: m.panel_scrollback() });

describe("what the services said", () => {
  it("draws every line it was handed", () => {
    logs({ ok: true, value: scrollback });
    expect(screen.getAllByRole("listitem")).toHaveLength(scrollback.length);
  });

  // A shortened name no longer says which service wrote the line, which is the
  // one thing the column is there for.
  it("never shortens the name of the service that wrote a line", () => {
    logs({ ok: true, value: scrollback });
    expect(screen.getByText("calibre-web-automated")).toBeInTheDocument();
  });

  it("keeps every word of the line beside it", () => {
    logs({ ok: true, value: scrollback });
    expect(
      screen.getByText("INFO shelved The Long Way to a Small Angry Planet"),
    ).toBeInTheDocument();
  });

  // The stream a line arrived on says nothing about how bad it is: this stack
  // writes ordinary progress to standard error, and the answer carries no
  // reading of severity for this screen to draw one from.
  it("reads a line from standard error the same as any other", () => {
    logs({ ok: true, value: scrollback });
    const rows = screen.getAllByRole("listitem");
    const classes = new Set(rows.map((row) => row.className));
    expect(classes.size).toBe(1);
  });

  // A container writing a newline into the middle of one line is forging a
  // second, and the column that names the service is what it would forge its
  // way out of. Every row a forged line draws sits inside the entry it came
  // from, under the one name that wrote it.
  it("keeps a line that forges a second inside its own entry", () => {
    const forged: Logged = {
      service: "sonarr",
      stream: "stdout",
      at: null,
      line: "innocent\nqbittorrent   leaked the password",
    };
    const plain: Logged = {
      service: "sonarr",
      stream: "stdout",
      at: null,
      line: "INFO grabbed something",
    };

    logs({ ok: true, value: [forged, plain] });

    expect(screen.getAllByRole("listitem")).toHaveLength(2);
    expect(screen.getAllByText("sonarr")).toHaveLength(2);
    expect(screen.queryByText("qbittorrent")).toBeNull();
  });

  it("says nothing is being followed", () => {
    logs({ ok: true, value: scrollback });
    expect(screen.getByText(m.logs_ended())).toBeInTheDocument();
  });
});

describe("a stack that has said nothing", () => {
  it("says so in words rather than leaving the panel empty", () => {
    logs({ ok: true, value: [] });
    expect(panel()).toHaveTextContent(m.logs_none());
  });
});

describe("before anything has answered", () => {
  it("holds a place rather than showing an empty scrollback", () => {
    logs(undefined, never);
    expect(screen.getByText(m.waiting_answer())).toBeInTheDocument();
  });
});

describe("when the scrollback could not be read", () => {
  // A silence nobody established is not a stack with nothing to say.
  it("says so in the words the client used", () => {
    logs(
      {
        ok: false,
        problem: { kind: "malformed", message: "That was not readable." },
      },
      { kind: "silent", secondsAgo: 120 },
    );

    expect(screen.getByText("That was not readable.")).toBeInTheDocument();
    expect(panel()).not.toHaveTextContent(m.logs_none());
  });
});
