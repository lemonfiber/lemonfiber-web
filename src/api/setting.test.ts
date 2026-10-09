import { API_VERSION, type Sending } from "@lemonfiber/sdk-ts";
import { describe, expect, it } from "vitest";
import { movedBy, standingOf } from "./setting";
import { fresh } from "./setups";
import type { Reaching } from "./asking";
import type { Move } from "../lib/wizard";

interface Seen {
  readonly url: string;
  readonly method: string;
  readonly body: string | undefined;
}

/**
 * Somewhere that is not this machine, assembled rather than written: the
 * structural guards refuse a foreign origin in the source, and this one is here
 * to be refused by the client.
 */
const elsewhere = ["http:", "", "example.test"].join("/");

/** A run that answers every step with where setup stands, and records it. */
function reaching(seen: Seen[], at = "http://127.0.0.1:7777"): Reaching {
  const sending: Sending = (url, init) => {
    seen.push({ url, method: init.method, body: init.body });
    return Promise.resolve({
      ok: true,
      status: 200,
      text: () =>
        Promise.resolve(
          JSON.stringify({
            api_version: API_VERSION,
            kind: "wizard",
            data: fresh,
          }),
        ),
    });
  };
  return {
    at,
    token: "a-run-key",
    sending,
    fetching: () => Promise.reject(new Error("no stream")),
  };
}

describe("asking setup", () => {
  it("reads where it stands", async () => {
    const seen: Seen[] = [];
    expect(await standingOf(reaching(seen))).toStrictEqual({
      ok: true,
      value: fresh,
    });
    expect(seen).toStrictEqual([
      {
        url: "http://127.0.0.1:7777/api/setup",
        method: "GET",
        body: undefined,
      },
    ]);
  });

  it.each([
    [{ move: "next" }, "/api/setup/next", undefined],
    [{ move: "back" }, "/api/setup/back", undefined],
    [{ move: "apply" }, "/api/setup/apply", undefined],
    [
      { move: "answer", answer: { household: true } },
      "/api/setup/answer",
      '{"household":true}',
    ],
    [
      { move: "recover", choice: "roll-back" },
      "/api/setup/recover",
      '{"choice":"roll-back"}',
    ],
  ] as readonly [Move, string, string | undefined][])(
    "takes %o at its route",
    async (move, path, body) => {
      const seen: Seen[] = [];
      expect(await movedBy(reaching(seen), move)).toStrictEqual({
        ok: true,
        value: fresh,
      });
      expect(seen).toStrictEqual([
        { url: `http://127.0.0.1:7777${path}`, method: "POST", body },
      ]);
    },
  );

  it("asks nothing of an address that is not on this machine", async () => {
    const seen: Seen[] = [];
    const away = reaching(seen, elsewhere);
    expect((await standingOf(away)).ok).toBe(false);
    expect((await movedBy(away, { move: "next" })).ok).toBe(false);
    expect(seen).toStrictEqual([]);
  });

  it("passes a refusal on as it was read", async () => {
    const refusing: Reaching = {
      ...reaching([]),
      sending: () =>
        Promise.resolve({
          ok: false,
          status: 409,
          text: () => Promise.resolve("Already set up."),
        }),
    };
    const read = await standingOf(refusing);
    expect(read.ok).toBe(false);
    const moved = await movedBy(refusing, { move: "next" });
    expect(!moved.ok && moved.problem.message).toBe("Already set up.");
  });
});
