import type { Sending } from "@lemonfiber/sdk-ts";
import { describe, expect, it, vi } from "vitest";
import { enveloped, here, key } from "./served";
import { Tracing } from "./tracing.svelte";
import { traced } from "../api/found";

/** A stack that answers every trace with one reply, and notes what was asked. */
function answering(status: number, body: string, asked: string[]): Sending {
  return (url) => {
    asked.push(url.replace(here, ""));
    return Promise.resolve({
      ok: status >= 200 && status < 300,
      status,
      text: () => Promise.resolve(body),
    });
  };
}

/** Tracing, against one stack. */
function tracing(sending: Sending, onrefused = vi.fn()): Tracing {
  return new Tracing({
    reaching: () => ({
      at: here,
      token: key,
      sending,
      fetching: () => Promise.resolve({ ok: false, body: null }),
    }),
    onrefused,
  });
}

describe("looking one item up", () => {
  it("asks where it is by name and season, and keeps what it answered", async () => {
    const asked: string[] = [];
    const looking = tracing(answering(200, enveloped("trace", traced), asked));

    await looking.look({ term: "The Expanse", season: 2 });

    expect(asked).toStrictEqual(["/api/trace?term=The+Expanse&season=2"]);
    expect(looking.tracer.reading).toStrictEqual({ ok: true, value: traced });
    expect(looking.tracer.busy).toBe(false);
  });

  it("passes a key turned away on, as every refusal of it is", async () => {
    const onrefused = vi.fn();
    const looking = tracing(answering(401, "", []), onrefused);

    looking.tracer.onlook({ term: "Arrival", season: undefined });

    await vi.waitFor(() => {
      expect(onrefused).toHaveBeenCalledOnce();
    });
    expect(looking.reading?.ok).toBe(false);
  });
});
