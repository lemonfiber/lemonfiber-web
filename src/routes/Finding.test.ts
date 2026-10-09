import { render, screen, within } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import Requests from "./Requests.svelte";
import {
  finder,
  searchedRecord,
  traced,
  tracer,
  walked,
  walkedRecord,
} from "./finds";
import { household } from "./house";
import type { Finder } from "../lib/finding";
import type { Freshness } from "../lib/freshness";
import { traceLines } from "../lib/traced";
import type { Tracer } from "./tracing.svelte";
import * as m from "../paraglide/messages.js";

const answered: Freshness = { kind: "answered", secondsAgo: 2 };

/** The requests screen, with one thing walked through and one looked up. */
function finding(
  over: Partial<Finder> = {},
  looking: Partial<Tracer> = {},
): void {
  render(Requests, {
    household: { ok: true, value: household },
    freshness: answered,
    finder: { ...finder, ...over },
    tracer: { ...tracer, ...looking },
  });
}

const press = (label: string): Promise<void> =>
  userEvent.click(screen.getByRole("button", { name: label }));

const button = (label: string): HTMLElement =>
  screen.getByRole("button", { name: label });

const walkAsked = (): HTMLElement =>
  screen.getByRole("status", { name: m.walk_asked() });

const traceAsked = (): HTMLElement =>
  screen.getByRole("status", { name: m.trace_asked() });

async function typeInto(label: string, text: string): Promise<void> {
  const box = screen.getByLabelText(label);
  await userEvent.clear(box);
  await userEvent.type(box, text);
}

describe("walking one thing through", () => {
  it("is not drawn where nothing answers it", () => {
    render(Requests, {
      household: { ok: true, value: household },
      freshness: answered,
    });
    expect(screen.queryByRole("region", { name: m.panel_walk() })).toBeNull();
    expect(screen.queryByRole("region", { name: m.panel_trace() })).toBeNull();
  });

  it("draws the walk alone where nothing looks things up", () => {
    render(Requests, {
      household: { ok: true, value: household },
      freshness: answered,
      finder,
    });
    expect(screen.getByRole("region", { name: m.panel_walk() })).toBeVisible();
    expect(screen.queryByRole("region", { name: m.panel_trace() })).toBeNull();
  });

  it("asks to walk the thing named", async () => {
    const onask = vi.fn();
    finding({ onask });

    await typeInto(m.walk_item(), " Sintel ");
    await press(m.action_walk());

    expect(onask).toHaveBeenCalledWith({
      doing: "walkthrough",
      item: "Sintel",
    });
    expect(walkAsked()).toHaveFocus();
  });

  it("asks for something likely to work where nothing is named", async () => {
    const onask = vi.fn();
    finding({ onask });

    await press(m.action_walk());

    expect(onask).toHaveBeenCalledWith({
      doing: "walkthrough",
      item: undefined,
    });
  });

  // A walk fetches something, and nothing comes back to read before it
  // starts, so what it does is said before the yes.
  it("says what a walk does before the yes, and takes the yes or the no", async () => {
    const onask = vi.fn();
    const onleave = vi.fn();
    const asking = { doing: "walkthrough", item: "Sintel" } as const;
    finding({ asked: asking, onask, onleave });

    expect(within(walkAsked()).getByText(m.confirm_walk_prose())).toBeVisible();
    expect(button(m.action_walk())).toHaveAttribute("aria-disabled", "true");
    await press(m.action_walk_yes());
    expect(onask).toHaveBeenCalledWith(asking);

    await press(m.action_leave_as_is());
    expect(onleave).toHaveBeenCalledOnce();
  });

  it("keeps a record of every step the walk took", async () => {
    const ondrop = vi.fn();
    finding({ work: [walkedRecord, searchedRecord], ondrop });

    expect(within(walkAsked()).getByText(walked.proves)).toBeVisible();
    await userEvent.click(
      within(walkAsked()).getByRole("button", { name: m.action_hide_record() }),
    );

    expect(ondrop).toHaveBeenCalledWith(walkedRecord.id);
  });

  it("presses to nothing where nothing answers the controls", async () => {
    finding({ work: [{ ...walkedRecord, at: "under-way", job: "8e1f" }] });
    await press(m.action_hide_record());
    await press(m.action_walk());
    expect(within(walkAsked()).getByText(m.doing_walk_title())).toBeVisible();
  });
});

describe("where one item is", () => {
  it("looks up the item named, narrowed to the season typed", async () => {
    const onlook = vi.fn();
    finding({}, { onlook });
    // While nothing is typed, the page says what pressing needs.
    expect(screen.getByText(m.trace_missing())).toBeVisible();

    await typeInto(m.trace_term(), "The Expanse");
    expect(screen.queryByText(m.trace_missing())).toBeNull();
    await typeInto(m.trace_season(), "2");
    await press(m.action_trace());

    expect(onlook).toHaveBeenCalledWith({ term: "The Expanse", season: 2 });
  });

  it("searches the indexers for it now, which is a record of its own", async () => {
    const onask = vi.fn();
    finding({ onask });

    await typeInto(m.trace_term(), "The Expanse");
    await press(m.action_search());

    expect(onask).toHaveBeenCalledWith({
      doing: "search",
      sought: { term: "The Expanse", season: undefined },
    });
    expect(traceAsked()).toHaveFocus();
  });

  it("sends nothing while nothing is named or the season is not a number", async () => {
    const onlook = vi.fn();
    finding({}, { onlook });
    expect(button(m.action_trace())).toHaveAttribute("aria-disabled", "true");
    expect(button(m.action_search())).toHaveAttribute("aria-disabled", "true");

    await typeInto(m.trace_term(), "The Expanse");
    await typeInto(m.trace_season(), "two");

    expect(button(m.action_trace())).toHaveAttribute("aria-disabled", "true");
    expect(screen.getByText(m.trace_unread())).toBeVisible();
    expect(onlook).not.toHaveBeenCalled();
  });

  it("says where it is, in lemonfiber's words", () => {
    finding({}, { reading: { ok: true, value: traced } });
    const said = screen.getByRole("list", { name: m.trace_said() });
    for (const line of traceLines(traced)) {
      expect(within(said).getByText(line)).toBeVisible();
    }
  });

  it("says why it could not be looked up, in lemonfiber's words", () => {
    finding(
      {},
      { reading: { ok: false, problem: { kind: "refused", message: "No." } } },
    );
    expect(screen.getByText("No.")).toBeVisible();
  });

  it("holds a place while it is being looked up", () => {
    finding({}, { busy: true });
    expect(screen.getAllByText(m.waiting_answer()).length).toBeGreaterThan(0);
  });

  it("keeps a record of what searching came to", async () => {
    const ondrop = vi.fn();
    finding({ work: [searchedRecord], ondrop });

    expect(
      within(traceAsked()).getByText(m.doing_search_title()),
    ).toBeVisible();
    await press(m.action_hide_record());

    expect(ondrop).toHaveBeenCalledWith(searchedRecord.id);
  });

  it("presses to nothing where nothing answers the controls", async () => {
    finding({ work: [{ ...searchedRecord, at: "under-way", job: "5c63" }] });
    await press(m.action_hide_record());
    await typeInto(m.trace_term(), "The Expanse");
    await press(m.action_trace());
    expect(
      within(traceAsked()).getByText(m.doing_search_title()),
    ).toBeVisible();
  });
});
