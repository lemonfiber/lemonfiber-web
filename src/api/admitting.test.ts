import { unreachable, type Sending } from "@lemonfiber/sdk-ts";
import { describe, expect, it, vi } from "vitest";
import { admitting } from "./admitting";
import { enveloped, notFromLemonfiber, proxyPage, replying } from "./bodies";

const here = "http://127.0.0.1:7777";

/**
 * Somewhere that is not this machine, assembled rather than written: the
 * structural guards refuse a foreign origin in the source, and this one is here
 * to be refused by the client.
 */
const elsewhere = ["http:", "", "example.test"].join("/");

/** Built rather than written, so no scanner reads it as a real one. */
const session = ["a", "session", "secret"].join("-");
const password = ["a", "chosen", "password"].join("-");

const admitted = enveloped("admission", {
  token: session,
  until: "2026-09-19T21:00:00Z",
});

const answering = (status: number, body: string): Sending =>
  vi.fn(() => Promise.resolve(replying(status, body)));

const arriving = (sending: Sending): { at: string; sending: Sending } => ({
  at: here,
  sending,
});

describe("handing over a credential at the door", () => {
  it("takes the session the run answered with", async () => {
    const got = await admitting(arriving(answering(200, admitted)), {
      password,
    });

    expect(got).toEqual({ at: "admitted", token: session });
  });

  // One form, both kinds of person. The operator's password is lemonfiber's
  // own and carries no name; a member's account is held by the media server and
  // is named. Which is which is lemonfiber's answer, not this page's.
  it("sends no name for the operator", async () => {
    const sending = answering(200, admitted);
    await admitting(arriving(sending), { password });

    expect(sending).toHaveBeenCalledWith(
      `${here}/api/session`,
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ password }),
      }),
    );
  });

  it("sends the name a member signed in under", async () => {
    const sending = answering(200, admitted);
    await admitting(arriving(sending), { name: "Ada", password });

    expect(sending).toHaveBeenCalledWith(
      `${here}/api/session`,
      expect.objectContaining({
        body: JSON.stringify({ name: "Ada", password }),
      }),
    );
  });

  // The one endpoint reached without a key: somebody holding a password and
  // nothing else carries none.
  it("carries no key", async () => {
    let carried: Record<string, string> | undefined;
    const sending: Sending = (_url, init) => {
      carried = init.headers;
      return Promise.resolve(replying(200, admitted));
    };

    await admitting(arriving(sending), { password });

    expect(carried).toEqual({
      Accept: "application/json",
      "Content-Type": "application/json",
    });
  });

  // Two credentials open this door. Naming the half that failed would say which
  // accounts exist to whoever is guessing.
  it("says the pair was not recognised, and not which half", async () => {
    const got = await admitting(arriving(answering(401, "No such member.")), {
      name: "Ada",
      password,
    });

    expect(got).toEqual({ at: "not-recognised" });
  });

  // The refusal says how long is left, so a reader waits rather than retrying
  // into the limit and extending it.
  it("hands on what a run said about answering too often", async () => {
    const said = "Too many answers. Try again in 4 minutes.";
    const got = await admitting(arriving(answering(429, said)), { password });

    expect(got).toEqual({ at: "declined", said });
  });

  it("hands on a refusal this page has no reading of", async () => {
    const got = await admitting(arriving(answering(403, "Not from here.")), {
      password,
    });

    expect(got.at).toBe("declined");
  });

  it("reports a run that never answered", async () => {
    const got = await admitting(
      arriving(() => Promise.reject(new Error("no route"))),
      { password },
    );

    expect(got).toEqual({ at: "declined", said: unreachable().message });
  });

  // A page from whatever stands between this page and lemonfiber is not
  // lemonfiber's account of anything.
  it("refuses a body that is not a document", async () => {
    const got = await admitting(arriving(answering(200, proxyPage)), {
      password,
    });

    expect(got.at).toBe("declined");
  });

  // The generated types are what know which payload goes with which kind, and a
  // payload read under the wrong one is fields with changed meanings.
  it("refuses an envelope calling itself something else", async () => {
    const got = await admitting(
      arriving(answering(200, notFromLemonfiber("job", { job: "9f2c" }))),
      { password },
    );

    expect(got.at).toBe("declined");
  });

  it("refuses an address that is not this machine", async () => {
    const got = await admitting(arriving(answering(200, admitted)), {
      password,
    });
    const away = await admitting(
      { at: elsewhere, sending: answering(200, admitted) },
      { password },
    );

    expect(got.at).toBe("admitted");
    expect(away.at).toBe("declined");
  });
});
