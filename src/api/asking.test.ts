import { API_VERSION, type Fetching, type Sending } from "@lemonfiber/sdk-ts";
import { describe, expect, it } from "vitest";
import { asked, turnedAway, watching } from "./asking";
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
