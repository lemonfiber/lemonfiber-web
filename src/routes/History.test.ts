import { render, screen, within } from "@testing-library/svelte";
import type { Reading } from "@lemonfiber/sdk-ts";
import { describe, expect, it } from "vitest";
import Checks from "./Checks.svelte";
import { changed, fixed } from "../api/histories";
import type { Freshness } from "../lib/freshness";
import { changeLines, type History } from "../lib/history";
import * as m from "../paraglide/messages.js";

const answered: Freshness = { kind: "answered", secondsAgo: 5 };

/** The checks screen, with what lemonfiber changed read. */
function reading(history: Reading<History> | undefined): void {
  render(Checks, { diagnosis: undefined, freshness: answered, history });
}

const panel = (): HTMLElement =>
  screen.getByRole("region", { name: m.panel_history() });

describe("what lemonfiber changed, on the checks screen", () => {
  it("is not drawn until it answers", () => {
    reading(undefined);
    expect(
      screen.queryByRole("region", { name: m.panel_history() }),
    ).toBeNull();
  });

  it("says how far back the record goes, and each change newest first", () => {
    reading({ ok: true, value: changed });
    expect(within(panel()).getByText(changed.horizon)).toBeVisible();
    const changes = within(panel()).getByRole("list", {
      name: m.history_said(),
    });
    const headings = within(changes)
      .getAllByRole("heading")
      .map((one) => one.textContent);
    expect(headings).toStrictEqual(changed.changes.map((one) => one.did));
    for (const line of changeLines(fixed)) {
      expect(within(changes).getByText(line)).toBeVisible();
    }
  });

  it("says so where lemonfiber has changed nothing", () => {
    reading({ ok: true, value: { ...changed, changes: [] } });
    expect(within(panel()).getByText(m.history_none())).toBeVisible();
    expect(
      within(panel()).queryByRole("list", { name: m.history_said() }),
    ).toBeNull();
  });

  it("says why it could not be read", () => {
    reading({ ok: false, problem: { kind: "refused", message: "No." } });
    expect(within(panel()).getByText("No.")).toBeVisible();
  });
});
