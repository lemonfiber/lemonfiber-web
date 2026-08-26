import { render, screen, waitFor, within } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import { API_VERSION, type Fetching, type Sending } from "@lemonfiber/sdk-ts";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Console from "./Console.svelte";
import {
  chosenForm,
  declared,
  diagnosis,
  diskChecks,
  forms,
  household,
  job,
  moment,
  scrollback,
  stack,
  worst,
  worstService,
} from "./fixture";
import { nameOf } from "../lib/route";
import { namesItsForms, titleOfDoing, wordOfDoing } from "../lib/work";
import * as m from "../paraglide/messages.js";

const key = ["a", "run", "key"].join("-");
const here = "http://127.0.0.1:7777";

/**
 * Somewhere that is not this machine, assembled rather than written: the
 * structural guards refuse a foreign origin in the source, and this one is here
 * to be refused by the client.
 */
const elsewhere = ["http:", "", "example.test"].join("/");

/** One envelope, rendered as an endpoint renders it. */
const enveloped = (kind: string, data: unknown): string =>
  JSON.stringify({ api_version: API_VERSION, kind, data });

/** A transport that answers each reading with what that endpoint answers. */
const answering: Sending = (url) =>
  Promise.resolve({
    ok: true,
    status: 200,
    text: () =>
      Promise.resolve(
        url.includes("/api/forms")
          ? enveloped("forms", forms)
          : enveloped("status", stack),
      ),
  });

/** A transport that refuses the key this page is using. */
const refusing: Sending = () =>
  Promise.resolve({
    ok: false,
    status: 401,
    text: () => Promise.resolve(""),
  });

/** What lemonfiber says when it ran the request and its own answering failed. */
const engineDown = "The container engine is not running.";

