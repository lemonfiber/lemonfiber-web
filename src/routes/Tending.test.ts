import { render, screen, within } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import Requests from "./Requests.svelte";
import { household } from "./house";
import { madeOffer, readOffer, tender } from "./tended";
import type { Freshness } from "../lib/freshness";
import { labelOfPolicy, nameOfRequest } from "../lib/household";
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

const panel = (): HTMLElement =>
  screen.getByRole("region", { name: m.panel_tending() });

const asked = (): HTMLElement =>
  screen.getByRole("status", { name: m.tending_asked() });

const press = (label: string): Promise<void> =>
  userEvent.click(screen.getByRole("button", { name: label }));

const button = (label: string): HTMLElement =>
  screen.getByRole("button", { name: label });

async function typeInto(label: string, text: string): Promise<void> {
  const box = screen.getByLabelText(label);
  await userEvent.clear(box);
  await userEvent.type(box, text);
}

describe("running the household", () => {
  it("is not drawn where nothing answers it", () => {
    render(Requests, {
      household: { ok: true, value: household },
      freshness: answered,
    });
    expect(
      screen.queryByRole("region", { name: m.panel_tending() }),
    ).toBeNull();
    expect(
      screen.queryByRole("button", { name: m.action_reissue({ name: "Kit" }) }),
    ).toBeNull();
  });

  it("stands first on the requests screen", () => {
    tending();
    expect(screen.getAllByRole("region").at(0)).toBe(panel());
  });

  it("is silenced while a request is in flight", () => {
    tending({ busy: true });
    expect(button(m.action_invite_open())).toHaveAttribute(
      "aria-disabled",
      "true",
    );
  });

  it("presses to nothing where nothing answers the controls", async () => {
    tending({ work: [madeOffer] });
    await press(m.action_hide_record());
    expect(within(asked()).getByText(m.doing_invite_title())).toBeVisible();
  });
});

describe("offering somebody an account", () => {
  it("reads what the offer would make first, with the limit typed", async () => {
    const onask = vi.fn();
    tending({ onask });

    await press(m.action_invite_open());
    await typeInto(m.invite_name(), " Sam ");
    await typeInto(m.invite_age(), "12");
    await press(m.action_invite_read());

    expect(onask).toHaveBeenCalledWith({
      doing: "invite",
      name: "Sam",
      terms: { ageLimit: 12, holdUnrated: true },
    });
    expect(asked()).toHaveFocus();
    expect(screen.queryByLabelText(m.invite_name())).toBeNull();
  });

  it("asks about what has no rating only where there is a limit", async () => {
    const onask = vi.fn();
    tending({ onask });
    await press(m.action_invite_open());
    await typeInto(m.invite_name(), "Sam");
    expect(
      screen.queryByRole("button", { name: m.invite_unrated() }),
    ).toBeNull();

    await typeInto(m.invite_age(), "15");
    await press(m.invite_unrated());
    await press(m.action_invite_read());

    expect(onask).toHaveBeenCalledWith({
      doing: "invite",
      name: "Sam",
      terms: { ageLimit: 15, holdUnrated: false },
    });
  });

  it("offers with no limit where no age is typed", async () => {
    const onask = vi.fn();
    tending({ onask });
    await press(m.action_invite_open());
    await typeInto(m.invite_name(), "Sam");
    await press(m.action_invite_read());

    expect(onask).toHaveBeenCalledWith({
      doing: "invite",
      name: "Sam",
      terms: { ageLimit: undefined, holdUnrated: true },
    });
  });

  // An age lemonfiber would refuse for a reason already on the screen is not
  // sent, and the line under the box says what an age is.
  it("sends nothing while the age typed is not one, or nobody is named", async () => {
    const onask = vi.fn();
    tending({ onask });
    await press(m.action_invite_open());
    expect(button(m.action_invite_read())).toHaveAttribute(
      "aria-disabled",
      "true",
    );

    await typeInto(m.invite_name(), "Sam");
    await typeInto(m.invite_age(), "twelve");

    expect(button(m.action_invite_read())).toHaveAttribute(
      "aria-disabled",
      "true",
    );
    expect(within(panel()).getByText(m.invite_age_unread())).toBeVisible();
    expect(onask).not.toHaveBeenCalled();
  });

  it("puts the form away when it is left", async () => {
    tending();
    await press(m.action_invite_open());
    await press(m.action_leave_as_is());
    expect(screen.queryByLabelText(m.invite_name())).toBeNull();
  });

  // The yes is the offer that was read, on the terms it was read on.
  it("makes the offer read on a yes under it", async () => {
    const onask = vi.fn();
    tending({ work: [readOffer], onask });

    expect(
      within(asked()).getByRole("heading", {
        name: m.invite_offer_title({ name: "Sam" }),
      }),
    ).toBeVisible();
    await press(m.action_invite_yes({ name: "Sam" }));

    expect(onask).toHaveBeenCalledWith({
      doing: "invite",
      name: "Sam",
      terms: { ageLimit: 12, holdUnrated: true },
      confirm: true,
    });
    expect(asked()).toHaveFocus();
  });

  it("puts the offer read away when it is left as it is", async () => {
    const ondrop = vi.fn();
    tending({ work: [readOffer], ondrop });

    await press(m.action_leave_as_is());

    expect(ondrop).toHaveBeenCalledWith(readOffer.id);
  });

  it("keeps a record of what the offer came to", async () => {
    const ondrop = vi.fn();
    tending({ work: [madeOffer], ondrop });

    expect(
      within(asked()).getByText(m.came_invite_made({ name: "Sam" })),
    ).toBeVisible();
    await press(m.action_hide_record());

    expect(ondrop).toHaveBeenCalledWith(madeOffer.id);
    expect(asked()).toHaveFocus();
  });
});

