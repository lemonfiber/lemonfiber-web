import { render, screen, within } from "@testing-library/svelte";
import type { Reading } from "@lemonfiber/sdk-ts";
import { describe, expect, it } from "vitest";
import Settings from "./Settings.svelte";
import { behind, versions } from "../api/copies";
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
