import { render, screen } from "@testing-library/svelte";
import type { Sending } from "@lemonfiber/sdk-ts";
import { describe, expect, it, vi } from "vitest";
import Member from "./Member.svelte";
import { saying } from "./Console.testing";
import { enveloped, replying } from "../api/bodies";
import { booted, healing, notified, watched } from "../api/health";
import { twoComing } from "../api/inflights";
import { kitsId, kitsNothingPartWay, kitsShelf, yours } from "./mine";
import { here, key } from "./served";
import * as m from "../paraglide/messages.js";

/** The reads the machine's health and what a stop would interrupt are drawn from. */
const OPERATOR_ONLY = [
  "/api/boot",
  "/api/watcher",
  "/api/queue",
  "/api/notify",
  "/api/in-flight",
];

/** A stack answering a member's own reads, and the operator's too. */
function answering(): Sending {
  const bodies: Record<string, string> = {
    "/api/requests": enveloped("household", yours),
    "/api/held": enveloped("held", kitsShelf),
    "/api/watching": enveloped("part-way", kitsNothingPartWay),
    "/api/boot": enveloped("boot", booted),
    "/api/watcher": enveloped("watcher", watched),
    "/api/queue": enveloped("queue", healing),
    "/api/notify": enveloped("notify", notified),
    "/api/in-flight": enveloped("in-flight", twoComing),
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

describe("the machine's health and what a stop would interrupt, where a member is shown", () => {
  it.each([
    ["/", "Andor"],
    ["/held", "Arrival"],
  ])("is neither asked for nor drawn at %s", async (path, drawn) => {
    globalThis.history.replaceState(undefined, "", path);
    const sending = answering();
    render(Member, {
      reaching: { at: here, token: key, sending, fetching: saying([]) },
      member: kitsId,
      onrefused: vi.fn(),
    });
    expect(await screen.findAllByText(drawn)).not.toHaveLength(0);

    for (const name of [
      m.panel_boot(),
      m.panel_watcher(),
      m.panel_queue(),
      m.panel_notify(),
    ]) {
      expect(screen.queryByRole("region", { name })).toBeNull();
    }
    expect(
      screen.queryByRole("heading", { name: m.inflight_heading() }),
    ).toBeNull();
    expect(
      vi
        .mocked(sending)
        .mock.calls.some(([url]) =>
          OPERATOR_ONLY.includes(new URL(url).pathname),
        ),
    ).toBe(false);
  });
});