describe("saying what the house may ask for", () => {
  it("starts from the policy in force, and asks for a limit only where it limits", async () => {
    const onask = vi.fn();
    tending({ onask });
    await press(m.action_limits_house());
    const policies = screen.getByRole("radiogroup", {
      name: m.limits_policy_house(),
    });
    expect(
      within(policies).getByRole("radio", {
        name: labelOfPolicy("everything-waits"),
      }),
    ).toHaveAttribute("aria-checked", "true");
    expect(screen.queryByLabelText(m.limits_requests())).toBeNull();

    await userEvent.click(
      within(policies).getByRole("radio", {
        name: labelOfPolicy("within-a-limit"),
      }),
    );
    await typeInto(m.limits_requests(), "5");
    await typeInto(m.limits_days(), "30");
    await press(m.action_limits_keep());

    expect(onask).toHaveBeenCalledWith({
      doing: "household-allow",
      limits: {
        name: undefined,
        policy: "within-a-limit",
        quota: { requests: 5, days: 30 },
      },
    });
    expect(asked()).toHaveFocus();
  });

  it("sends a policy alone where no limit is typed", async () => {
    const onask = vi.fn();
    tending({ onask });
    await press(m.action_limits_house());
    await userEvent.click(
      screen.getByRole("radio", { name: labelOfPolicy("trusted") }),
    );
    await press(m.action_limits_keep());

    expect(onask).toHaveBeenCalledWith({
      doing: "household-allow",
      limits: { name: undefined, policy: "trusted", quota: undefined },
    });
  });

  // Half a limit is refused by lemonfiber, so it is not sent.
  it("sends nothing while only half a limit is typed", async () => {
    const onask = vi.fn();
    tending({ onask });
    await press(m.action_limits_house());
    await userEvent.click(
      screen.getByRole("radio", { name: labelOfPolicy("within-a-limit") }),
    );
    expect(within(panel()).getByText(m.limits_hint())).toBeVisible();
    await typeInto(m.limits_requests(), "5");

    expect(button(m.action_limits_keep())).toHaveAttribute(
      "aria-disabled",
      "true",
    );
    expect(within(panel()).getByText(m.limits_unread())).toBeVisible();
    expect(onask).not.toHaveBeenCalled();
  });

  it("puts the form away when it is left", async () => {
    tending();
    await press(m.action_limits_house());
    await press(m.action_leave_as_is());
    expect(screen.queryByRole("radiogroup")).toBeNull();
  });
});

