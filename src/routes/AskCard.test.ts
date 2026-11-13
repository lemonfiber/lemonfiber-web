import { render, screen, within } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import { unreachable, type Problem } from "@lemonfiber/sdk-ts";
import { describe, expect, it, vi } from "vitest";
import AskCard from "./AskCard.svelte";
import { didAsk, dune, duneTwo, wouldAsk } from "./found";
import type { Heard } from "../api/member";
import type { Asked, FoundTitle } from "../lib/askable";
import * as m from "../paraglide/messages.js";

/** What lemonfiber said where it turned an ask down. */
const spent: Problem = {
  kind: "busy",
  message: "You have asked for all your allowance lets you.",
  code: "WISH-6",
};

interface Given {
  title?: FoundTitle;
  rehearsal?: Heard<Asked> | undefined;
  sent?: Heard<Asked> | undefined;
  sending?: boolean;
  artwork?: string;
}

function opened(given: Given = {}): {
  onask: ReturnType<typeof vi.fn>;
  onrehearse: ReturnType<typeof vi.fn>;
  onclose: ReturnType<typeof vi.fn>;
} {
  const onask = vi.fn();
  const onrehearse = vi.fn();
  const onclose = vi.fn();
  render(AskCard, {
    title: dune,
    rehearsal: { at: "answered", value: wouldAsk },
    onask,
    onrehearse,
    onclose,
    ...given,
  });
  return { onask, onrehearse, onclose };
}

const card = (name = "Dune"): HTMLElement =>
  screen.getByRole("dialog", { name });

describe("a found title, opened", () => {
  it("says what it is and where it stands", () => {
    opened();
    expect(card()).toHaveAttribute("open");
    expect(within(card()).getByText(/Film · 2021/)).toBeInTheDocument();
    expect(within(card()).getByText(m.found_askable())).toBeInTheDocument();
  });

  it("draws its poster where the search has one", () => {
    opened({ artwork: "blob:dune" });
    expect(card().querySelector("img")).toHaveAttribute("src", "blob:dune");
  });

  it("holds a place while what asking would come to is read", () => {
    opened({ rehearsal: undefined });
    expect(within(card()).getByRole("status")).toHaveTextContent(
      m.waiting_answer(),
    );
  });

  it("says what asking would come to in lemonfiber's words, before it is asked for", () => {
    opened();
    expect(within(card()).getByText(wouldAsk.said)).toBeInTheDocument();
  });

  it("asks only when they press for it", async () => {
    const { onask } = opened();
    expect(onask).not.toHaveBeenCalled();
    await userEvent.click(
      within(card()).getByRole("button", { name: m.found_ask() }),
    );
    expect(onask).toHaveBeenCalledOnce();
  });

  it("cannot be asked for twice while the ask is on its way", () => {
    opened({ sending: true });
    expect(
      within(card()).getByRole("button", { name: m.found_asking() }),
    ).toHaveAttribute("aria-disabled", "true");
  });

  it("says what the ask came to, in lemonfiber's words, and offers no second ask", () => {
    opened({ sent: { at: "answered", value: didAsk } });
    expect(within(card()).getByRole("status")).toHaveTextContent(didAsk.said);
    expect(
      within(card()).queryByRole("button", { name: m.found_ask() }),
    ).toBeNull();
  });

  it("says where lemonfiber turned the ask down, in its words", () => {
    opened({ sent: { at: "unanswered", problem: spent } });
    expect(within(card()).getByRole("status")).toHaveTextContent(spent.message);
  });

  it("says an ask that went unanswered was asked for nowhere, and asks again on a press", async () => {
    const { onask } = opened({
      sent: { at: "unanswered", problem: unreachable() },
    });
    expect(within(card()).getByRole("alert")).toHaveTextContent(
      m.found_ask_unanswered(),
    );
    await userEvent.click(
      within(card()).getByRole("button", { name: m.action_try_again() }),
    );
    expect(onask).toHaveBeenCalledOnce();
  });

  it("says where what asking would come to could not be read, with a way to ask again", async () => {
    const { onrehearse } = opened({
      rehearsal: { at: "unanswered", problem: unreachable() },
    });
    expect(card()).toHaveTextContent(m.found_rehearsal_unread());
    await userEvent.click(
      within(card()).getByRole("button", { name: m.action_try_again() }),
    );
    expect(onrehearse).toHaveBeenCalledOnce();
  });

  it("says why it may not be asked for, in lemonfiber's words", () => {
    opened({ rehearsal: { at: "unanswered", problem: spent } });
    expect(card()).toHaveTextContent(spent.message);
  });

  it("keeps its action where it may not be asked for, unusable and naming where it stands", () => {
    opened({ title: duneTwo });
    expect(
      within(card("Dune: Part Two")).getByRole("button", {
        name: m.found_on_its_way(),
      }),
    ).toHaveAttribute("aria-disabled", "true");
  });

  it("is put away by its close button", async () => {
    const { onclose } = opened();
    await userEvent.click(
      within(card()).getByRole("button", { name: m.member_title_close() }),
    );
    expect(onclose).toHaveBeenCalled();
  });

  it("is put away however the browser closes it", () => {
    const { onclose } = opened();
    (card() as HTMLDialogElement).close();
    expect(onclose).toHaveBeenCalledOnce();
  });
});