/** A transport that answers every reading with that failure. */
const failing: Sending = () =>
  Promise.resolve({
    ok: false,
    status: 500,
    text: () => Promise.resolve(enveloped("error", { summary: engineDown })),
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

/** A wait that is over as soon as it begins, so a test answers at once. */
const atOnce = (): Promise<void> => Promise.resolve();

/** A wait that never ends, which parks the asking where a test wants it. */
const parked = (): Promise<void> => new Promise(() => undefined);

const console_ = (
  over: {
    sending?: Sending;
    fetching?: Fetching;
    at?: string;
    onrefused?: () => void;
    pausing?: () => Promise<void>;
  } = {},
): { unmount: () => void } => {
  const { unmount } = render(Console, {
    reaching: {
      at: over.at ?? here,
      token: key,
      sending: over.sending ?? answering,
      fetching: over.fetching ?? silent,
    },
    onrefused: over.onrefused ?? vi.fn(),
    pausing: over.pausing ?? parked,
  });
  return { unmount };
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
      await screen.findByRole("region", { name: m.panel_findings() }),
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
      await screen.findByRole("region", { name: m.panel_scrollback() }),
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

  it("opens on the disk where the address names it", async () => {
    globalThis.history.replaceState(undefined, "", "/storage");
    console_();
    expect(
      await screen.findByRole("region", { name: m.panel_disk_findings() }),
    ).toBeInTheDocument();
  });
});

/** What was asked of the write endpoints, in the order it was asked. */
interface Sent {
  /** The bodies the action endpoint was posted. */
  bodies: string[];
  /** The addresses a name was redeemed at. */
  redeemed: string[];
}

/** One reply, as a transport hands it over. */
interface Says {
  status: number;
  body: string;
}

/** Work the runtime took, as the action endpoint answers it. */
const accepted: Says = {
  status: 202,
  body: enveloped("job", { job, action: "up" }),
};

/** The work, finished, as the equivalent command renders it. */
const rendered: Says = {
  status: 200,
  body: enveloped("lifecycle", {
    action: "up",
    command: ["compose", "up", "-d"],
    profile: "core",
    condition: "active",
  }),
};

/** The work, still going, as asking about it answers. */
const going: Says = accepted;

/** What lemonfiber says about work that ran and stopped. */
const wentWrong = "The container engine is not running.";

/** The work, stopped, as the failure renders it. */
const failed: Says = {
  status: 500,
  body: enveloped("error", {
    code: "engine-absent",
    summary: wentWrong,
    meaning: "Nothing can be started until it is.",
    remedies: [],
    severity: "error",
    state: "actionable",
  }),
};

/** A name this run never handed out. */
const forgotten: Says = {
  status: 404,
  body: "No work in this run goes by that name.",
};

/**
 * A transport that reads like the stack, answers every action alike, and says
 * what became of the work each time it is asked.
 *
 * The reply to an action is fixed rather than looked up per action: what a test
 * is asking about is what the screen does with a reply rather than which reply
 * a name earns. What became of the work is a list, read one entry per asking and
 * holding at the last, so a test says how many times it has to be asked before
 * there is something to say.
 */
function acting(
  reply: Says,
  sent: Sent = { bodies: [], redeemed: [] },
  becoming: readonly Says[] = [rendered],
): Sending {
  let asked = 0;
  return (url, init) => {
    if (init.method === "POST") {
      sent.bodies.push(init.body ?? "");
      return Promise.resolve({
        ok: reply.status >= 200 && reply.status < 300,
        status: reply.status,
        text: () => Promise.resolve(reply.body),
      });
    }
    if (!url.includes("/api/jobs/")) return answering(url, init);

    sent.redeemed.push(url);
    const said = becoming[Math.min(asked, becoming.length - 1)] ?? going;
    asked += 1;
    return Promise.resolve({
      ok: said.status >= 200 && said.status < 300,
      status: said.status,
      text: () => Promise.resolve(said.body),
    });
  };
}

const press = (label: string): Promise<void> =>
  userEvent.click(screen.getByRole("button", { name: label }));

/** The region a question, a record and the wait's own line all sit in. */
const asked = (): HTMLElement =>
  screen.getByRole("status", { name: m.running_asked() });

/** Takes one form up, by the name its control is announced under. */
const choose = (id: string): Promise<void> => {
  const form = declared.find((one) => one.id === id);
  return press(m.forms_choose({ name: form?.name ?? "" }));
};

describe("the forms the stack declares", () => {
  beforeEach(() => {
    globalThis.history.replaceState(undefined, "", "/");
  });

  it("lists them, in the stack's own words", async () => {
    console_();

    for (const form of declared) {
      expect(await screen.findByText(form.description)).toBeInTheDocument();
    }
  });

  // Three actions have lost their subject without a form, and nothing this page
  // could read listed the forms before the listing existed.
  it("offers what needs a form only once one has been taken up", async () => {
    console_();
    await screen.findByText(declared[0]?.description ?? "");

    for (const doing of namesItsForms) {
      expect(
        screen.getByRole("button", { name: wordOfDoing(doing, false) }),
      ).toHaveAttribute("aria-disabled", "true");
    }

    await choose(chosenForm);

    for (const doing of namesItsForms) {
      expect(
        screen.getByRole("button", { name: wordOfDoing(doing, true) }),
      ).toHaveAttribute("aria-disabled", "false");
    }
  });
});

describe("asking lemonfiber to do something", () => {
  beforeEach(() => {
    globalThis.history.replaceState(undefined, "", "/");
  });

  it("asks for what costs nothing without asking about it first", async () => {
    const sent: Sent = { bodies: [], redeemed: [] };
    console_({ sending: acting(accepted, sent) });

    await press(wordOfDoing("up", false));

    expect(sent.bodies).toStrictEqual([JSON.stringify({ forms: [] })]);
  });

  // An argument the action's command has nowhere to put is refused rather than
  // dropped, so a body carrying one is a request that is never carried out.
  it("sends nothing at all for an action whose command takes no argument", async () => {
    const sent: Sent = { bodies: [], redeemed: [] };
    console_({ sending: acting(accepted, sent) });

    await press(wordOfDoing("seed", false));

    expect(sent.bodies).toStrictEqual(["{}"]);
  });

  it("names the forms that were taken up, to the actions that hold them", async () => {
    const sent: Sent = { bodies: [], redeemed: [] };
    console_({ sending: acting(accepted, sent) });
    await screen.findByText(declared[0]?.description ?? "");

    await choose(chosenForm);
    await press(wordOfDoing("restart", true));

    expect(sent.bodies).toStrictEqual([
      JSON.stringify({ forms: [chosenForm] }),
    ]);
  });

  it("names none of them again once one is put back down", async () => {
    const sent: Sent = { bodies: [], redeemed: [] };
    console_({ sending: acting(accepted, sent) });
    await screen.findByText(declared[0]?.description ?? "");

    await choose(chosenForm);
    await choose(chosenForm);
    await press(wordOfDoing("up", false));

    expect(sent.bodies).toStrictEqual([JSON.stringify({ forms: [] })]);
  });

  // The reply names the work and says nothing else about it. What is kept is
  // the record of having asked, which outlives the request the way the work
  // does.
  it("keeps the name the reply gave work the runtime is holding", async () => {
    console_({ sending: acting(accepted, undefined, [going]) });

    await press(wordOfDoing("up", false));

    expect(
      await screen.findByText(titleOfDoing("up", false)),
    ).toBeInTheDocument();
    expect(screen.getByText(new RegExp(job))).toBeInTheDocument();
  });

  it("puts a record away when it is asked to", async () => {
    console_({ sending: acting(accepted, undefined, [going]) });
    await press(wordOfDoing("up", false));
    await screen.findByText(titleOfDoing("up", false));

    await press(m.action_hide_record());

    expect(screen.queryByText(titleOfDoing("up", false))).toBeNull();
  });
});

describe("asking for something costly", () => {
  beforeEach(() => {
    globalThis.history.replaceState(undefined, "", "/");
  });

  it("asks what it costs before anything is sent", async () => {
    const sent: Sent = { bodies: [], redeemed: [] };
    console_({ sending: acting(accepted, sent) });

    await press(wordOfDoing("down", false));

    expect(await screen.findByText(m.confirm_stop_title())).toBeInTheDocument();
    expect(sent.bodies).toStrictEqual([]);
  });

  // lemonfiber's own command takes no agreement for a teardown, and a field it
  // has nowhere to put is refused rather than dropped. So the question is this
  // screen's to ask and nothing travels with the answer.
  it("sends no agreement with an action whose command carries none", async () => {
    const sent: Sent = { bodies: [], redeemed: [] };
    console_({ sending: acting(accepted, sent) });

    await press(wordOfDoing("down", false));
    await press(m.action_stop_everything());

    expect(sent.bodies).toStrictEqual([JSON.stringify({ forms: [] })]);
  });

  it("sends nothing at all when the answer is no", async () => {
    const sent: Sent = { bodies: [], redeemed: [] };
    console_({ sending: acting(accepted, sent) });

    await press(wordOfDoing("down", false));
    await press(m.action_leave_running());

    expect(screen.queryByText(m.confirm_stop_title())).toBeNull();
    expect(sent.bodies).toStrictEqual([]);
  });

  // A question standing over a set that has since changed is a question about
  // something else, and answering it would send the request nobody asked for.
  it("withdraws the question when what it was about changes", async () => {
    const sent: Sent = { bodies: [], redeemed: [] };
    console_({ sending: acting(accepted, sent) });
    await screen.findByText(declared[0]?.description ?? "");

    await choose(chosenForm);
    await press(wordOfDoing("down", true));
    await screen.findByText(m.confirm_stop_chosen_title());
    await choose(chosenForm);

    expect(screen.queryByText(m.confirm_stop_chosen_title())).toBeNull();
    expect(sent.bodies).toStrictEqual([]);
  });

  it("asks about what it will actually stop", async () => {
    console_({ sending: acting(accepted) });
    await screen.findByText(declared[0]?.description ?? "");

    await choose(chosenForm);
    await press(wordOfDoing("down", true));

    expect(
      await screen.findByText(m.confirm_stop_chosen_title()),
    ).toBeInTheDocument();
  });
});

describe("what became of the work", () => {
  beforeEach(() => {
    globalThis.history.replaceState(undefined, "", "/");
  });

  it("says it finished, rather than going on saying it was taken on", async () => {
    console_({ sending: acting(accepted, undefined, [rendered]) });

    await press(wordOfDoing("up", false));

    expect(await screen.findByText(m.eyebrow_finished())).toBeInTheDocument();
    expect(screen.queryByText(m.eyebrow_taken_on())).toBeNull();
  });

  it("says what stopped it, in the words the failure rendered", async () => {
    console_({ sending: acting(accepted, undefined, [failed]) });

    await press(wordOfDoing("up", false));

    expect(await screen.findByText(wentWrong)).toBeInTheDocument();
  });

  // Nothing carries a job across a restart, so answering "still going" for a
  // name nothing knows would leave a reader waiting on an outcome that is
  // never coming.
  it("says a name this run no longer knows is gone, not unfinished", async () => {
    console_({ sending: acting(accepted, undefined, [forgotten]) });

    await press(wordOfDoing("up", false));

    expect(await screen.findByText(m.eyebrow_forgotten())).toBeInTheDocument();
  });

  // The work may be running perfectly well; it is the asking that stopped.
  it("says it lost the thread when it cannot ask at all", async () => {
    const sending: Sending = (url, init) =>
      url.includes("/api/jobs/")
        ? Promise.reject(new Error("no route"))
        : acting(accepted)(url, init);
    console_({ sending });

    await press(wordOfDoing("up", false));

    expect(await screen.findByText(m.eyebrow_lost_track())).toBeInTheDocument();
  });

  // A record is one request among several, and an outcome that arrived for one
  // of them says nothing about the rest.
  it("leaves the other records where they were", async () => {
    console_({ sending: acting(accepted, undefined, [going, rendered]) });

    await press(wordOfDoing("up", false));
    await press(wordOfDoing("seed", false));

    expect(await screen.findByText(m.eyebrow_finished())).toBeInTheDocument();
    expect(screen.getByText(m.eyebrow_taken_on())).toBeInTheDocument();
    expect(screen.getByText(titleOfDoing("up", false))).toBeInTheDocument();
  });

  it("asks again until there is something to say", async () => {
    const sent: Sent = { bodies: [], redeemed: [] };
    console_({
      sending: acting(accepted, sent, [going, going, rendered]),
      pausing: atOnce,
    });

    await press(wordOfDoing("up", false));

    expect(await screen.findByText(m.eyebrow_finished())).toBeInTheDocument();
    expect(sent.redeemed).toHaveLength(3);
  });

  // A record nobody is looking at is not a reason to keep asking lemonfiber
  // anything.
  it("stops asking once the record is put away", async () => {
    const sent: Sent = { bodies: [], redeemed: [] };
    let go = (): void => undefined;
    const held = (): Promise<void> =>
      new Promise((resolve) => {
        go = () => {
          resolve();
        };
      });
    console_({ sending: acting(accepted, sent, [going]), pausing: held });

    await press(wordOfDoing("up", false));
    await screen.findByText(titleOfDoing("up", false));
    await press(m.action_hide_record());
    go();
    await settle();

    expect(sent.redeemed).toHaveLength(1);
  });

  it("stops asking once the screen is put away", async () => {
    const sent: Sent = { bodies: [], redeemed: [] };
    let go = (): void => undefined;
    const held = (): Promise<void> =>
      new Promise((resolve) => {
        go = () => {
          resolve();
        };
      });
    const screening = console_({
      sending: acting(accepted, sent, [going]),
      pausing: held,
    });

    await press(wordOfDoing("up", false));
    await screen.findByText(titleOfDoing("up", false));
    screening.unmount();
    go();
    await settle();

    expect(sent.redeemed).toHaveLength(1);
  });

  // A key is minted once a run, so an asking refused is a page holding a key
  // from a run that has ended.
  it("forgets the key when the asking is turned away", async () => {
    const refused = vi.fn();
    console_({
      sending: acting(accepted, undefined, [{ status: 403, body: "" }]),
      onrefused: refused,
    });

    await press(wordOfDoing("up", false));

    await waitFor(() => {
      expect(refused).toHaveBeenCalled();
    });
  });
});

describe("when lemonfiber will not do what was asked", () => {
  beforeEach(() => {
    globalThis.history.replaceState(undefined, "", "/");
  });

  it("says what lemonfiber said, not the status it said it with", async () => {
    const said = "The action `up` needs `forms`, which was not given.";
    console_({ sending: acting({ status: 400, body: said }) });

    await press(wordOfDoing("up", false));

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

    await press(wordOfDoing("up", false));

    await waitFor(() => {
      expect(refused).toHaveBeenCalled();
    });
    expect(screen.queryByText(titleOfDoing("up", false))).toBeNull();
  });

  it("records work that finished while the request was open", async () => {
    console_({
      sending: acting({ status: 200, body: enveloped("quality", {}) }),
    });

    await press(wordOfDoing("up", false));

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

/**
 * A transport that answers each read with what that endpoint answers.
 *
 * The scrollback is the one that is not one document: it is answered the way
 * the endpoint answers it, one envelope to a line.
 */
const readings: Sending = (url) => {
  const said = (body: string) =>
    Promise.resolve({
      ok: true,
      status: 200,
      text: () => Promise.resolve(body),
    });

  if (url.includes("/api/forms")) return said(enveloped("forms", forms));
  if (url.includes("/api/checks")) return said(enveloped("doctor", diagnosis));
  if (url.includes("/api/storage"))
    return said(enveloped("doctor", diskChecks));
  if (url.includes("/api/requests")) {
    return said(enveloped("household", household));
  }
  if (url.includes("/api/logs")) {
    return said(
      scrollback.map((line) => `${enveloped("log", line)}\n`).join(""),
    );
  }
  return said(enveloped("status", stack));
};

/**
 * A transport that answers the checks and leaves the requests hanging.
 *
 * A stamp dropped on the way in is only there to be read while the place being
 * arrived at has not answered yet.
 */
const unanswered: Sending = (url, init) => {
  if (url.includes("/api/requests")) return new Promise(() => undefined);
  return readings(url, init);
};

/** Go where the menu leads, and wait for what is there. */
const goTo = async (place: Parameters<typeof nameOf>[0]): Promise<void> => {
  await userEvent.click(
    screen.getByRole("link", { name: new RegExp(nameOf(place)) }),
  );
};

describe("what each place is drawn from", () => {
  beforeEach(() => {
    globalThis.history.replaceState(undefined, "", "/");
  });

  it("draws the checks from the run they answer with", async () => {
    console_({ sending: readings });
    await goTo("checks");

    expect(
      await screen.findByRole("heading", {
        name: "Every service is answering its own health check",
      }),
    ).toBeInTheDocument();
  });

  it("draws the disk from the checks about it", async () => {
    console_({ sending: readings });
    await goTo("storage");

    expect(
      await screen.findByRole("heading", {
        name: "Downloads and the library are on one filesystem",
      }),
    ).toBeInTheDocument();
  });

  // The scrollback is answered one envelope to a line, which a whole-body parse
  // reads as malformed the moment there is more than one of them.
  it("draws every line the scrollback answered with", async () => {
    console_({ sending: readings });
    await goTo("logs");

    expect(
      await screen.findByText("calibre-web-automated"),
    ).toBeInTheDocument();

    const panel = screen.getByRole("region", { name: m.panel_scrollback() });
    expect(within(panel).getAllByRole("listitem")).toHaveLength(
      scrollback.length,
    );
  });

  it("draws what the household asked for", async () => {
    console_({ sending: readings });
    await goTo("requests");

    expect(await screen.findByText("The Expanse")).toBeInTheDocument();
  });

  // A stamp says when the reading behind the screen being read answered, and
  // the one left behind by the screen before it would date this one by another
  // screen's clock.
  it("drops the stamp on the way into a place", async () => {
    console_({ sending: unanswered });
    await goTo("checks");
    await screen.findByText(
      m.fresh_answered({ span: m.span_seconds({ count: 0 }) }),
    );

    await goTo("requests");

    expect(screen.getByText(m.fresh_never())).toBeInTheDocument();
  });

  it("says so when a place is asked for with a key this run refuses", async () => {
    const refused = vi.fn();
    console_({ sending: refusing, onrefused: refused });
    await goTo("logs");

    await waitFor(() => {
      expect(refused).toHaveBeenCalled();
    });
  });
});

// A control removed under a reader's own focus drops that focus to the document.
// Nothing is announced there, the next tab starts at the top of the page, and
// the row that answered the press is what they were reaching for. The panel
// silences a control that can do nothing rather than taking it away for exactly
// this reason; these four take their own row with them and cannot be silenced.
describe("where the reader is left when a row goes away", () => {
  const said = "Still starting: sonarr, radarr — 25 seconds so far, of 180.";

  beforeEach(() => {
    globalThis.history.replaceState(undefined, "", "/");
  });

  it("stands them in the region the record was in", async () => {
    console_({ sending: acting(accepted, undefined, [going]) });
    await press(wordOfDoing("up", false));
    await screen.findByText(titleOfDoing("up", false));

    await press(m.action_hide_record());

    expect(screen.queryByText(titleOfDoing("up", false))).toBeNull();
    expect(asked()).toHaveFocus();
  });

  it("stands them there when the costly question is answered yes", async () => {
    console_({ sending: acting(accepted, undefined, [going]) });
    await press(wordOfDoing("down", false));
    await screen.findByText(m.confirm_stop_title());

    await press(m.action_stop_everything());

    expect(screen.queryByText(m.confirm_stop_title())).toBeNull();
    expect(asked()).toHaveFocus();
  });

  it("stands them there when it is answered no", async () => {
    console_({ sending: acting(accepted) });
    await press(wordOfDoing("down", false));
    await screen.findByText(m.confirm_stop_title());

    await press(m.action_leave_running());

    expect(screen.queryByText(m.confirm_stop_title())).toBeNull();
    expect(asked()).toHaveFocus();
  });

  it("stands them there when the wait's own line is put away", async () => {
    console_({ fetching: saying([framed("start", said)]) });
    await screen.findByText(said);

    await press(m.action_hide_line());

    expect(screen.queryByText(said)).toBeNull();
    expect(asked()).toHaveFocus();
  });
});
