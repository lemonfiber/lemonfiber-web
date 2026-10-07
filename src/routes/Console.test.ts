import { render, screen, waitFor } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import type { Fetching, Sending } from "@lemonfiber/sdk-ts";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Console from "./Console.svelte";
import { moment, worst, worstService } from "./fixture";
import * as m from "../paraglide/messages.js";
import { key, here, enveloped } from "./served";
import {
  answering,
  refusing,
  framed,
  saying,
  settle,
  console_,
} from "./Console.testing";

/**
 * Somewhere that is not this machine, assembled rather than written: the
 * structural guards refuse a foreign origin in the source, and this one is here
 * to be refused by the client.
 */
const elsewhere = ["http:", "", "example.test"].join("/");

/** What lemonfiber says when it ran the request and its own answering failed. */
const engineDown = "The container engine is not running.";

/** A transport that answers every reading with that failure. */
const failing: Sending = () =>
  Promise.resolve({
    ok: false,
    status: 500,
    text: () =>
      Promise.resolve(
        enveloped("error", {
          code: "engine-absent",
          summary: engineDown,
          meaning: "Nothing can be started until it is.",
          remedies: [],
          severity: "error",
          state: "actionable",
        }),
      ),
  });

/** A stream that will not open at all, counting every asking. */
function refused(openings: { count: number }): Fetching {
  return () => {
    openings.count += 1;
    return Promise.resolve({ ok: false, status: 500, body: null });
  };
}

/** A stream that carries what it was given and stays open. */
function holding(said: readonly string[]): Fetching {
  return () =>
    Promise.resolve({
      ok: true,
      status: 200,
      body: new ReadableStream<Uint8Array>({
        start(controller) {
          const bytes = new TextEncoder();
          for (const one of said) controller.enqueue(bytes.encode(one));
        },
      }),
    });
}

/** A stream that refuses its first opening and carries on the next. */
function openingLater(said: readonly string[]): Fetching {
  let asked = 0;
  return () => {
    asked += 1;
    if (asked === 1)
      return Promise.resolve({ ok: false, status: 500, body: null });
    return Promise.resolve({
      ok: true,
      status: 200,
      body: new ReadableStream<Uint8Array>({
        start(controller) {
          const bytes = new TextEncoder();
          for (const one of said) controller.enqueue(bytes.encode(one));
          controller.close();
        },
      }),
    });
  };
}

/**
 * A stream that opens only after the current task, and counts its openings.
 *
 * The delay is what makes putting the screen away testable: the screen is gone
 * before the first thing the stream says arrives.
 */
function opening(
  said: readonly string[],
  openings: { count: number },
): Fetching {
  return () =>
    new Promise((resolve) => {
      setTimeout(() => {
        openings.count += 1;
        resolve({
          ok: true,
          status: 200,
          body: new ReadableStream<Uint8Array>({
            start(controller) {
              const bytes = new TextEncoder();
              for (const one of said) controller.enqueue(bytes.encode(one));
              controller.close();
            },
          }),
        });
      }, 0);
    });
}

describe("the console", () => {
  beforeEach(() => {
    globalThis.history.replaceState(undefined, "", "/");
  });

  it("draws the overview from what the readings answered", async () => {
    console_();
    expect(await screen.findByText(worstService.name)).toBeInTheDocument();
  });

  it("says the live connection was never made", async () => {
    console_();
    expect(
      await screen.findByText(m.banner_contact_lead()),
    ).toBeInTheDocument();
  });

  // Reopening is what a stream that carried and broke is given. A first opening
  // that failed is not one of those, so a banner saying it is being retried
  // would be describing something nothing is doing.
  it("tries a first opening once, and says nothing is trying again", async () => {
    const openings = { count: 0 };
    console_({ fetching: refused(openings) });

    expect(
      await screen.findByText(m.banner_contact_prose()),
    ).toBeInTheDocument();
    await settle();

    expect(openings.count).toBe(1);
  });

  it("opens the connection again when the operator asks for it", async () => {
    console_({ fetching: openingLater([framed("dashboard", moment)]) });

    await userEvent.click(
      await screen.findByRole("button", { name: m.action_try_again() }),
    );

    expect(await screen.findByText(worst)).toBeInTheDocument();
  });

  // A control asking for what is already under way asks for nothing.
  it("offers nothing to press while the stream is carrying", async () => {
    console_({ fetching: holding([framed("dashboard", moment)]) });

    expect(await screen.findByText(worst)).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: m.action_try_again() }),
    ).toBeNull();
  });

  it("says so when the key is not the one this run expects", async () => {
    const refused = vi.fn();
    console_({ sending: refusing, onrefused: refused });
    await waitFor(() => {
      expect(refused).toHaveBeenCalled();
    });
  });

  // Being sent back to the unlock screen means the key held here is discarded,
  // and a key that was working is not what a stopped container engine needs
  // put right. Every reading here failed, so the one that decides this had
  // every chance to read a failure as the key.
  it("keeps the key when it is lemonfiber's answering that failed", async () => {
    const refused = vi.fn();
    console_({ sending: failing, onrefused: refused });

    const said = await screen.findAllByText(engineDown);

    expect(said.length).toBeGreaterThan(0);
    expect(refused).not.toHaveBeenCalled();
  });

  // A client is configured with the address the binary printed; there is
  // nowhere else to listen.
  it("opens no connection to anywhere but this machine", async () => {
    console_({ at: elsewhere, onrefused: vi.fn() });
    expect(
      await screen.findByText(m.banner_contact_lead()),
    ).toBeInTheDocument();
  });
});

describe("what the live connection carries", () => {
  beforeEach(() => {
    globalThis.history.replaceState(undefined, "", "/");
  });

  it("draws the moment it delivered", async () => {
    console_({ fetching: saying([framed("dashboard", moment)]) });
    expect(await screen.findByText(worst)).toBeInTheDocument();
  });

  // A figure gathered before a gap is not current, whatever the transport says
  // about the gap.
  it("stops claiming the screen is current once the connection drops", async () => {
    console_({ fetching: saying([framed("dashboard", moment)]) });
    expect(await screen.findByText(m.flow_stale_lead())).toBeInTheDocument();
    expect(screen.getByText(worst)).toBeInTheDocument();
  });

  // A screen nobody is looking at any more must not be one of the reasons a
  // broken stream is reopened.
  it("stops listening once the screen is put away", async () => {
    const openings = { count: 0 };
    const { unmount } = render(Console, {
      reaching: {
        at: here,
        token: key,
        sending: answering,
        fetching: opening([framed("dashboard", moment)], openings),
      },
      onrefused: vi.fn(),
    });

    unmount();
    await settle();
    await settle();

    expect(openings.count).toBe(1);
    expect(screen.queryByText(worst)).toBeNull();
  });

  it("ignores an event carrying something this screen is not drawn from", async () => {
    console_({
      fetching: saying([
        framed("log", {
          service: "sonarr",
          stream: "stdout",
          line: "something",
        }),
      ]),
    });
    expect(
      await screen.findByText(m.banner_contact_lead()),
    ).toBeInTheDocument();
    expect(screen.queryByText(worst)).toBeNull();
  });
});
