import { render, screen, within } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import Settings from "./Settings.svelte";
import { keyer, unwoken, woken } from "./keyings";
import { iphoneWoken, pixelWoken } from "../api/keylists";
import type { Keyer } from "./keying.svelte";
import type { Freshness } from "../lib/freshness";
import { wakeableLines } from "../lib/woken";
import * as m from "../paraglide/messages.js";

const answered: Freshness = { kind: "answered", secondsAgo: 5 };

/** The settings screen, with keeping phones handed this. */
function drawn(over: Partial<Keyer> = {}): void {
  render(Settings, {
    quality: undefined,
    freshness: answered,
    keyer: { ...keyer, ...over },
  });
}

const panel = (): HTMLElement =>
  screen.getByRole("region", { name: m.panel_woken() });

const press = (label: string): Promise<void> =>
  userEvent.click(within(panel()).getByRole("button", { name: label }));

describe("the phones that can be woken, on the settings screen", () => {
  it("lists each by name, the host it is woken through and when it was registered", () => {
    drawn();
    const listed = within(panel()).getByRole("list", { name: m.woken_said() });
    for (const phone of [pixelWoken, iphoneWoken]) {
      expect(
        within(listed).getByRole("heading", { name: phone.name }),
      ).toBeVisible();
      for (const line of wakeableLines(phone)) {
        expect(within(listed).getAllByText(line)[0]).toBeVisible();
      }
    }
  });

  it("draws no whole address, in the text or in any attribute", () => {
    drawn();
    const page = document.body.innerHTML;
    for (const phone of woken.endpoints) {
      const address = new URL(phone.endpoint);
      expect(page).not.toContain(phone.endpoint);
      expect(page).not.toContain(`${address.pathname}${address.search}`);
    }
    expect(page).toContain("push.example.test");
  });

  it("asks first in a question naming the phone, the removal taking no rehearsal, and removes it only on a yes", async () => {
    const onask = vi.fn();
    drawn({ onask });

    await press(m.action_woken_remove({ name: "iphone" }));
    expect(onask).not.toHaveBeenCalled();
    expect(
      within(panel()).getByText(m.woken_remove_prose({ name: "iphone" })),
    ).toBeVisible();
    await press(m.action_leave_as_is());
    expect(
      within(panel()).queryByText(m.woken_remove_prose({ name: "iphone" })),
    ).toBeNull();
    expect(onask).not.toHaveBeenCalled();

    await press(m.action_woken_remove({ name: "iphone" }));
    await press(m.action_woken_remove_yes({ name: "iphone" }));
    expect(onask).toHaveBeenCalledWith({
      doing: "push-endpoint-remove",
      name: "iphone",
    });
    expect(
      within(panel()).queryByText(m.woken_remove_prose({ name: "iphone" })),
    ).toBeNull();
  });

  it("lists them again on asking", async () => {
    const onask = vi.fn();
    drawn({ onask });
    await press(m.action_woken_list());
    expect(onask).toHaveBeenCalledWith({ doing: "push-endpoint-list" });
  });

  it("says which phone the answer removed, and why a removal was not carried out", () => {
    drawn({
      woken: { ok: true, value: unwoken },
      wokenSaid: "No push endpoint is registered as `tablet`.",
    });
    const asked = within(panel()).getByRole("status", {
      name: m.woken_asked(),
    });
    expect(
      within(asked).getByText(m.woken_removed({ name: "iphone" })),
    ).toBeVisible();
    expect(
      within(asked).getByText("No push endpoint is registered as `tablet`."),
    ).toBeVisible();
  });

  it("says none has asked, while waiting, and lemonfiber's sentence in place of the list", () => {
    const { unmount } = render(Settings, {
      quality: undefined,
      freshness: answered,
      keyer: {
        ...keyer,
        woken: { ok: true, value: { endpoints: [], rehearsed: false } },
      },
    });
    expect(within(panel()).getByText(m.woken_none())).toBeVisible();
    unmount();

    drawn({ woken: undefined });
    expect(within(panel()).queryByRole("button")).toBeNull();
    expect(within(panel()).queryByRole("list")).toBeNull();
  });

  it("says why it could not read them, with nothing to press", () => {
    const said = "A key is refused here whatever its scope.";
    drawn({
      woken: { ok: false, problem: { kind: "declined", message: said } },
    });
    expect(within(panel()).getByText(said)).toBeVisible();
    expect(within(panel()).queryByRole("button")).toBeNull();
  });
});
