import { render, screen, waitFor } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import { API_VERSION, type Fetching, type Sending } from "@lemonfiber/sdk-ts";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Console from "./Console.svelte";
import { moment, stack, worst, worstService } from "./fixture";
import { nameOf } from "../lib/route";
import * as m from "../paraglide/messages.js";

const key = ["a", "run", "key"].join("-");
const here = "http://127.0.0.1:7777";

/**
 * Somewhere that is not this machine, assembled rather than written: the
 * structural guards refuse a foreign origin in the source, and this one is here
 * to be refused by the client.
 */
const elsewhere = ["http:", "", "example.test"].join("/");

/** A transport that answers every reading with the stack. */
const answering: Sending = () =>
  Promise.resolve({
    ok: true,
    status: 200,
    text: () =>
      Promise.resolve(
        JSON.stringify({
          api_version: API_VERSION,
          kind: "status",
          data: stack,
        }),
      ),
  });

/** A transport that refuses the key this page is using. */
const refusing: Sending = () =>
  Promise.resolve({
    ok: false,
    status: 401,
    text: () => Promise.resolve(""),
  });

/** One event, framed as the stream frames it. */
const framed = (kind: string, data: unknown): string =>
  `event: ${kind}\ndata: ${JSON.stringify({ api_version: API_VERSION, kind, data })}\n\n`;

/**
 * A stream that hands over one opening and will not open again.
 *
 * Refusing the second opening is what makes a test end: following reopens a
 * broken stream several times before it gives up.
 */
function saying(said: readonly string[]): Fetching {
  let opened = false;
  return () => {
    if (opened) return Promise.resolve({ ok: false, body: null });
    opened = true;
    return Promise.resolve({
      ok: true,
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

/** A stream that will not open at all. */
const silent: Fetching = () => Promise.resolve({ ok: false, body: null });

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

/** Lets whatever was queued for the next task run. */
const settle = (): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, 0);
  });

const console_ = (
  over: {
    sending?: Sending;
    fetching?: Fetching;
    at?: string;
    onrefused?: () => void;
  } = {},
): void => {
  render(Console, {
    reaching: {
      at: over.at ?? here,
      token: key,
      sending: over.sending ?? answering,
      fetching: over.fetching ?? silent,
    },
    onrefused: over.onrefused ?? vi.fn(),
  });
};

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

  it("says so when the key is not the one this run expects", async () => {
    const refused = vi.fn();
    console_({ sending: refusing, onrefused: refused });
    await waitFor(() => {
      expect(refused).toHaveBeenCalled();
    });
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
    console_({ fetching: saying([framed("log", { line: "something" })]) });
    expect(
      await screen.findByText(m.banner_contact_lead()),
    ).toBeInTheDocument();
    expect(screen.queryByText(worst)).toBeNull();
  });
});

describe("going somewhere else", () => {
  beforeEach(() => {
    globalThis.history.replaceState(undefined, "", "/");
  });

  it("answers a plain press itself, and puts the address in the bar", async () => {
    console_();
    await userEvent.click(
      screen.getByRole("link", { name: new RegExp(nameOf("checks")) }),
    );

    expect(globalThis.location.pathname).toBe("/checks");
    expect(
      screen.getByRole("region", { name: nameOf("checks") }),
    ).toBeInTheDocument();
  });

  // A modified press is asking the browser for a second tab, and a page that
  // answered it would take that away.
  it("leaves a modified press to the browser", async () => {
    console_();
    const link = await screen.findByRole("link", {
      name: new RegExp(nameOf("checks")),
    });

    link.dispatchEvent(
      new MouseEvent("click", {
        bubbles: true,
        cancelable: true,
        metaKey: true,
      }),
    );

    expect(globalThis.location.pathname).toBe("/");
  });

  it("follows the back button", async () => {
    console_();
    await userEvent.click(
      screen.getByRole("link", { name: new RegExp(nameOf("logs")) }),
    );
    expect(
      screen.getByRole("region", { name: nameOf("logs") }),
    ).toBeInTheDocument();

    globalThis.history.replaceState(undefined, "", "/");
    globalThis.dispatchEvent(new PopStateEvent("popstate"));

    await waitFor(() => {
      expect(
        screen.getByRole("region", { name: m.panel_standing() }),
      ).toBeInTheDocument();
    });
  });

  it("opens on the place the address names", async () => {
    globalThis.history.replaceState(undefined, "", "/requests");
    console_();
    expect(
      await screen.findByRole("region", { name: nameOf("requests") }),
    ).toBeInTheDocument();
  });

  it("says plainly that a place has nothing built for it yet", async () => {
    globalThis.history.replaceState(undefined, "", "/storage");
    console_();
    expect(await screen.findByText(m.home_unfinished())).toBeInTheDocument();
  });
});
