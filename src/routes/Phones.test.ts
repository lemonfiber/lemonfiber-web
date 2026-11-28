import { render, screen, within } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import Settings from "./Settings.svelte";
import {
  keyer,
  phonePreviewed,
  phones,
  previewUnnamed,
  unpaired,
} from "./keyings";
import { iphone, pixel } from "../api/keylists";
import type { Keyer } from "./keying.svelte";
import type { Freshness } from "../lib/freshness";
import { phoneLines } from "../lib/phones";
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
  screen.getByRole("region", { name: m.panel_phones() });

const press = (label: string): Promise<void> =>
  userEvent.click(within(panel()).getByRole("button", { name: label }));

describe("the phones' hardware keys, on the settings screen", () => {
  it("lists each by name, app, fingerprint, backing, and when it was registered and used", () => {
    drawn();
    const listed = within(panel()).getByRole("list", { name: m.phones_said() });
    expect(
      within(listed).getByRole("heading", { name: "pixel" }),
    ).toBeVisible();
    for (const line of phoneLines(pixel)) {
      expect(within(listed).getAllByText(line)[0]).toBeVisible();
    }
    for (const line of phoneLines(iphone)) {
      expect(within(listed).getAllByText(line)[0]).toBeVisible();
    }
  });

  it("revokes one only on a yes naming the phone, and offers none for a key revoked", async () => {
    const onask = vi.fn();
    drawn({ onask });
    expect(
      within(panel()).queryByRole("button", {
        name: m.action_phones_revoke({ name: "tablet" }),
      }),
    ).toBeNull();

    await press(m.action_phones_revoke({ name: "iphone" }));
    expect(onask).not.toHaveBeenCalled();
    expect(
      within(panel()).getByText(m.phones_revoke_prose({ name: "iphone" })),
    ).toBeVisible();
    await press(m.action_leave_as_is());
    expect(
      within(panel()).queryByText(m.phones_revoke_prose({ name: "iphone" })),
    ).toBeNull();
    expect(onask).not.toHaveBeenCalled();

    await press(m.action_phones_revoke({ name: "iphone" }));
    await press(m.action_phones_revoke_yes({ name: "iphone" }));
    expect(onask).toHaveBeenCalledWith({
      doing: "device-key-revoke",
      name: "iphone",
    });
    expect(
      within(panel()).queryByText(m.phones_revoke_prose({ name: "iphone" })),
    ).toBeNull();
  });

  it("offers a preview of the revoke beside the yes, asked for with nothing revoked", async () => {
    const onask = vi.fn();
    drawn({ onask });
    await press(m.action_phones_revoke({ name: "iphone" }));
    await press(m.action_phones_revoke_preview({ name: "iphone" }));
    expect(onask).toHaveBeenCalledWith({
      doing: "device-key-revoke",
      name: "iphone",
      dryRun: true,
    });
  });

  it("draws what the preview answered under its question, and the yes revokes it", async () => {
    const onask = vi.fn();
    drawn({ onask, previewed: phonePreviewed });
    expect(
      within(panel()).getByText(m.phones_preview_would({ name: "iphone" })),
    ).toBeVisible();
    await press(m.action_phones_revoke_yes({ name: "iphone" }));
    expect(onask).toHaveBeenCalledWith({
      doing: "device-key-revoke",
      name: "iphone",
    });
  });

  it("says what revoking would do is not known where the preview did not name the phone", () => {
    drawn({ previewed: previewUnnamed });
    expect(
      within(panel()).getByText(m.preview_unnamed({ name: "iphone" })),
    ).toBeVisible();
    expect(
      within(panel()).getByRole("button", {
        name: m.action_phones_revoke_yes({ name: "iphone" }),
      }),
    ).toBeVisible();
  });

  it("says which phone's key the answer revoked", () => {
    drawn({ phones: { ok: true, value: unpaired } });
    const asked = within(panel()).getByRole("status", {
      name: m.phones_asked(),
    });
    expect(
      within(asked).getByText(m.phones_revoked({ name: "iphone" })),
    ).toBeVisible();
    expect(
      within(panel()).queryByRole("button", {
        name: m.action_phones_revoke({ name: "iphone" }),
      }),
    ).toBeNull();
  });

  it("says why a revoke was not carried out", () => {
    drawn({ phoneSaid: "No device key is registered as `iphone`." });
    const asked = within(panel()).getByRole("status", {
      name: m.phones_asked(),
    });
    expect(
      within(asked).getByText("No device key is registered as `iphone`."),
    ).toBeVisible();
  });

  it("lists them again on asking", async () => {
    const onask = vi.fn();
    drawn({ onask });
    await press(m.action_phones_list());
    expect(onask).toHaveBeenCalledWith({ doing: "device-key-list" });
  });

  it("holds a place until they are read", () => {
    drawn({ phones: undefined });
    expect(within(panel()).getByText(m.waiting_answer())).toBeInTheDocument();
    expect(
      within(panel()).queryByRole("button", { name: m.action_phones_list() }),
    ).toBeNull();
  });

  it("draws the panel silenced with lemonfiber's sentence where the signed-in key may not keep them", () => {
    const said =
      "A key may not register, list or revoke device keys, whatever its scope.";
    drawn({
      phones: { ok: false, problem: { kind: "declined", message: said } },
    });
    expect(within(panel()).getByText(said)).toBeVisible();
    expect(within(panel()).queryAllByRole("button")).toHaveLength(0);
    expect(
      within(panel()).queryByRole("list", { name: m.phones_said() }),
    ).toBeNull();
  });

  it("says so where no phone has registered one", () => {
    drawn({ phones: { ok: true, value: { ...phones, keys: [] } } });
    expect(within(panel()).getByText(m.phones_none())).toBeVisible();
    expect(
      within(panel()).queryByRole("list", { name: m.phones_said() }),
    ).toBeNull();
  });

  it("presses to nothing where nothing answers the controls", async () => {
    drawn();
    await press(m.action_phones_revoke({ name: "pixel" }));
    await press(m.action_phones_revoke_yes({ name: "pixel" }));
    await press(m.action_phones_list());
    expect(panel()).toBeInTheDocument();
  });
});
