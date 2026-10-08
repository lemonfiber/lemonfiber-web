import { render, screen, within } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import Requests from "./Requests.svelte";
import { household } from "./house";
import { handedKit, signedInKit, tender } from "./tended";
import { servedAt, unprovisionedKit } from "../api/handoffs";
import type { Freshness } from "../lib/freshness";
import type { Tender } from "../lib/tending";
import * as m from "../paraglide/messages.js";

const answered: Freshness = { kind: "answered", secondsAgo: 4 };

/** The requests screen, with the household run from it. */
function tending(over: Partial<Tender> = {}): void {
  render(Requests, {
    household: { ok: true, value: household },
    freshness: answered,
    tender: { ...tender, ...over },
  });
}

const press = (label: string): Promise<void> =>
  userEvent.click(screen.getByRole("button", { name: label }));

const handing = (): HTMLElement =>
  screen.getByRole("region", { name: m.handoff_said({ name: "Kit" }) });

describe("handing somebody a device", () => {
  it("asks lemonfiber for a code for that person", async () => {
    const onask = vi.fn();
    tending({ onask });

    await press(m.action_handoff({ name: "Kit" }));

    expect(onask).toHaveBeenCalledWith({
      doing: "household-handoff",
      name: "Kit",
    });
  });

  it("draws nothing under a person until a hand-off is answered", () => {
    tending();
    expect(
      screen.queryByRole("region", { name: m.handoff_said({ name: "Kit" }) }),
    ).toBeNull();
  });

  it("draws a code for each app, with what it carries beside it", () => {
    tending({ work: [handedKit] });

    const section = handing();
    expect(
      within(section).getByText(m.handoff_ready({ name: "Kit" })),
    ).toBeVisible();
    const apps = within(section).getByRole("list", { name: m.handoff_apps() });
    expect(
      within(apps).getByRole("img", {
        name: m.handoff_code_said({
          client: "Jellyfin",
          device: "Android phone",
        }),
      }),
    ).toBeVisible();
    expect(
      within(apps).getByText(
        m.handoff_client_closed({ device: "iPhone", client: "Infuse" }),
      ),
    ).toBeVisible();
    expect(
      within(apps).getByText(m.handoff_code_address({ code: servedAt })),
    ).toBeVisible();
  });

  it("lists the steps to sign in, in order", () => {
    tending({ work: [handedKit] });

    const steps = within(handing()).getByRole("list", {
      name: m.handoff_steps(),
    });
    expect(
      within(steps)
        .getAllByRole("listitem")
        .map((step) => step.textContent.trim()),
    ).toStrictEqual([
      "Install the app on the device.",
      "Scan the code, or type the address.",
      "Sign in as Kit.",
    ]);
  });

  it("asks again how far the sign-in has got, where that is what to do", async () => {
    const onask = vi.fn();
    tending({ work: [handedKit], onask });

    await press(m.action_handoff_again({ name: "Kit" }));

    expect(onask).toHaveBeenCalledWith({
      doing: "household-handoff",
      name: "Kit",
    });
  });

  it("silences both while something is under way", () => {
    tending({ work: [handedKit], busy: true });
    for (const label of [
      m.action_handoff({ name: "Kit" }),
      m.action_handoff_again({ name: "Kit" }),
    ]) {
      expect(screen.getByRole("button", { name: label })).toHaveAttribute(
        "aria-disabled",
        "true",
      );
    }
  });

  it("lists the devices signed in, and offers no asking again once done", () => {
    tending({ work: [signedInKit] });

    const sessions = within(handing()).getByRole("list", {
      name: m.handoff_sessions(),
    });
    expect(within(sessions).getAllByRole("listitem")).toHaveLength(2);
    expect(
      screen.queryByRole("button", {
        name: m.action_handoff_again({ name: "Kit" }),
      }),
    ).toBeNull();
  });

  it("says only what there is to do where Kit has no account yet", () => {
    tending({
      work: [
        {
          id: "56",
          doing: "household-handoff",
          scoped: false,
          given: { name: "Kit" },
          at: "done",
          job: undefined,
          came: { kind: "handoff", report: unprovisionedKit },
        },
      ],
    });

    const section = handing();
    expect(
      within(section).getByText(m.handoff_remedy_invite({ name: "Kit" })),
    ).toBeVisible();
    expect(within(section).queryAllByRole("list")).toHaveLength(1);
    expect(within(section).queryByRole("button")).toBeNull();
  });
});
