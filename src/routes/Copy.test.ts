import { render, screen, within } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import type { Reading } from "@lemonfiber/sdk-ts";
import { describe, expect, it } from "vitest";
import Settings from "./Settings.svelte";
import { behind, untold, versions } from "../api/copies";
import {
  standingLines,
  versionLines,
  type Standing,
  type Versions,
} from "../lib/copy";
import type { Freshness } from "../lib/freshness";
import * as m from "../paraglide/messages.js";

const answered: Freshness = { kind: "answered", secondsAgo: 5 };

/** The settings screen, with this copy's readings. */
function reading(
  read: {
    versions?: Reading<Versions>;
    standing?: Reading<Standing>;
  } = {},
): void {
  render(Settings, { quality: undefined, freshness: answered, ...read });
}

const part = (name: string): HTMLElement =>
  within(screen.getByRole("region", { name: m.panel_copy() })).getByRole(
    "region",
    { name },
  );

describe("this copy of lemonfiber, on the settings screen", () => {
  it("holds a place for each reading while nothing has answered", () => {
    reading();
    for (const name of [m.copy_versions(), m.copy_moving()]) {
      expect(
        within(part(name)).getByText(m.waiting_answer()),
      ).toBeInTheDocument();
    }
  });

  it("names the versions in play, and where it stands against the newest release", () => {
    reading({
      versions: { ok: true, value: versions },
      standing: { ok: true, value: behind },
    });
    for (const line of versionLines(versions)) {
      expect(within(part(m.copy_versions())).getByText(line)).toBeVisible();
    }
    for (const line of standingLines(behind)) {
      expect(within(part(m.copy_moving())).getByText(line)).toBeVisible();
    }
  });

  it("says why each could not be read", () => {
    reading({
      versions: { ok: false, problem: { kind: "refused", message: "No." } },
      standing: {
        ok: false,
        problem: { kind: "refused", message: "Not now." },
      },
    });
    expect(within(part(m.copy_versions())).getByText("No.")).toBeVisible();
    expect(within(part(m.copy_moving())).getByText("Not now.")).toBeVisible();
  });
});

describe("what a newer release changes", () => {
  it("folds the notes away under their own heading, drawn as a list rather than as markup", async () => {
    reading({
      standing: {
        ok: true,
        value: {
          ...behind,
          changed: "## 0.18.0\n\n### New\n\n- The household view\n\nThanks.",
        },
      },
    });
    const moving = part(m.copy_moving());
    const notes = within(moving).getByText(m.copy_changed());
    expect(within(moving).getByText("The household view")).not.toBeVisible();

    await userEvent.click(notes);

    expect(within(moving).getByRole("heading", { name: "New" })).toBeVisible();
    expect(within(moving).getByText("The household view")).toBeVisible();
    expect(within(moving).getByText("Thanks.")).toBeVisible();
    expect(within(moving).queryByText(/##/u)).toBeNull();
  });

  it("offers no notes where the release passed none on, or only blank ones", () => {
    for (const value of [
      untold,
      { ...untold, changed: null },
      { ...untold, changed: "  " },
    ]) {
      const { unmount } = render(Settings, {
        quality: undefined,
        freshness: answered,
        standing: { ok: true, value },
      });
      expect(screen.queryByText(m.copy_changed())).toBeNull();
      unmount();
    }
  });
});
