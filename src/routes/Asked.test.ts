import { render, screen, within } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import Asked from "./Asked.svelte";
import { kit, yours, yoursSpent, yoursUnasked, yoursUnread } from "./mine";
import type { Freshness } from "../lib/freshness";
import { wordOfRequestState } from "../lib/household";
import type { Household } from "../lib/wire";
import { approvalOf, dayOf, leftOf } from "../lib/yours";
import * as m from "../paraglide/messages.js";

const answered: Freshness = { kind: "answered", secondsAgo: 8 };
const silent: Freshness = { kind: "silent", secondsAgo: 300 };
const never: Freshness = { kind: "never" };

function drawn(
  household: Household | undefined,
  over: { freshness?: Freshness; quiet?: boolean; onretry?: () => void } = {},
): void {
  render(Asked, {
    household,
    freshness: over.freshness ?? answered,
    quiet: over.quiet ?? false,
    onretry: over.onretry,
  });
}

/** The panel of that name. */
const panel = (name: string): HTMLElement =>
  screen.getByRole("region", { name });

describe("before a member asks", () => {
  // Whether it needs approval and whether they have allowance left is said
  // before anything they asked for.
  it("says whether asking needs approval and what is left, first", () => {
    drawn(yours);
    const before = panel(m.member_asking_title());
    const asking = kit.asking ?? undefined;
    if (asking === undefined)
      throw new Error("the fixture asks within a limit");

    expect(before).toHaveTextContent(approvalOf(asking));
    expect(before).toHaveTextContent(leftOf(asking));
    const regions = screen.getAllByRole("region");
    expect(regions[0]).toBe(before);
  });

  it("says, before they ask, that none is left and when one more becomes possible", () => {
    drawn(yoursSpent);
    const before = panel(m.member_asking_title());
    expect(before).toHaveTextContent(m.member_allowance_spent());
    expect(before).toHaveTextContent(dayOf("2026-09-14T12:00:00Z"));
  });

  // An unread answer is not an unlimited member.
  it("says it could not be read, rather than that nothing limits them", () => {
    drawn({ ...yours, members: [{ ...kit, asking: null }] });
    const before = panel(m.member_asking_title());
    expect(before).toHaveTextContent(m.member_asking_unread());
    expect(before).not.toHaveTextContent(m.member_allowance_unlimited());
  });
});

describe("what a member asked for", () => {
  it("lists each request, named, with where it stands in their words", () => {
    drawn(yours);
    const table = within(panel(m.room_asked())).getByRole("table", {
      name: m.room_asked(),
    });
    expect(within(table).getByText("Andor")).toBeInTheDocument();
    expect(
      within(table).getByText(wordOfRequestState("here")),
    ).toBeInTheDocument();
    expect(
      within(table).getByText(m.request_a_kind({ media: "film" })),
    ).toBeInTheDocument();
  });

  it("tells them one that did not work was passed to the operator", () => {
    drawn(yours);
    expect(screen.getByText(m.member_failed_told())).toBeInTheDocument();
  });

  it("carries the reason one was turned down with", () => {
    drawn(yours);
    expect(
      screen.getByText("Not this one, it is too late in the evening."),
    ).toBeInTheDocument();
  });

  // What lemonfiber tells the operator about the household is the operator's.
  it("shows none of what the operator is told about the household", () => {
    drawn(yours);
    for (const finding of yours.findings) {
      expect(screen.queryByText(finding)).toBeNull();
    }
    expect(screen.queryByText(yours.filtering ?? "")).toBeNull();
    expect(screen.queryByRole("button")).toBeNull();
  });
});

describe("a member who has asked for nothing", () => {
  // What to do first, not an empty table.
  it("says what to do first rather than drawing an empty table", () => {
    drawn(yoursUnasked);
    const asked = panel(m.room_asked());
    expect(asked).toHaveTextContent(m.member_asked_first());
    expect(within(asked).queryByRole("table")).toBeNull();
  });
});

describe("what could not be read, said as that", () => {
  it("says so where the household could not be read at all", () => {
    drawn(yoursUnread);
    expect(panel(m.room_asked())).toHaveTextContent(m.member_asked_unread());
    expect(screen.queryByText(m.member_asked_first())).toBeNull();
  });

  it("says so where the household answered without them in it", () => {
    drawn({ ...yours, members: [] });
    expect(panel(m.room_asked())).toHaveTextContent(m.member_asked_unread());
  });

  // The request service unasked leaves the same empty list a member who has
  // asked for nothing has, and means the opposite.
  it("says so where the request service was not asked, rather than that nothing was asked for", () => {
    drawn({
      ...yoursUnasked,
      policy: null,
    });
    expect(panel(m.room_asked())).toHaveTextContent(m.member_asked_unread());
    expect(screen.queryByText(m.member_asked_first())).toBeNull();
  });
});

describe("while nothing has answered", () => {
  it("holds a place for what they asked for", () => {
    drawn(undefined, { freshness: never });
    expect(screen.getByRole("status")).toHaveTextContent(m.waiting_answer());
    expect(screen.queryByText(m.member_asked_first())).toBeNull();
  });
});

describe("while lemonfiber is not answering", () => {
  // Their own requests from the last read, marked with when.
  it("keeps what they asked for from the last read, marked with how long it has been quiet", () => {
    drawn(yours, { quiet: true, freshness: silent });
    expect(screen.getByText("Andor")).toBeInTheDocument();
    expect(panel(m.room_asked())).toHaveTextContent(
      m.fresh_silent({ span: m.span_minutes({ count: 5 }) }),
    );
    expect(screen.getByText(m.member_unanswered_lead())).toBeInTheDocument();
    expect(screen.getByText(m.member_unanswered_prose())).toBeInTheDocument();
  });

  // Asking for something new is declined rather than queued, and nothing is
  // said about allowance from before the silence.
  it("declines asking for anything new, and says nothing of the allowance it last read", () => {
    drawn(yours, { quiet: true, freshness: silent });
    const before = panel(m.member_asking_title());
    const asking = kit.asking ?? undefined;
    if (asking === undefined)
      throw new Error("the fixture asks within a limit");

    expect(before).toHaveTextContent(m.member_asking_declined());
    expect(before).not.toHaveTextContent(leftOf(asking));
  });

  it("says nothing could be read where nothing ever was", () => {
    drawn(undefined, { quiet: true, freshness: never });
    expect(panel(m.room_asked())).toHaveTextContent(m.member_asked_unread());
    expect(screen.getByText(m.member_asking_declined())).toBeInTheDocument();
  });

  it("asks again when asked to", async () => {
    const onretry = vi.fn();
    drawn(yours, { quiet: true, freshness: silent, onretry });

    await userEvent.click(
      screen.getByRole("button", { name: m.action_try_again() }),
    );

    expect(onretry).toHaveBeenCalledOnce();
  });

  it("offers nothing to press where nothing answers it", () => {
    drawn(yours, { quiet: true, freshness: silent });
    expect(screen.queryByRole("button")).toBeNull();
  });
});
