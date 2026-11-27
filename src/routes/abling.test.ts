import type { Fetching } from "@lemonfiber/sdk-ts";
import { describe, expect, it, vi } from "vitest";
import { Abling } from "./abling.svelte";
import { routed } from "./Console.testing";
import { enveloped, here, key } from "./served";
import { readKeyAble } from "../api/abilities.testing";

const silent: Fetching = () =>
  Promise.resolve({ ok: false, status: 500, body: null });

/** What the key can use, read through a transport answering `answers`. */
function abling(answers: Parameters<typeof routed>[0]): {
  abling: Abling;
  onrefused: () => void;
} {
  const onrefused = vi.fn();
  const sending = routed(answers, []);
  return {
    abling: new Abling({
      reaching: () => ({ at: here, token: key, sending, fetching: silent }),
      onrefused,
    }),
    onrefused,
  };
}

describe("what the signed-in key can use", () => {
  it("is nothing until it is read, and what lemonfiber said once it is", async () => {
    const { abling: held } = abling({
      "GET /api/capabilities": enveloped("capabilities", readKeyAble),
    });
    expect(held.able).toBeUndefined();
    await held.read();
    expect(held.able).toStrictEqual(readKeyAble);
  });

  it("is nothing where it could not be read, and a refused key is passed on", async () => {
    const { abling: held, onrefused } = abling({
      "GET /api/capabilities": { status: 401, body: "" },
    });
    await held.read();
    expect(held.able).toBeUndefined();
    expect(held.answer?.ok).toBe(false);
    expect(onrefused).toHaveBeenCalled();
  });

  it("passes on nothing where it was only not found", async () => {
    const { abling: held, onrefused } = abling({});
    await held.read();
    expect(held.able).toBeUndefined();
    expect(onrefused).not.toHaveBeenCalled();
  });

  it("is nothing where no client could be opened at the address", async () => {
    const onrefused = vi.fn();
    const held = new Abling({
      reaching: () => ({
        at: "ftp://198.51.100.7",
        token: key,
        sending: routed({}, []),
        fetching: silent,
      }),
      onrefused,
    });
    await held.read();
    expect(held.answer?.ok).toBe(false);
    expect(held.able).toBeUndefined();
    expect(onrefused).not.toHaveBeenCalled();
  });
});