describe("what waits on the operator, for each person", () => {
  const [, kit] = household.members;
  const waiting = kit?.requests.find(
    (request) => request.state === "waiting-for-approval",
  );
  const title = waiting === undefined ? "missing" : nameOfRequest(waiting);

  it("lets a request waiting on the operator through", async () => {
    const onask = vi.fn();
    tending({ onask });

    await press(m.action_approve({ title }));

    expect(onask).toHaveBeenCalledWith({
      doing: "household-approve",
      request: 44,
      title,
    });
  });

  it("offers no ruling on a request that is not waiting", () => {
    tending();
    expect(
      screen.queryByRole("button", {
        name: m.action_approve({ title: "Andor" }),
      }),
    ).toBeNull();
  });

  // A refusal owes the person who asked a sentence, so none goes without one.
  it("turns a request down only with a reason, and sends it", async () => {
    const onask = vi.fn();
    tending({ onask });

    await press(m.action_decline_open({ title }));
    expect(button(m.action_decline_yes())).toHaveAttribute(
      "aria-disabled",
      "true",
    );
    await typeInto(m.decline_reason({ title }), " We have it on disc. ");
    await press(m.action_decline_yes());

    expect(onask).toHaveBeenCalledWith({
      doing: "household-decline",
      request: 44,
      title,
      reason: "We have it on disc.",
    });
    expect(screen.queryByLabelText(m.decline_reason({ title }))).toBeNull();
  });

  it("puts the reason away when it is left", async () => {
    tending();
    await press(m.action_decline_open({ title }));
    await press(m.action_leave_as_is());
    expect(screen.queryByLabelText(m.decline_reason({ title }))).toBeNull();
  });

  it("lets somebody set a new password, after a question", async () => {
    const onask = vi.fn();
    tending({ onask });

    await press(m.action_reissue({ name: "Kit" }));

    expect(onask).toHaveBeenCalledWith({ doing: "reissue", name: "Kit" });
  });

  it("asks before a new password, and takes the yes or the no", async () => {
    const onask = vi.fn();
    const onleave = vi.fn();
    const asking = { doing: "reissue", name: "Kit" } as const;
    tending({ asked: asking, onask, onleave });

    expect(
      within(asked()).getByText(m.confirm_reissue_title({ name: "Kit" })),
    ).toBeVisible();
    expect(button(m.action_reissue({ name: "Kit" }))).toHaveAttribute(
      "aria-disabled",
      "true",
    );
    await press(m.action_reissue_yes());
    expect(onask).toHaveBeenCalledWith(asking);

    await press(m.action_leave_as_is());
    expect(onleave).toHaveBeenCalledOnce();
    expect(asked()).toHaveFocus();
  });

  it("says what one person may ask for, from their own policy", async () => {
    const onask = vi.fn();
    tending({ onask });

    await press(m.action_limits_member({ name: "Kit" }));
    const policies = screen.getByRole("radiogroup", {
      name: m.limits_policy_member({ name: "Kit" }),
    });
    expect(
      within(policies).getByRole("radio", {
        name: labelOfPolicy("within-a-limit"),
      }),
    ).toHaveAttribute("aria-checked", "true");
    await typeInto(m.limits_requests(), "3");
    await typeInto(m.limits_days(), "7");
    await press(m.action_limits_keep());

    expect(onask).toHaveBeenCalledWith({
      doing: "household-allow",
      limits: {
        name: "Kit",
        policy: "within-a-limit",
        quota: { requests: 3, days: 7 },
      },
    });
    expect(screen.queryByRole("radiogroup")).toBeNull();
  });

  it("starts somebody nothing has limited from trust", async () => {
    tending();
    await press(m.action_limits_member({ name: "Nour" }));
    expect(
      screen.getByRole("radio", { name: labelOfPolicy("trusted") }),
    ).toHaveAttribute("aria-checked", "true");

    await press(m.action_leave_as_is());
    expect(screen.queryByRole("radiogroup")).toBeNull();
  });
});
