import {
  API_VERSION,
  TOKEN_HEADER,
  type Fetching,
  type Sending,
} from "@lemonfiber/sdk-ts";
import { describe, expect, it, vi } from "vitest";
import { explaining } from "./explaining";
import type { Reaching } from "./asking";
import { explained } from "../routes/fixture";

const key = ["a", "run", "key"].join("-");
const here = "http://127.0.0.1:7777";

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

const asking = (sending: Sending): Reaching => ({
  at: here,
  token: key,
  sending,
  fetching,
});

/** The entry for one word, as the read about this product's words answers it. */
const entry = enveloped("word", explained);

describe("asking what a word means", () => {
  it("asks the read that answers a word, carrying the key in a header", async () => {
    const sending = saying(200, entry);

    await explaining(asking(sending))(explained.word);

    expect(sending).toHaveBeenCalledWith(
      `${here}/api/explain?word=hardlink`,
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({ [TOKEN_HEADER]: key }) as unknown,
      }),
    );
  });

  it("gives back the entry the answer carried", async () => {
    const got = await explaining(asking(saying(200, entry)))(explained.word);

    expect(got).toEqual({ ok: true, value: explained });
  });

  // Two of this table's words are two words, and the parameter is built by the
  // client package rather than joined onto the path here.
  it("carries a word of two words as one word", async () => {
    const sending = saying(200, entry);

    await explaining(asking(sending))("block account");

    expect(sending).toHaveBeenCalledWith(
      `${here}/api/explain?word=block+account`,
      expect.anything(),
    );
  });

  it("asks about one word once, however many places want it", async () => {
    const sending = saying(200, entry);
    const explain = explaining(asking(sending));

    const both = await Promise.all([
      explain(explained.word),
      explain(explained.word),
    ]);

    expect(sending).toHaveBeenCalledTimes(1);
    expect(both).toEqual([
      { ok: true, value: explained },
      { ok: true, value: explained },
    ]);
  });

  // The one answer asking again cannot change. The binary answered, and what it
  // answered is that there is no entry.
  it("keeps an answer that says the table has no entry for the word", async () => {
    const refusal = enveloped("error", {
      code: "WORD-1",
      summary: "`nonsense` is not one of the words this product explains",
      meaning: "What is explained here is this ecosystem's own vocabulary.",
      remedies: [],
      severity: "error",
      state: "actionable",
    });
    const sending = saying(404, refusal);
    const explain = explaining(asking(sending));

    const first = await explain("nonsense");
    await explain("nonsense");

    expect(first).toMatchObject({ ok: false, problem: { kind: "missing" } });
    expect(sending).toHaveBeenCalledTimes(1);
  });

  it("asks again after an answer that never came", async () => {
    const sending = saying(500);
    const explain = explaining(asking(sending));

    const first = await explain(explained.word);
    await explain(explained.word);

    expect(first).toMatchObject({ ok: false });
    expect(sending).toHaveBeenCalledTimes(2);
  });
});
