import { render, screen } from "@testing-library/svelte";
import type { Sending } from "@lemonfiber/sdk-ts";
import { describe, expect, it, vi } from "vitest";
import Member from "./Member.svelte";
import { saying } from "./Console.testing";
import { enveloped, replying } from "../api/bodies";
import { booted, healing, notified, watched } from "../api/health";
import { twoComing } from "../api/inflights";
import { servedPlain, settledDone, shipped } from "../api/machines";
import { kitsId, kitsNothingPartWay, kitsShelf, yours } from "./mine";
import { here, key } from "./served";
import * as m from "../paraglide/messages.js";

/** The reads only the operator is shown. */
const OPERATOR_ONLY = [
  "/api/boot",
  "/api/watcher",
  "/api/queue",
  "/api/notify",
  "/api/in-flight",
  "/api/served",
  "/api/stack",
  "/api/settled",
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
    "/api/served": enveloped("served", servedPlain),
    "/api/stack": enveloped("stack", shipped),
    "/api/settled": enveloped("settled", settledDone),
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

describe("what only the operator is shown, where a member is shown", () => {
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
      m.panel_served(),
      m.panel_stack(),
      m.panel_settled(),
    ]) {
      expect(screen.queryByRole("region", { name })).toBeNull();
    }
    expect(
      screen.queryByRole("heading", { name: m.inflight_heading() }),
    ).toBeNull();
    expect(screen.queryByText(m.served_alarm_lead())).toBeNull();
    expect(
      vi
        .mocked(sending)
        .mock.calls.some(([url]) =>
          OPERATOR_ONLY.includes(new URL(url).pathname),
        ),
    ).toBe(false);
  });
});
