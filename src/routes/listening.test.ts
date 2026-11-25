import { API_VERSION, type Fetching, type Kind } from "@lemonfiber/sdk-ts";
import { describe, expect, it } from "vitest";
import { cleared, raised } from "./fixture";
import { copyingNone, copyingNow } from "../api/copyings";
import { Listening } from "./listening.svelte";
import { here, key } from "./served";
import { saying } from "./Console.testing";
import type { Step } from "../lib/stepping";

/** One event, as the stream frames it, said for a job where one is named. */
const said = (kind: Kind, data: unknown, job?: string): string =>
  `event: ${kind}\ndata: ${JSON.stringify({ api_version: API_VERSION, kind, data, ...(job === undefined ? {} : { job }) })}\n\n`;

const searching: Step = { step: "searching", said: "Asking.", detail: "" };
const grabbing: Step = {
  step: "grabbing",
  said: "Handing it over.",
  detail: "",
};

/** A listener on a stream that says these and then ends, and once it has. */
async function heard(events: readonly string[]): Promise<Listening> {
  const fetching: Fetching = saying(events);
  const sending = () => Promise.reject(new Error("nothing is sent"));
  const listening = new Listening(() => ({
    at: here,
    token: key,
    sending,
    fetching,
  }));
  listening.listen();
  await expect.poll(() => listening.listening, { timeout: 2000 }).toBe(false);
  return listening;
}

describe("what the stream says while a walk goes, and as alerts start and end", () => {
  it("keeps each step under the walk it was said for, and none said for no walk", async () => {
    const listening = await heard([
      said("step", searching, "5c63"),
      said("step", searching),
      said("step", grabbing, "5c63"),
    ]);
    expect(listening.steps).toStrictEqual({ "5c63": [searching, grabbing] });
  });

  it("holds the newest alert said, until it is put away", async () => {
    const listening = await heard([
      said("alert", raised),
      said("alert", cleared),
    ]);
    expect(listening.told).toStrictEqual(cleared);
    listening.dismiss();
    expect(listening.told).toBeUndefined();
  });

  it("holds the copy running as the stream last said it, an end included", async () => {
    const running = await heard([said("copying", copyingNow)]);
    expect(running.copying).toStrictEqual(copyingNow);
    const ended = await heard([
      said("copying", copyingNow),
      said("copying", copyingNone),
    ]);
    expect(ended.copying).toStrictEqual(copyingNone);
  });

  it("says alerts may be missing after a partial replay, until that is seen", async () => {
    const listening = await heard([said("replay", { alerts: "partial" })]);
    expect(listening.missing).toBe(true);
    listening.seen();
    expect(listening.missing).toBe(false);
  });

  it("says nothing of missing alerts after a whole replay", async () => {
    const listening = await heard([said("replay", { alerts: "whole" })]);
    expect(listening.missing).toBe(false);
  });

  // After a break the stream hands the last of each kind over again, stale.
  // Taking that would narrate a step twice and raise an alert nobody raised.
  it("takes nothing the stream hands over again after it breaks", async () => {
    const listening = await heard([said("step", searching, "5c63")]);
    expect(listening.steps["5c63"]).toHaveLength(1);
  });
});
