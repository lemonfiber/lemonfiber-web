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
  started,
  times,
  type Asked,
  type Says,
} from "./served";
import { letGone, letOffer, reckoned, shared } from "../api/spaces";
import { bytes } from "../lib/figures";
import * as m from "../paraglide/messages.js";

/** Where the disk screen reads the accounting of its completed downloads. */
const space = "/api/space";

/** The stream is never opened in these, so nothing needs to answer it. */
const silent: Fetching = () => Promise.resolve({ ok: false, body: null });

/** The disk screen, against a stack whose letting go answers as it is told. */
function letting(
  asked: Asked,
  acting: Partial<Record<string, readonly Says[]>>,
  becoming: readonly Says[] = [],
): void {
  globalThis.history.replaceState(undefined, "", "/storage");
  const sending = stack(
    {
      acting,
      becoming,
      reading: {
        [space]: { status: 200, body: enveloped("space", reckoned) },
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

const press = (label: string): Promise<void> =>
  userEvent.click(screen.getByRole("button", { name: label }));

const costing = m.action_let_go_cost({ name: shared.name });

describe("letting a download go, from the disk screen", () => {
  it("says what it costs, lets it go on a yes naming the offer, and reads the disk again", async () => {
    const sent = fresh();
    letting(
      sent,
      {
        "stop-seeding": [
          { status: 200, body: enveloped("stop-seeding", letOffer) },
          started,
        ],
      },
      [started, { status: 200, body: enveloped("stop-seeding", letGone) }],
    );
    await screen.findByRole("button", { name: costing });

    await press(costing);
    await screen.findByText(m.action_let_go_yes());
    expect(screen.getByText(letOffer.goes)).toBeVisible();
    await press(m.action_let_go_yes());

    expect(sent.posted).toStrictEqual([
      {
        at: "/api/actions/stop-seeding",
        body: JSON.stringify({ download: shared.name }),
      },
      {
        at: "/api/actions/stop-seeding",
        body: JSON.stringify({ download: shared.name, offer: "let-go-4e11" }),
      },
    ]);
    const asked = screen.getByRole("status", { name: m.letting_asked() });
    expect(
      await within(asked).findByText(
        m.letting_gone({ name: shared.name, size: bytes(shared.bytes) }),
      ),
    ).toBeInTheDocument();
    expect(times(sent, space)).toBe(2);
  });

  // An offer that moved since it was read is refused by lemonfiber, in its own
  // sentence, and reads as a refusal.
  it("says a refused letting go in lemonfiber's words", async () => {
    const moved = "The download's ratio changed since the offer was made.";
    letting(fresh(), {
      "stop-seeding": [
        { status: 200, body: enveloped("stop-seeding", letOffer) },
        { status: 409, body: moved },
      ],
    });
    await screen.findByRole("button", { name: costing });

    await press(costing);
    await screen.findByText(m.action_let_go_yes());
    await press(m.action_let_go_yes());

    const asked = screen.getByRole("status", { name: m.letting_asked() });
    expect(await within(asked).findByText(moved)).toBeInTheDocument();
    expect(within(asked).getByText(m.eyebrow_refused())).toBeInTheDocument();
  });
});
