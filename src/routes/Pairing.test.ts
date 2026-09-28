import { render, screen, within } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import Settings from "./Settings.svelte";
import { made, material, pairer, zeroesForm } from "./paired";
import type { Freshness } from "../lib/freshness";
import type { Pairer } from "../lib/pairing";
import * as m from "../paraglide/messages.js";

const answered: Freshness = { kind: "answered", secondsAgo: 3 };

/** The settings screen, with a phone paired from it. */
function pairing(over: Partial<Pairer> = {}): void {
  render(Settings, {
    quality: undefined,
    freshness: answered,
    pairer: { ...pairer, ...over },
  });
}

const asked = (): HTMLElement =>
  screen.getByRole("status", { name: m.pairing_asked() });

const press = (label: string): Promise<void> =>
  userEvent.click(screen.getByRole("button", { name: label }));

describe("pairing a phone from the settings screen", () => {
  it("is not drawn where nothing answers it", () => {
    render(Settings, { quality: undefined, freshness: answered });
    expect(
      screen.queryByRole("region", { name: m.panel_pairing() }),
    ).toBeNull();
  });

  it("asks for fresh material, and puts the reader where it will land", async () => {
    const onask = vi.fn();
    pairing({ onask });

    await press(m.action_pair());

    expect(onask).toHaveBeenCalledWith({ doing: "companion-pair" });
    expect(asked()).toHaveFocus();
  });

  it("is silenced while a request is in flight", () => {
    pairing({ busy: true });
    expect(
      screen.getByRole("button", { name: m.action_pair() }),
    ).toHaveAttribute("aria-disabled", "true");
  });

  // Typed entry is checked against the short form before the phone trusts
  // this machine, so the two are shown together.
  it("shows the line to type, and the short form to check it against", async () => {
    pairing({ work: [made] });

    const shown = within(asked()).getByRole("region", {
      name: m.pairing_title(),
    });
    expect(within(shown).getByText(material.written)).toBeVisible();
    expect(await within(shown).findByText(zeroesForm)).toBeVisible();
    expect(within(asked()).getByText(material.replacing)).toBeVisible();
  });

  it("shows nothing to type before any material has come back", () => {
    pairing({
      work: [
        {
          id: "62",
          doing: "companion-pair",
          scoped: false,
          given: {},
          at: "under-way",
          job: "5c63",
        },
      ],
    });
    expect(within(asked()).getByText(m.doing_pair_title())).toBeVisible();
    expect(
      screen.queryByRole("region", { name: m.pairing_title() }),
    ).toBeNull();
  });

  it("puts a record away when asked", async () => {
    const ondrop = vi.fn();
    pairing({ work: [made], ondrop });

    await press(m.action_hide_record());

    expect(ondrop).toHaveBeenCalledWith(made.id);
    expect(asked()).toHaveFocus();
  });

  it("presses to nothing where nothing answers the controls", async () => {
    pairing({ work: [made] });
    await press(m.action_hide_record());
    await press(m.action_pair());
    expect(within(asked()).getByText(m.doing_pair_title())).toBeVisible();
  });
});
