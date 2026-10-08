import { render, screen, within } from "@testing-library/svelte";
import type { Reading } from "@lemonfiber/sdk-ts";
import { describe, expect, it } from "vitest";
import Requests from "./Requests.svelte";
import { guidance, television } from "../api/apps";
import { deviceLines, type Guidance } from "../lib/clients";
import type { Freshness } from "../lib/freshness";
import * as m from "../paraglide/messages.js";

const answered: Freshness = { kind: "answered", secondsAgo: 5 };

/** The requests screen, with which app to watch on read. */
function reading(clients: Reading<Guidance> | undefined): void {
  render(Requests, { household: undefined, freshness: answered, clients });
}

const panel = (): HTMLElement =>
  screen.getByRole("region", { name: m.panel_clients() });

describe("which app to watch on, on the requests screen", () => {
  it("is not drawn until it answers", () => {
    reading(undefined);
    expect(
      screen.queryByRole("region", { name: m.panel_clients() }),
    ).toBeNull();
  });

  it("says once what holds for every device, and where playback will struggle", () => {
    reading({ ok: true, value: guidance });
    for (const said of [
      guidance.only_at_home,
      guidance.nothing_is_installed,
      guidance.straining?.caution ?? "",
      guidance.straining?.instead ?? "",
    ]) {
      expect(within(panel()).getByText(said)).toBeVisible();
    }
  });

  it("names each device with the app to use and how well it is served", () => {
    reading({ ok: true, value: guidance });
    const devices = within(panel()).getByRole("region", {
      name: m.clients_devices(),
    });
    expect(
      within(devices).getByRole("heading", { name: television.device }),
    ).toBeVisible();
    for (const line of deviceLines(television)) {
      expect(within(devices).getByText(line)).toBeVisible();
    }
  });

  it("says what to do when it does not work, by what somebody would say", () => {
    reading({ ok: true, value: guidance });
    const trouble = within(panel()).getByRole("region", {
      name: m.clients_trouble(),
    });
    expect(
      within(trouble).getByRole("heading", { name: "It keeps buffering" }),
    ).toBeVisible();
    expect(
      within(trouble).getByText(
        m.clients_fix({ fix: "Choose a lighter preset." }),
      ),
    ).toBeVisible();
  });

  it("draws no caution where playback is not expected to struggle", () => {
    reading({ ok: true, value: { ...guidance, straining: null } });
    expect(
      within(panel()).queryByText(guidance.straining?.caution ?? ""),
    ).toBeNull();
  });

  it("says why it could not be read", () => {
    reading({ ok: false, problem: { kind: "refused", message: "No." } });
    expect(within(panel()).getByText("No.")).toBeVisible();
  });
});
