import { render, screen, within } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import type { Fetching } from "@lemonfiber/sdk-ts";
import { describe, expect, it, vi } from "vitest";
import Console from "./Console.svelte";
import {
  enveloped,
  fresh,
  here,
  key,
  stack,
  times,
  type Asked,
  type Says,
} from "./served";
import { filled, wouldFill } from "../api/substitutions";
import { wiring } from "../api/wirings";
import * as m from "../paraglide/messages.js";

/** Where the settings screen reads what is wired to what. */
const wired = "/api/wiring";

/** The stream is never opened in these, so nothing needs to answer it. */
const silent: Fetching = () =>
  Promise.resolve({ ok: false, status: 500, body: null });

/** The settings screen, against a stack whose choices answer as told. */
function choosing(
  asked: Asked,
  acting: Partial<Record<string, readonly Says[]>>,
): void {
  globalThis.history.replaceState(undefined, "", "/settings");
  const sending = stack(
    {
      acting,
      becoming: [],
      reading: { [wired]: { status: 200, body: enveloped("wiring", wiring) } },
    },
    asked,
  );
  render(Console, {
    reaching: { at: here, token: key, sending, fetching: silent },
    onrefused: vi.fn(),
    pausing: () => Promise.resolve(),
  });
}

const preview = m.action_fill_preview({ capability: "requests" });

describe("choosing what fills a capability, from the settings screen", () => {
  it("rehearses the choice first, writes it on a yes naming the offer, and reads the wiring again", async () => {
    const sent = fresh();
    choosing(sent, {
      "wiring-fill": [
        { status: 200, body: enveloped("substitution", wouldFill) },
        { status: 200, body: enveloped("substitution", filled) },
      ],
    });

    const candidates = await screen.findByRole("radiogroup", {
      name: m.fill_candidates({ capability: "requests" }),
    });
    await userEvent.click(
      within(candidates).getByRole("radio", { name: "jellyseerr" }),
    );
    await userEvent.type(
      screen.getAllByRole("textbox", { name: m.fill_reason() })[0] ??
        document.body,
      "Jellyseerr knows the household.",
    );
    await userEvent.click(screen.getByRole("button", { name: preview }));

    const asked = screen.getByRole("status", { name: m.fill_asked() });
    expect(
      await within(asked).findByText(
        m.fill_would({ capability: "requests", service: "jellyseerr" }),
      ),
    ).toBeInTheDocument();

    await userEvent.click(
      within(asked).getByRole("button", { name: m.action_fill_yes() }),
    );
    expect(
      await within(asked).findByText(
        m.fill_did({ capability: "requests", service: "jellyseerr" }),
      ),
    ).toBeInTheDocument();
    expect(sent.posted).toStrictEqual([
      {
        at: "/api/actions/wiring-fill",
        body: JSON.stringify({
          capability: "requests",
          service: "jellyseerr",
          reason: "Jellyseerr knows the household.",
          dry_run: true,
        }),
      },
      {
        at: "/api/actions/wiring-fill",
        body: JSON.stringify({
          capability: "requests",
          service: "jellyseerr",
          reason: "Jellyseerr knows the household.",
          offer: wouldFill.agreement,
        }),
      },
    ]);
    expect(times(sent, wired)).toBe(2);
  });

  it("offers no preview until a service is picked where nobody has chosen", async () => {
    choosing(fresh(), {});
    expect(
      await screen.findByRole("button", { name: preview }),
    ).toHaveAttribute("aria-disabled", "true");
    expect(
      screen.getByRole("button", {
        name: m.action_fill_preview({ capability: "subtitles" }),
      }),
    ).toHaveAttribute("aria-disabled", "false");
  });

  // A wiring that moved since the offer was read is refused by lemonfiber, in
  // its own sentence, and reads as a refusal.
  it("says a refused choice in lemonfiber's words", async () => {
    const moved = "The wiring changed since the offer was made.";
    choosing(fresh(), { "wiring-fill": [{ status: 409, body: moved }] });

    await userEvent.click(
      await screen.findByRole("button", {
        name: m.action_fill_preview({ capability: "subtitles" }),
      }),
    );

    const asked = screen.getByRole("status", { name: m.fill_asked() });
    expect(await within(asked).findByText(moved)).toBeInTheDocument();
  });
});
