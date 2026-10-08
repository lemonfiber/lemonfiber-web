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
import { replacedPartly, wouldReplace } from "../api/moves";
import { survey } from "../api/surveys";
import * as m from "../paraglide/messages.js";

/** Where the checks screen surveys what is already here. */
const surveyed = "/api/migration";

/** The stream is never opened in these, so nothing needs to answer it. */
const silent: Fetching = () =>
  Promise.resolve({ ok: false, status: 500, body: null });

/** The checks screen, against a stack whose acts on what is here answer as told. */
function moving(
  asked: Asked,
  acting: Partial<Record<string, readonly Says[]>>,
): void {
  globalThis.history.replaceState(undefined, "", "/checks");
  const sending = stack(
    {
      acting,
      becoming: [],
      reading: {
        [surveyed]: { status: 200, body: enveloped("migration", survey) },
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

describe("acting on what is already here, from the checks screen", () => {
  it("reads what replacing would stop, stops it on a yes naming the offer, and surveys again", async () => {
    const sent = fresh();
    moving(sent, {
      "migrate-replace": [
        { status: 200, body: enveloped("replacement", wouldReplace) },
        { status: 200, body: enveloped("replacement", replacedPartly) },
      ],
    });

    await userEvent.click(
      await screen.findByRole("button", {
        name: m.action_move_preview({ mode: "replace" }),
      }),
    );
    const asked = screen.getByRole("status", { name: m.move_asked() });
    expect(
      await within(asked).findByText(
        m.move_would_stop({ services: "sonarr, radarr" }),
      ),
    ).toBeInTheDocument();

    await userEvent.click(
      within(asked).getByRole("button", {
        name: m.action_move_yes({ mode: "replace" }),
      }),
    );
    expect(
      await within(asked).findByText(m.move_not_done({ services: "radarr" })),
    ).toBeInTheDocument();
    expect(sent.posted).toStrictEqual([
      { at: "/api/actions/migrate-replace", body: JSON.stringify({}) },
      {
        at: "/api/actions/migrate-replace",
        body: JSON.stringify({ offer: wouldReplace.agreement }),
      },
    ]);
    expect(times(sent, surveyed)).toBe(2);
  });
});
