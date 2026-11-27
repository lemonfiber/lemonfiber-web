import type { Sending } from "@lemonfiber/sdk-ts";
import { describe, expect, it, vi } from "vitest";
import { enveloped, replying } from "../api/bodies";
import { Hearing } from "./hearing.svelte";
import { kitsKinds, kitsTelling } from "../api/hearings";
import { fetching, here, session } from "./Member.testing";
import { kitsId, yours } from "./mine";

/** A transport whose every answer waits until it is let go. */
function held(): { sending: Sending; answer: (body: string) => void } {
  const waiting: ((body: string) => void)[] = [];
  const sending: Sending = vi.fn(
    () =>
      new Promise<ReturnType<typeof replying>>((resolve) => {
        waiting.push((body) => {
          resolve(replying(200, body));
        });
      }),
  );
  return {
    sending,
    answer: (body) => {
      waiting.shift()?.(body);
    },
  };
}

function hearing(sending: Sending): { of: Hearing; turned: () => void } {
  const turned = vi.fn();
  const of = new Hearing(
    () => ({
      reaching: { at: here, token: session, sending, fetching },
      member: kitsId,
    }),
    turned,
    undefined,
  );
  return { of, turned };
}

const settle = (): Promise<void> => new Promise((done) => setTimeout(done));

describe("what a member's rooms read beside what they asked for", () => {
  it("drops an answer for a room since left", async () => {
    const { sending, answer } = held();
    const { of } = hearing(sending);
    of.arrive({ room: "find" });
    of.arrive({ room: "held" });
    answer(enveloped("askable-kinds", kitsKinds));
    await settle();
    expect(of.kinds).toBeUndefined();
    expect(of.choices).toBeUndefined();
  });

  it("drops what a choice came to once the member has gone elsewhere", async () => {
    const { sending, answer } = held();
    const { of } = hearing(sending);
    of.arrive({ room: "asked" });
    answer(enveloped("notify-mine", kitsTelling));
    await settle();
    void of.tick("phones");
    expect(of.choosing).toBe("sending");
    void of.tick("family-chat");
    expect(sending).toHaveBeenCalledTimes(2);
    of.arrive({ room: "held" });
    answer(enveloped("notify-mine", kitsTelling));
    await settle();
    expect(of.choosing).toBeUndefined();
  });

  it("chooses nothing before the ways are read", async () => {
    const { sending } = held();
    const { of } = hearing(sending);
    of.arrive({ away: "logs" });
    await of.tick("phones");
    expect(sending).not.toHaveBeenCalled();
  });

  it("marks nothing away from the list of what they asked for", () => {
    const { sending } = held();
    const { of } = hearing(sending);
    of.arrive({ room: "find" });
    of.saw(yours);
    of.saw(yours);
    expect(of.fresh).toEqual([]);
  });
});
