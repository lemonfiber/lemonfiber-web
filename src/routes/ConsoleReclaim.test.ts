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
import { reclaimedRoom, roomy } from "../api/spaces";
import { bytes } from "../lib/figures";
import * as m from "../paraglide/messages.js";

/** Where the disk screen reads the accounting. */
const space = "/api/space";

/** The stream is never opened in these, so nothing needs to answer it. */
const silent: Fetching = () =>
  Promise.resolve({ ok: false, status: 500, body: null });

/** The disk screen, against a stack whose taking back room answers as told. */
function reclaiming(
  asked: Asked,
  acting: Partial<Record<string, readonly Says[]>>,
): void {
  globalThis.history.replaceState(undefined, "", "/storage");
  const sending = stack(
    {
      acting,
      becoming: [],
      reading: { [space]: { status: 200, body: enveloped("space", roomy) } },
    },
    asked,
  );
  render(Console, {
    reaching: { at: here, token: key, sending, fetching: silent },
    onrefused: vi.fn(),
    pausing: () => Promise.resolve(),
  });
}

const yes = m.action_reclaim_yes({ size: bytes(3_221_225_472) });

describe("taking back room, from the disk screen", () => {
  it("takes what costs nothing on a yes naming the offer, and reads the disk again", async () => {
    const sent = fresh();
    reclaiming(sent, {
      space: [{ status: 200, body: enveloped("space", reclaimedRoom) }],
    });

    await userEvent.click(await screen.findByRole("button", { name: yes }));

    expect(sent.posted).toStrictEqual([
      {
        at: "/api/actions/space",
        body: JSON.stringify({ offer: "space-7d41" }),
      },
    ]);
    const asked = screen.getByRole("status", { name: m.reclaim_asked() });
    expect(
      await within(asked).findByText(
        m.came_reclaim_taken({ size: bytes(3_221_225_472) }),
      ),
    ).toBeInTheDocument();
    expect(times(sent, space)).toBe(2);
  });

  // An accounting that moved since it was read is refused by lemonfiber, in
  // its own sentence, and reads as a refusal.
  it("says a refused yes in lemonfiber's words", async () => {
    const moved = "The disk changed since the offer was made.";
    reclaiming(fresh(), { space: [{ status: 409, body: moved }] });

    await userEvent.click(await screen.findByRole("button", { name: yes }));

    const asked = screen.getByRole("status", { name: m.reclaim_asked() });
    expect(await within(asked).findByText(moved)).toBeInTheDocument();
    expect(within(asked).getByText(m.eyebrow_refused())).toBeInTheDocument();
  });
});
