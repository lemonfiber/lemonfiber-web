import { render, screen, within } from "@testing-library/svelte";
import type { Fetching } from "@lemonfiber/sdk-ts";
import { userEvent } from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import Console from "./Console.svelte";
import { enveloped, fresh, here, key, stack, times } from "./served";
import { traced } from "../api/found";
import { booted, healing, notified, watched } from "../api/health";
import { bootReadout } from "../lib/boot";
import { notifiedReadout } from "../lib/notifying";
import * as m from "../paraglide/messages.js";

/** The stream is never opened in these, so nothing needs to answer it. */
const silent: Fetching = () =>
  Promise.resolve({ ok: false, status: 500, body: null });

/** The console, at a path, with the machine's health answered. */
function opened(path: string): ReturnType<typeof fresh> {
  globalThis.history.replaceState(undefined, "", path);
  const sent = fresh();
  const sending = stack(
    {
      acting: {},
      becoming: [],
      reading: {
        "/api/boot": { status: 200, body: enveloped("boot", booted) },
        "/api/watcher": { status: 200, body: enveloped("watcher", watched) },
        "/api/queue": { status: 200, body: enveloped("queue", healing) },
        "/api/notify": { status: 200, body: enveloped("notify", notified) },
        "/api/trace": { status: 200, body: enveloped("trace", traced) },
      },
    },
    sent,
  );
  render(Console, {
    reaching: { at: here, token: key, sending, fetching: silent },
    onrefused: vi.fn(),
    pausing: () => Promise.resolve(),
  });
  return sent;
}

describe("the machine's health, from the console", () => {
  it("is read on the way into the checks, once each", async () => {
    const sent = opened("/checks");
    const boot = await screen.findByRole("region", { name: m.panel_boot() });
    const [started] = bootReadout(booted).lines;
    expect(await within(boot).findByText(started ?? "")).toBeVisible();
    expect(
      await screen.findByRole("region", { name: m.panel_watcher() }),
    ).toBeVisible();
    for (const path of ["/api/boot", "/api/watcher", "/api/queue"]) {
      expect(times(sent, path)).toBe(1);
    }
  });

  it("follows an unhealthy download to its trace on the requests screen", async () => {
    const sent = opened("/checks");
    const queue = await screen.findByRole("region", { name: m.panel_queue() });
    await userEvent.click(
      await within(queue).findByRole("button", {
        name: m.action_stuck_follow({ title: "Arrival" }),
      }),
    );
    expect(
      await screen.findByRole("list", { name: m.trace_said() }),
    ).toBeInTheDocument();
    expect(globalThis.location.pathname).toBe("/requests");
    expect(times(sent, "/api/trace")).toBe(1);
  });

  it("reads where alerts go on the way into the settings", async () => {
    const sent = opened("/settings");
    const panel = await screen.findByRole("region", { name: m.panel_notify() });
    const [state] = notifiedReadout(notified).lines;
    expect(await within(panel).findByText(state ?? "")).toBeVisible();
    expect(times(sent, "/api/notify")).toBe(1);
  });
});
