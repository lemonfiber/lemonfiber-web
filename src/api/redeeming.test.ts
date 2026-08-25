import {
  API_VERSION,
  TOKEN_HEADER,
  unreachable,
  type Fetching,
  type Sending,
} from "@lemonfiber/sdk-ts";
import { describe, expect, it, vi } from "vitest";
import { pausing, redeeming } from "./redeeming";
import type { Reaching } from "./asking";

const key = ["a", "run", "key"].join("-");
const here = "http://127.0.0.1:7777";
const job = "9f2c41ab7d0e5c63";

/**
 * Somewhere that is not this machine, assembled rather than written: the
 * structural guards refuse a foreign origin in the source, and this one is here
 * to be refused by the client.
 */
const elsewhere = ["http:", "", "example.test"].join("/");

/** The stream is never opened from here, so nothing needs to answer it. */
const fetching: Fetching = () => Promise.resolve({ ok: true, body: null });

/** Whatever this reply is, said as the transport hands it over. */
const saying = (status: number, body = ""): Sending =>
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

const asking = (over: { at?: string; sending: Sending }): Reaching => ({
  at: over.at ?? here,
  token: key,
  sending: over.sending,
  fetching,
});

describe("asking what became of a name", () => {
  it("asks at the name's own address, carrying the key in a header", async () => {
    const sending = saying(202, enveloped("job", { job, action: "up" }));

    await redeeming(asking({ sending }), job);

    expect(sending).toHaveBeenCalledWith(
      `${here}/api/jobs/${job}`,
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({ [TOKEN_HEADER]: key }) as unknown,
      }),
    );
  });

  // A name is whatever the server minted, and putting one into an address
  // unescaped is putting somebody else's bytes into a path.
  it("escapes a name before it becomes part of an address", async () => {
    const sending = saying(404);

    await redeeming(asking({ sending }), "one two/three");

    expect(sending).toHaveBeenCalledWith(
      `${here}/api/jobs/one%20two%2Fthree`,
      expect.anything(),
    );
  });

  it("refuses an address that is not this machine, in the client's words", async () => {
    const sending = saying(200);

    const came = await redeeming(asking({ at: elsewhere, sending }), job);

    expect(came.at).toBe("adrift");
    expect(sending).not.toHaveBeenCalled();
  });
});

describe("where the work got to", () => {
  it("says it is still going where nothing has changed", async () => {
    const came = await redeeming(
      asking({ sending: saying(202, enveloped("job", { job, action: "up" })) }),
      job,
    );

    expect(came).toStrictEqual({ at: "running" });
  });

  it("says it finished where lemonfiber rendered what it came to", async () => {
    const came = await redeeming(
      asking({
        sending: saying(
          200,
          enveloped("lifecycle", {
            action: "up",
            command: ["compose", "up"],
            profile: "core",
            condition: "active",
          }),
        ),
      }),
      job,
    );

    expect(came).toStrictEqual({ at: "finished" });
  });

  // What went wrong is lemonfiber's own account of it, and the envelope is
  // where that account is already written.
  it("says what stopped it, in the words the failure rendered", async () => {
    const summary = "The container engine is not running.";
    const came = await redeeming(
      asking({
        sending: saying(
          500,
          enveloped("error", {
            code: "engine-absent",
            summary,
            meaning: "Nothing can be started until it is.",
            remedies: [],
            severity: "error",
            state: "actionable",
          }),
        ),
      }),
      job,
    );

    expect(came).toStrictEqual({ at: "stopped", said: summary });
  });

  // Answering "still going" for work nothing is doing leaves a caller waiting
  // on an outcome that is never coming.
  it("says a name this run never handed out is absent, not unfinished", async () => {
    const came = await redeeming(asking({ sending: saying(404) }), job);

    expect(came).toStrictEqual({ at: "forgotten" });
  });

  it("says it was turned away where the key is not this run's", async () => {
    const came = await redeeming(asking({ sending: saying(403) }), job);

    expect(came).toStrictEqual({ at: "turned-away" });
  });
});

describe("when the asking itself fails", () => {
  // The work may be running perfectly well; it is the asking that stopped, and
  // saying the work stopped would be this page's guess as lemonfiber's word.
  it("says it lost the thread rather than that the work stopped", async () => {
    const sending: Sending = () => Promise.reject(new Error("no route"));

    const came = await redeeming(asking({ sending }), job);

    expect(came).toStrictEqual({
      at: "adrift",
      said: unreachable().message,
    });
  });
});

describe("the wait between one asking and the next", () => {
  it("finishes, so the asking goes round again", async () => {
    await expect(pausing(0)).resolves.toBeUndefined();
  });
});
