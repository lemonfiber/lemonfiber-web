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
  type Asked,
  type Says,
} from "./served";
import { material, zeroesForm } from "../api/pairings";
import { inForce } from "../api/qualities";
import * as m from "../paraglide/messages.js";

/** The stream is never opened in these, so nothing needs to answer it. */
const silent: Fetching = () => Promise.resolve({ ok: false, body: null });

/** The settings screen, against a stack that answers pairing as it is told. */
function opening(asked: Asked, pairing: readonly Says[]): void {
  globalThis.history.replaceState(undefined, "", "/settings");
  const sending = stack(
    {
      acting: { "companion-pair": pairing },
      becoming: [],
      reading: {
        "/api/quality": { status: 200, body: enveloped("quality", inForce) },
      },
    },
    asked,
  );
  render(Console, {
    reaching: { at: here, token: key, sending, fetching: silent },
    onrefused: vi.fn(),
    pausing: () => Promise.resolve(),
  });
}

const asked = (): HTMLElement =>
  screen.getByRole("status", { name: m.pairing_asked() });

describe("pairing a phone from the settings screen", () => {
  it("makes fresh material on the press, with the short form to check", async () => {
    const sent = fresh();
    opening(sent, [{ status: 200, body: enveloped("pairing", material) }]);
    await screen.findByText(m.action_pair());

    await userEvent.click(
      screen.getByRole("button", { name: m.action_pair() }),
    );

    expect(sent.posted).toStrictEqual([
      { at: "/api/actions/companion-pair", body: "{}" },
    ]);
    expect(
      await within(asked()).findByText(material.written),
    ).toBeInTheDocument();
    expect(within(asked()).getByText(zeroesForm)).toBeInTheDocument();
  });

  // lemonfiber makes material only while the web interface is served
  // encrypted, and says so. That is a refusal, in its words.
  it("says a refusal in lemonfiber's words", async () => {
    const plain =
      "Pairing needs the web interface served encrypted on your network.";
    opening(fresh(), [{ status: 409, body: plain }]);
    await screen.findByText(m.action_pair());

    await userEvent.click(
      screen.getByRole("button", { name: m.action_pair() }),
    );

    expect(await within(asked()).findByText(plain)).toBeInTheDocument();
    expect(within(asked()).getByText(m.eyebrow_refused())).toBeInTheDocument();
  });
});
