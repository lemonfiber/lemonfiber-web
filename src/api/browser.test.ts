import { afterEach, describe, expect, it, vi } from "vitest";
import { fetching, sending } from "./browser";

const where = "http://127.0.0.1:7777/api/status";

describe("the transport", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("hands one request to the browser and gives back its answer", async () => {
    const answer = {
      ok: true,
      status: 200,
      text: () => Promise.resolve("{}"),
    };
    const asked = vi.fn(() => Promise.resolve(answer));
    vi.stubGlobal("fetch", asked);

    const init = { method: "GET", headers: { Accept: "application/json" } };
    const got = await sending(where, init);

    expect(got).toBe(answer);
    expect(asked).toHaveBeenCalledWith(where, init);
  });

  it("hands one held-open request over the same way", async () => {
    const answer = { ok: true, body: null };
    const asked = vi.fn(() => Promise.resolve(answer));
    vi.stubGlobal("fetch", asked);

    const init = {
      headers: { Accept: "text/event-stream" },
      signal: new AbortController().signal,
    };
    const got = await fetching(where, init);

    expect(got).toBe(answer);
    expect(asked).toHaveBeenCalledWith(where, init);
  });
});
