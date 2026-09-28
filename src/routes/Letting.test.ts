import { render, screen, within } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import type { Reading } from "@lemonfiber/sdk-ts";
import { describe, expect, it, vi } from "vitest";
import Storage from "./Storage.svelte";
import {
  goneRecord,
  kept,
  letOffer,
  letter,
  offerRecord,
  reckoned,
  shared,
  stray,
} from "./lettings";
import type { Freshness } from "../lib/freshness";
import { candidateLines, lettingLines, type Reckoned } from "../lib/letting";
import type { Letter } from "../lib/seeding";
import * as m from "../paraglide/messages.js";

const answered: Freshness = { kind: "answered", secondsAgo: 5 };

/**
 * The disk screen, with the completed downloads on it. A reading of null is
 * one that has not answered yet.
 */
function letting(
  over: Partial<Letter> = {},
  space: Reading<Reckoned> | null = { ok: true, value: reckoned },
): void {
  render(Storage, {
    disk: undefined,
    live: { kind: "never" },
    diagnosis: undefined,
    read: answered,
    letting: { letter: { ...letter, ...over }, space: space ?? undefined },
  });
}

const panel = (): HTMLElement =>
  screen.getByRole("region", { name: m.panel_letting() });

const asked = (): HTMLElement =>
  screen.getByRole("status", { name: m.letting_asked() });

const press = (label: string): Promise<void> =>
  userEvent.click(screen.getByRole("button", { name: label }));

describe("the completed downloads, on the disk screen", () => {
  it("is not drawn where nothing answers it", () => {
    render(Storage, {
      disk: undefined,
      live: { kind: "never" },
      diagnosis: undefined,
      read: answered,
    });
    expect(
      screen.queryByRole("region", { name: m.panel_letting() }),
    ).toBeNull();
  });

  it("says what each takes up and where it stands", () => {
    letting();
    const listed = within(panel()).getByRole("list", {
      name: m.letting_said(),
    });
    for (const candidate of reckoned.candidates) {
      for (const line of candidateLines(candidate)) {
        expect(within(listed).getAllByText(line)[0]).toBeVisible();
      }
    }
  });

  it("offers to let go only what is still being shared", () => {
    letting();
    expect(
      screen.getByRole("button", {
        name: m.action_let_go_cost({ name: shared.name }),
      }),
    ).toBeVisible();
    for (const one of [stray, kept]) {
      expect(
        screen.queryByRole("button", {
          name: m.action_let_go_cost({ name: one.name }),
        }),
      ).toBeNull();
    }
  });

  it("waits while the accounting has not answered", () => {
    letting({}, null);
    expect(within(panel()).getByText(m.waiting_answer())).toBeInTheDocument();
  });

  it("says why it could not be read, in lemonfiber's words", () => {
    letting({}, { ok: false, problem: { kind: "refused", message: "No." } });
    expect(within(panel()).getByText("No.")).toBeVisible();
  });

  it("says so where nothing has finished downloading", () => {
    letting({}, { ok: true, value: { ...reckoned, candidates: [] } });
    expect(within(panel()).getByText(m.letting_none())).toBeVisible();
  });
});

describe("letting one go, under its offer", () => {
  it("asks what letting it go would cost first, and lets nothing go", async () => {
    const onask = vi.fn();
    letting({ onask });

    await press(m.action_let_go_cost({ name: shared.name }));

    expect(onask).toHaveBeenCalledWith({
      doing: "stop-seeding",
      download: shared.name,
    });
    expect(asked()).toHaveFocus();
  });

  // There is no bare yes: the yes carries the name the offer gave itself.
  it("shows the cost before the yes, and lets go on a yes naming the offer", async () => {
    const onask = vi.fn();
    letting({ work: [offerRecord], onask });

    const shown = within(asked());
    expect(
      shown.getByRole("region", {
        name: m.let_go_plan_title({ name: shared.name }),
      }),
    ).toBeVisible();
    for (const line of lettingLines(letOffer)) {
      expect(shown.getAllByText(line)[0]).toBeVisible();
    }

    await press(m.action_let_go_yes());
    expect(onask).toHaveBeenCalledWith({
      doing: "stop-seeding",
      download: shared.name,
      offer: "let-go-4e11",
    });
  });

  it("puts the offer away when it is left as it is", async () => {
    const ondrop = vi.fn();
    letting({ work: [offerRecord], ondrop });

    await press(m.action_leave_as_is());

    expect(ondrop).toHaveBeenCalledWith(offerRecord.id);
  });

  it("keeps a record of what the client let go, and no offer once taken", async () => {
    const ondrop = vi.fn();
    letting({ work: [goneRecord], ondrop });

    expect(
      screen.queryByRole("button", { name: m.action_let_go_yes() }),
    ).toBeNull();
    await press(m.action_hide_record());
    expect(ondrop).toHaveBeenCalledWith(goneRecord.id);
  });

  it("is silenced while a request is in flight", () => {
    letting({ busy: true });
    expect(
      screen.getByRole("button", {
        name: m.action_let_go_cost({ name: shared.name }),
      }),
    ).toHaveAttribute("aria-disabled", "true");
  });

  it("presses to nothing where nothing answers the controls", async () => {
    letting({
      work: [{ ...goneRecord, id: "93", at: "under-way", job: "4a10" }],
    });
    await press(m.action_hide_record());
    await press(m.action_let_go_cost({ name: shared.name }));
    expect(within(asked()).getByText(m.doing_let_go_title())).toBeVisible();
  });
});
