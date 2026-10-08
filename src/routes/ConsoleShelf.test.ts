import { render, screen } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import type { Fetching } from "@lemonfiber/sdk-ts";
import { describe, expect, it, vi, type Mock } from "vitest";
import Console from "./Console.svelte";
import { household } from "./house";
import { enveloped, fresh, here, key, stack, times, type Says } from "./served";
import { film, kitsShelf } from "../api/shelves";
import { holdingLine } from "../lib/watchable";
import * as m from "../paraglide/messages.js";

/** Where the requests screen reads the household. */
const requests = "/api/requests";

/** Where one member's shelf is read. */
const held = "/api/held";

/** The stream is never opened in these, so nothing needs to answer it. */
const silent: Fetching = () =>
  Promise.resolve({ ok: false, status: 500, body: null });

/** The requests screen, with Kit's shelf answering as told. */
function running(
  sent: ReturnType<typeof fresh>,
  shelf: Says,
): Mock<() => void> {
  globalThis.history.replaceState(undefined, "", "/requests");
  const onrefused = vi.fn<() => void>();
  const sending = stack(
    {
      acting: {},
      becoming: [],
      reading: {
        [requests]: { status: 200, body: enveloped("household", household) },
        [held]: shelf,
      },
    },
    sent,
  );
  render(Console, {
    reaching: { at: here, token: key, sending, fetching: silent },
    onrefused,
    pausing: () => Promise.resolve(),
  });
  return onrefused;
}

describe("what one member can watch, from the requests screen", () => {
  it("is read when the operator opens it, and not before", async () => {
    const sent = fresh();
    running(sent, { status: 200, body: enveloped("held", kitsShelf) });
    const open = await screen.findByRole("button", {
      name: m.action_shelf({ name: "Kit" }),
    });
    expect(times(sent, held)).toBe(0);

    await userEvent.click(open);
    expect(await screen.findByText(holdingLine(film))).toBeVisible();
    expect(times(sent, held)).toBe(1);
  });

  it("passes on a refused key", async () => {
    const sent = fresh();
    const onrefused = running(sent, { status: 401, body: "" });
    await userEvent.click(
      await screen.findByRole("button", {
        name: m.action_shelf({ name: "Kit" }),
      }),
    );
    await vi.waitFor(() => {
      expect(onrefused).toHaveBeenCalled();
    });
  });
});
