import { render, screen } from "@testing-library/svelte";
import type { Sending } from "@lemonfiber/sdk-ts";
import { describe, expect, it, vi } from "vitest";
import Member from "./Member.svelte";
import { framed, saying } from "./Console.testing";
import { enveloped, replying } from "../api/bodies";
import { copyingNow } from "../api/copyings";
import { kitsId, kitsNothingPartWay, kitsShelf, yours } from "./mine";
import { here, key } from "./served";
import * as m from "../paraglide/messages.js";

/** A stack answering a member's own reads, and a copy running too. */
function answering(): Sending {
  const bodies: Record<string, string> = {
    "/api/requests": enveloped("household", yours),
    "/api/held": enveloped("held", kitsShelf),
    "/api/watching": enveloped("part-way", kitsNothingPartWay),
    "/api/copying": enveloped("copying", copyingNow),
  };
  return vi.fn((url: string) => {
    const body = bodies[new URL(url).pathname];
    return Promise.resolve(
      body === undefined
        ? replying(403, "This is not something this account may ask for.")
        : replying(200, body),
    );
  });
}

describe("a running copy and alerts that may be missing, where a member is shown", () => {
  it.each([
    ["/", "Andor"],
    ["/held", "Arrival"],
  ])("are neither asked for nor drawn at %s", async (path, drawn) => {
    globalThis.history.replaceState(undefined, "", path);
    const sending = answering();
    render(Member, {
      reaching: {
        at: here,
        token: key,
        sending,
        fetching: saying([
          framed("copying", copyingNow),
          framed("replay", { alerts: "partial" }),
        ]),
      },
      member: kitsId,
      onrefused: vi.fn(),
    });
    expect(await screen.findAllByText(drawn)).not.toHaveLength(0);

    expect(
      screen.queryByRole("region", { name: m.copying_backup() }),
    ).toBeNull();
    expect(screen.queryByText(m.told_missing())).toBeNull();
    expect(
      vi
        .mocked(sending)
        .mock.calls.some(([url]) => new URL(url).pathname === "/api/copying"),
    ).toBe(false);
  });
});
