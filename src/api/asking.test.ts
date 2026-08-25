import { API_VERSION, type Fetching, type Sending } from "@lemonfiber/sdk-ts";
import { describe, expect, it } from "vitest";
import { asked, scrollback, turnedAway, watching } from "./asking";
import { stack } from "../routes/fixture";

const key = ["a", "run", "key"].join("-");
const here = "http://127.0.0.1:7777";

/**
 * Somewhere that is not this machine, assembled rather than written: the
 * structural guards refuse a foreign origin in the source, and this one is here
 * to be refused by the client.
 */
const elsewhere = ["http:", "", "example.test"].join("/");

/** One answer, as the binary would render it. */
const enveloped = (kind: string, data: unknown): string =>
  JSON.stringify({ api_version: API_VERSION, kind, data });

/** A transport that answers every request with the same body. */
const answering = (body: string, ok = true, status = 200): Sending => {
  return () =>
    Promise.resolve({ ok, status, text: () => Promise.resolve(body) });
};

/** A transport that hands over one opening of the stream and ends it. */
const streaming = (said: readonly string[]): Fetching => {
  return () =>
    Promise.resolve({
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

const unreachable: Fetching = () => Promise.reject(new Error("nothing there"));

const reaching = (sending: Sending, fetching: Fetching = unreachable) => ({
  at: here,
  token: key,
  sending,
  fetching,
});

describe("asked", () => {
  it("gives back the payload the kind it names carries", async () => {
    const got = await asked(
      reaching(answering(enveloped("status", stack))),
      "status",
      "status",
    );

    expect(got).toEqual({ ok: true, value: stack });
  });

  // A client is configured with the address the binary printed. One anywhere
  // else is a name that has been pointed off this machine.
  it("refuses an address that is not on this machine", async () => {
    const got = await asked(
      { ...reaching(answering("{}")), at: elsewhere },
      "status",
      "status",
    );

    expect(got).toMatchObject({ ok: false, problem: { kind: "refused" } });
  });

  it("says plainly when the key is not the one this run expects", async () => {
    const got = await asked(
      reaching(answering("", false, 401)),
      "status",
      "status",
    );

    expect(got).toMatchObject({ ok: false, problem: { kind: "refused" } });
  });

  // Reading a payload under the wrong kind is fields with changed meanings.
  it("refuses an envelope calling itself something else", async () => {
    const got = await asked(
      reaching(answering(enveloped("doctor", stack))),
      "status",
      "status",
    );

    expect(got).toMatchObject({ ok: false, problem: { kind: "malformed" } });
  });
});

describe("watching", () => {
  it("refuses to listen anywhere but this machine", () => {
    const got = watching(
      { ...reaching(answering("{}")), at: elsewhere },
      new AbortController().signal,
    );

    expect(got).toMatchObject({ ok: false, problem: { kind: "refused" } });
  });

  it("hands over what the stream said", async () => {
    const said = `event: dashboard\ndata: ${enveloped("dashboard", { telemetry: "live" })}\n\n`;
    const got = watching(
      reaching(answering("{}"), streaming([said])),
      new AbortController().signal,
    );

    expect(got.ok).toBe(true);
    if (!got.ok) return;

    const first = await got.arrivals.next();
    expect(first.value).toMatchObject({ at: "live", kind: "dashboard" });
    await got.arrivals.return(undefined);
  });
});

describe("turnedAway", () => {
  it("is true when any answer says the key is wrong", async () => {
    const refused = await asked(
      reaching(answering("", false, 401)),
      "status",
      "status",
    );
    const fine = await asked(
      reaching(answering(enveloped("status", stack))),
      "status",
      "status",
    );

    expect(turnedAway(fine, refused)).toBe(true);
  });

  it("is false when nothing was refused", async () => {
    const fine = await asked(
      reaching(answering(enveloped("status", stack))),
      "status",
      "status",
    );

    expect(turnedAway(fine)).toBe(false);
  });
});

/** One line of one service's output, as the endpoint renders it. */
const spoke = (service: string, line: string): string =>
  `${enveloped("log", { service, stream: "stdout", line })}\n`;

/** A transport that will not answer at all. */
const throwing: Sending = () => Promise.reject(new Error("nothing there"));

describe("scrollback", () => {
  // The endpoint answers one envelope per line rather than one document, which
  // is what a whole-body parse reads as malformed the moment there is more than
  // one line — and the moment there are none.
  it("reads every line the body carried", async () => {
    const got = await scrollback(
      reaching(
        answering(spoke("sonarr", "grabbed something") + spoke("radarr", "up")),
      ),
    );

    expect(got).toEqual({
      ok: true,
      value: [
        { service: "sonarr", stream: "stdout", line: "grabbed something" },
        { service: "radarr", stream: "stdout", line: "up" },
      ],
    });
  });

  it("reads a stack that has said nothing as a stack that has said nothing", async () => {
    expect(await scrollback(reaching(answering("")))).toEqual({
      ok: true,
      value: [],
    });
  });

  it("passes over the blank between one line and the next", async () => {
    const got = await scrollback(
      reaching(answering(`\n${spoke("sonarr", "up")}\n\n`)),
    );

    expect(got).toMatchObject({ ok: true });
  });

  it("refuses an address that is not on this machine", async () => {
    const got = await scrollback({
      ...reaching(answering("")),
      at: elsewhere,
    });

    expect(got).toMatchObject({ ok: false, problem: { kind: "refused" } });
  });

  // A page holding no key at all has nothing to ask with, and asking anyway
  // would spend a request finding that out.
  it("refuses an empty key without asking", async () => {
    const got = await scrollback({ ...reaching(answering("")), token: "  " });

    expect(got).toMatchObject({ ok: false, problem: { kind: "refused" } });
  });

  it("says lemonfiber is not answering where nothing answers", async () => {
    expect(await scrollback(reaching(throwing))).toMatchObject({
      ok: false,
      problem: { kind: "unreachable" },
    });
  });

  it.each([401, 403])("reads a %s as the key being refused", async (status) => {
    const got = await scrollback(reaching(answering("", false, status)));

    expect(got).toMatchObject({ ok: false, problem: { kind: "refused" } });
  });

  // A command that ran and failed is answered with an `error` envelope carrying
  // one plain sentence, and that sentence is the whole of what an operator can
  // act on.
  it("hands on the sentence lemonfiber failed with", async () => {
    const said = "The container engine is not running.";
    const got = await scrollback(
      reaching(answering(enveloped("error", { summary: said }), false, 500)),
    );

    expect(got).toMatchObject({
      ok: false,
      problem: { kind: "refused", message: said },
    });
  });

  it.each([
    ["a body it cannot read", ""],
    ["an envelope of another kind", enveloped("status", stack)],
    ["an error that carries no sentence", enveloped("error", {})],
    ["an error whose sentence is blank", enveloped("error", { summary: " " })],
  ])("reads a failure with %s as lemonfiber not answering", async (_, body) => {
    const got = await scrollback(reaching(answering(body, false, 500)));

    expect(got).toMatchObject({ ok: false, problem: { kind: "unreachable" } });
  });

  // Half a scrollback drawn beside no account of what happened to the rest is a
  // screen claiming to show what a service said.
  it("refuses the whole body where one line is not an envelope", async () => {
    const got = await scrollback(
      reaching(answering(`${spoke("sonarr", "up")}not an envelope\n`)),
    );

    expect(got).toMatchObject({ ok: false, problem: { kind: "malformed" } });
  });

  it("refuses the whole body where one line is not a log line", async () => {
    const got = await scrollback(
      reaching(answering(`${enveloped("status", stack)}\n`)),
    );

    expect(got).toMatchObject({ ok: false, problem: { kind: "malformed" } });
  });
});
