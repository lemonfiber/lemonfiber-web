import {
  API_VERSION,
  malformed,
  TOKEN_HEADER,
  unreachable,
  type Fetching,
  type Sending,
} from "@lemonfiber/sdk-ts";
import { describe, expect, it, vi } from "vitest";
import { acting, type Arguments } from "./acting";
import type { Reaching } from "./asking";

const key = ["a", "run", "key"].join("-");
const here = "http://127.0.0.1:7777";

/**
 * Somewhere that is not this machine, assembled rather than written: the
 * structural guards refuse a foreign origin in the source, and this one is here
 * to be refused by the client.
 */
const elsewhere = ["http:", "", "example.test"].join("/");

/** The stream is never opened from here, so nothing needs to answer it. */
const fetching: Fetching = () => Promise.resolve({ ok: true, body: null });

/** Whatever this reply is, said as the transport hands it over. */
const saying = (status: number, body: string): Sending =>
  vi.fn(() =>
    Promise.resolve({
      ok: status >= 200 && status < 300,
      status,
      text: () => Promise.resolve(body),
    }),
  );

/** One envelope, rendered as the server renders it. */
const enveloped = (kind: string, data: unknown): string =>
  JSON.stringify({ api_version: API_VERSION, kind, data });

/** What a reverse proxy in front of lemonfiber answers with when it cannot. */
const proxyPage = [
  "<html>",
  "<head><title>502 Bad Gateway</title></head>",
  "<body><center><h1>502 Bad Gateway</h1></center></body>",
  "</html>",
].join("\n");

const asking = (over: { at?: string; sending: Sending }): Reaching => ({
  at: over.at ?? here,
  token: key,
  sending: over.sending,
  fetching,
});

const nothing: Arguments = { forms: [] };

/** An action whose command has no field for a form takes no argument at all. */
const bare: Arguments = {};

describe("asking for an action", () => {
  it("asks at the action's own address, carrying the key in a header", async () => {
    const sending = saying(202, enveloped("job", { job: "abc", action: "up" }));

    await acting(asking({ sending }), "up", { forms: ["media"] });

    expect(sending).toHaveBeenCalledWith(
      `${here}/api/actions/up`,
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ [TOKEN_HEADER]: key }) as unknown,
        body: JSON.stringify({ forms: ["media"] }),
      }),
    );
  });

  // A field the named action's command has nowhere to put is refused rather
  // than dropped, so a body carrying one is a request that is never carried
  // out at all.
  it("sends a body holding nothing for an action that takes no argument", async () => {
    const sending = saying(
      202,
      enveloped("job", { job: "abc", action: "seed" }),
    );

    await acting(asking({ sending }), "seed", bare);

    expect(sending).toHaveBeenCalledWith(
      `${here}/api/actions/seed`,
      expect.objectContaining({ body: "{}" }),
    );
  });

  it("refuses an address that is not this machine, in the client's words", async () => {
    const sending = saying(200, "");

    const came = await acting(
      asking({ at: elsewhere, sending }),
      "up",
      nothing,
    );

    expect(came.at).toBe("declined");
    expect(sending).not.toHaveBeenCalled();
  });
});

describe("when the work outlives the request", () => {
  it("keeps the name the reply gave the work", async () => {
    const came = await acting(
      asking({
        sending: saying(202, enveloped("job", { job: "9f2c", action: "up" })),
      }),
      "up",
      nothing,
    );

    expect(came).toStrictEqual({ at: "started", job: "9f2c" });
  });

  it("will not take a reply that accepts work without naming it", async () => {
    const came = await acting(
      asking({ sending: saying(202, enveloped("status", { services: [] })) }),
      "up",
      nothing,
    );

    expect(came).toStrictEqual({ at: "declined", said: malformed().message });
  });
});

describe("when the work had finished before the reply", () => {
  it("says so rather than inventing a name for work nothing is doing", async () => {
    const came = await acting(
      asking({
        sending: saying(200, enveloped("quality", { confirmed: true })),
      }),
      "quality-reapply",
      nothing,
    );

    expect(came).toStrictEqual({ at: "settled" });
  });
});

describe("when lemonfiber will not do it", () => {
  it("carries the sentence it said, not the status it said it with", async () => {
    const said = "The action `restart` needs `forms`, which was not given.";

    const came = await acting(
      asking({ sending: saying(400, said) }),
      "restart",
      nothing,
    );

    expect(came).toStrictEqual({ at: "declined", said });
  });

  it("reads the problem envelope a command that failed renders", async () => {
    const summary = "The container engine is not running.";
    const body = enveloped("error", {
      code: "engine-absent",
      summary,
      meaning: "Nothing can be started until it is.",
      remedies: [],
      severity: "error",
      state: "actionable",
    });

    const came = await acting(
      asking({ sending: saying(500, body) }),
      "up",
      nothing,
    );

    expect(came).toStrictEqual({ at: "declined", said: summary });
  });

  it("says something of its own where the refusal carried no words", async () => {
    const came = await acting(
      asking({ sending: saying(400, "   ") }),
      "up",
      nothing,
    );

    expect(came).toStrictEqual({
      at: "declined",
      said: unreachable().message,
    });
  });
});

// Whatever stands between this page and lemonfiber answers in its own words,
// under a status of its own choosing. Rendering that as lemonfiber's sentence
// puts a proxy's page, or a bare document, where an operator reads what
// lemonfiber said.
describe("when the reply did not come from lemonfiber", () => {
  it.each([
    ["a page from whatever answered instead", proxyPage],
    ["a document that is not an envelope", '{"detail":"forbidden"}'],
    [
      "an envelope whose sentence is not one",
      enveloped("error", { code: "engine-absent", summary: { text: "no" } }),
    ],
    [
      "an envelope carrying no sentence at all",
      enveloped("error", { code: "engine-absent", summary: null }),
    ],
  ])("says lemonfiber is not answering for %s", async (_what, body) => {
    const came = await acting(
      asking({ sending: saying(502, body) }),
      "up",
      nothing,
    );

    expect(came).toStrictEqual({
      at: "declined",
      said: unreachable().message,
    });
  });
});

describe("when the key is not this run's", () => {
  // The page holds a key a run has ended with, and no retry can help. Saying so
  // apart from every other refusal is what lets the page forget it and ask.
  //
  // 403 is what lemonfiber answers with and 401 is what something in front of it
  // may answer with instead, and both mean the same thing to whoever is reading.
  it.each([401, 403])(
    "says a %s was turned away rather than that lemonfiber said no",
    async (status) => {
      const came = await acting(
        asking({ sending: saying(status, "") }),
        "down",
        nothing,
      );

      expect(came).toStrictEqual({ at: "turned-away" });
    },
  );
});

describe("when the reply cannot be read at all", () => {
  it("says lemonfiber is not answering where nothing came back", async () => {
    const sending: Sending = () => Promise.reject(new Error("no route"));

    const came = await acting(asking({ sending }), "up", nothing);

    expect(came).toStrictEqual({
      at: "declined",
      said: unreachable().message,
    });
  });

  it("refuses a body that is not an envelope", async () => {
    const came = await acting(
      asking({ sending: saying(200, "not json") }),
      "up",
      nothing,
    );

    expect(came).toStrictEqual({ at: "declined", said: malformed().message });
  });
});
