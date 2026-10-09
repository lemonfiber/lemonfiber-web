import { render, screen, within } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import { unreachable } from "@lemonfiber/sdk-ts";
import { describe, expect, it, vi } from "vitest";
import TitleCard from "./TitleCard.svelte";
import { arrival, expanse, goneFromTheShelf } from "./mine";
import type { Heard } from "../api/member";
import type { Told } from "../lib/title";
import * as m from "../paraglide/messages.js";

function opened(
  answer: Heard<Told> | undefined,
  more: { artwork?: string; onretry?: () => void } = {},
): { onclose: ReturnType<typeof vi.fn> } {
  const onclose = vi.fn();
  render(TitleCard, { name: "Arrival", answer, onclose, ...more });
  return { onclose };
}

const card = (): HTMLElement => screen.getByRole("dialog", { name: "Arrival" });

describe("one title, opened", () => {
  it("is named before it is read, and holds a place while it is", () => {
    opened(undefined);
    expect(card()).toHaveAttribute("open");
    expect(within(card()).getByRole("status")).toHaveTextContent(
      m.waiting_answer(),
    );
  });

  it("says what it is, what it is filed under and what it is about", () => {
    opened({ at: "answered", value: arrival });
    expect(within(card()).getByText(/116 minutes/)).toBeInTheDocument();
    expect(
      within(card()).getByText("Drama, Science Fiction"),
    ).toBeInTheDocument();
    expect(
      within(card()).getByText(arrival.title?.overview ?? ""),
    ).toBeInTheDocument();
  });

  // Where it streams from is the server's, and never a member's to read.
  it("says nothing of where it streams from", () => {
    opened({ at: "answered", value: arrival });
    expect(card()).not.toHaveTextContent("door.example");
  });

  it("draws its poster where the shelf has one, and none where not", () => {
    opened({ at: "answered", value: arrival }, { artwork: "blob:arrival" });
    expect(card().querySelector("img")).toHaveAttribute("src", "blob:arrival");
  });

  it("lists a series' seasons, each with its episodes", async () => {
    opened({ at: "answered", value: expanse });
    const seasons = within(card()).getByRole("region", {
      name: m.member_title_seasons(),
    });
    await userEvent.click(
      within(seasons).getByText(
        m.member_title_season({ name: "Season 1", count: 2 }),
      ),
    );
    expect(
      within(seasons).getByText(
        m.member_title_episode({ number: 1, title: "Dulcinea" }),
      ),
    ).toBeInTheDocument();
    expect(within(seasons).getByText("44 minutes")).toBeInTheDocument();
    expect(within(seasons).getByText("The Big Empty")).toBeInTheDocument();
    expect(
      within(seasons).getByText("A distress call reaches an ice hauler."),
    ).toBeInTheDocument();
  });

  it("lists no seasons for a film", () => {
    opened({ at: "answered", value: arrival });
    expect(within(card()).queryByRole("region")).toBeNull();
  });

  it("says where it has left the shelf since", () => {
    opened({ at: "answered", value: goneFromTheShelf });
    expect(within(card()).getByText(m.member_title_gone())).toBeInTheDocument();
  });

  it("says it could not be read, and offers to ask again where it can", async () => {
    const onretry = vi.fn();
    opened({ at: "unanswered", problem: unreachable() }, { onretry });
    expect(
      within(card()).getByText(m.member_title_unread()),
    ).toBeInTheDocument();
    await userEvent.click(
      within(card()).getByRole("button", { name: m.action_try_again() }),
    );
    expect(onretry).toHaveBeenCalledOnce();
  });

  it("says what lemonfiber said where it declined, with nothing to press", () => {
    opened({ at: "declined", said: "Not yours." });
    expect(within(card()).getByText("Not yours.")).toBeInTheDocument();
    expect(
      within(card()).queryByRole("button", { name: m.action_try_again() }),
    ).toBeNull();
  });

  it("is put away by its close button", async () => {
    const { onclose } = opened({ at: "answered", value: arrival });
    await userEvent.click(
      within(card()).getByRole("button", { name: m.member_title_close() }),
    );
    expect(onclose).toHaveBeenCalledOnce();
  });

  // Escape, or the browser's own way of closing a dialog.
  it("is put away however the browser closes it", () => {
    const { onclose } = opened({ at: "answered", value: arrival });
    (card() as HTMLDialogElement).close();
    expect(onclose).toHaveBeenCalledOnce();
  });
});
