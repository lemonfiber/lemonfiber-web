import { render, screen, within } from "@testing-library/svelte";
import type { Reading } from "@lemonfiber/sdk-ts";
import { describe, expect, it } from "vitest";
import Dashboard from "./Dashboard.svelte";
import { controls } from "./fixture";
import { episode, playing } from "../api/playings";
import type { Freshness } from "../lib/freshness";
import { playedOf, sessionLine, type Playing } from "../lib/playing";
import * as m from "../paraglide/messages.js";

const answered: Freshness = { kind: "answered", secondsAgo: 5 };

/** The overview, with what is playing read. */
function reading(watched: Reading<Playing> | undefined): void {
  render(Dashboard, {
    stack: undefined,
    programs: undefined,
    moment: undefined,
    flow: "opening",
    read: answered,
    live: { kind: "never" },
    controls,
    playing: watched,
  });
}

const panel = (): HTMLElement =>
  screen.getByRole("region", { name: m.panel_playing() });

describe("what is playing now, on the overview", () => {
  it("is not drawn until it answers", () => {
    reading(undefined);
    expect(
      screen.queryByRole("region", { name: m.panel_playing() }),
    ).toBeNull();
  });

  it("names each session with who is watching, where, and whether paused", () => {
    reading({ ok: true, value: playing });
    const sessions = within(panel()).getByRole("list", {
      name: m.playing_said(),
    });
    expect(
      within(sessions).getByRole("heading", { name: playedOf(episode) }),
    ).toBeVisible();
    expect(within(sessions).getByText(sessionLine(episode))).toBeVisible();
  });

  it("says nobody is watching where nobody is", () => {
    reading({ ok: true, value: { ...playing, sessions: [] } });
    expect(within(panel()).getByText(m.playing_none())).toBeVisible();
  });

  // A server that would not say is not a quiet house.
  it("says the media server could not be asked, and what lemonfiber found", () => {
    const found = "The media server did not answer.";
    reading({
      ok: true,
      value: { ...playing, available: false, sessions: [], findings: [found] },
    });
    expect(within(panel()).getByText(m.playing_unasked())).toBeVisible();
    expect(within(panel()).getByText(found)).toBeVisible();
    expect(within(panel()).queryByText(m.playing_none())).toBeNull();
  });

  it("says why it could not be read", () => {
    reading({ ok: false, problem: { kind: "refused", message: "No." } });
    expect(within(panel()).getByText("No.")).toBeVisible();
  });
});
