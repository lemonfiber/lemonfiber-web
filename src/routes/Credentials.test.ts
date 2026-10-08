import { render, screen, within } from "@testing-library/svelte";
import type { Reading } from "@lemonfiber/sdk-ts";
import { describe, expect, it } from "vitest";
import Settings from "./Settings.svelte";
import { inventory, staleKey } from "../api/credentials";
import { heldLines, type Inventory } from "../lib/credentials";
import type { Freshness } from "../lib/freshness";
import * as m from "../paraglide/messages.js";

const answered: Freshness = { kind: "answered", secondsAgo: 5 };

/** The settings screen, with the credentials read. */
function reading(credentials: Reading<Inventory> | undefined): void {
  render(Settings, { quality: undefined, freshness: answered, credentials });
}

const panel = (): HTMLElement =>
  screen.getByRole("region", { name: m.panel_credentials() });

describe("the credentials, on the settings screen", () => {
  it("holds a place while nothing has answered", () => {
    reading(undefined);
    expect(within(panel()).getByText(m.waiting_answer())).toBeInTheDocument();
  });

  it("names each credential with everything said of it", () => {
    reading({ ok: true, value: inventory });
    const held = within(panel()).getByRole("list", {
      name: m.credential_said(),
    });
    expect(
      within(held).getByRole("heading", { name: staleKey.name }),
    ).toBeVisible();
    for (const line of heldLines(staleKey)) {
      expect(within(held).getByText(line)).toBeVisible();
    }
  });

  it("says what keeping them in files protects against, and what it does not", () => {
    reading({ ok: true, value: inventory });
    const protection = within(panel()).getByRole("region", {
      name: m.credential_protection(),
    });
    for (const said of [
      inventory.protection.summary,
      ...inventory.protection.against,
      ...inventory.protection.not_against,
    ]) {
      expect(within(protection).getByText(said)).toBeVisible();
    }
  });

  it("says so where the stack holds none", () => {
    reading({ ok: true, value: { ...inventory, held: [] } });
    expect(within(panel()).getByText(m.credential_none())).toBeVisible();
    expect(
      within(panel()).queryByRole("list", { name: m.credential_said() }),
    ).toBeNull();
  });

  it("says why they could not be read", () => {
    reading({ ok: false, problem: { kind: "refused", message: "No." } });
    expect(within(panel()).getByText("No.")).toBeVisible();
  });
});
