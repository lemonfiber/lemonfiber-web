import { render, screen, waitFor, within } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import type { Fetching } from "@lemonfiber/sdk-ts";
import { describe, expect, it, vi } from "vitest";
import Console from "./Console.svelte";
import { household } from "./house";
import {
  enveloped,
  fresh,
  here,
  key,
  stack,
  times,
  type Asked,
  type Says,
} from "./served";
import { offered, reissued, wouldOffer } from "../api/invitations";
import { nameOfRequest } from "../lib/household";
import * as m from "../paraglide/messages.js";

/** Where the requests screen reads the household. */
const requests = "/api/requests";

/** The stream is never opened in these, so nothing needs to answer it. */
const silent: Fetching = () =>
  Promise.resolve({ ok: false, status: 500, body: null });

/** The requests screen, against a stack whose household actions answer as told. */
function running(
  asked: Asked,
  acting: Partial<Record<string, readonly Says[]>> = {},
): void {
  globalThis.history.replaceState(undefined, "", "/requests");
  const sending = stack(
    {
      acting,
      becoming: [],
      reading: {
        [requests]: { status: 200, body: enveloped("household", household) },
      },
    },
    asked,
  );
  render(Console, {
    reaching: { at: here, token: key, sending, fetching: silent },
    onrefused: vi.fn(),
    pausing: () => Promise.resolve(),
  });
}

const press = (label: string): Promise<void> =>
  userEvent.click(screen.getByRole("button", { name: label }));

const asked = (): HTMLElement =>
  screen.getByRole("status", { name: m.tending_asked() });

/** The one request Kit is waiting on the operator for. */
const waiting = household.members[1]?.requests[0];
const title = waiting === undefined ? "missing" : nameOfRequest(waiting);

describe("running the household from the requests screen", () => {
  it("reads what the house asked for on the way in", async () => {
    const sent = fresh();
    running(sent);

    expect(
      await screen.findByText(m.action_reissue({ name: "Kit" })),
    ).toBeInTheDocument();
    expect(times(sent, requests)).toBe(1);
  });

  it("reads what an offer would make first, makes it on a yes, and reads the house again", async () => {
    const sent = fresh();
    running(sent, {
      invite: [
        { status: 200, body: enveloped("invitation", wouldOffer) },
        { status: 200, body: enveloped("invitation", offered) },
      ],
    });
    await screen.findByText(m.action_invite_open());

    await press(m.action_invite_open());
    await userEvent.type(screen.getByLabelText(m.invite_name()), "Sam");
    await userEvent.type(screen.getByLabelText(m.invite_age()), "12");
    await press(m.action_invite_read());
    await within(asked()).findByText(m.invite_offer_title({ name: "Sam" }));
    expect(times(sent, requests)).toBe(1);
    await press(m.action_invite_yes({ name: "Sam" }));

    expect(sent.posted).toStrictEqual([
      {
        at: "/api/actions/invite",
        body: JSON.stringify({ name: "Sam", age_limit: 12, unrated: "block" }),
      },
      {
        at: "/api/actions/invite",
        body: JSON.stringify({
          name: "Sam",
          age_limit: 12,
          unrated: "block",
          confirm: true,
        }),
      },
    ]);
    expect(
      await within(asked()).findByText(m.came_invite_made({ name: "Sam" })),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(m.invite_offer_title({ name: "Sam" })),
    ).toBeNull();
    await waitFor(() => {
      expect(times(sent, requests)).toBe(2);
    });
  });

  // Nothing comes back to read before a password is taken off, so what it
  // does is said before the yes and nothing is sent until then.
  it("asks before taking a password off, and sends it on the yes", async () => {
    const sent = fresh();
    running(sent, {
      reissue: [{ status: 200, body: enveloped("invitation", reissued) }],
    });
    await screen.findByText(m.action_reissue({ name: "Kit" }));

    await press(m.action_reissue({ name: "Kit" }));
    expect(
      within(asked()).getByText(m.confirm_reissue_prose()),
    ).toBeInTheDocument();
    expect(sent.posted).toStrictEqual([]);
    await press(m.action_reissue_yes());

    expect(sent.posted).toStrictEqual([
      { at: "/api/actions/reissue", body: JSON.stringify({ name: "Kit" }) },
    ]);
    expect(
      await within(asked()).findByText(m.came_invite_reset({ name: "Kit" })),
    ).toBeInTheDocument();
  });

  it("lets a request through, and reads the house again", async () => {
    const sent = fresh();
    running(sent, {
      "household-approve": [
        { status: 200, body: enveloped("household", household) },
      ],
    });
    await screen.findByText(m.action_approve({ title }));

    await press(m.action_approve({ title }));

    expect(sent.posted).toStrictEqual([
      {
        at: "/api/actions/household-approve",
        body: JSON.stringify({ request: 44 }),
      },
    ]);
    expect(
      await within(asked()).findByText(m.doing_approve_title()),
    ).toBeInTheDocument();
    await waitFor(() => {
      expect(times(sent, requests)).toBe(2);
    });
  });

  // A refusal is lemonfiber's own sentence, and reads as a refusal.
  it("says a refusal in lemonfiber's words", async () => {
    const decided = "Request 44 has already been decided.";
    running(fresh(), {
      "household-decline": [{ status: 409, body: decided }],
    });
    await screen.findByText(m.action_decline_open({ title }));

    await press(m.action_decline_open({ title }));
    await userEvent.type(
      screen.getByLabelText(m.decline_reason({ title })),
      "We have it on disc.",
    );
    await press(m.action_decline_yes());

    expect(await within(asked()).findByText(decided)).toBeInTheDocument();
    expect(within(asked()).getByText(m.eyebrow_refused())).toBeInTheDocument();
  });
});
