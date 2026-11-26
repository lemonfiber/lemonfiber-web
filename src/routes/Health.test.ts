import { render, screen, within } from "@testing-library/svelte";
import { userEvent } from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import Checks from "./Checks.svelte";
import Settings from "./Settings.svelte";
import { blind, booted, healing, notified, watched } from "../api/health";
import { bootReadout } from "../lib/boot";
import type { Freshness } from "../lib/freshness";
import { healingReadout } from "../lib/healing";
import { notifiedReadout } from "../lib/notifying";
import { watcherReadout } from "../lib/watcher";
import * as m from "../paraglide/messages.js";

const answered: Freshness = { kind: "answered", secondsAgo: 5 };

const region = (name: string): HTMLElement =>
  screen.getByRole("region", { name });

describe("the machine's health, on the checks screen", () => {
  it("is not drawn until it answers", () => {
    render(Checks, { diagnosis: undefined, freshness: answered });
    for (const name of [m.panel_boot(), m.panel_watcher(), m.panel_queue()]) {
      expect(screen.queryByRole("region", { name })).toBeNull();
    }
  });

  it("says when the machine started, what watches it and what heals stuck downloads", () => {
    render(Checks, {
      diagnosis: undefined,
      freshness: answered,
      boot: { ok: true, value: booted },
      watcher: { ok: true, value: watched },
      healing: { ok: true, value: healing },
    });
    for (const line of bootReadout(booted).lines) {
      expect(within(region(m.panel_boot())).getByText(line)).toBeVisible();
    }
    const monitors = within(region(m.panel_watcher())).getByRole("list", {
      name: m.watcher_said(),
    });
    expect(
      within(monitors)
        .getAllByRole("heading")
        .map((one) => one.textContent),
    ).toStrictEqual(watcherReadout(watched).entries.map((one) => one.head));
    for (const line of healingReadout(healing).lines) {
      expect(within(region(m.panel_queue())).getByText(line)).toBeVisible();
    }
  });

  it("says a watcher that does not answer is no all-clear, and why a reading could not be read", () => {
    render(Checks, {
      diagnosis: undefined,
      freshness: answered,
      watcher: { ok: true, value: blind },
      boot: { ok: false, problem: { kind: "refused", message: "No." } },
    });
    const [said] = watcherReadout(blind).lines.slice(-1);
    expect(
      within(region(m.panel_watcher())).getByText(said ?? ""),
    ).toBeVisible();
    expect(within(region(m.panel_boot())).getByText("No.")).toBeVisible();
    expect(
      within(region(m.panel_watcher())).queryByRole("list", {
        name: m.watcher_said(),
      }),
    ).toBeNull();
  });

  it("follows an unhealthy download to its trace, and offers nothing to follow where nothing answers it", async () => {
    const onfollow = vi.fn();
    const { unmount } = render(Checks, {
      diagnosis: undefined,
      freshness: answered,
      healing: { ok: true, value: healing },
      onfollow,
    });
    await userEvent.click(
      within(region(m.panel_queue())).getByRole("button", {
        name: m.action_stuck_follow({ title: "Arrival" }),
      }),
    );
    expect(onfollow).toHaveBeenCalledWith({
      term: "Arrival",
      season: undefined,
    });
    unmount();

    render(Checks, {
      diagnosis: undefined,
      freshness: answered,
      healing: { ok: true, value: healing },
    });
    expect(within(region(m.panel_queue())).queryByRole("button")).toBeNull();
  });
});

describe("where alerts go, on the settings screen", () => {
  it("is not drawn until it answers", () => {
    render(Settings, { quality: undefined, freshness: answered });
    expect(screen.queryByRole("region", { name: m.panel_notify() })).toBeNull();
  });

  it("says where delivery stands and each way alerts go", () => {
    render(Settings, {
      quality: undefined,
      freshness: answered,
      notify: { ok: true, value: notified },
    });
    const told = notifiedReadout(notified);
    for (const line of told.lines) {
      expect(within(region(m.panel_notify())).getByText(line)).toBeVisible();
    }
    const ways = within(region(m.panel_notify())).getByRole("list", {
      name: m.notify_said(),
    });
    expect(
      within(ways)
        .getAllByRole("heading")
        .map((one) => one.textContent),
    ).toStrictEqual(told.entries.map((one) => one.head));
  });
});
