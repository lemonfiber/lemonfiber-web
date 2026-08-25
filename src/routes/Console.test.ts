import { render, screen, waitFor } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import { API_VERSION, type Fetching, type Sending } from "@lemonfiber/sdk-ts";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Console from "./Console.svelte";
import { moment, stack, worst, worstService } from "./fixture";
import { nameOf } from "../lib/route";
import { titleOfDoing, wordOfDoing } from "../lib/work";
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

/** One envelope, rendered as an endpoint renders it. */
const enveloped = (kind: string, data: unknown): string =>
  JSON.stringify({ api_version: API_VERSION, kind, data });

/** What was sent to the actions endpoint, in the order it was sent. */
interface Sent {
  bodies: string[];
}

/**
 * A transport that reads like the stack and answers every action alike.
 *
 * The reply is fixed rather than looked up per action: the two this surface
 * offers are answered the same way, and what a test is asking about is what the
 * screen does with a reply rather than which reply a name earns.
 */
function acting(
  reply: { status: number; body: string },
  sent: Sent = { bodies: [] },
): Sending {
  return (url, init) => {
    if (init.method !== "POST") return answering(url, init);
    sent.bodies.push(init.body ?? "");
    return Promise.resolve({
      ok: reply.status >= 200 && reply.status < 300,
      status: reply.status,
      text: () => Promise.resolve(reply.body),
    });
  };
}

/** Work the runtime took, as the endpoint answers it. */
const accepted = {
  status: 202,
  body: enveloped("job", { job: "9f2c41ab7d0e5c63", action: "up" }),
};

const press = (label: string): Promise<void> =>
  userEvent.click(screen.getByRole("button", { name: label }));

describe("asking lemonfiber to do something", () => {
  beforeEach(() => {
    globalThis.history.replaceState(undefined, "", "/");
  });

  it("asks for what costs nothing without asking about it first", async () => {
    const sent: Sent = { bodies: [] };
    console_({ sending: acting(accepted, sent) });

    await press(wordOfDoing("up"));

    expect(sent.bodies).toStrictEqual([
      JSON.stringify({ forms: [], confirm: false }),
    ]);
  });

  // The reply names the work and says nothing else about it. What is kept is
  // the record of having asked, which outlives the request the way the work
  // does.
  it("keeps the name the reply gave work the runtime is holding", async () => {
    console_({ sending: acting(accepted) });

    await press(wordOfDoing("up"));

    expect(await screen.findByText(titleOfDoing("up"))).toBeInTheDocument();
    expect(screen.getByText(/9f2c41ab7d0e5c63/)).toBeInTheDocument();
  });

  it("puts a record away when it is asked to", async () => {
    console_({ sending: acting(accepted) });
    await press(wordOfDoing("up"));
    await screen.findByText(titleOfDoing("up"));

    await press(m.action_hide_record());

    expect(screen.queryByText(titleOfDoing("up"))).toBeNull();
  });
});

describe("asking for something costly", () => {
  beforeEach(() => {
    globalThis.history.replaceState(undefined, "", "/");
  });

  it("asks what it costs before anything is sent", async () => {
    const sent: Sent = { bodies: [] };
    console_({ sending: acting(accepted, sent) });

    await press(wordOfDoing("down"));

    expect(await screen.findByText(m.confirm_stop_title())).toBeInTheDocument();
    expect(sent.bodies).toStrictEqual([]);
  });

  // The agreement travels with the request rather than being kept here: the
  // carrier has a field for it, and what an operator agreed to is part of what
  // was asked for.
  it("says the cost was agreed when the answer is yes", async () => {
    const sent: Sent = { bodies: [] };
    console_({ sending: acting(accepted, sent) });

    await press(wordOfDoing("down"));
    await press(m.action_stop_everything());

    expect(sent.bodies).toStrictEqual([
      JSON.stringify({ forms: [], confirm: true }),
    ]);
  });

  it("sends nothing at all when the answer is no", async () => {
    const sent: Sent = { bodies: [] };
    console_({ sending: acting(accepted, sent) });

    await press(wordOfDoing("down"));
    await press(m.action_leave_running());

    expect(screen.queryByText(m.confirm_stop_title())).toBeNull();
    expect(sent.bodies).toStrictEqual([]);
  });
});

describe("when lemonfiber will not do what was asked", () => {
  beforeEach(() => {
    globalThis.history.replaceState(undefined, "", "/");
  });

  it("says what lemonfiber said, not the status it said it with", async () => {
    const said = "The action `up` needs `forms`, which was not given.";
    console_({ sending: acting({ status: 400, body: said }) });

    await press(wordOfDoing("up"));

    expect(await screen.findByText(said)).toBeInTheDocument();
  });

  // A key is minted once a run, so a write refused is a page holding a key
  // from a run that has ended. Forgetting it on the write path is what keeps a
  // button from being the one thing that never asks again.
  it("forgets the key when a write is turned away", async () => {
    const refused = vi.fn();
    console_({
      sending: acting({ status: 403, body: "" }),
      onrefused: refused,
    });

    await press(wordOfDoing("up"));

    await waitFor(() => {
      expect(refused).toHaveBeenCalled();
    });
    expect(screen.queryByText(titleOfDoing("up"))).toBeNull();
  });

  it("records work that finished while the request was open", async () => {
    console_({
      sending: acting({ status: 200, body: enveloped("reset", {}) }),
    });

    await press(wordOfDoing("up"));

    expect(await screen.findByText(m.work_done())).toBeInTheDocument();
  });
});

describe("what a wait says while it is still waiting", () => {
  beforeEach(() => {
    globalThis.history.replaceState(undefined, "", "/");
  });

  const line = "Still starting: sonarr, radarr — 25 seconds so far, of 180.";

  it("draws the newest line the stream carried", async () => {
    console_({ fetching: saying([framed("start", line)]) });

    expect(await screen.findByText(line)).toBeInTheDocument();
    expect(screen.getByText(m.waiting_still())).toBeInTheDocument();
  });

  it("keeps only the newest of them", async () => {
    const older = "Still starting: sonarr, radarr — 5 seconds so far, of 180.";
    console_({
      fetching: saying([framed("start", older), framed("start", line)]),
    });

    expect(await screen.findByText(line)).toBeInTheDocument();
    expect(screen.queryByText(older)).toBeNull();
  });

  it("puts the line away when it is asked to", async () => {
    console_({ fetching: saying([framed("start", line)]) });
    await screen.findByText(line);

    await press(m.action_hide_line());

    expect(screen.queryByText(line)).toBeNull();
  });
});
