import { render, screen, within } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import Settings from "./Settings.svelte";
import { keyer, listing, made } from "./keyings";
import { home } from "../api/keylists";
import type { Keyer } from "./keying.svelte";
import type { Freshness } from "../lib/freshness";
import { keyLines, mintedLines } from "../lib/keys";
import * as m from "../paraglide/messages.js";

const answered: Freshness = { kind: "answered", secondsAgo: 5 };

/** The settings screen, with keeping keys handed this. */
function drawn(over: Partial<Keyer> = {}): void {
  render(Settings, {
    quality: undefined,
    freshness: answered,
    keyer: { ...keyer, ...over },
  });
}

const panel = (): HTMLElement =>
  screen.getByRole("region", { name: m.panel_keys() });

const press = (label: string): Promise<void> =>
  userEvent.click(within(panel()).getByRole("button", { name: label }));

const typeInto = (label: string, text: string): Promise<void> =>
  userEvent.type(within(panel()).getByLabelText(label), text);

describe("the integration keys, on the settings screen", () => {
  it("lists each key without its secret, and what lemonfiber says of purposes", () => {
    drawn();
    const keys = within(panel()).getByRole("list", { name: m.keys_said() });
    for (const line of keyLines(home)) {
      expect(within(keys).getAllByText(line)[0]).toBeVisible();
    }
    expect(within(panel()).getByText(listing.purposes)).toBeVisible();
  });

  it("offers to revoke only a key in use, and revokes it once the operator says so", async () => {
    const onask = vi.fn();
    drawn({ onask });
    expect(
      within(panel()).queryByRole("button", {
        name: m.action_keys_revoke({ name: "old-mcp" }),
      }),
    ).toBeNull();

    await press(m.action_keys_revoke({ name: "home" }));
    expect(onask).not.toHaveBeenCalled();
    expect(
      within(panel()).getByText(m.keys_revoke_prose({ name: "home" })),
    ).toBeVisible();
    await press(m.action_leave_as_is());
    expect(
      within(panel()).queryByText(m.keys_revoke_prose({ name: "home" })),
    ).toBeNull();

    await press(m.action_keys_revoke({ name: "home" }));
    await press(m.action_keys_revoke_yes({ name: "home" }));
    expect(onask).toHaveBeenCalledWith({ doing: "key-revoke", name: "home" });
  });

  it("mints with the password typed, and lets go of it as it is sent", async () => {
    const onask = vi.fn();
    drawn({ onask });
    const mint = (): HTMLElement =>
      within(panel()).getByRole("button", { name: m.action_keys_mint() });
    expect(mint()).toHaveAttribute("aria-disabled", "true");

    await typeInto(m.keys_name(), "home");
    await typeInto(m.keys_password(), "hunter2");
    await userEvent.click(mint());
    expect(onask).toHaveBeenCalledWith({
      doing: "key-mint",
      minting: {
        name: "home",
        scope: "read",
        purpose: "home-assistant",
        password: "hunter2",
      },
    });
    expect(within(panel()).getByLabelText(m.keys_password())).toHaveValue("");
  });

  it("mints a member's key only once the account is named, for the purpose chosen", async () => {
    const onask = vi.fn();
    drawn({ onask });
    const scopes = within(panel()).getByRole("radiogroup", {
      name: m.keys_scope_said(),
    });
    await userEvent.click(
      within(scopes).getByRole("radio", { name: m.keys_scope_member() }),
    );
    const purposes = within(panel()).getByRole("radiogroup", {
      name: m.keys_purpose_said(),
    });
    await userEvent.click(
      within(purposes).getByRole("radio", { name: m.keys_purpose_other() }),
    );
    await typeInto(m.keys_name(), "kit-phone");
    await typeInto(m.keys_password(), "hunter2");
    const mint = (): HTMLElement =>
      within(panel()).getByRole("button", { name: m.action_keys_mint() });
    expect(mint()).toHaveAttribute("aria-disabled", "true");

    await typeInto(m.keys_account(), "kit");
    await userEvent.click(mint());
    expect(onask).toHaveBeenCalledWith({
      doing: "key-mint",
      minting: {
        name: "kit-phone",
        scope: "member:kit",
        purpose: "other",
        password: "hunter2",
      },
    });

    await userEvent.click(
      within(scopes).getByRole("radio", { name: m.keys_scope_act() }),
    );
    expect(within(panel()).queryByLabelText(m.keys_account())).toBeNull();
  });

  it("shows a key just minted once, with what a program needs, until it is closed", async () => {
    const onclose = vi.fn();
    drawn({ minted: made, onclose });
    const shown = within(panel()).getByRole("region", {
      name: m.keys_made_title({ name: "home" }),
    });
    expect(within(shown).getByText(made.secret)).toBeVisible();
    for (const line of mintedLines(made)) {
      expect(within(shown).getByText(line)).toBeVisible();
    }
    await userEvent.click(
      within(shown).getByRole("button", { name: m.action_keys_close() }),
    );
    expect(onclose).toHaveBeenCalled();
  });

  it("lists the keys again on asking", async () => {
    const onask = vi.fn();
    drawn({ onask });
    await press(m.action_keys_list());
    expect(onask).toHaveBeenCalledWith({ doing: "key-list" });
  });

  it("says why a mint or a revoke was not carried out", () => {
    drawn({ said: "That is not the password." });
    const asked = within(panel()).getByRole("status", { name: m.keys_asked() });
    expect(within(asked).getByText("That is not the password.")).toBeVisible();
  });

  it("holds a place, says why the keys could not be read, or that there are none", () => {
    drawn({ listing: undefined });
    expect(within(panel()).getByText(m.waiting_answer())).toBeInTheDocument();
  });

  it("says why the keys could not be read", () => {
    drawn({
      listing: { ok: false, problem: { kind: "refused", message: "No." } },
    });
    expect(within(panel()).getByText("No.")).toBeVisible();
  });

  it("says so where no key has been minted", () => {
    drawn({ listing: { ok: true, value: { ...listing, keys: [] } } });
    expect(within(panel()).getByText(m.keys_none())).toBeVisible();
    expect(
      within(panel()).queryByRole("list", { name: m.keys_said() }),
    ).toBeNull();
  });

  it("presses to nothing where nothing answers the controls", async () => {
    drawn({ minted: made });
    await press(m.action_keys_close());
    await press(m.action_keys_revoke({ name: "home" }));
    await press(m.action_keys_revoke_yes({ name: "home" }));
    await typeInto(m.keys_name(), "home");
    await typeInto(m.keys_password(), "x");
    await press(m.action_keys_mint());
    await press(m.action_keys_list());
    expect(panel()).toBeInTheDocument();
  });
});
