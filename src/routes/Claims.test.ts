import { render, screen, within } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import Settings from "./Settings.svelte";
import { claimed, keyer, made } from "./keyings";
import type { Keyer } from "./keying.svelte";
import type { Freshness } from "../lib/freshness";
import { claimedLines } from "../lib/keys";
import { drawn as coded } from "../lib/qr";
import * as m from "../paraglide/messages.js";

const answered: Freshness = { kind: "answered", secondsAgo: 5 };

/** The settings screen, with keeping keys handed this. */
function drawn(over: Partial<Keyer> = {}): { unmount: () => void } {
  return render(Settings, {
    quality: undefined,
    freshness: answered,
    keyer: { ...keyer, ...over },
  });
}

const panel = (): HTMLElement =>
  screen.getByRole("region", { name: m.panel_keys() });

const typeInto = (label: string, text: string): Promise<void> =>
  userEvent.type(within(panel()).getByLabelText(label), text);

const handed = (label: string): Promise<void> =>
  userEvent.click(
    within(
      within(panel()).getByRole("radiogroup", { name: m.keys_hand_said() }),
    ).getByRole("radio", { name: label }),
  );

describe("minting a key as a claim, on the settings screen", () => {
  it("mints a claim once handing it to a program is chosen, and lets go of the password", async () => {
    const onask = vi.fn();
    drawn({ onask });
    const password = crypto.randomUUID();
    await handed(m.keys_hand_claim());
    await typeInto(m.keys_name(), "home");
    await typeInto(m.keys_password(), password);
    await userEvent.click(
      within(panel()).getByRole("button", { name: m.action_keys_mint() }),
    );
    expect(onask).toHaveBeenCalledWith({
      doing: "key-claim",
      minting: {
        name: "home",
        scope: "read",
        purpose: "home-assistant",
        password,
      },
    });
    expect(within(panel()).getByLabelText(m.keys_password())).toHaveValue("");

    await handed(m.keys_hand_shown());
    await typeInto(m.keys_name(), "home");
    await typeInto(m.keys_password(), password);
    await userEvent.click(
      within(panel()).getByRole("button", { name: m.action_keys_mint() }),
    );
    expect(onask).toHaveBeenLastCalledWith(
      expect.objectContaining({ doing: "key-mint" }),
    );
  });

  it("shows the claim link once, as text and as a code, with when it lapses, and no secret", async () => {
    const onclose = vi.fn();
    drawn({ claimed, onclose });
    const shown = within(panel()).getByRole("region", {
      name: m.keys_claim_title({ name: "home" }),
    });
    expect(within(shown).getByText(claimed.link)).toBeVisible();
    expect(
      within(shown)
        .getByRole("img", { name: m.keys_claim_code_said({ name: "home" }) })
        .querySelector("path"),
    ).toHaveAttribute("d", coded(claimed.link).path);
    for (const line of claimedLines(claimed)) {
      expect(within(shown).getByText(line)).toBeVisible();
    }
    expect(
      within(panel()).queryByRole("region", {
        name: m.keys_made_title({ name: "home" }),
      }),
    ).toBeNull();
    await userEvent.click(
      within(shown).getByRole("button", { name: m.action_keys_close_claim() }),
    );
    expect(onclose).toHaveBeenCalled();
  });

  it("drops what was just minted when the panel is left", () => {
    const onclose = vi.fn();
    const { unmount } = drawn({ claimed, minted: made, onclose });
    expect(onclose).not.toHaveBeenCalled();
    unmount();
    expect(onclose).toHaveBeenCalledOnce();
  });
});
